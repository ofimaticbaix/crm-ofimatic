-- =================================================
-- CRM - DATABASE SCHEMA
-- =================================================
-- PostgreSQL + Supabase
-- Version: 1.0.0
-- Last updated: 2026-03-09
-- =================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================
-- FUNCTIONS (must be defined before triggers)
-- =================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION track_deal_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stage_id != OLD.stage_id THEN
    NEW.stage_changed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =================================================
-- CORE TENANT & AUTH
-- =================================================

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  subscription_status TEXT DEFAULT 'trial',
  subscription_tier TEXT DEFAULT 'starter',
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT subscription_status_check CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired')),
  CONSTRAINT subscription_tier_check CHECK (subscription_tier IN ('starter', 'professional', 'enterprise'))
);

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  locale TEXT DEFAULT 'es',
  timezone TEXT DEFAULT 'Europe/Madrid',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT role_check CHECK (role IN ('owner', 'admin', 'manager', 'rep', 'read_only')),
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_memberships_workspace ON memberships(workspace_id);
CREATE INDEX idx_memberships_user ON memberships(user_id);

-- =================================================
-- CONTACTS
-- =================================================

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Basic info
  first_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))) STORED,
  email TEXT,
  phone TEXT,
  mobile TEXT,

  -- Professional info
  job_title TEXT,
  company_id UUID,

  -- Additional
  linkedin_url TEXT,
  twitter_handle TEXT,
  website TEXT,

  -- Metadata
  lifecycle_stage TEXT DEFAULT 'lead',
  lead_source TEXT,
  language TEXT DEFAULT 'es',

  -- Ownership
  owner_id UUID,
  created_by_id UUID,
  updated_by_id UUID,

  -- Consent (GDPR)
  consent_marketing BOOLEAN DEFAULT false,
  consent_communications BOOLEAN DEFAULT true,
  consent_date TIMESTAMPTZ,

  -- Custom
  custom_fields JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  -- Search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('spanish',
      COALESCE(first_name, '') || ' ' ||
      COALESCE(last_name, '') || ' ' ||
      COALESCE(email, '') || ' ' ||
      COALESCE(job_title, '')
    )
  ) STORED,

  CONSTRAINT lifecycle_stage_check CHECK (lifecycle_stage IN ('lead', 'prospect', 'customer', 'evangelist'))
);

CREATE INDEX idx_contacts_workspace ON contacts(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_owner ON contacts(owner_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_search ON contacts USING GIN(search_vector);
CREATE INDEX idx_contacts_lifecycle ON contacts(lifecycle_stage);

-- =================================================
-- COMPANIES
-- =================================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  website TEXT,

  -- Business details
  industry TEXT,
  company_size TEXT,
  annual_revenue DECIMAL(15,2),
  vat_number TEXT,

  -- Addresses
  billing_address JSONB,
  shipping_address JSONB,

  -- Social
  linkedin_url TEXT,

  -- Ownership
  owner_id UUID,
  created_by_id UUID,
  updated_by_id UUID,

  -- Health & scoring
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  lifetime_value DECIMAL(15,2) DEFAULT 0,

  -- Custom
  custom_fields JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  -- Search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('spanish', COALESCE(name, '') || ' ' || COALESCE(website, ''))
  ) STORED,

  CONSTRAINT company_size_check CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '501+'))
);

CREATE INDEX idx_companies_workspace ON companies(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_companies_owner ON companies(owner_id);
CREATE INDEX idx_companies_search ON companies USING GIN(search_vector);
CREATE INDEX idx_companies_industry ON companies(industry);

-- Add FK constraint for contacts.company_id
ALTER TABLE contacts ADD CONSTRAINT fk_contacts_company
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- =================================================
-- PIPELINES & STAGES
-- =================================================

CREATE TABLE pipelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  position INTEGER NOT NULL,
  is_closed_won BOOLEAN DEFAULT false,
  is_closed_lost BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_stages_pipeline ON stages(pipeline_id);
CREATE INDEX idx_pipelines_workspace ON pipelines(workspace_id);

-- =================================================
-- DEALS
-- =================================================

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,

  -- Pipeline
  pipeline_id UUID NOT NULL REFERENCES pipelines(id),
  stage_id UUID NOT NULL REFERENCES stages(id),

  -- Financial
  value DECIMAL(15,2),
  currency TEXT DEFAULT 'EUR',
  is_recurring BOOLEAN DEFAULT false,
  recurring_period TEXT,

  -- Timing
  expected_close_date DATE,
  actual_close_date DATE,

  -- Relationships
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,

  -- Ownership
  owner_id UUID,
  created_by_id UUID,
  updated_by_id UUID,

  -- Status
  status TEXT DEFAULT 'open',
  loss_reason TEXT,

  -- Next action
  next_step TEXT,

  -- Competitors
  competitors TEXT[],

  -- Custom
  custom_fields JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  stage_changed_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  -- Search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('spanish', COALESCE(name, '') || ' ' || COALESCE(description, ''))
  ) STORED,

  CONSTRAINT status_check CHECK (status IN ('open', 'won', 'lost')),
  CONSTRAINT recurring_period_check CHECK (recurring_period IN ('monthly', 'quarterly', 'annual', NULL))
);

CREATE INDEX idx_deals_workspace ON deals(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_pipeline ON deals(pipeline_id);
CREATE INDEX idx_deals_stage ON deals(stage_id);
CREATE INDEX idx_deals_owner ON deals(owner_id);
CREATE INDEX idx_deals_company ON deals(company_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_close_date ON deals(expected_close_date);
CREATE INDEX idx_deals_search ON deals USING GIN(search_vector);

-- Deal-Contact many-to-many
CREATE TABLE deal_contacts (
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  role TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (deal_id, contact_id),

  CONSTRAINT role_check CHECK (role IN ('decision_maker', 'influencer', 'champion', 'end_user', NULL))
);

CREATE INDEX idx_deal_contacts_deal ON deal_contacts(deal_id);
CREATE INDEX idx_deal_contacts_contact ON deal_contacts(contact_id);

-- =================================================
-- ACTIVITIES
-- =================================================

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Type
  type TEXT NOT NULL,

  -- Content
  subject TEXT,
  description TEXT,
  outcome TEXT,

  -- Timing
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_date DATE,

  -- Task specifics
  is_completed BOOLEAN DEFAULT false,
  assigned_to_id UUID,

  -- Relationships (polymorphic)
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,

  -- Ownership
  created_by_id UUID NOT NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT type_check CHECK (type IN ('call', 'meeting', 'email', 'note', 'task'))
);

CREATE INDEX idx_activities_workspace ON activities(workspace_id);
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_contact ON activities(contact_id);
CREATE INDEX idx_activities_company ON activities(company_id);
CREATE INDEX idx_activities_deal ON activities(deal_id);
CREATE INDEX idx_activities_assigned_to ON activities(assigned_to_id);
CREATE INDEX idx_activities_due_date ON activities(due_date) WHERE is_completed = false;
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);

-- =================================================
-- NOTES
-- =================================================

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,

  -- Relationships (polymorphic)
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,

  -- Ownership
  created_by_id UUID NOT NULL,
  updated_by_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notes_workspace ON notes(workspace_id);
CREATE INDEX idx_notes_contact ON notes(contact_id);
CREATE INDEX idx_notes_company ON notes(company_id);
CREATE INDEX idx_notes_deal ON notes(deal_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);

-- =================================================
-- TAGS
-- =================================================

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, name)
);

CREATE TABLE taggables (
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  taggable_type TEXT NOT NULL,
  taggable_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (tag_id, taggable_type, taggable_id),

  CONSTRAINT taggable_type_check CHECK (taggable_type IN ('contact', 'company', 'deal'))
);

CREATE INDEX idx_taggables_entity ON taggables(taggable_type, taggable_id);
CREATE INDEX idx_tags_workspace ON tags(workspace_id);

-- =================================================
-- ATTACHMENTS
-- =================================================

CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- File info
  filename TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  storage_path TEXT NOT NULL,

  -- Relationships (polymorphic)
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,

  -- Ownership
  uploaded_by_id UUID NOT NULL,

  -- Timestamps
  uploaded_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT entity_type_check CHECK (entity_type IN ('contact', 'company', 'deal', 'note'))
);

CREATE INDEX idx_attachments_entity ON attachments(entity_type, entity_id);
CREATE INDEX idx_attachments_workspace ON attachments(workspace_id);

-- =================================================
-- AUDIT LOGS
-- =================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Action
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,

  -- Changes
  changes JSONB,

  -- User
  user_id UUID,
  user_email TEXT,

  -- Context
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_workspace ON audit_logs(workspace_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =================================================
-- IMPORT JOBS
-- =================================================

CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Import details
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,

  -- Mapping
  field_mapping JSONB NOT NULL,

  -- Status
  status TEXT DEFAULT 'pending',

  -- Results
  total_rows INTEGER,
  imported_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',

  -- User
  created_by_id UUID NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  CONSTRAINT file_type_check CHECK (file_type IN ('csv', 'xlsx', 'xls', 'mdb', 'accdb', 'json')),
  CONSTRAINT entity_type_check CHECK (entity_type IN ('contacts', 'companies', 'deals', 'invoices_paid', 'invoices_pending')),
  CONSTRAINT status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX idx_import_jobs_workspace ON import_jobs(workspace_id);
CREATE INDEX idx_import_jobs_status ON import_jobs(status);

-- =================================================
-- INVOICES (Facturas)
-- =================================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Factura
  invoice_number TEXT NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  company_nif TEXT,

  -- Detalle
  concept TEXT,

  -- Fechas
  issue_date DATE NOT NULL,
  due_date DATE,
  payment_date DATE,

  -- Importes
  subtotal DECIMAL(15,2),
  tax_rate DECIMAL(5,2) DEFAULT 21.00,
  tax_amount DECIMAL(15,2),
  total DECIMAL(15,2) NOT NULL,

  -- Estado y pago
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,

  -- Custom
  custom_fields JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',

  -- Ownership
  created_by_id UUID,
  updated_by_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT invoice_status_check CHECK (status IN ('paid', 'pending', 'overdue', 'cancelled'))
);

CREATE INDEX idx_invoices_workspace ON invoices(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date DESC);
CREATE INDEX idx_invoices_due_date ON invoices(due_date) WHERE status IN ('pending', 'overdue');

CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- =================================================
-- IMPORT PROFILES (Perfiles de importación)
-- =================================================

CREATE TABLE import_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  mappings JSONB NOT NULL,
  source_columns TEXT[] NOT NULL,
  usage_count INTEGER DEFAULT 0,

  -- Ownership
  created_by_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT profile_entity_type_check CHECK (entity_type IN ('contacts', 'companies', 'invoices_paid', 'invoices_pending'))
);

CREATE INDEX idx_import_profiles_workspace ON import_profiles(workspace_id);

CREATE TRIGGER import_profiles_updated_at BEFORE UPDATE ON import_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE import_profiles ENABLE ROW LEVEL SECURITY;

-- =================================================
-- TRIGGERS
-- =================================================

CREATE TRIGGER workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER activities_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER pipelines_updated_at BEFORE UPDATE ON pipelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER stages_updated_at BEFORE UPDATE ON stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER deals_stage_changed BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION track_deal_stage_change();

-- =================================================
-- ROW LEVEL SECURITY (RLS)
-- =================================================

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE taggables ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's workspace IDs
CREATE OR REPLACE FUNCTION user_workspaces()
RETURNS SETOF UUID AS $$
  SELECT workspace_id FROM memberships WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Policies for contacts (example - similar for other tables)
CREATE POLICY "Users can view contacts in their workspaces"
  ON contacts FOR SELECT
  USING (workspace_id IN (SELECT user_workspaces()));

CREATE POLICY "Users can insert contacts in their workspaces"
  ON contacts FOR INSERT
  WITH CHECK (workspace_id IN (SELECT user_workspaces()));

CREATE POLICY "Users can update contacts in their workspaces"
  ON contacts FOR UPDATE
  USING (workspace_id IN (SELECT user_workspaces()));

CREATE POLICY "Users can delete contacts in their workspaces"
  ON contacts FOR DELETE
  USING (workspace_id IN (SELECT user_workspaces()));

-- Similar policies for companies, deals, etc.
-- (Abbreviated for brevity - apply same pattern)

-- =================================================
-- SEED DATA (Default Pipeline)
-- =================================================

-- This will be populated via migrations or seed script
-- Example: Default pipeline for new workspaces

-- =================================================
-- END OF SCHEMA
-- =================================================
