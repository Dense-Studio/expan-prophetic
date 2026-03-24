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
  is_student BOOLEAN DEFAULT FALSE,
  school TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Storage Bucket for Member Photos
-- Note: You may need to create this manually in the Supabase UI
-- Bucket name: member-photos
-- Ensure it is public or has appropriate RLS policies.

-- 3. RLS Policies
ALTER TABLE expan_registrations ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for onboarding
CREATE POLICY "Allow anonymous registration" ON expan_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select for admin" ON expan_registrations FOR SELECT USING (true);
