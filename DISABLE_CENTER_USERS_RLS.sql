-- =============================================================================
-- SIMPLE FIX: DISABLE RLS FOR CENTER_USERS TABLE
-- =============================================================================
-- This is the simplest solution since we handle auth at application level

-- Option 1: Disable RLS entirely (simplest approach)
ALTER TABLE center_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE center_sessions DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('center_users', 'center_sessions');

-- This should show rowsecurity = false for both tables
