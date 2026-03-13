-- Migration: Enhanced fields for Companies and Contacts
-- Inspired by ForceManager CRM features

-- ============================================
-- 1. COMPANIES: Add new fields
-- ============================================

-- Account type (classification)
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'prospect';

-- Add constraint separately to handle existing data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_account_type_check'
  ) THEN
    ALTER TABLE companies ADD CONSTRAINT companies_account_type_check
      CHECK (account_type IN ('customer', 'prospect', 'lead', 'partner', 'supplier'));
  END IF;
END $$;

-- Account status
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_account_status_check'
  ) THEN
    ALTER TABLE companies ADD CONSTRAINT companies_account_status_check
      CHECK (account_status IN ('active', 'inactive', 'negotiating', 'churned'));
  END IF;
END $$;

-- Additional company fields
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS founded_year INTEGER,
  ADD COLUMN IF NOT EXISTS employees_exact INTEGER,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Update company_size constraint to allow null
ALTER TABLE companies DROP CONSTRAINT IF EXISTS company_size_check;
ALTER TABLE companies ADD CONSTRAINT company_size_check
  CHECK (company_size IS NULL OR company_size IN ('1-10', '11-50', '51-200', '201-500', '501+'));

-- ============================================
-- 2. CONTACTS: Add new fields
-- ============================================

-- Department
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS department TEXT;

-- Birthday
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS birthday DATE;

-- Gender
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS gender TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contacts_gender_check'
  ) THEN
    ALTER TABLE contacts ADD CONSTRAINT contacts_gender_check
      CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer_not_to_say'));
  END IF;
END $$;

-- Is decision maker
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS is_decision_maker BOOLEAN DEFAULT false;

-- Notes
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================
-- 3. INDEXES for new fields
-- ============================================

CREATE INDEX IF NOT EXISTS idx_companies_account_type ON companies(account_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_companies_account_status ON companies(account_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_is_decision_maker ON contacts(is_decision_maker) WHERE deleted_at IS NULL AND is_decision_maker = true;

-- ============================================
-- 4. Update search vectors to include new fields
-- ============================================

-- Companies: Add email and phone to search
DROP INDEX IF EXISTS idx_companies_search;

ALTER TABLE companies DROP COLUMN IF EXISTS search_vector;
ALTER TABLE companies ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('spanish',
    COALESCE(name, '') || ' ' ||
    COALESCE(website, '') || ' ' ||
    COALESCE(email, '') || ' ' ||
    COALESCE(phone, '') || ' ' ||
    COALESCE(description, '')
  )
) STORED;

CREATE INDEX idx_companies_search ON companies USING GIN(search_vector);

COMMENT ON COLUMN companies.account_type IS 'Type of account: customer, prospect, lead, partner, supplier';
COMMENT ON COLUMN companies.account_status IS 'Current status: active, inactive, negotiating, churned';
COMMENT ON COLUMN companies.description IS 'Company description or notes';
COMMENT ON COLUMN companies.founded_year IS 'Year the company was founded';
COMMENT ON COLUMN companies.employees_exact IS 'Exact number of employees (optional, more precise than company_size)';
COMMENT ON COLUMN contacts.department IS 'Department within the company';
COMMENT ON COLUMN contacts.birthday IS 'Contact birthday for reminders';
COMMENT ON COLUMN contacts.gender IS 'Gender for personalized communication';
COMMENT ON COLUMN contacts.is_decision_maker IS 'Whether this contact is a key decision maker';
COMMENT ON COLUMN contacts.notes IS 'Additional notes about the contact';
