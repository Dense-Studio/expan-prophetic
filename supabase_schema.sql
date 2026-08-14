-- 0. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. EXPAN Registrations Table (New)
CREATE TABLE IF NOT EXISTS expan_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT UNIQUE NOT NULL,
  location_name TEXT,
  referral_source TEXT, -- Posters & Flyers, Invited by someone, Social Media, Other
  preferred_language TEXT CHECK (preferred_language IN ('English', 'Twi', 'Fante', 'Ga', 'Ewe')),
  expan_attendance_count SMALLINT CHECK (expan_attendance_count BETWEEN 1 AND 4),
  is_student BOOLEAN DEFAULT FALSE,
  school TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  event_key TEXT NOT NULL DEFAULT 'expan-all-night-2026-08-14',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS Policies
ALTER TABLE expan_registrations ENABLE ROW LEVEL SECURITY;

-- Registration and admin access are handled by narrow server endpoints using
-- the Supabase service role. No anonymous table policies are intentionally added.

-- 3. Event check-ins for returning EXPAN guests
CREATE TABLE IF NOT EXISTS expan_check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES expan_registrations(id) ON DELETE CASCADE,
  event_key TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  attendance_count SMALLINT CHECK (attendance_count BETWEEN 1 AND 4),
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  confirmation_sms_attempted_at TIMESTAMPTZ,
  confirmation_sms_sent_at TIMESTAMPTZ,
  confirmation_sms_error TEXT,
  UNIQUE (registration_id, event_key)
);

CREATE INDEX IF NOT EXISTS expan_check_ins_event_key_idx
  ON expan_check_ins (event_key);

ALTER TABLE expan_check_ins ENABLE ROW LEVEL SECURITY;

-- Check-in lookup and writes are handled by /api/check-in.
