-- =============================================================================
-- FIX CENTER SYNCHRONIZATION IMMEDIATELY
-- =============================================================================
-- This script will fix the sync between center_users and autism_centers tables

-- Step 1: Check current sync status
SELECT 'CURRENT SYNC STATUS' as check_type;
SELECT 
    COUNT(*) as total_center_users,
    COUNT(ac.id) as synced_autism_centers,
    COUNT(*) - COUNT(ac.id) as unsynced_centers
FROM center_users cu
LEFT JOIN autism_centers ac ON cu.id = ac.center_user_id
WHERE cu.is_active = true;

-- Step 2: Check if trigger exists
SELECT 'CHECKING EXISTING TRIGGERS' as check_type;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'center_users'
AND trigger_name LIKE '%sync%';

-- Step 3: Add missing latitude/longitude columns to center_users if they don't exist
ALTER TABLE center_users ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE center_users ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Step 4: Create or replace the sync function
CREATE OR REPLACE FUNCTION sync_center_user_to_autism_centers()
RETURNS TRIGGER AS $$
DECLARE
    default_services TEXT[] := ARRAY['Autism Assessment', 'Behavioral Therapy', 'Speech Therapy'];
BEGIN
    -- Handle INSERT: Create new autism_centers record
    IF TG_OP = 'INSERT' THEN
        -- Only create if center has coordinates and is active
        IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL AND NEW.is_active = true THEN
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
                NEW.id,
                NEW.center_name,
                NEW.center_type,
                NEW.address,
                NEW.latitude,
                NEW.longitude,
                NEW.phone,
                NEW.email,
                NEW.description,
                NEW.contact_person,
                default_services,
                ARRAY['0-3', '4-7', '8-12', '13-18'],
                ARRAY['Private Pay', 'Insurance', 'Medicaid'],
                COALESCE(NEW.is_verified, false),
                NEW.created_at,
                NEW.updated_at
            );
            
            RAISE NOTICE 'Created autism_centers record for new center: %', NEW.center_name;
        END IF;
        
        RETURN NEW;
    END IF;

    -- Handle UPDATE: Sync changes to autism_centers
    IF TG_OP = 'UPDATE' THEN
        -- If center becomes inactive, remove from autism_centers
        IF OLD.is_active = true AND NEW.is_active = false THEN
            DELETE FROM autism_centers WHERE center_user_id = NEW.id;
            RAISE NOTICE 'Removed autism_centers record for deactivated center: %', NEW.center_name;
            RETURN NEW;
        END IF;

        -- If center becomes active and has coordinates, create autism_centers record
        IF (OLD.is_active = false AND NEW.is_active = true) OR 
           (OLD.latitude IS NULL AND NEW.latitude IS NOT NULL) THEN
            
            -- Check if autism_centers record already exists
            IF NOT EXISTS (SELECT 1 FROM autism_centers WHERE center_user_id = NEW.id) THEN
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
                    NEW.id,
                    NEW.center_name,
                    NEW.center_type,
                    NEW.address,
                    NEW.latitude,
                    NEW.longitude,
                    NEW.phone,
                    NEW.email,
                    NEW.description,
                    NEW.contact_person,
                    default_services,
                    ARRAY['0-3', '4-7', '8-12', '13-18'],
                    ARRAY['Private Pay', 'Insurance', 'Medicaid'],
                    COALESCE(NEW.is_verified, false),
                    NEW.created_at,
                    NEW.updated_at
                );
                
                RAISE NOTICE 'Created autism_centers record for reactivated center: %', NEW.center_name;
                RETURN NEW;
            END IF;
        END IF;

        -- Update existing autism_centers record if center is active
        IF NEW.is_active = true AND EXISTS (SELECT 1 FROM autism_centers WHERE center_user_id = NEW.id) THEN
            UPDATE autism_centers 
            SET 
                name = NEW.center_name,
                type = NEW.center_type,
                address = NEW.address,
                latitude = NEW.latitude,
                longitude = NEW.longitude,
                phone = NEW.phone,
                email = NEW.email,
                description = NEW.description,
                contact_person = NEW.contact_person,
                verified = COALESCE(NEW.is_verified, false),
                updated_at = NEW.updated_at
            WHERE center_user_id = NEW.id;
            
            RAISE NOTICE 'Updated autism_centers record for center: %', NEW.center_name;
        END IF;
        
        RETURN NEW;
    END IF;

    -- Handle DELETE: Remove from autism_centers
    IF TG_OP = 'DELETE' THEN
        DELETE FROM autism_centers WHERE center_user_id = OLD.id;
        RAISE NOTICE 'Removed autism_centers record for deleted center: %', OLD.center_name;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Drop existing trigger and create new one
DROP TRIGGER IF EXISTS trigger_sync_center_user_to_autism_centers ON center_users;
CREATE TRIGGER trigger_sync_center_user_to_autism_centers
    AFTER INSERT OR UPDATE OR DELETE ON center_users
    FOR EACH ROW
    EXECUTE FUNCTION sync_center_user_to_autism_centers();

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION sync_center_user_to_autism_centers() TO authenticated;
GRANT EXECUTE ON FUNCTION sync_center_user_to_autism_centers() TO anon;

-- Step 7: Manually sync existing data
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
    cu.updated_at
FROM center_users cu
LEFT JOIN autism_centers ac ON cu.id = ac.center_user_id
WHERE cu.is_active = true 
  AND cu.latitude IS NOT NULL 
  AND cu.longitude IS NOT NULL
  AND ac.id IS NULL;

-- Step 8: Update existing autism_centers records that are out of sync
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
    verified = COALESCE(cu.is_verified, false),
    updated_at = GREATEST(cu.updated_at, NOW())
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
    autism_centers.description != cu.description OR
    autism_centers.contact_person != cu.contact_person OR
    autism_centers.verified != COALESCE(cu.is_verified, false)
  );

-- Step 9: Remove autism_centers records for inactive center_users
DELETE FROM autism_centers 
WHERE center_user_id IN (
    SELECT cu.id 
    FROM center_users cu 
    WHERE cu.is_active = false
);

-- Step 10: Final verification
SELECT 'FINAL SYNC STATUS' as check_type;
SELECT 
    COUNT(*) as total_center_users,
    COUNT(ac.id) as synced_autism_centers,
    COUNT(*) - COUNT(ac.id) as remaining_unsynced
FROM center_users cu
LEFT JOIN autism_centers ac ON cu.id = ac.center_user_id
WHERE cu.is_active = true;

-- Step 11: Show any remaining issues
SELECT 
    'REMAINING ISSUES' as issue_type,
    cu.center_name,
    cu.email,
    CASE 
        WHEN cu.latitude IS NULL THEN 'Missing latitude'
        WHEN cu.longitude IS NULL THEN 'Missing longitude'
        WHEN cu.is_active = false THEN 'Center inactive'
        ELSE 'Unknown issue'
    END as issue_reason
FROM center_users cu
LEFT JOIN autism_centers ac ON cu.id = ac.center_user_id
WHERE ac.id IS NULL;

SELECT 'SYNC SETUP COMPLETE!' as status;
SELECT 'Center updates will now automatically sync to user locator' as message;
