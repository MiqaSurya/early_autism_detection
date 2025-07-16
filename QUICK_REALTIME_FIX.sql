-- =============================================================================
-- QUICK REAL-TIME FIX FOR AUTISM CENTERS
-- =============================================================================
-- Run this first to fix the most common real-time issues

-- Step 1: Enable real-time for autism_centers table
ALTER TABLE autism_centers REPLICA IDENTITY FULL;

-- Step 2: Fix RLS policies for real-time subscriptions
-- Drop all existing policies first
DROP POLICY IF EXISTS "Anyone can view autism centers" ON autism_centers;
DROP POLICY IF EXISTS "Authenticated users can insert autism centers" ON autism_centers;
DROP POLICY IF EXISTS "Allow public read access to autism_centers" ON autism_centers;
DROP POLICY IF EXISTS "Public read access for autism_centers" ON autism_centers;
DROP POLICY IF EXISTS "Authenticated write access for autism_centers" ON autism_centers;

-- Create permissive policies that work with real-time
CREATE POLICY "autism_centers_public_read" ON autism_centers
    FOR SELECT USING (true);

CREATE POLICY "autism_centers_authenticated_write" ON autism_centers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Step 3: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON autism_centers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON autism_centers TO authenticated;

-- Step 4: Check current configuration
SELECT 
    'autism_centers' as table_name,
    CASE 
        WHEN c.relreplident = 'f' THEN 'FULL'
        WHEN c.relreplident = 'd' THEN 'DEFAULT'
        WHEN c.relreplident = 'n' THEN 'NOTHING'
        WHEN c.relreplident = 'i' THEN 'INDEX'
        ELSE 'UNKNOWN'
    END as replica_identity,
    c.relrowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'autism_centers') as policies_count
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname = 'autism_centers';

-- Step 5: Show current data
SELECT 
    COUNT(*) as total_centers,
    COUNT(*) FILTER (WHERE verified = true) as verified_centers,
    MAX(updated_at) as last_updated
FROM autism_centers;

-- Step 6: Instructions
SELECT 'NEXT STEPS:' as instructions;
SELECT '1. Go to Supabase Dashboard > Settings > API' as step_1;
SELECT '2. Scroll to "Realtime" section' as step_2;
SELECT '3. Make sure "autism_centers" table is enabled' as step_3;
SELECT '4. If not enabled, click to enable it' as step_4;
SELECT '5. Test the application - it should now use polling mode reliably' as step_5;
