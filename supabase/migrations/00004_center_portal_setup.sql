-- =============================================================================
-- CENTER PORTAL DATABASE SETUP
-- =============================================================================
-- This migration adds support for center-specific user management

-- Step 1: Add role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' 
CHECK (role IN ('user', 'admin', 'center_manager'));

-- Step 2: Add center management fields to autism_centers table
ALTER TABLE autism_centers ADD COLUMN IF NOT EXISTS managed_by UUID REFERENCES auth.users(id);
ALTER TABLE autism_centers ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE autism_centers ADD COLUMN IF NOT EXISTS registration_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE autism_centers ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE autism_centers ADD COLUMN IF NOT EXISTS business_license TEXT;

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_autism_centers_managed_by ON autism_centers(managed_by);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Step 4: Create RLS policies for center managers
-- Allow center managers to read/update only their own centers
CREATE POLICY "Center managers can view their own centers" ON autism_centers
    FOR SELECT USING (managed_by = auth.uid());

CREATE POLICY "Center managers can update their own centers" ON autism_centers
    FOR UPDATE USING (managed_by = auth.uid());

-- Step 5: Create a function to handle center manager registration
CREATE OR REPLACE FUNCTION public.register_center_manager(
    center_name TEXT,
    center_type TEXT,
    center_address TEXT,
    center_latitude DECIMAL,
    center_longitude DECIMAL,
    center_phone TEXT DEFAULT NULL,
    center_email TEXT DEFAULT NULL,
    center_website TEXT DEFAULT NULL,
    center_description TEXT DEFAULT NULL,
    contact_person TEXT DEFAULT NULL,
    business_license TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_id UUID;
    center_id UUID;
    result JSON;
BEGIN
    -- Get the current user ID
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Update user profile to center_manager role
    UPDATE profiles 
    SET role = 'center_manager'
    WHERE id = user_id;
    
    -- Insert the new center
    INSERT INTO autism_centers (
        name, type, address, latitude, longitude, phone, email, website, 
        description, managed_by, is_verified, contact_person, business_license,
        created_at, updated_at
    ) VALUES (
        center_name, center_type, center_address, center_latitude, center_longitude,
        center_phone, center_email, center_website, center_description, user_id,
        false, contact_person, business_license, now(), now()
    ) RETURNING id INTO center_id;
    
    -- Return success result
    result := json_build_object(
        'success', true,
        'center_id', center_id,
        'message', 'Center registered successfully. Awaiting admin verification.'
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Return error result
    result := json_build_object(
        'success', false,
        'error', SQLERRM
    );
    RETURN result;
END;
$$;

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION public.register_center_manager TO authenticated;

-- Step 7: Create a function to get center manager's center
CREATE OR REPLACE FUNCTION public.get_my_center()
RETURNS TABLE (
    id UUID,
    name TEXT,
    type TEXT,
    address TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    phone TEXT,
    email TEXT,
    website TEXT,
    description TEXT,
    is_verified BOOLEAN,
    contact_person TEXT,
    business_license TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ac.id, ac.name, ac.type, ac.address, ac.latitude, ac.longitude,
        ac.phone, ac.email, ac.website, ac.description, ac.is_verified,
        ac.contact_person, ac.business_license, ac.created_at, ac.updated_at
    FROM autism_centers ac
    WHERE ac.managed_by = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_center TO authenticated;

-- Step 8: Add helpful comments
COMMENT ON COLUMN profiles.role IS 'User role: user, admin, or center_manager';
COMMENT ON COLUMN autism_centers.managed_by IS 'User ID of the center manager';
COMMENT ON COLUMN autism_centers.is_verified IS 'Whether the center has been verified by admin';
COMMENT ON FUNCTION public.register_center_manager IS 'Registers a new center and assigns current user as manager';
COMMENT ON FUNCTION public.get_my_center IS 'Returns the center managed by the current user';
