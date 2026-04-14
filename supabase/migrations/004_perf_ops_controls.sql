-- Performance indexes + ops controls (digest/quota/routing observability)

-- Common list/export filter combinations
CREATE INDEX IF NOT EXISTS idx_employers_status_created_at
  ON employers(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_employers_county_created_at
  ON employers(address_county, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_employers_industry_created_at
  ON employers(industry, created_at DESC);

-- Daily email log for quota/health visibility
CREATE TABLE IF NOT EXISTS email_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL, -- crs_new_signup | employer_confirmation | staff_recovery
  to_email TEXT,
  status TEXT NOT NULL,   -- sent | skipped | queued | failed
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_delivery_log_created_at
  ON email_delivery_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_delivery_log_category_created
  ON email_delivery_log(category, created_at DESC);

-- Optional digest queue (future worker can flush hourly/daily)
CREATE TABLE IF NOT EXISTS notification_digest_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_digest_queue_category_created
  ON notification_digest_queue(category, created_at DESC);

-- Singleton app settings row for operational controls
CREATE TABLE IF NOT EXISTS app_settings (
  id SMALLINT PRIMARY KEY CHECK (id = 1),
  crs_digest_mode TEXT NOT NULL DEFAULT 'instant', -- instant | hourly | daily
  resend_daily_quota INTEGER,                      -- NULL = no app-side cap
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO app_settings(id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE email_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_digest_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access email_delivery_log"
  ON email_delivery_log FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access notification_digest_queue"
  ON notification_digest_queue FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access app_settings"
  ON app_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
