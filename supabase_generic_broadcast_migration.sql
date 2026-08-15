-- Run once in Supabase for an existing reliable SMS installation.
-- Adds the dedicated campaign type used by Generic Broadcast SMS.

ALTER TABLE sms_campaigns
  DROP CONSTRAINT IF EXISTS sms_campaigns_kind_check;

ALTER TABLE sms_campaigns
  ADD CONSTRAINT sms_campaigns_kind_check
  CHECK (kind IN ('reminder', 'live', 'general'));
