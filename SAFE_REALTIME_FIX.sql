-- =============================================================================
-- SAFE REAL-TIME FIX FOR AUTISM CENTERS
-- =============================================================================
-- This version checks existing policies first and handles conflicts safely

-- Step 1: Check current state
SELECT 'CURRENT POLICIES:' as info;
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'autism_centers';

-- Step 2: Check replica identity
SELECT 'CURRENT REPLICA IDENTITY:' as info;
SELECT 
    'autism_centers' as table_name,
    CASE 
        WHEN c.relreplident = 'f' THEN 'FULL'
        WHEN c.relreplident = 'd' THEN 'DEFAULT'
        WHEN c.relreplident = 'n' THEN 'NOTHING'
        WHEN c.relreplident = 'i' THEN 'INDEX'
        ELSE 'UNKNOWN'
    END as replica_identity,
    c.relrowsecurity as rls_enabled
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname = 'autism_centers';

-- Step 3: Enable real-time for autism_centers table (safe to run multiple times)
ALTER TABLE autism_centers REPLICA IDENTITY FULL;

-- Step 4: Drop ALL existing policies safely
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Get all policies for autism_centers table
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'autism_centers'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON autism_centers', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Step 5: Create new policies with unique names
CREATE POLICY "autism_centers_select_all" ON autism_centers
    FOR SELECT USING (true);

CREATE POLICY "autism_centers_insert_authenticated" ON autism_centers
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "autism_centers_update_authenticated" ON autism_centers
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "autism_centers_delete_authenticated" ON autism_centers
    FOR DELETE TO authenticated USING (true);

-- Step 6: Grant necessary permissions (safe to run multiple times)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON autism_centers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON autism_centers TO authenticated;

-- Step 7: Verify the setup
SELECT 'VERIFICATION - NEW POLICIES:' as info;
SELECT policyname, cmd, roles, qual 
FROM pg_policies 
WHERE tablename = 'autism_centers'
ORDER BY policyname;

-- Step 8: Check permissions
SELECT 'VERIFICATION - PERMISSIONS:' as info;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'autism_centers' 
  AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- Step 9: Test data access
SELECT 'VERIFICATION - DATA ACCESS:' as info;
SELECT 
    COUNT(*) as total_centers,
    COUNT(*) FILTER (WHERE verified = true) as verified_centers,
    MAX(updated_at) as last_updated
FROM autism_centers;

-- Step 10: Final configuration check
SELECT 'FINAL CONFIGURATION:' as info;
SELECT 
    'autism_centers' as table_name,
    CASE 
        WHEN c.relreplident = 'f' THEN 'FULL ✓'
        WHEN c.relreplident = 'd' THEN 'DEFAULT (needs FULL)'
        WHEN c.relreplident = 'n' THEN 'NOTHING (needs FULL)'
        WHEN c.relreplident = 'i' THEN 'INDEX (needs FULL)'
        ELSE 'UNKNOWN'
    END as replica_identity_status,
    CASE 
        WHEN c.relrowsecurity THEN 'ENABLED ✓'
        ELSE 'DISABLED (should be enabled)'
    END as rls_status,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'autism_centers') as policy_count
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname = 'autism_centers';

-- Step 11: Next steps
SELECT 'NEXT STEPS:' as instructions;
SELECT '1. Go to Supabase Dashboard > Settings > API > Realtime' as step_1;
SELECT '2. Find "autism_centers" table and enable it' as step_2;
SELECT '3. Save the settings' as step_3;
SELECT '4. Test your application - should show blue "Auto-refresh (15s)" status' as step_4;
SELECT '5. If you see green "Live updates", real-time is working too!' as step_5;
