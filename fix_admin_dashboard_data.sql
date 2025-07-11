-- FIX ADMIN DASHBOARD DATA ACCESS
-- Run this in your Supabase SQL Editor to fix admin dashboard data issues

-- 1. Ensure all users have profiles (run the previous fix first if not done)
INSERT INTO public.profiles (id, display_name, email, email_verified)
SELECT 
    u.id,
    COALESCE(
        u.raw_user_meta_data->>'display_name',
        u.raw_user_meta_data->>'full_name',
        split_part(u.email, '@', 1)
    ) as display_name,
    u.email,
    COALESCE(u.email_confirmed_at IS NOT NULL, FALSE) as email_verified
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = EXCLUDED.email_verified,
    updated_at = timezone('utc'::text, now());

-- 2. Create a function for admin to get user statistics
CREATE OR REPLACE FUNCTION public.get_admin_user_stats()
RETURNS TABLE (
    user_id UUID,
    user_email TEXT,
    display_name TEXT,
    join_date TIMESTAMPTZ,
    children_count BIGINT,
    assessments_count BIGINT,
    completed_assessments_count BIGINT,
    last_activity TIMESTAMPTZ,
    email_verified BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.email as user_email,
        p.display_name,
        p.created_at as join_date,
        COUNT(DISTINCT c.id) as children_count,
        COUNT(DISTINCT a.id) as assessments_count,
        COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_assessments_count,
        GREATEST(
            p.created_at,
            MAX(c.created_at),
            MAX(a.completed_at),
            MAX(a.started_at)
        ) as last_activity,
        p.email_verified
    FROM public.profiles p
    LEFT JOIN public.children c ON p.id = c.parent_id
    LEFT JOIN public.assessments a ON c.id = a.child_id
    GROUP BY p.id, p.email, p.display_name, p.created_at, p.email_verified
    ORDER BY children_count DESC, assessments_count DESC;
END;
$$;

-- 3. Create a function to get admin dashboard stats
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS TABLE (
    total_users BIGINT,
    total_children BIGINT,
    total_assessments BIGINT,
    completed_assessments BIGINT,
    active_users_24h BIGINT,
    new_users_today BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    yesterday TIMESTAMPTZ := NOW() - INTERVAL '24 hours';
    today_start TIMESTAMPTZ := DATE_TRUNC('day', NOW());
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.profiles)::BIGINT as total_users,
        (SELECT COUNT(*) FROM public.children)::BIGINT as total_children,
        (SELECT COUNT(*) FROM public.assessments)::BIGINT as total_assessments,
        (SELECT COUNT(*) FROM public.assessments WHERE status = 'completed')::BIGINT as completed_assessments,
        (SELECT COUNT(DISTINCT c.parent_id) 
         FROM public.children c 
         JOIN public.assessments a ON c.id = a.child_id 
         WHERE a.started_at >= yesterday)::BIGINT as active_users_24h,
        (SELECT COUNT(*) FROM public.profiles WHERE created_at >= today_start)::BIGINT as new_users_today;
END;
$$;

-- 4. Grant execute permissions to authenticated users (for admin access)
GRANT EXECUTE ON FUNCTION public.get_admin_user_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;

-- 5. Create RLS policies that allow admin access
-- First, add role column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Update admin user role (replace 'admin@example.com' with your admin email)
UPDATE public.profiles 
SET role = 'admin' 
WHERE email IN ('admin', 'admin@example.com', 'laboochi02@gmail.com');

-- 6. Create admin-friendly policies
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
CREATE POLICY "Admin can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin can view all children" ON public.children;
CREATE POLICY "Admin can view all children"
  ON public.children FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin can view all assessments" ON public.assessments;
CREATE POLICY "Admin can view all assessments"
  ON public.assessments FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

-- 7. Test the functions
SELECT 'Testing admin stats function:' as test;
SELECT * FROM public.get_admin_dashboard_stats();

SELECT 'Testing user stats function (first 5 users):' as test;
SELECT * FROM public.get_admin_user_stats() LIMIT 5;
