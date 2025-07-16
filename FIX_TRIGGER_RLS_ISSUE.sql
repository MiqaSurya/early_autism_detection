-- =============================================================================
-- FIX DATABASE TRIGGER RLS ISSUE
-- =============================================================================
-- The trigger sync_center_user_to_autism_centers is causing RLS violations
-- because it runs in the context of the user, not the service role.
-- This script fixes the issue by updating the RLS policies.

-- Step 1: Update RLS policies to allow the trigger to work
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can insert autism centers" ON autism_centers;
DROP POLICY IF EXISTS "Anyone can view autism centers" ON autism_centers;

-- Create more permissive policies that work with triggers
-- Allow public read access (for user locator)
CREATE POLICY "Public read access for autism_centers" ON autism_centers
    FOR SELECT USING (true);

-- Allow service role full access
CREATE POLICY "Service role full access" ON autism_centers
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to insert (for admin and triggers)
CREATE POLICY "Allow authenticated insert" ON autism_centers
    FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to insert via triggers (bypass RLS for triggers)
CREATE POLICY "Allow trigger insert" ON autism_centers
    FOR INSERT WITH CHECK (true);

-- Step 2: Alternative approach - Disable RLS for autism_centers table temporarily
-- This is a more aggressive fix but ensures triggers work
-- ALTER TABLE autism_centers DISABLE ROW LEVEL SECURITY;

-- Step 3: Verify current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'autism_centers'
ORDER BY policyname;

-- Step 4: Test the trigger by checking if it exists
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_sync_center_user_to_autism_centers';

-- Step 5: If needed, recreate the trigger with SECURITY DEFINER
-- This makes the trigger run with the privileges of the function owner
DROP TRIGGER IF EXISTS trigger_sync_center_user_to_autism_centers ON center_users;

-- Recreate the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION sync_center_user_to_autism_centers()
RETURNS TRIGGER
SECURITY DEFINER -- This makes the function run with elevated privileges
SET search_path = public
AS $$
DECLARE
    default_services text[];
BEGIN
    -- Handle INSERT: Create corresponding autism_centers record
    IF TG_OP = 'INSERT' THEN
        -- Only proceed if center is active
        IF NEW.is_active = true THEN
            -- Set default services based on center type
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
            
            -- Insert into autism_centers with SECURITY DEFINER privileges
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
        
        -- If center becomes active, create autism_centers record
        IF OLD.is_active = false AND NEW.is_active = true THEN
            -- Set default services based on center type
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
        
        -- Update existing autism_centers record if center is active
        IF NEW.is_active = true THEN
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

-- Recreate the trigger
CREATE TRIGGER trigger_sync_center_user_to_autism_centers
    AFTER INSERT OR UPDATE OR DELETE ON center_users
    FOR EACH ROW
    EXECUTE FUNCTION sync_center_user_to_autism_centers();

-- Step 6: Grant necessary permissions to the function owner
-- This ensures the SECURITY DEFINER function has the right permissions
GRANT ALL ON autism_centers TO postgres;
GRANT ALL ON center_users TO postgres;

-- Step 7: Test query to verify setup
SELECT 'RLS policies updated and trigger recreated with SECURITY DEFINER' as status;
