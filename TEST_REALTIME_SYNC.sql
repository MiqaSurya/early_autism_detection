-- =============================================================================
-- TEST REAL-TIME SYNCHRONIZATION FOR AUTISM CENTERS
-- =============================================================================
-- This script tests the real-time sync between center_users and autism_centers

-- Step 1: Check current state
SELECT 'CURRENT STATE CHECK' as test_phase;
SELECT 
    'center_users' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE is_active = true) as active_records
FROM center_users
UNION ALL
SELECT 
    'autism_centers' as table_name,     
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE verified = true) as verified_records
FROM autism_centers;

-- Step 2: Check sync status
SELECT 'SYNC STATUS CHECK' as test_phase;
SELECT 
    cu.id as center_user_id,
    cu.center_name,
    cu.is_active,
    ac.id as autism_center_id,
    ac.name as autism_center_name,
    ac.verified,
    CASE 
        WHEN ac.id IS NULL THEN 'NOT_SYNCED'
        WHEN cu.center_name != ac.name THEN 'OUT_OF_SYNC'
        ELSE 'SYNCED'
    END as sync_status
FROM center_users cu
LEFT JOIN autism_centers ac ON cu.id = ac.center_user_id
WHERE cu.is_active = true
ORDER BY cu.created_at DESC
LIMIT 10;

-- Step 3: Test center_user INSERT trigger
SELECT 'TESTING INSERT TRIGGER' as test_phase;
INSERT INTO center_users (
    email,
    password_hash,
    contact_person,
    center_name,
    center_type,
    address,
    latitude,
    longitude,
    phone,
    description,
    is_verified,
    is_active
) VALUES (
    'test_sync@example.com',
    'test_hash',
    'Test Contact Person',
    'Test Sync Center',
    'diagnostic',
    'Test Address, Kuala Lumpur',
    3.1390,
    101.6869,
    '+60123456789',
    'Test center for sync verification',
    true,
    true
);

-- Check if autism_centers record was created
SELECT 'INSERT TRIGGER RESULT' as test_phase;
SELECT 
    cu.center_name as center_user_name,
    ac.name as autism_center_name,
    ac.center_user_id,
    ac.created_at as autism_center_created
FROM center_users cu
LEFT JOIN autism_centers ac ON cu.id = ac.center_user_id
WHERE cu.email = 'test_sync@example.com';

-- Step 4: Test center_user UPDATE trigger
SELECT 'TESTING UPDATE TRIGGER' as test_phase;
UPDATE center_users 
SET 
    center_name = 'Updated Test Sync Center',
    description = 'Updated description for sync test',
    updated_at = NOW()
WHERE email = 'test_sync@example.com';

-- Check if autism_centers record was updated
SELECT 'UPDATE TRIGGER RESULT' as test_phase;
SELECT 
    cu.center_name as center_user_name,
    cu.description as center_user_description,
    ac.name as autism_center_name,
    ac.description as autism_center_description,
    ac.updated_at as autism_center_updated
FROM center_users cu
LEFT JOIN autism_centers ac ON cu.id = ac.center_user_id
WHERE cu.email = 'test_sync@example.com';

-- Step 5: Test direct autism_centers UPDATE (simulating center portal update)
SELECT 'TESTING DIRECT AUTISM_CENTERS UPDATE' as test_phase;
UPDATE autism_centers 
SET 
    phone = '+60987654321',
    website = 'https://updated-test-center.com',
    updated_at = NOW()
WHERE center_user_id = (
    SELECT id FROM center_users WHERE email = 'test_sync@example.com'
);

-- Check the update
SELECT 'DIRECT UPDATE RESULT' as test_phase;
SELECT 
    name,
    phone,
    website,
    updated_at
FROM autism_centers 
WHERE center_user_id = (
    SELECT id FROM center_users WHERE email = 'test_sync@example.com'
);

-- Step 6: Test real-time notification function
SELECT 'TESTING REAL-TIME NOTIFICATION' as test_phase;
SELECT test_realtime_update();

-- Step 7: Check recent updates (this should show in real-time)
SELECT 'RECENT UPDATES CHECK' as test_phase;
SELECT 
    name,
    type,
    verified,
    updated_at,
    EXTRACT(EPOCH FROM (NOW() - updated_at)) as seconds_ago
FROM autism_centers 
ORDER BY updated_at DESC 
LIMIT 5;

-- Step 8: Clean up test data
SELECT 'CLEANING UP TEST DATA' as test_phase;
DELETE FROM autism_centers 
WHERE center_user_id = (
    SELECT id FROM center_users WHERE email = 'test_sync@example.com'
);

DELETE FROM center_users 
WHERE email = 'test_sync@example.com';

-- Step 9: Final verification
SELECT 'FINAL VERIFICATION' as test_phase;
SELECT 
    'Test data cleaned up' as message,
    COUNT(*) as remaining_test_records
FROM center_users 
WHERE email = 'test_sync@example.com';

-- Step 10: Check real-time configuration
SELECT 'REAL-TIME CONFIGURATION CHECK' as test_phase;
SELECT * FROM check_realtime_config();

-- Step 11: Monitor view for ongoing issues
SELECT 'MONITORING VIEW' as test_phase;
SELECT * FROM realtime_monitoring LIMIT 10;

-- Step 12: Instructions for manual testing
SELECT 'MANUAL TESTING INSTRUCTIONS' as instructions;
SELECT '1. Open browser console and watch for real-time events' as step_1;
SELECT '2. Update a center via center portal' as step_2;
SELECT '3. Check if user locator updates automatically' as step_3;
SELECT '4. If not working, run: SELECT force_realtime_notification();' as step_4;
SELECT '5. Check Supabase dashboard for real-time settings' as step_5;

-- Step 13: Performance check
SELECT 'PERFORMANCE CHECK' as test_phase;
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename = 'autism_centers' 
  AND attname IN ('latitude', 'longitude', 'type', 'updated_at');

-- Step 14: Index usage check
SELECT 'INDEX USAGE CHECK' as test_phase;
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'autism_centers';

SELECT 'TEST COMPLETED - Check results above' as final_message;
