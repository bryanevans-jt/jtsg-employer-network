-- Coverage territories: counties → territory → CRS / Supervisor assignees (admin-managed)

CREATE TABLE coverage_territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE coverage_assignee_role AS ENUM ('crs', 'supervisor');

-- Each county maps to at most one territory (routing is unambiguous)
CREATE TABLE coverage_territory_counties (
  territory_id UUID NOT NULL REFERENCES coverage_territories(id) ON DELETE CASCADE,
  county_key TEXT NOT NULL,
  PRIMARY KEY (territory_id, county_key),
  CONSTRAINT uq_coverage_county_key UNIQUE (county_key)
);

CREATE INDEX idx_coverage_territory_counties_territory
  ON coverage_territory_counties(territory_id);

CREATE TABLE coverage_territory_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  territory_id UUID NOT NULL REFERENCES coverage_territories(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assignee_role coverage_assignee_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (territory_id, profile_id)
);

CREATE INDEX idx_coverage_assignees_territory
  ON coverage_territory_assignees(territory_id);

CREATE INDEX idx_coverage_assignees_profile
  ON coverage_territory_assignees(profile_id);

ALTER TABLE coverage_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_territory_counties ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_territory_assignees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access coverage_territories"
  ON coverage_territories FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access coverage_territory_counties"
  ON coverage_territory_counties FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access coverage_territory_assignees"
  ON coverage_territory_assignees FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER coverage_territories_updated_at
  BEFORE UPDATE ON coverage_territories
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
