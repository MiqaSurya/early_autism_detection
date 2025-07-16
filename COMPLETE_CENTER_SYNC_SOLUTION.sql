-- =============================================================================
-- COMPLETE CENTER SYNCHRONIZATION SOLUTION
-- =============================================================================
-- This script ensures that center_users table updates automatically sync
-- with autism_centers table for real-time user locator updates

-- Step 1: Check current sync status
SELECT 'CURRENT SYNC STATUS' as check_type;
SELECT 
    COUNT(*) as total_center_users,
    COUNT(ac.id) as synced_autism_centers,
    COUNT(*) - COUNT(ac.id) as unsynced_centers
FROM center_users cu
LEFT JOIN autism_centers ac ON cu.id = ac.center_user_id
WHERE cu.is_active = true;

-- Step 2: Create or replace the comprehensive sync function
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

-- Step 3: Drop existing trigger and create new one
DROP TRIGGER IF EXISTS trigger_sync_center_user_to_autism_centers ON center_users;
CREATE TRIGGER trigger_sync_center_user_to_autism_centers
    AFTER INSERT OR UPDATE OR DELETE ON center_users
    FOR EACH ROW
    EXECUTE FUNCTION sync_center_user_to_autism_centers();

-- Step 4: Create function to manually sync all existing centers
CREATE OR REPLACE FUNCTION manual_sync_all_centers()
RETURNS TABLE(
    action TEXT,
    center_name TEXT,
    center_id UUID,
    message TEXT
) AS $$
DECLARE
    center_record RECORD;
    sync_count INTEGER := 0;
    update_count INTEGER := 0;
    create_count INTEGER := 0;
BEGIN
    -- First, sync all active center_users that don't have autism_centers records
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
            ARRAY['Autism Assessment', 'Behavioral Therapy', 'Speech Therapy'],
            ARRAY['0-3', '4-7', '8-12', '13-18'],
            ARRAY['Private Pay', 'Insurance', 'Medicaid'],
            COALESCE(center_record.is_verified, false),
            center_record.created_at,
            center_record.updated_at
        );
        
        create_count := create_count + 1;
        
        RETURN QUERY SELECT 
            'CREATE'::TEXT,
            center_record.center_name,
            center_record.id,
            'Created new autism_centers record'::TEXT;
    END LOOP;

    -- Second, update existing autism_centers records that are out of sync
    FOR center_record IN 
        SELECT cu.*, ac.id as autism_center_id
        FROM center_users cu
        INNER JOIN autism_centers ac ON cu.id = ac.center_user_id
        WHERE cu.is_active = true
          AND (
            ac.name != cu.center_name OR
            ac.type != cu.center_type OR
            ac.address != cu.address OR
            ac.latitude != cu.latitude OR
            ac.longitude != cu.longitude OR
            ac.phone != cu.phone OR
            ac.email != cu.email OR
            ac.description != cu.description OR
            ac.contact_person != cu.contact_person OR
            ac.verified != COALESCE(cu.is_verified, false)
          )
    LOOP
        UPDATE autism_centers 
        SET 
            name = center_record.center_name,
            type = center_record.center_type,
            address = center_record.address,
            latitude = center_record.latitude,
            longitude = center_record.longitude,
            phone = center_record.phone,
            email = center_record.email,
            description = center_record.description,
            contact_person = center_record.contact_person,
            verified = COALESCE(center_record.is_verified, false),
            updated_at = GREATEST(center_record.updated_at, NOW())
        WHERE center_user_id = center_record.id;
        
        update_count := update_count + 1;
        
        RETURN QUERY SELECT 
            'UPDATE'::TEXT,
            center_record.center_name,
            center_record.id,
            'Updated existing autism_centers record'::TEXT;
    END LOOP;

    -- Third, remove autism_centers records for inactive center_users
    FOR center_record IN 
        SELECT cu.center_name, cu.id, ac.id as autism_center_id
        FROM center_users cu
        INNER JOIN autism_centers ac ON cu.id = ac.center_user_id
        WHERE cu.is_active = false
    LOOP
        DELETE FROM autism_centers WHERE center_user_id = center_record.id;
        
        RETURN QUERY SELECT 
            'DELETE'::TEXT,
            center_record.center_name,
            center_record.id,
            'Removed autism_centers record for inactive center'::TEXT;
    END LOOP;

    -- Return summary
    RETURN QUERY SELECT 
        'SUMMARY'::TEXT,
        format('Created: %s, Updated: %s', create_count, update_count)::TEXT,
        NULL::UUID,
        'Manual sync completed'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION sync_center_user_to_autism_centers() TO authenticated;
GRANT EXECUTE ON FUNCTION manual_sync_all_centers() TO authenticated;

-- Step 6: Run manual sync to fix existing data
SELECT 'RUNNING MANUAL SYNC...' as status;
SELECT * FROM manual_sync_all_centers();

-- Step 7: Verify the sync
SELECT 'FINAL VERIFICATION' as check_type;
SELECT 
    COUNT(*) as total_center_users,
    COUNT(ac.id) as synced_autism_centers,
    COUNT(*) - COUNT(ac.id) as remaining_unsynced
FROM center_users cu
LEFT JOIN autism_centers ac ON cu.id = ac.center_user_id
WHERE cu.is_active = true;

-- Step 8: Show any remaining issues
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

SELECT 'SETUP COMPLETE!' as status;
SELECT 'Center updates will now automatically sync to user locator' as message;
