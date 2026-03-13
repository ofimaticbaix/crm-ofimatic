-- Migration: Geolocation and Visits
-- Features: Map visualization, check-in/check-out, route planning

-- ============================================
-- 1. COMPANIES: Add geolocation fields
-- ============================================

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ;

-- Index for spatial queries (finding nearby companies)
CREATE INDEX IF NOT EXISTS idx_companies_location
  ON companies(latitude, longitude)
  WHERE deleted_at IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON COLUMN companies.latitude IS 'Latitude coordinate for map display';
COMMENT ON COLUMN companies.longitude IS 'Longitude coordinate for map display';
COMMENT ON COLUMN companies.geocoded_at IS 'Timestamp when address was geocoded';

-- ============================================
-- 2. VISITS: Check-in/check-out tracking
-- ============================================

CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Check-in data
  check_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_in_latitude DECIMAL(10, 8),
  check_in_longitude DECIMAL(11, 8),
  check_in_address TEXT,

  -- Check-out data
  check_out_at TIMESTAMPTZ,
  check_out_latitude DECIMAL(10, 8),
  check_out_longitude DECIMAL(11, 8),

  -- Visit details
  visit_type TEXT DEFAULT 'presencial' CHECK (visit_type IN ('presencial', 'videollamada', 'llamada')),
  purpose TEXT,
  notes TEXT,
  outcome TEXT CHECK (outcome IN ('positive', 'neutral', 'negative', 'no_show', NULL)),
  next_steps TEXT,

  -- Metadata
  duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN check_out_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (check_out_at - check_in_at)) / 60
      ELSE NULL
    END
  ) STORED,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for visits
CREATE INDEX IF NOT EXISTS idx_visits_workspace ON visits(workspace_id);
CREATE INDEX IF NOT EXISTS idx_visits_company ON visits(company_id);
CREATE INDEX IF NOT EXISTS idx_visits_user ON visits(user_id);
CREATE INDEX IF NOT EXISTS idx_visits_check_in_at ON visits(check_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_pending_checkout ON visits(check_out_at) WHERE check_out_at IS NULL;

-- RLS for visits
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view visits in their workspace" ON visits
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create visits in their workspace" ON visits
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own visits" ON visits
  FOR UPDATE USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_visits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS visits_updated_at ON visits;
CREATE TRIGGER visits_updated_at
  BEFORE UPDATE ON visits
  FOR EACH ROW
  EXECUTE FUNCTION update_visits_updated_at();

-- ============================================
-- 3. ROUTES: Planned routes (optional, for route planning)
-- ============================================

CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  planned_date DATE NOT NULL,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),

  -- Route data (stored as JSON array of company IDs in order)
  company_ids UUID[] NOT NULL DEFAULT '{}',

  -- Calculated route info (from OSRM)
  total_distance_km DECIMAL(10, 2),
  estimated_duration_minutes INTEGER,
  route_polyline TEXT, -- Encoded polyline for map display

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for routes
CREATE INDEX IF NOT EXISTS idx_routes_workspace ON routes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_routes_user ON routes(user_id);
CREATE INDEX IF NOT EXISTS idx_routes_planned_date ON routes(planned_date);

-- RLS for routes
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view routes in their workspace" ON routes
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own routes" ON routes
  FOR ALL USING (user_id = auth.uid());

-- Trigger for updated_at
DROP TRIGGER IF EXISTS routes_updated_at ON routes;
CREATE TRIGGER routes_updated_at
  BEFORE UPDATE ON routes
  FOR EACH ROW
  EXECUTE FUNCTION update_visits_updated_at();

COMMENT ON TABLE visits IS 'Track commercial visits with check-in/check-out and geolocation';
COMMENT ON TABLE routes IS 'Planned commercial routes for field sales';
