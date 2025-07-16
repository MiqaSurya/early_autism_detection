-- =============================================================================
-- FIX CENTER SYNCHRONIZATION ISSUES
-- =============================================================================
-- This script identifies and fixes sync issues between center_users and autism_centers

-- Step 1: Identify the sync issues
SELECT 
    'SYNC ISSUE DIAGNOSIS' as step,
    'Checking for unsynced center_users...' as action;

-- Show center_users that don't have corresponding autism_centers records
SELECT 
    'UNSYNCED CENTER_USERS' as issue_type,
    cu.id as center_user_id,
    cu.center_name,
    cu.email,
    cu.center_type,
    cu.is_active,
    cu.created_at,
    'Missing autism_centers record' as issue
FROM center_users cu
LEFT JOIN autism_centers ac ON cu.id = ac.center_user_id
WHERE ac.id IS NULL 
  AND cu.is_active = true;

-- Step 2: Create missing autism_centers records for active center_users
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
    verified,
    created_at,
    updated_at
)
SELECT 
    cu.id as center_user_id,
    cu.center_name as name,
    cu.center_type as type,
    cu.address,
    cu.latitude,
    cu.longitude,
    cu.phone,
    cu.email,
    cu.description,
    cu.contact_person,
    cu.is_verified as verified,
    cu.created_at,
    cu.updated_at
FROM center_users cu
LEFT JOIN autism_centers ac ON cu.id = ac.center_user_id
WHERE ac.id IS NULL 
  AND cu.is_active = true
  AND cu.latitude IS NOT NULL 
  AND cu.longitude IS NOT NULL;

-- Step 3: Update existing autism_centers records to match center_users data
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
    updated_at = GREATEST(autism_centers.updated_at, cu.updated_at)
FROM center_users cu
WHERE autism_centers.center_user_id = cu.id
  AND cu.is_active = true
  AND (
    autism_centers.name != cu.center_name OR
    autism_centers.type != cu.center_type OR
    autism_centers.address != cu.address OR
    autism_centers.latitude != cu.latitude OR
    autism_centers.longitude != cu.longitude OR
    autism_centers.phone != cu.phone OR
    autism_centers.email != cu.email OR
    COALESCE(autism_centers.description, '') != COALESCE(cu.description, '') OR
    autism_centers.contact_person != cu.contact_person
  );

-- Step 4: Clean up autism_centers records for inactive center_users
UPDATE autism_centers 
SET verified = false
FROM center_users cu
WHERE autism_centers.center_user_id = cu.id
  AND cu.is_active = false;

-- Step 5: Verification - Check sync status after fixes
SELECT 
    'POST-FIX VERIFICATION' as step,
    COUNT(*) as total_center_users,
    COUNT(ac.id) as synced_autism_centers,
    COUNT(*) - COUNT(ac.id) as remaining_unsynced,
    CASE 
        WHEN COUNT(*) = COUNT(ac.id) THEN '✅ ALL_SYNCED'
        ELSE '⚠️ STILL_ISSUES'
    END as sync_status
FROM center_users cu
LEFT JOIN autism_centers ac ON cu.id = ac.center_user_id
WHERE cu.is_active = true;

-- Step 6: Show detailed status after fixes
SELECT 
    'DETAILED POST-FIX STATUS' as step,
    cu.center_name,
    cu.email,
    CASE 
        WHEN ac.id IS NOT NULL THEN '✅ SYNCED' 
        ELSE '❌ STILL_MISSING' 
    END as sync_status,
    CASE 
        WHEN cu.latitude IS NULL OR cu.longitude IS NULL THEN 'Missing coordinates'
        WHEN ac.id IS NULL THEN 'Missing autism_centers record'
        ELSE 'OK'
    END as issue_reason
FROM center_users cu
LEFT JOIN autism_centers ac ON cu.id = ac.center_user_id
WHERE cu.is_active = true
ORDER BY sync_status, cu.center_name;

-- Step 7: Final summary
SELECT 
    'FINAL SYNC SUMMARY' as report_type,
    (SELECT COUNT(*) FROM center_users WHERE is_active = true) as total_active_centers,
    (SELECT COUNT(*) FROM autism_centers WHERE center_user_id IS NOT NULL) as synced_centers,
    (SELECT COUNT(*) FROM autism_centers WHERE center_user_id IS NOT NULL AND verified = true) as verified_centers,
    CASE 
        WHEN (SELECT COUNT(*) FROM center_users WHERE is_active = true AND latitude IS NOT NULL AND longitude IS NOT NULL) = 
             (SELECT COUNT(*) FROM autism_centers WHERE center_user_id IS NOT NULL)
        THEN '✅ SYNC_COMPLETE'
        ELSE '⚠️ CHECK_COORDINATES'
    END as overall_status;

-- Step 8: Update existing autism_centers with default services, age groups, and insurance
UPDATE autism_centers
SET
    services = CASE
        WHEN type = 'diagnostic' THEN ARRAY['ADOS-2 Assessment', 'Developmental Evaluation', 'Speech Assessment', 'Psychological Testing']
        WHEN type = 'therapy' THEN ARRAY['ABA Therapy', 'Speech Therapy', 'Occupational Therapy', 'Social Skills Training']
        WHEN type = 'support' THEN ARRAY['Support Groups', 'Family Counseling', 'Resource Navigation', 'Respite Care']
        WHEN type = 'education' THEN ARRAY['Inclusive Classrooms', 'Teacher Training', 'Curriculum Development', 'Parent Education']
        ELSE ARRAY['General Autism Support Services']
    END,
    age_groups = ARRAY['0-3', '4-7', '8-12', '13-18'],
    insurance_accepted = ARRAY['Private Pay', 'Insurance', 'Medicaid']
WHERE center_user_id IS NOT NULL
  AND (services IS NULL OR array_length(services, 1) IS NULL);

-- Success message
SELECT 'Center synchronization fix completed! Run VERIFY_CENTER_SYNC.sql again to confirm.' as status;
