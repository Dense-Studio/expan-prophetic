-- Run this in the Supabase SQL editor to support the 1, 2, 3, 4
-- EXPAN attendance selector for registrations and check-ins.
BEGIN;

ALTER TABLE expan_registrations
  DROP CONSTRAINT IF EXISTS expan_registrations_attendance_count_check;

ALTER TABLE expan_registrations
  ADD CONSTRAINT expan_registrations_attendance_count_check
  CHECK (expan_attendance_count IS NULL OR expan_attendance_count BETWEEN 1 AND 4);

ALTER TABLE expan_check_ins
  DROP CONSTRAINT IF EXISTS expan_check_ins_attendance_count_check;

ALTER TABLE expan_check_ins
  ADD CONSTRAINT expan_check_ins_attendance_count_check
  CHECK (attendance_count IS NULL OR attendance_count BETWEEN 1 AND 4);

COMMIT;
