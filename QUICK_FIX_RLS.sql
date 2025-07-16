-- =============================================================================
-- QUICK FIX FOR CENTER REGISTRATION RLS ISSUE
-- =============================================================================
-- Run this in your Supabase SQL Editor to fix the immediate registration issue

-- Fix autism_centers RLS policies
ALTER TABLE public.autism_centers DISABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.autism_centers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.autism_centers;
DROP POLICY IF EXISTS "Enable update for center owners" ON public.autism_centers;
DROP POLICY IF EXISTS "Enable delete for center owners" ON public.autism_centers;
DROP POLICY IF EXISTS "Service role can do everything" ON public.autism_centers;

-- Create new policies that allow service role access
CREATE POLICY "Public read access" ON public.autism_centers
    FOR SELECT USING (true);

CREATE POLICY "Service role full access" ON public.autism_centers
    FOR ALL USING (auth.role() = 'service_role');

-- Re-enable RLS
ALTER TABLE public.autism_centers ENABLE ROW LEVEL SECURITY;

-- Fix center_users RLS policies  
ALTER TABLE public.center_users DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read for center owners" ON public.center_users;
DROP POLICY IF EXISTS "Enable insert for registration" ON public.center_users;
DROP POLICY IF EXISTS "Enable update for center owners" ON public.center_users;
DROP POLICY IF EXISTS "Service role can do everything" ON public.center_users;

-- Create new policies
CREATE POLICY "Allow registration" ON public.center_users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.center_users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Center owners can read/update" ON public.center_users
    FOR ALL USING (
        auth.role() = 'service_role' OR
        id::uuid = auth.uid()
    );

-- Re-enable RLS
ALTER TABLE public.center_users ENABLE ROW LEVEL SECURITY;

-- Remove problematic trigger if it exists
DROP TRIGGER IF EXISTS sync_center_to_autism_centers ON public.center_users;
DROP FUNCTION IF EXISTS sync_center_to_autism_centers();

SELECT 'RLS policies fixed! Try registering again.' as message;
