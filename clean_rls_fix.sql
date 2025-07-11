-- CLEAN RLS POLICIES FIX
-- This script safely removes all existing policies and creates new ones

-- Step 1: Disable RLS temporarily to clear all policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.children DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (this will work even if they don't exist)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on profiles table
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.profiles';
    END LOOP;
    
    -- Drop all policies on children table
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'children') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.children';
    END LOOP;
    
    -- Drop all policies on assessments table
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'assessments') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.assessments';
    END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, working policies

-- PROFILES - Allow users to see their own data + admin access
CREATE POLICY "profiles_access" ON public.profiles
  FOR ALL USING (
    auth.uid() = id 
    OR 
    auth.email() = 'admin'
    OR
    auth.email() = 'laboochi02@gmail.com'
  );

-- CHILDREN - Allow users to see their own children + admin access
CREATE POLICY "children_access" ON public.children
  FOR ALL USING (
    auth.uid() = parent_id 
    OR 
    auth.email() = 'admin'
    OR
    auth.email() = 'laboochi02@gmail.com'
  );

-- ASSESSMENTS - Allow users to see assessments for their children + admin access
CREATE POLICY "assessments_access" ON public.assessments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.children 
      WHERE children.id = assessments.child_id 
      AND children.parent_id = auth.uid()
    )
    OR 
    auth.email() = 'admin'
    OR
    auth.email() = 'laboochi02@gmail.com'
  );

-- Step 5: Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.children TO authenticated;
GRANT ALL ON public.assessments TO authenticated;

-- Step 6: Verify the setup
SELECT 'RLS policies reset successfully!' as status;

-- Show the new policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'children', 'assessments')
ORDER BY tablename, policyname;
