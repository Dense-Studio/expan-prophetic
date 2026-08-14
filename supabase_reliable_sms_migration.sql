-- Reliable bulk SMS campaigns and server-only admin access.
-- Back up the database before running this migration.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  ip_hash TEXT PRIMARY KEY,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_key TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('reminder', 'live')),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  audience_label TEXT NOT NULL,
  encoding TEXT NOT NULL CHECK (encoding IN ('GSM-7', 'UCS-2')),
  sms_parts SMALLINT NOT NULL CHECK (sms_parts > 0),
  estimated_credits INTEGER NOT NULL CHECK (estimated_credits >= 0),
  total_recipients INTEGER NOT NULL DEFAULT 0,
  valid_recipients INTEGER NOT NULL DEFAULT 0,
  invalid_recipients INTEGER NOT NULL DEFAULT 0,
  duplicate_recipients INTEGER NOT NULL DEFAULT 0,
  audience_mode TEXT NOT NULL DEFAULT 'standard' CHECK (
    audience_mode IN ('standard', 'auditorium_first', 'auditorium_only', 'new_arrivals')
  ),
  priority_event_key TEXT,
  priority_cutoff TIMESTAMPTZ,
  priority_recipients INTEGER NOT NULL DEFAULT 0,
  source_campaign_id UUID REFERENCES sms_campaigns(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (
    status IN ('queued', 'processing', 'awaiting_delivery', 'completed',
      'completed_with_failures', 'needs_review', 'paused', 'cancelled')
  ),
  sandbox BOOLEAN NOT NULL DEFAULT FALSE,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES sms_campaigns(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES expan_registrations(id) ON DELETE SET NULL,
  original_phone TEXT NOT NULL,
  normalized_phone TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (
    status IN ('queued', 'submitting', 'accepted', 'delivered', 'not_delivered',
      'expired', 'prohibited', 'failed', 'invalid', 'needs_review', 'cancelled')
  ),
  attempt_count SMALLINT NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provider_message_id TEXT,
  provider_status TEXT,
  error_code TEXT,
  error_message TEXT,
  priority_tier SMALLINT NOT NULL DEFAULT 0 CHECK (priority_tier IN (0, 1)),
  last_attempt_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS sms_campaign_recipients_campaign_phone_idx
  ON sms_campaign_recipients (campaign_id, normalized_phone)
  WHERE normalized_phone IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS sms_campaign_recipients_provider_id_idx
  ON sms_campaign_recipients (provider_message_id)
  WHERE provider_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS sms_campaign_recipients_queue_idx
  ON sms_campaign_recipients (campaign_id, status, next_attempt_at);
CREATE INDEX IF NOT EXISTS sms_campaign_recipients_priority_queue_idx
  ON sms_campaign_recipients
  (campaign_id, status, priority_tier DESC, next_attempt_at, created_at);
CREATE INDEX IF NOT EXISTS sms_campaign_recipients_status_idx
  ON sms_campaign_recipients (status, updated_at);
CREATE INDEX IF NOT EXISTS sms_campaigns_status_idx
  ON sms_campaigns (status, created_at DESC);

ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_campaign_recipients ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON admin_login_attempts FROM anon, authenticated;
REVOKE ALL ON sms_campaigns FROM anon, authenticated;
REVOKE ALL ON sms_campaign_recipients FROM anon, authenticated;

CREATE OR REPLACE FUNCTION claim_sms_campaign_recipients(
  p_campaign_id UUID,
  p_limit INTEGER DEFAULT 250
)
RETURNS SETOF sms_campaign_recipients
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH active_tier AS (
    SELECT MAX(priority_tier) AS priority_tier
    FROM sms_campaign_recipients
    WHERE campaign_id = p_campaign_id
      AND status IN ('queued', 'submitting')
  ),
  candidates AS (
    SELECT recipient.id
    FROM sms_campaign_recipients AS recipient
    CROSS JOIN active_tier
    WHERE recipient.campaign_id = p_campaign_id
      AND recipient.status = 'queued'
      AND recipient.priority_tier = active_tier.priority_tier
      AND recipient.next_attempt_at <= NOW()
    ORDER BY recipient.priority_tier DESC, recipient.created_at, recipient.id
    FOR UPDATE OF recipient SKIP LOCKED
    LIMIT LEAST(GREATEST(p_limit, 1), 250)
  )
  UPDATE sms_campaign_recipients AS recipient
  SET status = 'submitting',
      attempt_count = recipient.attempt_count + 1,
      last_attempt_at = NOW(),
      updated_at = NOW()
  FROM candidates
  WHERE recipient.id = candidates.id
  RETURNING recipient.*;
$$;

CREATE OR REPLACE FUNCTION get_sms_campaign_counts(p_campaign_id UUID)
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'queued', COUNT(*) FILTER (WHERE status = 'queued'),
    'submitting', COUNT(*) FILTER (WHERE status = 'submitting'),
    'accepted', COUNT(*) FILTER (WHERE status = 'accepted'),
    'delivered', COUNT(*) FILTER (WHERE status = 'delivered'),
    'not_delivered', COUNT(*) FILTER (WHERE status = 'not_delivered'),
    'expired', COUNT(*) FILTER (WHERE status = 'expired'),
    'prohibited', COUNT(*) FILTER (WHERE status = 'prohibited'),
    'failed', COUNT(*) FILTER (WHERE status = 'failed'),
    'invalid', COUNT(*) FILTER (WHERE status = 'invalid'),
    'needs_review', COUNT(*) FILTER (WHERE status = 'needs_review'),
    'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled')
  )
  FROM sms_campaign_recipients
  WHERE campaign_id = p_campaign_id;
$$;

CREATE OR REPLACE FUNCTION refresh_sms_campaign_status(p_campaign_id UUID)
RETURNS sms_campaigns
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  campaign sms_campaigns;
  counts JSONB;
  next_status TEXT;
BEGIN
  SELECT * INTO campaign FROM sms_campaigns WHERE id = p_campaign_id FOR UPDATE;
  IF campaign.id IS NULL THEN
    RAISE EXCEPTION 'Campaign not found';
  END IF;

  counts := get_sms_campaign_counts(p_campaign_id);

  IF campaign.status IN ('paused', 'cancelled') THEN
    next_status := campaign.status;
  ELSIF (counts->>'queued')::INT > 0 OR (counts->>'submitting')::INT > 0 THEN
    next_status := 'processing';
  ELSIF (counts->>'needs_review')::INT > 0 THEN
    next_status := 'needs_review';
  ELSIF (counts->>'accepted')::INT > 0 THEN
    next_status := 'awaiting_delivery';
  ELSIF (counts->>'not_delivered')::INT > 0
     OR (counts->>'expired')::INT > 0
     OR (counts->>'prohibited')::INT > 0
     OR (counts->>'failed')::INT > 0
     OR (counts->>'invalid')::INT > 0 THEN
    next_status := 'completed_with_failures';
  ELSE
    next_status := 'completed';
  END IF;

  UPDATE sms_campaigns
  SET status = next_status,
      started_at = COALESCE(started_at, CASE WHEN next_status <> 'queued' THEN NOW() END),
      completed_at = CASE
        WHEN next_status IN ('completed', 'completed_with_failures') THEN COALESCE(completed_at, NOW())
        ELSE NULL
      END,
      updated_at = NOW()
  WHERE id = p_campaign_id
  RETURNING * INTO campaign;

  RETURN campaign;
END;
$$;

REVOKE ALL ON FUNCTION claim_sms_campaign_recipients(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_sms_campaign_counts(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION refresh_sms_campaign_status(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION claim_sms_campaign_recipients(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_sms_campaign_counts(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION refresh_sms_campaign_status(UUID) TO service_role;

-- After deployment, store APP_URL and SMS_WORKER_SECRET in Supabase Vault and
-- schedule the recovery worker. Replace the placeholders before running:
-- SELECT vault.create_secret('https://your-app.vercel.app', 'expan_app_url');
-- SELECT vault.create_secret('your-worker-secret', 'expan_sms_worker_secret');
-- SELECT cron.schedule(
--   'expan-sms-worker-every-minute',
--   '* * * * *',
--   $$
--   SELECT net.http_post(
--     url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'expan_app_url') || '/api/sms-worker',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'expan_sms_worker_secret')
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
