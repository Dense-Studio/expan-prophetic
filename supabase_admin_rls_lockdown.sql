-- Run only after the secure server-endpoint deployment has been verified.
-- This removes the legacy anonymous access that exposed admin data and writes.

ALTER TABLE expan_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expan_check_ins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous registration" ON expan_registrations;
DROP POLICY IF EXISTS "Allow public select for admin" ON expan_registrations;
DROP POLICY IF EXISTS "Allow public update" ON expan_registrations;
DROP POLICY IF EXISTS "Allow public delete" ON expan_registrations;

DROP POLICY IF EXISTS "Allow anonymous check in" ON expan_check_ins;
DROP POLICY IF EXISTS "Allow public check in lookup" ON expan_check_ins;
DROP POLICY IF EXISTS "Allow public check in delete" ON expan_check_ins;

REVOKE ALL ON expan_registrations FROM anon, authenticated;
REVOKE ALL ON expan_check_ins FROM anon, authenticated;
