-- Run this once in the Supabase SQL editor for edition filtering and check-in.
-- All registrations that predate this migration belong to the March edition.
ALTER TABLE expan_registrations
  ADD COLUMN IF NOT EXISTS event_key TEXT;

ALTER TABLE expan_registrations
  ADD COLUMN IF NOT EXISTS preferred_language TEXT;

ALTER TABLE expan_registrations
  ADD COLUMN IF NOT EXISTS expan_attendance_count SMALLINT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'expan_registrations_preferred_language_check') THEN
    ALTER TABLE expan_registrations
      ADD CONSTRAINT expan_registrations_preferred_language_check
      CHECK (preferred_language IS NULL OR preferred_language IN ('English', 'Twi', 'Fante', 'Ga', 'Ewe'));
  END IF;

  ALTER TABLE expan_registrations
    DROP CONSTRAINT IF EXISTS expan_registrations_attendance_count_check;
  ALTER TABLE expan_registrations
    ADD CONSTRAINT expan_registrations_attendance_count_check
    CHECK (expan_attendance_count IS NULL OR expan_attendance_count BETWEEN 1 AND 4);
END $$;

UPDATE expan_registrations
SET event_key = 'expan-all-night-2026-03-27'
WHERE event_key IS NULL;

ALTER TABLE expan_registrations
  ALTER COLUMN event_key SET NOT NULL;

ALTER TABLE expan_registrations
  ALTER COLUMN event_key SET DEFAULT 'expan-all-night-2026-08-14';

CREATE TABLE IF NOT EXISTS expan_check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES expan_registrations(id) ON DELETE CASCADE,
  event_key TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  attendance_count SMALLINT,
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (registration_id, event_key)
);

ALTER TABLE expan_check_ins
  ADD COLUMN IF NOT EXISTS attendance_count SMALLINT;

DO $$
BEGIN
  ALTER TABLE expan_check_ins
    DROP CONSTRAINT IF EXISTS expan_check_ins_attendance_count_check;
  ALTER TABLE expan_check_ins
    ADD CONSTRAINT expan_check_ins_attendance_count_check
    CHECK (attendance_count IS NULL OR attendance_count BETWEEN 1 AND 4);
END $$;

CREATE INDEX IF NOT EXISTS expan_check_ins_event_key_idx
  ON expan_check_ins (event_key);

ALTER TABLE expan_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous check in"
  ON expan_check_ins FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public check in lookup"
  ON expan_check_ins FOR SELECT USING (true);
CREATE POLICY "Allow public check in delete"
  ON expan_check_ins FOR DELETE USING (true);
