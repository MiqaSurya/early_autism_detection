-- QUICK ADMIN DASHBOARD FIX
-- Run this in your Supabase SQL Editor to fix the admin dashboard data issue

-- 1. First, let's see what data we actually have
SELECT 'Current Data Summary:' as info;

SELECT 
    'profiles' as table_name,
    COUNT(*) as total_records
FROM public.profiles
UNION ALL
SELECT 
    'children' as table_name,
    COUNT(*) as total_records
FROM public.children
UNION ALL
SELECT 
    'assessments' as table_name,
    COUNT(*) as total_records
FROM public.assessments;

-- 2. Check if profiles are missing for any auth users
SELECT 'Missing Profiles Check:' as info;

SELECT 
    COUNT(*) as auth_users_without_profiles
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 3. Create missing profiles for auth users
INSERT INTO public.profiles (id, display_name, email, email_verified, created_at, updated_at)
SELECT 
    u.id,
    COALESCE(
        u.raw_user_meta_data->>'display_name',
        u.raw_user_meta_data->>'full_name',
        split_part(u.email, '@', 1)
    ) as display_name,
    u.email,
    COALESCE(u.email_confirmed_at IS NOT NULL, FALSE) as email_verified,
    u.created_at,
    NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = EXCLUDED.email_verified,
    updated_at = NOW();

-- 4. Update any profiles that might have missing email data
UPDATE public.profiles
SET email = auth.users.email,
    updated_at = NOW()
FROM auth.users
WHERE public.profiles.id = auth.users.id
AND (public.profiles.email IS NULL OR public.profiles.email = '');

-- 5. Check the user-children-assessments relationship
SELECT 'User Data Summary:' as info;

SELECT 
    p.id as user_id,
    p.email,
    p.display_name,
    COUNT(DISTINCT c.id) as children_count,
    COUNT(DISTINCT a.id) as assessments_count,
    COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_assessments
FROM public.profiles p
LEFT JOIN public.children c ON p.id = c.parent_id
LEFT JOIN public.assessments a ON c.id = a.child_id
GROUP BY p.id, p.email, p.display_name
HAVING COUNT(DISTINCT c.id) > 0 OR COUNT(DISTINCT a.id) > 0
ORDER BY children_count DESC, assessments_count DESC
LIMIT 10;

-- 6. Grant proper permissions for admin access
-- Make sure RLS allows admin to see all data
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Create admin policies (replace 'your-admin-email@example.com' with your actual admin email)
DROP POLICY IF EXISTS "Admin full access to profiles" ON public.profiles;
CREATE POLICY "Admin full access to profiles"
  ON public.profiles
  FOR ALL
  USING (
    auth.email() IN ('admin', 'admin@example.com', 'admin')
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND email IN ('admin', 'admin@example.com', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admin full access to children" ON public.children;
CREATE POLICY "Admin full access to children"
  ON public.children
  FOR ALL
  USING (
    auth.email() IN ('admin', 'admin@example.com', 'admin')
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND email IN ('admin', 'admin@example.com', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admin full access to assessments" ON public.assessments;
CREATE POLICY "Admin full access to assessments"
  ON public.assessments
  FOR ALL
  USING (
    auth.email() IN ('admin', 'admin@example.com', 'admin')
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND email IN ('admin', 'admin@example.com', 'admin')
    )
  );

-- 7. Final verification
SELECT 'Final Verification:' as info;

SELECT 
    'Total Users' as metric,
    COUNT(*) as value
FROM public.profiles
UNION ALL
SELECT 
    'Users with Children' as metric,
    COUNT(DISTINCT parent_id) as value
FROM public.children
UNION ALL
SELECT 
    'Users with Assessments' as metric,
    COUNT(DISTINCT c.parent_id) as value
FROM public.children c
JOIN public.assessments a ON c.id = a.child_id;

SELECT 'Setup Complete!' as status;
