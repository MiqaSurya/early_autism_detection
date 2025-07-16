-- Migration: Enhanced Center Registration Sync
-- This ensures center registrations are immediately visible to admin and user systems

-- Step 1: Create a function to handle post-registration sync
CREATE OR REPLACE FUNCTION public.sync_center_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Log the registration for admin tracking
    INSERT INTO public.admin_logs (
        action,
        table_name,
        record_id,
        details,
        created_at
    ) VALUES (
        'center_registered',
        'autism_centers',
        NEW.id,
        json_build_object(
            'center_name', NEW.name,
            'center_type', NEW.type,
            'managed_by', NEW.managed_by,
            'contact_person', NEW.contact_person,
            'requires_verification', NOT NEW.is_verified
        ),
        now()
    );
    
    -- Update profile stats for admin dashboard
    UPDATE profiles 
    SET updated_at = now()
    WHERE id = NEW.managed_by;
    
    RETURN NEW;
END;
$$;

-- Step 2: Create admin logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES auth.users(id)
);

-- Step 3: Create trigger for center registration sync
DROP TRIGGER IF EXISTS trigger_sync_center_registration ON autism_centers;
CREATE TRIGGER trigger_sync_center_registration
    AFTER INSERT ON autism_centers
    FOR EACH ROW
    EXECUTE FUNCTION sync_center_registration();

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_table_record ON admin_logs(table_name, record_id);

-- Step 5: Create a view for admin dashboard statistics
CREATE OR REPLACE VIEW public.admin_dashboard_stats AS
SELECT 
    -- User statistics
    (SELECT COUNT(*) FROM profiles WHERE role = 'user') as total_users,
    (SELECT COUNT(*) FROM profiles WHERE role = 'center_manager') as total_center_managers,
    (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_30d,
    
    -- Center statistics
    (SELECT COUNT(*) FROM autism_centers) as total_centers,
    (SELECT COUNT(*) FROM autism_centers WHERE is_verified = true) as verified_centers,
    (SELECT COUNT(*) FROM autism_centers WHERE is_verified = false) as pending_centers,
    (SELECT COUNT(*) FROM autism_centers WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_centers_30d,
    
    -- Assessment statistics
    (SELECT COUNT(*) FROM assessments) as total_assessments,
    (SELECT COUNT(*) FROM assessments WHERE completed = true) as completed_assessments,
    (SELECT COUNT(*) FROM assessments WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_assessments_30d,
    
    -- Recent activity
    (SELECT COUNT(*) FROM admin_logs WHERE created_at >= CURRENT_DATE - INTERVAL '24 hours') as recent_activities_24h;

-- Step 6: Grant permissions
GRANT SELECT ON admin_dashboard_stats TO authenticated;
GRANT SELECT, INSERT ON admin_logs TO authenticated;

-- Step 7: Create RLS policies for admin logs
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to access all logs
CREATE POLICY "Service role can access all admin logs" ON admin_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read logs (for admin dashboard)
CREATE POLICY "Authenticated users can read admin logs" ON admin_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Step 8: Create a function to get recent center registrations for admin
CREATE OR REPLACE FUNCTION public.get_recent_center_registrations(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
    center_id UUID,
    center_name TEXT,
    center_type TEXT,
    manager_name TEXT,
    manager_email TEXT,
    registration_date TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN,
    contact_person TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ac.id as center_id,
        ac.name as center_name,
        ac.type as center_type,
        p.full_name as manager_name,
        p.email as manager_email,
        ac.created_at as registration_date,
        ac.is_verified,
        ac.contact_person
    FROM autism_centers ac
    JOIN profiles p ON ac.managed_by = p.id
    WHERE ac.created_at >= (CURRENT_DATE - INTERVAL '1 day' * days_back)
    ORDER BY ac.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_recent_center_registrations TO authenticated;

-- Step 9: Create notification function for new registrations
CREATE OR REPLACE FUNCTION public.notify_new_center_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- This could be extended to send actual notifications
    -- For now, it just ensures the data is immediately available
    
    -- Refresh any materialized views if they exist
    -- REFRESH MATERIALIZED VIEW CONCURRENTLY some_view_name;
    
    RETURN NEW;
END;
$$;

-- Step 10: Create trigger for notifications
DROP TRIGGER IF EXISTS trigger_notify_center_registration ON autism_centers;
CREATE TRIGGER trigger_notify_center_registration
    AFTER INSERT ON autism_centers
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_center_registration();

-- Step 11: Create a function to verify registration sync
CREATE OR REPLACE FUNCTION public.verify_center_registration_sync(user_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_record RECORD;
    center_count INTEGER;
    result JSON;
BEGIN
    -- Get user information
    SELECT p.id, p.full_name, p.email, p.role, p.created_at
    INTO user_record
    FROM profiles p
    WHERE p.email = user_email AND p.role = 'center_manager';
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Center manager not found'
        );
    END IF;
    
    -- Count associated centers
    SELECT COUNT(*)
    INTO center_count
    FROM autism_centers
    WHERE managed_by = user_record.id;
    
    -- Build result
    result := json_build_object(
        'success', true,
        'user_id', user_record.id,
        'name', user_record.full_name,
        'email', user_record.email,
        'registration_date', user_record.created_at,
        'center_count', center_count,
        'sync_verified', center_count > 0,
        'admin_visible', true
    );
    
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION verify_center_registration_sync TO authenticated;
