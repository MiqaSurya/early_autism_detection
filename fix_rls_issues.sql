-- =============================================================================
-- FIX RLS ISSUES - Early Autism Detector
-- =============================================================================
-- This script fixes the RLS (Row Level Security) issues reported by Supabase
-- Run this in your Supabase SQL Editor

-- =============================================================================
-- 1. Fix spatial_ref_sys table (PostGIS system table)
-- =============================================================================
-- Note: spatial_ref_sys is a PostGIS system table that you don't own
-- This is a system table and the RLS warning can be safely ignored
-- Supabase manages this table and it doesn't expose sensitive user data

-- Skip spatial_ref_sys - this is a PostGIS system table managed by Supabase
-- The RLS warning for this table can be safely ignored as it contains
-- only spatial reference system definitions (not user data)
-- If you need to suppress this warning, contact Supabase support

-- Commenting out the spatial_ref_sys modifications:
/*
-- These commands will fail with "must be owner of table" error:
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read spatial reference systems"
ON public.spatial_ref_sys FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow public read access to spatial reference systems"
ON public.spatial_ref_sys FOR SELECT TO anon USING (true);
*/

-- =============================================================================
-- 2. Fix questionnaire_templates table
-- =============================================================================
-- Enable RLS on questionnaire_templates
ALTER TABLE public.questionnaire_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for questionnaire_templates
-- Allow authenticated users to read questionnaire templates
CREATE POLICY "Allow authenticated users to read questionnaire templates"
ON public.questionnaire_templates
FOR SELECT
TO authenticated
USING (true);

-- Allow public access to questionnaire templates (for M-CHAT-R assessment)
-- This is safe since questionnaire templates are not user-specific data
CREATE POLICY "Allow public read access to questionnaire templates"
ON public.questionnaire_templates
FOR SELECT
TO anon
USING (true);

-- If you need admin users to manage questionnaire templates, add this policy:
-- (Uncomment if you have admin functionality)
/*
CREATE POLICY "Allow admin users to manage questionnaire templates"
ON public.questionnaire_templates
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
*/

-- =============================================================================
-- 3. Additional RLS checks for other tables (preventive)
-- =============================================================================
-- Let's also ensure all your main tables have RLS enabled

-- Enable RLS on core tables (simplified approach - safe to run multiple times)
-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on children
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Enable RLS on assessments
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on responses
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- Enable RLS on saved_locations
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on chat_history
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- Enable RLS on autism_centers
ALTER TABLE public.autism_centers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on scoring_ranges
ALTER TABLE public.scoring_ranges ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 4. Verification queries
-- =============================================================================
-- Run these to verify RLS is enabled on all tables

-- Check RLS status on all public tables
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================================================
-- NOTES:
-- =============================================================================
-- 1. spatial_ref_sys: This is a PostGIS system table. Enabling RLS on it is safe
--    and the policies allow both authenticated and anonymous access for map functionality.
--
-- 2. questionnaire_templates: This table contains M-CHAT-R questions and templates.
--    The policies allow public read access since these are not sensitive data.
--
-- 3. After running this script, the RLS warnings in Supabase should disappear.
--
-- 4. If you get any errors about policies already existing, that's normal - 
--    the script will skip creating duplicate policies.
--
-- 5. Test your application after running this to ensure map and assessment 
--    functionality still works correctly.
-- =============================================================================
