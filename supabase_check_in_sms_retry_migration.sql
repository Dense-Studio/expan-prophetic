-- Track check-in confirmation SMS attempts so a failed first attempt can be
-- retried without creating a duplicate attendance record or resending a
-- confirmation that was already accepted.

ALTER TABLE public.expan_check_ins
  ADD COLUMN IF NOT EXISTS confirmation_sms_attempted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmation_sms_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmation_sms_error TEXT;

COMMENT ON COLUMN public.expan_check_ins.confirmation_sms_attempted_at IS
  'Most recent time the API claimed this check-in for a confirmation SMS attempt.';

COMMENT ON COLUMN public.expan_check_ins.confirmation_sms_sent_at IS
  'Time Arkesel accepted the check-in confirmation SMS.';

COMMENT ON COLUMN public.expan_check_ins.confirmation_sms_error IS
  'Sanitized diagnostic from the most recent failed confirmation SMS attempt.';
