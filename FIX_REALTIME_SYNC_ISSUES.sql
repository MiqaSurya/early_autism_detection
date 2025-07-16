-- =============================================================================
-- FIX REAL-TIME SYNCHRONIZATION ISSUES FOR AUTISM CENTERS
-- =============================================================================
-- This script addresses common issues that prevent real-time updates from working

-- Step 1: Ensure real-time is enabled for the autism_centers table
ALTER TABLE autism_centers REPLICA IDENTITY FULL;

-- Step 2: Check and fix RLS policies for real-time subscriptions
-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Anyone can view autism centers" ON autism_centers;
DROP POLICY IF EXISTS "Authenticated users can insert autism centers" ON autism_centers;
DROP POLICY IF EXISTS "Allow public read access to autism_centers" ON autism_centers;

-- Create comprehensive RLS policies that work with real-time
CREATE POLICY "Public read access for autism_centers" ON autism_centers
    FOR SELECT USING (true);

CREATE POLICY "Authenticated insert for autism_centers" ON autism_centers
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update for autism_centers" ON autism_centers
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated delete for autism_centers" ON autism_centers
    FOR DELETE TO authenticated USING (true);

-- Step 3: Grant necessary permissions for real-time subscriptions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON autism_centers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON autism_centers TO authenticated;

-- Step 4: Enable real-time for the table (this might need to be done in Supabase dashboard)
-- Note: This command might not work in all environments, check Supabase dashboard
-- ALTER PUBLICATION supabase_realtime ADD TABLE autism_centers;

-- Step 5: Create a function to test real-time updates
CREATE OR REPLACE FUNCTION test_realtime_update()
RETURNS void AS $$
BEGIN
    -- Update a test record to trigger real-time event
    UPDATE autism_centers 
    SET updated_at = NOW()
    WHERE id = (SELECT id FROM autism_centers LIMIT 1);
    
    RAISE NOTICE 'Test real-time update triggered at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create a function to check real-time configuration
CREATE OR REPLACE FUNCTION check_realtime_config()
RETURNS TABLE(
    table_name text,
    replica_identity text,
    rls_enabled boolean,
    policies_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'autism_centers'::text,
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
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create a function to manually sync center_users to autism_centers
CREATE OR REPLACE FUNCTION manual_sync_centers()
RETURNS void AS $$
DECLARE
    center_record RECORD;
    sync_count INTEGER := 0;
BEGIN
    -- Sync all active center_users to autism_centers
    FOR center_record IN 
        SELECT cu.*
        FROM center_users cu
        LEFT JOIN autism_centers ac ON cu.id = ac.center_user_id
        WHERE cu.is_active = true 
          AND cu.latitude IS NOT NULL 
          AND cu.longitude IS NOT NULL
          AND ac.id IS NULL
    LOOP
        INSERT INTO autism_centers (
            center_user_id,
            name,
            type,
            address,
            latitude,
            longitude,
            phone,
            email,
            description,
            contact_person,
            services,
            age_groups,
            insurance_accepted,
            verified,
            created_at,
            updated_at
        ) VALUES (
            center_record.id,
            center_record.center_name,
            center_record.center_type,
            center_record.address,
            center_record.latitude,
            center_record.longitude,
            center_record.phone,
            center_record.email,
            center_record.description,
            center_record.contact_person,
            CASE center_record.center_type
                WHEN 'diagnostic' THEN ARRAY['ADOS-2 Assessment', 'Developmental Evaluation', 'Speech Assessment']
                WHEN 'therapy' THEN ARRAY['ABA Therapy', 'Speech Therapy', 'Occupational Therapy']
                WHEN 'support' THEN ARRAY['Support Groups', 'Family Counseling', 'Resource Navigation']
                WHEN 'education' THEN ARRAY['Special Education', 'Inclusive Programs', 'Educational Support']
                ELSE ARRAY['General Services']
            END,
            ARRAY['0-3', '4-7', '8-12', '13-18'],
            ARRAY['Private Pay', 'Insurance', 'Medicaid'],
            COALESCE(center_record.is_verified, false),
            center_record.created_at,
            center_record.updated_at
        );
        
        sync_count := sync_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Manually synced % centers to autism_centers table', sync_count;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create a function to force real-time notification
CREATE OR REPLACE FUNCTION force_realtime_notification()
RETURNS void AS $$
BEGIN
    -- Insert a temporary test record
    INSERT INTO autism_centers (
        name, type, address, latitude, longitude, verified
    ) VALUES (
        'Test Center - DELETE ME', 'diagnostic', 'Test Address', 3.1390, 101.6869, false
    );
    
    -- Delete the test record immediately
    DELETE FROM autism_centers WHERE name = 'Test Center - DELETE ME';
    
    RAISE NOTICE 'Forced real-time notification sent at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Step 9: Run diagnostics
SELECT 'Real-time Configuration Check:' as info;
SELECT * FROM check_realtime_config();

SELECT 'Center Sync Status:' as info;
SELECT 
    (SELECT COUNT(*) FROM center_users WHERE is_active = true) as active_center_users,
    (SELECT COUNT(*) FROM autism_centers) as autism_centers_total,
    (SELECT COUNT(*) FROM autism_centers WHERE center_user_id IS NOT NULL) as synced_centers;

-- Step 10: Manual sync if needed
SELECT manual_sync_centers();

-- Step 11: Instructions for testing
SELECT 'To test real-time updates, run these commands:' as instructions;
SELECT '1. SELECT test_realtime_update();' as step_1;
SELECT '2. SELECT force_realtime_notification();' as step_2;
SELECT '3. Check browser console for real-time events' as step_3;

-- Step 12: Create a view for monitoring real-time events
CREATE OR REPLACE VIEW realtime_monitoring AS
SELECT 
    ac.id,
    ac.name,
    ac.type,
    ac.verified,
    ac.updated_at,
    cu.center_name as center_user_name,
    cu.is_active as center_user_active,
    CASE 
        WHEN cu.id IS NULL THEN 'No center_user link'
        WHEN NOT cu.is_active THEN 'Center user inactive'
        ELSE 'Active and linked'
    END as sync_status
FROM autism_centers ac
LEFT JOIN center_users cu ON ac.center_user_id = cu.id
ORDER BY ac.updated_at DESC;

COMMENT ON VIEW realtime_monitoring IS 'Monitor autism centers and their sync status with center_users';
