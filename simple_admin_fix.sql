-- SIMPLE ADMIN DASHBOARD FIX
-- Run this step by step if the full script has issues

-- Step 1: Check current data
SELECT 'Current Data:' as info;
SELECT COUNT(*) as total_profiles FROM public.profiles;
SELECT COUNT(*) as total_children FROM public.children;
SELECT COUNT(*) as total_assessments FROM public.assessments;

-- Step 2: Create missing profiles (run this separately)
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

-- Step 3: Check user data relationships
SELECT 
    p.id as user_id,
    p.email,
    p.display_name,
    COUNT(DISTINCT c.id) as children_count,
    COUNT(DISTINCT a.id) as assessments_count
FROM public.profiles p
LEFT JOIN public.children c ON p.id = c.parent_id
LEFT JOIN public.assessments a ON c.id = a.child_id
GROUP BY p.id, p.email, p.display_name
ORDER BY children_count DESC, assessments_count DESC
LIMIT 10;

-- Step 4: Enable RLS and create admin policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Step 5: Create admin access policies (replace with your admin email)
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
CREATE POLICY "Admin can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.email() IN ('admin', 'admin@example.com', 'admin')
  );

DROP POLICY IF EXISTS "Admin can view all children" ON public.children;
CREATE POLICY "Admin can view all children"
  ON public.children FOR SELECT
  USING (
    auth.email() IN ('admin', 'admin@example.com', 'admin')
  );

DROP POLICY IF EXISTS "Admin can view all assessments" ON public.assessments;
CREATE POLICY "Admin can view all assessments"
  ON public.assessments FOR SELECT
  USING (
    auth.email() IN ('admin', 'admin@example.com', 'admin')
  );

SELECT 'Admin policies created successfully!' as status;
