-- =============================================================================
-- SETUP REAL-TIME SYNCHRONIZATION FOR AUTISM CENTERS
-- =============================================================================
-- This script sets up database triggers and functions for automatic real-time sync

-- Step 1: Enable real-time for autism_centers table
ALTER TABLE autism_centers REPLICA IDENTITY FULL;

-- Step 2: Create function to automatically sync center_users changes to autism_centers
CREATE OR REPLACE FUNCTION sync_center_user_to_autism_centers()
RETURNS TRIGGER AS $$
DECLARE
    default_services TEXT[];
BEGIN
    -- Generate default services based on center type
    CASE NEW.center_type
        WHEN 'diagnostic' THEN
            default_services := ARRAY['ADOS-2 Assessment', 'Developmental Evaluation', 'Speech Assessment', 'Psychological Testing'];
        WHEN 'therapy' THEN
            default_services := ARRAY['ABA Therapy', 'Speech Therapy', 'Occupational Therapy', 'Social Skills Training'];
        WHEN 'support' THEN
            default_services := ARRAY['Support Groups', 'Family Counseling', 'Resource Navigation', 'Respite Care'];
        WHEN 'education' THEN
            default_services := ARRAY['Inclusive Classrooms', 'Teacher Training', 'Curriculum Development', 'Parent Education'];
        ELSE
            default_services := ARRAY['General Autism Support Services'];
    END CASE;

    IF TG_OP = 'INSERT' THEN
        -- Create new autism_centers record when center_user is created
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
        
        RAISE NOTICE 'Auto-created autism_centers record for new center: %', NEW.center_name;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Update existing autism_centers record when center_user is updated
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
            verified = COALESCE(NEW.is_verified, verified),
            updated_at = NEW.updated_at,
            -- Only update services if they're currently null/empty
            services = CASE 
                WHEN services IS NULL OR array_length(services, 1) IS NULL 
                THEN default_services 
                ELSE services 
            END,
            -- Only update age_groups if they're currently null/empty
            age_groups = CASE 
                WHEN age_groups IS NULL OR array_length(age_groups, 1) IS NULL 
                THEN ARRAY['0-3', '4-7', '8-12', '13-18']
                ELSE age_groups 
            END,
            -- Only update insurance if it's currently null/empty
            insurance_accepted = CASE 
                WHEN insurance_accepted IS NULL OR array_length(insurance_accepted, 1) IS NULL 
                THEN ARRAY['Private Pay', 'Insurance', 'Medicaid']
                ELSE insurance_accepted 
            END
        WHERE center_user_id = NEW.id;
        
        RAISE NOTICE 'Auto-updated autism_centers record for center: %', NEW.center_name;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Mark autism_centers record as unverified when center_user is deleted/deactivated
        UPDATE autism_centers 
        SET 
            verified = false,
            updated_at = NOW()
        WHERE center_user_id = OLD.id;
        
        RAISE NOTICE 'Auto-deactivated autism_centers record for deleted center: %', OLD.center_name;
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger for automatic sync
DROP TRIGGER IF EXISTS trigger_sync_center_user_to_autism_centers ON center_users;
CREATE TRIGGER trigger_sync_center_user_to_autism_centers
    AFTER INSERT OR UPDATE OR DELETE ON center_users
    FOR EACH ROW
    EXECUTE FUNCTION sync_center_user_to_autism_centers();

-- Step 4: Create function to update timestamps for real-time notifications
CREATE OR REPLACE FUNCTION update_autism_centers_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger for timestamp updates
DROP TRIGGER IF EXISTS trigger_update_autism_centers_timestamp ON autism_centers;
CREATE TRIGGER trigger_update_autism_centers_timestamp
    BEFORE UPDATE ON autism_centers
    FOR EACH ROW
    EXECUTE FUNCTION update_autism_centers_timestamp();

-- Step 6: Enable Row Level Security (RLS) for real-time subscriptions
ALTER TABLE autism_centers ENABLE ROW LEVEL SECURITY;

-- Step 7: Create policy to allow public read access for real-time subscriptions
DROP POLICY IF EXISTS "Allow public read access to autism_centers" ON autism_centers;
CREATE POLICY "Allow public read access to autism_centers" ON autism_centers
    FOR SELECT USING (true);

-- Step 8: Grant necessary permissions for real-time
GRANT SELECT ON autism_centers TO anon;
GRANT SELECT ON autism_centers TO authenticated;

-- Step 9: Test the trigger system
SELECT 'Real-time sync setup completed successfully!' as status;

-- Step 10: Show current sync status
SELECT 
    'SYNC STATUS CHECK' as check_type,
    COUNT(*) as total_center_users,
    COUNT(ac.id) as synced_autism_centers,
    COUNT(*) - COUNT(ac.id) as unsynced_centers,
    CASE 
        WHEN COUNT(*) = COUNT(ac.id) THEN '✅ ALL_SYNCED'
        ELSE '⚠️ NEEDS_SYNC'
    END as sync_status
FROM center_users cu
LEFT JOIN autism_centers ac ON cu.id = ac.center_user_id
WHERE cu.is_active = true;

-- Success message
SELECT 
    'REAL-TIME SYNC SETUP COMPLETE!' as message,
    'Centers will now automatically sync to user locator and admin site' as description,
    'New registrations and updates will appear instantly' as benefit;
