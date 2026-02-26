-- JTSG Employer Network: initial schema

-- Employer status enum
CREATE TYPE employer_status AS ENUM ('New Submission', 'Active Partner');

-- Employers (public signup + staff view)
CREATE TABLE employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status employer_status NOT NULL DEFAULT 'New Submission',

  -- Company
  company_name TEXT NOT NULL,
  address_street TEXT NOT NULL,
  address_city TEXT NOT NULL,
  address_state TEXT NOT NULL,
  address_county TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  industry TEXT NOT NULL,

  -- Contact person
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT NOT NULL,
  contact_title TEXT,

  -- Map cache
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
);

CREATE INDEX idx_employers_status ON employers(status);
CREATE INDEX idx_employers_created_at ON employers(created_at DESC);
CREATE INDEX idx_employers_address_city ON employers(address_city);
CREATE INDEX idx_employers_address_county ON employers(address_county);
CREATE INDEX idx_employers_industry ON employers(industry);
CREATE INDEX idx_employers_company_name ON employers(company_name);

-- Profiles: link Supabase Auth users to our roles (admin is special)
CREATE TYPE app_role AS ENUM (
  'admin',
  'director',
  'supervisor',
  'employment_specialist',
  'crs'
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(id)
);

-- RLS: allow public insert for employers (signup form only)
ALTER TABLE employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Public can only INSERT into employers (signup)
CREATE POLICY "Public can insert employers"
  ON employers FOR INSERT
  TO anon
  WITH CHECK (true);

-- No public read/update/delete on employers
-- Staff access will be enforced in app using service role or per-role policies

-- Profiles: only service role or own user (for reading own profile)
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Service role full access employers"
  ON employers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access profiles"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employers_updated_at
  BEFORE UPDATE ON employers
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
