-- FIX RLS POLICIES FOR ADMIN ACCESS
-- Run this in your Supabase SQL Editor to fix the 500 errors

-- First, let's check what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'children', 'assessments');

-- Drop existing restrictive policies that might be blocking admin access
DROP POLICY IF EXISTS "Users can only view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can only view own children" ON public.children;
DROP POLICY IF EXISTS "Users can only view own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.children;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.assessments;

-- Create comprehensive policies that allow both user access and admin access

-- PROFILES TABLE POLICIES
CREATE POLICY "Users can view own profile and admins can view all"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id 
    OR 
    auth.email() IN ('admin', 'admin@example.com', 'admin')
    OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND email IN ('admin', 'admin@example.com', 'admin')
    )
  );

CREATE POLICY "Users can update own profile and admins can update all"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id 
    OR 
    auth.email() IN ('admin', 'admin@example.com', 'admin')
  );

CREATE POLICY "Users can insert own profile and admins can insert all"
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id 
    OR 
    auth.email() IN ('admin', 'admin@example.com', 'admin')
  );

-- CHILDREN TABLE POLICIES
CREATE POLICY "Users can view own children and admins can view all"
  ON public.children FOR SELECT
  USING (
    auth.uid() = parent_id 
    OR 
    auth.email() IN ('admin', 'admin@example.com', 'admin')
    OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND email IN ('admin', 'admin@example.com', 'admin')
    )
  );

CREATE POLICY "Users can manage own children and admins can manage all"
  ON public.children FOR ALL
  USING (
    auth.uid() = parent_id 
    OR 
    auth.email() IN ('admin', 'admin@example.com', 'admin')
  );

-- ASSESSMENTS TABLE POLICIES
CREATE POLICY "Users can view own assessments and admins can view all"
  ON public.assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.children 
      WHERE children.id = assessments.child_id 
      AND children.parent_id = auth.uid()
    )
    OR 
    auth.email() IN ('admin', 'admin@example.com', 'admin')
    OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND email IN ('admin', 'admin@example.com', 'admin')
    )
  );

CREATE POLICY "Users can manage own assessments and admins can manage all"
  ON public.assessments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.children 
      WHERE children.id = assessments.child_id 
      AND children.parent_id = auth.uid()
    )
    OR 
    auth.email() IN ('admin', 'admin@example.com', 'admin')
  );

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.children TO authenticated;
GRANT ALL ON public.assessments TO authenticated;

-- Check the policies were created successfully
SELECT 'Policies created successfully!' as status;
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'children', 'assessments')
ORDER BY tablename, policyname;
