-- =============================================================================
-- VERIFY CENTER SYNCHRONIZATION BETWEEN TABLES
-- =============================================================================
-- This script helps verify that center updates are properly synchronized
-- between center_users table and autism_centers table

-- Check if center_users and autism_centers are properly linked
SELECT 
    'CENTER SYNCHRONIZATION STATUS' as check_type,
    COUNT(*) as total_center_users,
    COUNT(ac.id) as synced_autism_centers,
    COUNT(*) - COUNT(ac.id) as unsynced_centers
FROM center_users cu
LEFT JOIN autism_centers ac ON cu.id = ac.center_user_id
WHERE cu.is_active = true;

-- Show detailed sync status for each center
SELECT 
    cu.center_name,
    cu.email,
    cu.is_verified as center_user_verified,
    cu.updated_at as center_user_updated,
    CASE 
        WHEN ac.id IS NOT NULL THEN 'SYNCED' 
        ELSE 'NOT_SYNCED' 
    END as sync_status,
    ac.verified as autism_center_verified,
    ac.updated_at as autism_center_updated,
    CASE 
        WHEN ac.updated_at >= cu.updated_at THEN 'UP_TO_DATE'
        WHEN ac.updated_at < cu.updated_at THEN 'NEEDS_UPDATE'
        WHEN ac.id IS NULL THEN 'MISSING'
        ELSE 'UNKNOWN'
    END as sync_freshness
FROM center_users cu
LEFT JOIN autism_centers ac ON cu.id = ac.center_user_id
WHERE cu.is_active = true
ORDER BY cu.center_name;

-- Check for data consistency between tables
SELECT 
    'DATA CONSISTENCY CHECK' as check_type,
    cu.center_name as center_user_name,
    ac.name as autism_center_name,
    CASE WHEN cu.center_name = ac.name THEN '✅ MATCH' ELSE '❌ MISMATCH' END as name_match,
    cu.center_type as center_user_type,
    ac.type as autism_center_type,
    CASE WHEN cu.center_type = ac.type THEN '✅ MATCH' ELSE '❌ MISMATCH' END as type_match,
    cu.address as center_user_address,
    ac.address as autism_center_address,
    CASE WHEN cu.address = ac.address THEN '✅ MATCH' ELSE '❌ MISMATCH' END as address_match
FROM center_users cu
INNER JOIN autism_centers ac ON cu.id = ac.center_user_id
WHERE cu.is_active = true;

-- Show centers visible to users (for autism center locator)
SELECT 
    'USER SITE VISIBILITY' as check_type,
    COUNT(*) as total_visible_centers,
    COUNT(CASE WHEN verified = true THEN 1 END) as verified_centers,
    COUNT(CASE WHEN verified = false THEN 1 END) as unverified_centers
FROM autism_centers 
WHERE center_user_id IS NOT NULL;

-- Show recent updates (last 24 hours)
SELECT 
    'RECENT UPDATES (24H)' as check_type,
    cu.center_name,
    cu.email,
    cu.updated_at as center_user_updated,
    ac.updated_at as autism_center_updated,
    CASE 
        WHEN ac.updated_at >= cu.updated_at THEN '✅ SYNCED'
        ELSE '⚠️ OUT_OF_SYNC'
    END as sync_status
FROM center_users cu
LEFT JOIN autism_centers ac ON cu.id = ac.center_user_id
WHERE cu.updated_at >= NOW() - INTERVAL '24 hours'
   OR ac.updated_at >= NOW() - INTERVAL '24 hours'
ORDER BY GREATEST(cu.updated_at, COALESCE(ac.updated_at, cu.updated_at)) DESC;

-- Summary report
SELECT 
    'SYNC SUMMARY' as report_type,
    (SELECT COUNT(*) FROM center_users WHERE is_active = true) as total_active_centers,
    (SELECT COUNT(*) FROM autism_centers WHERE center_user_id IS NOT NULL) as synced_centers,
    (SELECT COUNT(*) FROM autism_centers WHERE center_user_id IS NOT NULL AND verified = true) as verified_centers,
    CASE 
        WHEN (SELECT COUNT(*) FROM center_users WHERE is_active = true) = 
             (SELECT COUNT(*) FROM autism_centers WHERE center_user_id IS NOT NULL)
        THEN '✅ ALL_SYNCED'
        ELSE '⚠️ SYNC_ISSUES'
    END as overall_status;
