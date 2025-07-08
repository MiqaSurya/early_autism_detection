-- =============================================================================
-- SIMPLE RLS FIX - Early Autism Detector
-- =============================================================================
-- This script fixes only the RLS issues you can actually control
-- Run this in your Supabase SQL Editor

-- =============================================================================
-- 1. Fix questionnaire_templates table (if it exists)
-- =============================================================================

-- Check if questionnaire_templates table exists and enable RLS
DO $$
BEGIN
    -- Check if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'questionnaire_templates') THEN
        
        -- Enable RLS on questionnaire_templates
        ALTER TABLE public.questionnaire_templates ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist to avoid conflicts
        DROP POLICY IF EXISTS "Allow authenticated users to read questionnaire templates" ON public.questionnaire_templates;
        DROP POLICY IF EXISTS "Allow public read access to questionnaire templates" ON public.questionnaire_templates;
        
        -- Create policies for questionnaire_templates
        -- Allow authenticated users to read questionnaire templates
        CREATE POLICY "Allow authenticated users to read questionnaire templates"
        ON public.questionnaire_templates
        FOR SELECT
        TO authenticated
        USING (true);

        -- Allow public access to questionnaire templates (for M-CHAT-R assessment)
        CREATE POLICY "Allow public read access to questionnaire templates"
        ON public.questionnaire_templates
        FOR SELECT
        TO anon
        USING (true);
        
        RAISE NOTICE 'RLS enabled on questionnaire_templates table';
    ELSE
        RAISE NOTICE 'questionnaire_templates table does not exist - skipping';
    END IF;
END $$;

-- =============================================================================
-- 2. Ensure RLS is enabled on all your main application tables
-- =============================================================================

-- Enable RLS on core tables (safe to run multiple times)
DO $$
BEGIN
    -- profiles table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on profiles table';
    END IF;
    
    -- children table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'children') THEN
        ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on children table';
    END IF;
    
    -- assessments table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assessments') THEN
        ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on assessments table';
    END IF;
    
    -- responses table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'responses') THEN
        ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on responses table';
    END IF;
    
    -- saved_locations table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saved_locations') THEN
        ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on saved_locations table';
    END IF;
    
    -- chat_history table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_history') THEN
        ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on chat_history table';
    END IF;
    
    -- autism_centers table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'autism_centers') THEN
        ALTER TABLE public.autism_centers ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on autism_centers table';
    END IF;
    
    -- questions table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'questions') THEN
        ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on questions table';
    END IF;
    
    -- scoring_ranges table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scoring_ranges') THEN
        ALTER TABLE public.scoring_ranges ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on scoring_ranges table';
    END IF;
END $$;

-- =============================================================================
-- 3. Verification - Check RLS status
-- =============================================================================

-- Show RLS status for all your tables (excluding system tables)
SELECT 
    schemaname,
    tablename,
    row_security as rls_enabled,
    CASE 
        WHEN row_security THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'spatial_%'  -- Exclude PostGIS system tables
  AND tablename NOT LIKE 'geography_%'
  AND tablename NOT LIKE 'geometry_%'
ORDER BY tablename;

-- =============================================================================
-- NOTES ABOUT THE ERRORS:
-- =============================================================================
-- 
-- 1. spatial_ref_sys ERROR: This is NORMAL and EXPECTED
--    - spatial_ref_sys is a PostGIS system table owned by Supabase
--    - You cannot modify it, and that's perfectly fine
--    - This table contains spatial reference systems (not user data)
--    - The RLS warning for this table can be safely ignored
--
-- 2. What this script fixes:
--    - questionnaire_templates (if it exists in your database)
--    - All your main application tables
--    - Ensures proper RLS policies are in place
--
-- 3. After running this script:
--    - The questionnaire_templates RLS warning should disappear
--    - The spatial_ref_sys warning will remain (this is normal)
--    - All your user data tables will have RLS enabled
--
-- 4. If you want to completely eliminate the spatial_ref_sys warning:
--    - Contact Supabase support
--    - Or simply ignore it (it's not a security risk)
--
-- =============================================================================
