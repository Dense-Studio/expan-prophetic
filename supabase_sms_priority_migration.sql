-- Prioritise people arriving at the current EXPAN event in live SMS campaigns.
-- Safe to run after supabase_reliable_sms_migration.sql.

ALTER TABLE sms_campaigns
  ADD COLUMN IF NOT EXISTS audience_mode TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS priority_event_key TEXT,
  ADD COLUMN IF NOT EXISTS priority_cutoff TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS priority_recipients INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source_campaign_id UUID REFERENCES sms_campaigns(id) ON DELETE SET NULL;

ALTER TABLE sms_campaigns
  DROP CONSTRAINT IF EXISTS sms_campaigns_audience_mode_check;

ALTER TABLE sms_campaigns
  ADD CONSTRAINT sms_campaigns_audience_mode_check
  CHECK (audience_mode IN ('standard', 'auditorium_first', 'auditorium_only', 'new_arrivals'));

ALTER TABLE sms_campaign_recipients
  ADD COLUMN IF NOT EXISTS priority_tier SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE sms_campaign_recipients
  DROP CONSTRAINT IF EXISTS sms_campaign_recipients_priority_tier_check;

ALTER TABLE sms_campaign_recipients
  ADD CONSTRAINT sms_campaign_recipients_priority_tier_check
  CHECK (priority_tier IN (0, 1));

CREATE INDEX IF NOT EXISTS sms_campaign_recipients_priority_queue_idx
  ON sms_campaign_recipients
  (campaign_id, status, priority_tier DESC, next_attempt_at, created_at);

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

REVOKE ALL ON FUNCTION claim_sms_campaign_recipients(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION claim_sms_campaign_recipients(UUID, INTEGER) TO service_role;

