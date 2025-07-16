-- =============================================================================
-- TEST CENTER SYNCHRONIZATION
-- =============================================================================
-- This script tests that center_users updates automatically sync to autism_centers

-- Step 1: Check current state before test
SELECT 'BEFORE TEST - Current sync status' as test_phase;
SELECT 
    COUNT(*) as total_center_users,
    COUNT(ac.id) as synced_autism_centers
FROM center_users cu
LEFT JOIN autism_centers ac ON cu.id = ac.center_user_id
WHERE cu.is_active = true;

-- Step 2: Test UPDATE operation - simulate center updating their info
SELECT 'TEST 1: Updating center information' as test_phase;

-- Find an active center to test with
DO $$
DECLARE
    test_center_id UUID;
    test_center_name TEXT;
    old_address TEXT;
    new_address TEXT := 'Updated Test Address 123, Kuala Lumpur, Malaysia';
BEGIN
    -- Get a test center
    SELECT id, center_name, address 
    INTO test_center_id, test_center_name, old_address
    FROM center_users 
    WHERE is_active = true 
    LIMIT 1;
    
    IF test_center_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with center: % (ID: %)', test_center_name, test_center_id;
        RAISE NOTICE 'Old address: %', old_address;
        
        -- Update the center_users record
        UPDATE center_users 
        SET 
            address = new_address,
            description = 'Updated description via sync test',
            updated_at = NOW()
        WHERE id = test_center_id;
        
        RAISE NOTICE 'Updated center_users record';
        
        -- Check if autism_centers was automatically updated
        PERFORM pg_sleep(1); -- Small delay to ensure trigger completes
        
        IF EXISTS (
            SELECT 1 FROM autism_centers 
            WHERE center_user_id = test_center_id 
            AND address = new_address
        ) THEN
            RAISE NOTICE '✅ SUCCESS: autism_centers was automatically updated!';
        ELSE
            RAISE NOTICE '❌ FAILED: autism_centers was not updated automatically';
        END IF;
        
    ELSE
        RAISE NOTICE 'No active center found for testing';
    END IF;
END $$;

-- Step 3: Verify sync status after test
SELECT 'AFTER TEST - Sync verification' as test_phase;
SELECT 
    cu.center_name,
    cu.address as center_user_address,
    ac.address as autism_center_address,
    CASE 
        WHEN cu.address = ac.address THEN '✅ SYNCED'
        ELSE '❌ NOT SYNCED'
    END as sync_status,
    cu.updated_at as center_user_updated,
    ac.updated_at as autism_center_updated
FROM center_users cu
INNER JOIN autism_centers ac ON cu.id = ac.center_user_id
WHERE cu.is_active = true
ORDER BY cu.updated_at DESC
LIMIT 5;

-- Step 4: Test real-time impact - check what users will see
SELECT 'USER LOCATOR VIEW - What users will see' as test_phase;
SELECT 
    name,
    type,
    address,
    latitude,
    longitude,
    phone,
    email,
    verified,
    updated_at
FROM autism_centers
WHERE updated_at > (NOW() - INTERVAL '5 minutes')
ORDER BY updated_at DESC;

-- Step 5: Performance check - ensure triggers are efficient
SELECT 'PERFORMANCE CHECK' as test_phase;
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename IN ('center_users', 'autism_centers')
AND attname IN ('id', 'center_user_id', 'updated_at');

-- Step 6: Check trigger status
SELECT 'TRIGGER STATUS' as test_phase;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%sync%center%'
AND event_object_table = 'center_users';

SELECT 'TEST COMPLETE!' as status;
SELECT 'If you see ✅ SUCCESS above, the sync is working correctly!' as message;
