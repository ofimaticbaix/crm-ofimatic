-- ============================================================
-- CRM OFIMATIC BAIX - Complete Multi-Tenant SaaS Setup
-- ============================================================
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- This migration sets up: plans, RLS, auto-onboarding, and seed data
-- ============================================================

-- ============================================================
-- 1. PLANS TABLE - Define subscription plans and their limits
-- ============================================================

CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC(10,2) DEFAULT 0,
  price_yearly NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  is_active BOOLEAN DEFAULT true,
  -- Feature limits (null = unlimited)
  max_users INTEGER,
  max_contacts INTEGER,
  max_companies INTEGER,
  max_deals INTEGER,
  max_pipelines INTEGER DEFAULT 1,
  max_storage_mb INTEGER DEFAULT 100,
  -- Feature flags
  features JSONB DEFAULT '{}'::jsonb,
  -- Metadata
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. SEED PLANS - Insert the 4 tiers
-- ============================================================

INSERT INTO public.plans (id, name, description, price_monthly, price_yearly, max_users, max_contacts, max_companies, max_deals, max_pipelines, max_storage_mb, features, sort_order)
VALUES
  (
    'starter',
    'Starter',
    'Para equipos pequenos que quieren crecer',
    29, 290,
    3,      -- max_users
    500,    -- max_contacts
    100,    -- max_companies
    50,     -- max_deals
    2,      -- max_pipelines
    500,    -- max_storage_mb
    '{
      "crm_basic": true,
      "kanban_board": true,
      "task_management": true,
      "csv_import": true,
      "excel_import": true,
      "ai_assistant": false,
      "email_integration": true,
      "whatsapp_integration": false,
      "custom_fields": true,
      "reports_advanced": false,
      "api_access": false,
      "white_label": false,
      "priority_support": false
    }'::jsonb,
    0
  ),
  (
    'pro',
    'Profesional',
    'Para equipos de ventas que necesitan resultados',
    79, 790,
    10,     -- max_users
    5000,   -- max_contacts
    500,    -- max_companies
    NULL,   -- unlimited deals
    5,      -- max_pipelines
    2000,   -- max_storage_mb
    '{
      "crm_basic": true,
      "kanban_board": true,
      "task_management": true,
      "csv_import": true,
      "excel_import": true,
      "ai_assistant": true,
      "email_integration": true,
      "whatsapp_integration": true,
      "custom_fields": true,
      "reports_advanced": true,
      "api_access": true,
      "white_label": false,
      "priority_support": false
    }'::jsonb,
    1
  ),
  (
    'enterprise',
    'Enterprise',
    'Para grandes organizaciones con necesidades avanzadas',
    199, 1990,
    NULL,   -- unlimited users
    NULL,   -- unlimited contacts
    NULL,   -- unlimited companies
    NULL,   -- unlimited deals
    NULL,   -- unlimited pipelines
    NULL,   -- unlimited storage
    '{
      "crm_basic": true,
      "kanban_board": true,
      "task_management": true,
      "csv_import": true,
      "excel_import": true,
      "ai_assistant": true,
      "email_integration": true,
      "whatsapp_integration": true,
      "custom_fields": true,
      "reports_advanced": true,
      "api_access": true,
      "white_label": true,
      "priority_support": true
    }'::jsonb,
    2
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. ENSURE CORE TABLES EXIST (idempotent)
-- ============================================================

-- Users profile table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'Europe/Madrid',
  locale TEXT DEFAULT 'es',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workspaces (tenants)
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  plan_id TEXT REFERENCES public.plans(id) DEFAULT 'starter',
  subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'inactive', 'expired')),
  subscription_tier TEXT DEFAULT 'starter',
  trial_ends_at TIMESTAMPTZ,
  billing_email TEXT,
  billing_address JSONB DEFAULT '{}'::jsonb,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add plan_id column if workspaces already exists but doesn't have it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workspaces' AND column_name = 'plan_id'
  ) THEN
    ALTER TABLE public.workspaces ADD COLUMN plan_id TEXT REFERENCES public.plans(id) DEFAULT 'starter';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workspaces' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE public.workspaces ADD COLUMN trial_ends_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workspaces' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE public.workspaces ADD COLUMN stripe_customer_id TEXT;
    ALTER TABLE public.workspaces ADD COLUMN stripe_subscription_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workspaces' AND column_name = 'settings'
  ) THEN
    ALTER TABLE public.workspaces ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Memberships (user <-> workspace with role)
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, workspace_id)
);

-- Companies
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  company_size TEXT,
  annual_revenue NUMERIC(15,2),
  vat_number TEXT,
  billing_address JSONB DEFAULT '{}'::jsonb,
  linkedin_url TEXT,
  health_score INTEGER DEFAULT 50,
  owner_id UUID REFERENCES auth.users(id),
  created_by_id UUID REFERENCES auth.users(id),
  updated_by_id UUID REFERENCES auth.users(id),
  custom_fields JSONB DEFAULT '{}'::jsonb,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contacts
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  job_title TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  lifecycle_stage TEXT DEFAULT 'lead' CHECK (lifecycle_stage IN ('subscriber', 'lead', 'mql', 'sql', 'opportunity', 'customer', 'evangelist')),
  lead_source TEXT,
  owner_id UUID REFERENCES auth.users(id),
  created_by_id UUID REFERENCES auth.users(id),
  updated_by_id UUID REFERENCES auth.users(id),
  custom_fields JSONB DEFAULT '{}'::jsonb,
  search_vector TSVECTOR,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pipelines
CREATE TABLE IF NOT EXISTS public.pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Pipeline Principal',
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Stages
CREATE TABLE IF NOT EXISTS public.stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  position INTEGER NOT NULL DEFAULT 0,
  is_closed_won BOOLEAN DEFAULT false,
  is_closed_lost BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Deals
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id),
  stage_id UUID NOT NULL REFERENCES public.stages(id),
  value NUMERIC(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  expected_close_date DATE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
  next_step TEXT,
  competitors TEXT[],
  created_by_id UUID REFERENCES auth.users(id),
  updated_by_id UUID REFERENCES auth.users(id),
  custom_fields JSONB DEFAULT '{}'::jsonb,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Deal-Contacts junction
CREATE TABLE IF NOT EXISTS public.deal_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  role TEXT,
  is_primary BOOLEAN DEFAULT false,
  UNIQUE(deal_id, contact_id)
);

-- Activities (tasks, calls, meetings, emails, notes)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call', 'meeting', 'email', 'note', 'task')),
  subject TEXT,
  description TEXT,
  outcome TEXT,
  scheduled_at TIMESTAMPTZ,
  due_date DATE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  assigned_to_id UUID REFERENCES auth.users(id),
  created_by_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_workspace ON public.memberships(workspace_id);
CREATE INDEX IF NOT EXISTS idx_companies_workspace ON public.companies(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_workspace ON public.contacts(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_company ON public.contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_search ON public.contacts USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_deals_workspace ON public.deals(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_deals_pipeline ON public.deals(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_company ON public.deals(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_workspace ON public.activities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activities_due ON public.activities(due_date) WHERE is_completed = false;
CREATE INDEX IF NOT EXISTS idx_activities_contact ON public.activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_company ON public.activities(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_deal ON public.activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_workspace ON public.pipelines(workspace_id);
CREATE INDEX IF NOT EXISTS idx_stages_pipeline ON public.stages(pipeline_id);

-- ============================================================
-- 5. SEARCH VECTOR TRIGGER (for contacts full-text search)
-- ============================================================

CREATE OR REPLACE FUNCTION update_contact_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('spanish',
    coalesce(NEW.first_name, '') || ' ' ||
    coalesce(NEW.last_name, '') || ' ' ||
    coalesce(NEW.email, '') || ' ' ||
    coalesce(NEW.phone, '') || ' ' ||
    coalesce(NEW.job_title, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_contact_search ON public.contacts;
CREATE TRIGGER trigger_update_contact_search
  BEFORE INSERT OR UPDATE OF first_name, last_name, email, phone, job_title
  ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_search_vector();

-- ============================================================
-- 6. AUTO-ONBOARDING: When a user signs up, auto-create everything
-- ============================================================

-- Function: create workspace, membership, pipeline, and stages for new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_workspace_id UUID;
  new_pipeline_id UUID;
  user_name TEXT;
BEGIN
  -- Get user name from metadata or email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- 1. Create user profile
  INSERT INTO public.users (id, full_name)
  VALUES (NEW.id, user_name)
  ON CONFLICT (id) DO NOTHING;

  -- 2. Create workspace with 14-day trial
  INSERT INTO public.workspaces (name, slug, plan_id, subscription_status, subscription_tier, trial_ends_at)
  VALUES (
    user_name || '''s Workspace',
    lower(replace(replace(user_name, ' ', '-'), '''', '')) || '-' || substr(NEW.id::text, 1, 8),
    'starter',
    'trialing',
    'starter',
    now() + interval '14 days'
  )
  RETURNING id INTO new_workspace_id;

  -- 3. Create membership (owner role)
  INSERT INTO public.memberships (user_id, workspace_id, role)
  VALUES (NEW.id, new_workspace_id, 'owner');

  -- 4. Create default pipeline
  INSERT INTO public.pipelines (workspace_id, name, is_default)
  VALUES (new_workspace_id, 'Pipeline Principal', true)
  RETURNING id INTO new_pipeline_id;

  -- 5. Create default stages
  INSERT INTO public.stages (pipeline_id, name, description, probability, position, is_closed_won, is_closed_lost) VALUES
    (new_pipeline_id, 'Prospecto',     'Oportunidad identificada',           10, 0, false, false),
    (new_pipeline_id, 'Contactado',    'Primer contacto realizado',          20, 1, false, false),
    (new_pipeline_id, 'Cualificado',   'Necesidades confirmadas',            40, 2, false, false),
    (new_pipeline_id, 'Propuesta',     'Propuesta enviada al cliente',       60, 3, false, false),
    (new_pipeline_id, 'Negociacion',   'En proceso de negociacion',          80, 4, false, false),
    (new_pipeline_id, 'Ganado',        'Deal cerrado con exito',            100, 5, true,  false),
    (new_pipeline_id, 'Perdido',       'Deal no conseguido',                  0, 6, false, true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS) - Multi-tenant isolation
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Helper function: get workspace IDs the current user belongs to
CREATE OR REPLACE FUNCTION public.get_my_workspace_ids()
RETURNS SETOF UUID AS $$
  SELECT workspace_id FROM public.memberships WHERE user_id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---- PLANS (public read) ----
DROP POLICY IF EXISTS "Plans are viewable by everyone" ON public.plans;
CREATE POLICY "Plans are viewable by everyone" ON public.plans
  FOR SELECT USING (true);

-- ---- USERS (own profile) ----
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

-- ---- WORKSPACES ----
DROP POLICY IF EXISTS "Users can view their workspaces" ON public.workspaces;
CREATE POLICY "Users can view their workspaces" ON public.workspaces
  FOR SELECT USING (id IN (SELECT public.get_my_workspace_ids()));

DROP POLICY IF EXISTS "Owners can update their workspace" ON public.workspaces;
CREATE POLICY "Owners can update their workspace" ON public.workspaces
  FOR UPDATE USING (
    id IN (
      SELECT workspace_id FROM public.memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ---- MEMBERSHIPS ----
DROP POLICY IF EXISTS "Users can view memberships of their workspaces" ON public.memberships;
CREATE POLICY "Users can view memberships of their workspaces" ON public.memberships
  FOR SELECT USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

DROP POLICY IF EXISTS "Admins can manage memberships" ON public.memberships;
CREATE POLICY "Admins can manage memberships" ON public.memberships
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ---- COMPANIES ----
DROP POLICY IF EXISTS "Users can view companies in their workspace" ON public.companies;
CREATE POLICY "Users can view companies in their workspace" ON public.companies
  FOR SELECT USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

DROP POLICY IF EXISTS "Users can create companies in their workspace" ON public.companies;
CREATE POLICY "Users can create companies in their workspace" ON public.companies
  FOR INSERT WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));

DROP POLICY IF EXISTS "Users can update companies in their workspace" ON public.companies;
CREATE POLICY "Users can update companies in their workspace" ON public.companies
  FOR UPDATE USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

DROP POLICY IF EXISTS "Users can delete companies in their workspace" ON public.companies;
CREATE POLICY "Users can delete companies in their workspace" ON public.companies
  FOR DELETE USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

-- ---- CONTACTS ----
DROP POLICY IF EXISTS "Users can view contacts in their workspace" ON public.contacts;
CREATE POLICY "Users can view contacts in their workspace" ON public.contacts
  FOR SELECT USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

DROP POLICY IF EXISTS "Users can create contacts in their workspace" ON public.contacts;
CREATE POLICY "Users can create contacts in their workspace" ON public.contacts
  FOR INSERT WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));

DROP POLICY IF EXISTS "Users can update contacts in their workspace" ON public.contacts;
CREATE POLICY "Users can update contacts in their workspace" ON public.contacts
  FOR UPDATE USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

DROP POLICY IF EXISTS "Users can delete contacts in their workspace" ON public.contacts;
CREATE POLICY "Users can delete contacts in their workspace" ON public.contacts
  FOR DELETE USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

-- ---- PIPELINES ----
DROP POLICY IF EXISTS "Users can view pipelines in their workspace" ON public.pipelines;
CREATE POLICY "Users can view pipelines in their workspace" ON public.pipelines
  FOR SELECT USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

DROP POLICY IF EXISTS "Users can manage pipelines in their workspace" ON public.pipelines;
CREATE POLICY "Users can manage pipelines in their workspace" ON public.pipelines
  FOR ALL USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

-- ---- STAGES ----
DROP POLICY IF EXISTS "Users can view stages of their pipelines" ON public.stages;
CREATE POLICY "Users can view stages of their pipelines" ON public.stages
  FOR SELECT USING (
    pipeline_id IN (
      SELECT id FROM public.pipelines WHERE workspace_id IN (SELECT public.get_my_workspace_ids())
    )
  );

DROP POLICY IF EXISTS "Users can manage stages of their pipelines" ON public.stages;
CREATE POLICY "Users can manage stages of their pipelines" ON public.stages
  FOR ALL USING (
    pipeline_id IN (
      SELECT id FROM public.pipelines WHERE workspace_id IN (SELECT public.get_my_workspace_ids())
    )
  );

-- ---- DEALS ----
DROP POLICY IF EXISTS "Users can view deals in their workspace" ON public.deals;
CREATE POLICY "Users can view deals in their workspace" ON public.deals
  FOR SELECT USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

DROP POLICY IF EXISTS "Users can create deals in their workspace" ON public.deals;
CREATE POLICY "Users can create deals in their workspace" ON public.deals
  FOR INSERT WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));

DROP POLICY IF EXISTS "Users can update deals in their workspace" ON public.deals;
CREATE POLICY "Users can update deals in their workspace" ON public.deals
  FOR UPDATE USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

DROP POLICY IF EXISTS "Users can delete deals in their workspace" ON public.deals;
CREATE POLICY "Users can delete deals in their workspace" ON public.deals
  FOR DELETE USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

-- ---- DEAL_CONTACTS ----
DROP POLICY IF EXISTS "Users can view deal_contacts in their workspace" ON public.deal_contacts;
CREATE POLICY "Users can view deal_contacts in their workspace" ON public.deal_contacts
  FOR SELECT USING (
    deal_id IN (
      SELECT id FROM public.deals WHERE workspace_id IN (SELECT public.get_my_workspace_ids())
    )
  );

DROP POLICY IF EXISTS "Users can manage deal_contacts in their workspace" ON public.deal_contacts;
CREATE POLICY "Users can manage deal_contacts in their workspace" ON public.deal_contacts
  FOR ALL USING (
    deal_id IN (
      SELECT id FROM public.deals WHERE workspace_id IN (SELECT public.get_my_workspace_ids())
    )
  );

-- ---- ACTIVITIES ----
DROP POLICY IF EXISTS "Users can view activities in their workspace" ON public.activities;
CREATE POLICY "Users can view activities in their workspace" ON public.activities
  FOR SELECT USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

DROP POLICY IF EXISTS "Users can create activities in their workspace" ON public.activities;
CREATE POLICY "Users can create activities in their workspace" ON public.activities
  FOR INSERT WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));

DROP POLICY IF EXISTS "Users can update activities in their workspace" ON public.activities;
CREATE POLICY "Users can update activities in their workspace" ON public.activities
  FOR UPDATE USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

DROP POLICY IF EXISTS "Users can delete activities in their workspace" ON public.activities;
CREATE POLICY "Users can delete activities in their workspace" ON public.activities
  FOR DELETE USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

-- ============================================================
-- 8. UTILITY FUNCTIONS
-- ============================================================

-- Function to check if workspace has reached a plan limit
CREATE OR REPLACE FUNCTION public.check_plan_limit(
  p_workspace_id UUID,
  p_resource TEXT  -- 'contacts', 'companies', 'deals', 'users', 'pipelines'
)
RETURNS JSONB AS $$
DECLARE
  plan_record RECORD;
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Get workspace plan
  SELECT p.* INTO plan_record
  FROM public.workspaces w
  JOIN public.plans p ON p.id = w.plan_id
  WHERE w.id = p_workspace_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'Workspace not found');
  END IF;

  -- Get the limit for the resource
  CASE p_resource
    WHEN 'contacts' THEN max_allowed := plan_record.max_contacts;
    WHEN 'companies' THEN max_allowed := plan_record.max_companies;
    WHEN 'deals' THEN max_allowed := plan_record.max_deals;
    WHEN 'pipelines' THEN max_allowed := plan_record.max_pipelines;
    WHEN 'users' THEN max_allowed := plan_record.max_users;
    ELSE RETURN jsonb_build_object('allowed', false, 'error', 'Unknown resource');
  END CASE;

  -- NULL means unlimited
  IF max_allowed IS NULL THEN
    RETURN jsonb_build_object('allowed', true, 'current', 0, 'max', null, 'unlimited', true);
  END IF;

  -- Count current usage
  CASE p_resource
    WHEN 'contacts' THEN
      SELECT count(*) INTO current_count FROM public.contacts WHERE workspace_id = p_workspace_id AND deleted_at IS NULL;
    WHEN 'companies' THEN
      SELECT count(*) INTO current_count FROM public.companies WHERE workspace_id = p_workspace_id AND deleted_at IS NULL;
    WHEN 'deals' THEN
      SELECT count(*) INTO current_count FROM public.deals WHERE workspace_id = p_workspace_id AND deleted_at IS NULL;
    WHEN 'pipelines' THEN
      SELECT count(*) INTO current_count FROM public.pipelines WHERE workspace_id = p_workspace_id;
    WHEN 'users' THEN
      SELECT count(*) INTO current_count FROM public.memberships WHERE workspace_id = p_workspace_id;
  END CASE;

  RETURN jsonb_build_object(
    'allowed', current_count < max_allowed,
    'current', current_count,
    'max', max_allowed,
    'unlimited', false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a workspace has a specific feature
CREATE OR REPLACE FUNCTION public.check_feature(
  p_workspace_id UUID,
  p_feature TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  has_feature BOOLEAN;
BEGIN
  SELECT (p.features->>p_feature)::boolean INTO has_feature
  FROM public.workspaces w
  JOIN public.plans p ON p.id = w.plan_id
  WHERE w.id = p_workspace_id;

  RETURN COALESCE(has_feature, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 9. UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['users', 'workspaces', 'companies', 'contacts', 'deals', 'activities', 'pipelines', 'plans'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trigger_updated_at ON public.%I', tbl);
    EXECUTE format('CREATE TRIGGER trigger_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()', tbl);
  END LOOP;
END $$;

-- ============================================================
-- 10. GRANT PERMISSIONS
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.plans TO anon, authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.workspaces TO authenticated;
GRANT ALL ON public.memberships TO authenticated;
GRANT ALL ON public.companies TO authenticated;
GRANT ALL ON public.contacts TO authenticated;
GRANT ALL ON public.pipelines TO authenticated;
GRANT ALL ON public.stages TO authenticated;
GRANT ALL ON public.deals TO authenticated;
GRANT ALL ON public.deal_contacts TO authenticated;
GRANT ALL ON public.activities TO authenticated;

-- ============================================================
-- DONE! Your multi-tenant SaaS database is ready.
-- New users who sign up will automatically get:
-- 1. A user profile
-- 2. A workspace (free plan)
-- 3. An owner membership
-- 4. A default pipeline with 7 stages
-- ============================================================
