-- =============================================================================
-- DEBUG CENTER SYNCHRONIZATION ISSUE
-- =============================================================================
-- This script helps debug why center updates aren't syncing to autism_centers

-- Step 1: Check current sync status
SELECT 'CURRENT SYNC STATUS' as check_type;
SELECT 
    COUNT(*) as total_center_users,
    COUNT(ac.id) as synced_autism_centers,
    COUNT(*) - COUNT(ac.id) as unsynced_centers
FROM center_users cu
LEFT JOIN autism_centers ac ON cu.id = ac.center_user_id
WHERE cu.is_active = true;

-- Step 2: Show detailed comparison of center_users vs autism_centers
SELECT 'DETAILED SYNC COMPARISON' as check_type;
SELECT 
    cu.id as center_user_id,
    cu.center_name as cu_name,
    ac.name as ac_name,
    cu.address as cu_address,
    ac.address as ac_address,
    cu.updated_at as cu_updated,
    ac.updated_at as ac_updated,
    CASE 
        WHEN ac.id IS NULL THEN '❌ MISSING IN AUTISM_CENTERS'
        WHEN cu.center_name != ac.name THEN '⚠️ NAME MISMATCH'
        WHEN cu.address != ac.address THEN '⚠️ ADDRESS MISMATCH'
        WHEN cu.updated_at > ac.updated_at THEN '⚠️ AUTISM_CENTERS OUTDATED'
        ELSE '✅ SYNCED'
    END as sync_status
FROM center_users cu
LEFT JOIN autism_centers ac ON cu.id = ac.center_user_id
WHERE cu.is_active = true
ORDER BY cu.updated_at DESC;

-- Step 3: Check if center_users have required coordinates
SELECT 'COORDINATE CHECK' as check_type;
SELECT 
    cu.center_name,
    cu.latitude,
    cu.longitude,
    CASE 
        WHEN cu.latitude IS NULL THEN '❌ MISSING LATITUDE'
        WHEN cu.longitude IS NULL THEN '❌ MISSING LONGITUDE'
        WHEN cu.latitude = 0 AND cu.longitude = 0 THEN '⚠️ DEFAULT COORDINATES'
        ELSE '✅ HAS COORDINATES'
    END as coordinate_status
FROM center_users cu
WHERE cu.is_active = true
ORDER BY cu.updated_at DESC;

-- Step 4: Check recent updates in both tables
SELECT 'RECENT UPDATES - CENTER_USERS' as check_type;
SELECT 
    center_name,
    address,
    updated_at,
    'center_users' as table_name
FROM center_users 
WHERE updated_at > (NOW() - INTERVAL '1 hour')
ORDER BY updated_at DESC;

SELECT 'RECENT UPDATES - AUTISM_CENTERS' as check_type;
SELECT 
    name,
    address,
    updated_at,
    'autism_centers' as table_name
FROM autism_centers 
WHERE updated_at > (NOW() - INTERVAL '1 hour')
ORDER BY updated_at DESC;

-- Step 5: Test manual sync for one center
DO $$
DECLARE
    test_center_id UUID;
    test_center_name TEXT;
    sync_result TEXT;
BEGIN
    -- Get the most recently updated center
    SELECT id, center_name 
    INTO test_center_id, test_center_name
    FROM center_users 
    WHERE is_active = true 
    AND latitude IS NOT NULL 
    AND longitude IS NOT NULL
    ORDER BY updated_at DESC 
    LIMIT 1;
    
    IF test_center_id IS NOT NULL THEN
        RAISE NOTICE 'Testing manual sync for center: % (ID: %)', test_center_name, test_center_id;
        
        -- Check if autism_centers record exists
        IF EXISTS (SELECT 1 FROM autism_centers WHERE center_user_id = test_center_id) THEN
            -- Update existing record
            UPDATE autism_centers 
            SET 
                name = cu.center_name,
                type = cu.center_type,
                address = cu.address,
                latitude = cu.latitude,
                longitude = cu.longitude,
                phone = cu.phone,
                email = cu.email,
                description = cu.description,
                contact_person = cu.contact_person,
                updated_at = NOW()
            FROM center_users cu
            WHERE autism_centers.center_user_id = cu.id
            AND cu.id = test_center_id;
            
            sync_result := 'UPDATED existing autism_centers record';
        ELSE
            -- Create new record
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
            )
            SELECT 
                cu.id,
                cu.center_name,
                cu.center_type,
                cu.address,
                cu.latitude,
                cu.longitude,
                cu.phone,
                cu.email,
                cu.description,
                cu.contact_person,
                ARRAY['Autism Assessment', 'Behavioral Therapy', 'Speech Therapy'],
                ARRAY['0-3', '4-7', '8-12', '13-18'],
                ARRAY['Private Pay', 'Insurance', 'Medicaid'],
                COALESCE(cu.is_verified, false),
                cu.created_at,
                NOW()
            FROM center_users cu
            WHERE cu.id = test_center_id;
            
            sync_result := 'CREATED new autism_centers record';
        END IF;
        
        RAISE NOTICE '✅ Manual sync completed: %', sync_result;
    ELSE
        RAISE NOTICE '❌ No active center with coordinates found for testing';
    END IF;
END $$;

-- Step 6: Final verification after manual sync
SELECT 'AFTER MANUAL SYNC' as check_type;
SELECT 
    COUNT(*) as total_center_users,
    COUNT(ac.id) as synced_autism_centers,
    COUNT(*) - COUNT(ac.id) as remaining_unsynced
FROM center_users cu
LEFT JOIN autism_centers ac ON cu.id = ac.center_user_id
WHERE cu.is_active = true;

-- Step 7: Show what users will see in locator
SELECT 'USER LOCATOR DATA' as check_type;
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
ORDER BY updated_at DESC
LIMIT 10;

-- Step 8: Check for specific sync issues
SELECT 'SYNC ISSUE ANALYSIS' as check_type;

-- Check if center_users have all required fields
SELECT
    'MISSING REQUIRED FIELDS' as issue_type,
    cu.center_name,
    CASE
        WHEN cu.center_name IS NULL OR cu.center_name = '' THEN 'Missing center_name'
        WHEN cu.center_type IS NULL OR cu.center_type = '' THEN 'Missing center_type'
        WHEN cu.address IS NULL OR cu.address = '' THEN 'Missing address'
        WHEN cu.latitude IS NULL THEN 'Missing latitude'
        WHEN cu.longitude IS NULL THEN 'Missing longitude'
        WHEN cu.email IS NULL OR cu.email = '' THEN 'Missing email'
        WHEN cu.contact_person IS NULL OR cu.contact_person = '' THEN 'Missing contact_person'
        ELSE 'All required fields present'
    END as missing_field
FROM center_users cu
WHERE cu.is_active = true
AND (
    cu.center_name IS NULL OR cu.center_name = '' OR
    cu.center_type IS NULL OR cu.center_type = '' OR
    cu.address IS NULL OR cu.address = '' OR
    cu.latitude IS NULL OR
    cu.longitude IS NULL OR
    cu.email IS NULL OR cu.email = '' OR
    cu.contact_person IS NULL OR cu.contact_person = ''
);

-- Check for data type issues
SELECT 'DATA TYPE ISSUES' as issue_type;
SELECT
    cu.center_name,
    cu.latitude,
    cu.longitude,
    CASE
        WHEN cu.latitude = 0 AND cu.longitude = 0 THEN 'Default coordinates (0,0)'
        WHEN cu.latitude < -90 OR cu.latitude > 90 THEN 'Invalid latitude range'
        WHEN cu.longitude < -180 OR cu.longitude > 180 THEN 'Invalid longitude range'
        ELSE 'Coordinates OK'
    END as coordinate_issue
FROM center_users cu
WHERE cu.is_active = true
AND (
    (cu.latitude = 0 AND cu.longitude = 0) OR
    cu.latitude < -90 OR cu.latitude > 90 OR
    cu.longitude < -180 OR cu.longitude > 180
);

-- Check for recent API activity (if we can see it)
SELECT 'RECENT ACTIVITY CHECK' as check_type;
SELECT
    'CENTER_USERS_RECENT_UPDATES' as table_name,
    COUNT(*) as recent_updates
FROM center_users
WHERE updated_at > (NOW() - INTERVAL '1 hour');

SELECT
    'AUTISM_CENTERS_RECENT_UPDATES' as table_name,
    COUNT(*) as recent_updates
FROM autism_centers
WHERE updated_at > (NOW() - INTERVAL '1 hour');

-- Show the most recent center that was updated
SELECT 'MOST_RECENT_CENTER_UPDATE' as check_type;
SELECT
    cu.center_name,
    cu.updated_at as center_user_updated,
    ac.updated_at as autism_center_updated,
    EXTRACT(EPOCH FROM (cu.updated_at - ac.updated_at)) as seconds_difference,
    CASE
        WHEN ac.updated_at IS NULL THEN '❌ NO AUTISM_CENTERS RECORD'
        WHEN cu.updated_at > ac.updated_at THEN '⚠️ AUTISM_CENTERS OUTDATED'
        WHEN cu.updated_at = ac.updated_at THEN '✅ PERFECTLY SYNCED'
        ELSE '🤔 AUTISM_CENTERS NEWER THAN CENTER_USERS'
    END as sync_status
FROM center_users cu
LEFT JOIN autism_centers ac ON cu.id = ac.center_user_id
WHERE cu.is_active = true
ORDER BY cu.updated_at DESC
LIMIT 5;

SELECT 'DEBUG COMPLETE!' as status;
SELECT 'Run this script after making changes to see what happens!' as instruction;
