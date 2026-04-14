-- Extended pipeline statuses (PostgreSQL 15+ supports IF NOT EXISTS on ADD VALUE)
ALTER TYPE employer_status ADD VALUE IF NOT EXISTS 'Not a fit';
ALTER TYPE employer_status ADD VALUE IF NOT EXISTS 'On hold';
ALTER TYPE employer_status ADD VALUE IF NOT EXISTS 'Inactive';

-- Staff workflow fields on employers
ALTER TABLE employers
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS next_follow_up_date DATE,
  ADD COLUMN IF NOT EXISTS assigned_staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employers_follow_up ON employers(next_follow_up_date)
  WHERE next_follow_up_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employers_assigned ON employers(assigned_staff_id)
  WHERE assigned_staff_id IS NOT NULL;

-- Activity log (service role only from app)
CREATE TABLE IF NOT EXISTS employer_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employer_activity_employer_created
  ON employer_activity(employer_id, created_at DESC);

ALTER TABLE employer_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access employer_activity"
  ON employer_activity FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Soft-disable staff accounts (checked in app APIs + getProfile)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
