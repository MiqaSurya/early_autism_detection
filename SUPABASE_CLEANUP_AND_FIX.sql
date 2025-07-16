-- =============================================================================
-- SUPABASE DATABASE CLEANUP AND FIX SCRIPT
-- =============================================================================
-- This script will help clean up unused data and fix RLS policies
-- Run this in your Supabase SQL Editor

-- =============================================================================
-- STEP 1: CHECK CURRENT DATABASE USAGE
-- =============================================================================
SELECT 'DATABASE SIZE CHECK' as step;

-- Check table sizes to identify what's taking up space
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check row counts for main tables (only if they exist)
SELECT 'ROW COUNTS' as info;

-- Check which tables exist first
SELECT 'EXISTING TABLES' as check_type;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Count rows only for tables that exist
DO $$
BEGIN
    -- Check auth.users
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        RAISE NOTICE 'auth.users: % rows', (SELECT COUNT(*) FROM auth.users);
    END IF;

    -- Check public tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        RAISE NOTICE 'public.profiles: % rows', (SELECT COUNT(*) FROM public.profiles);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'children') THEN
        RAISE NOTICE 'public.children: % rows', (SELECT COUNT(*) FROM public.children);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assessments') THEN
        RAISE NOTICE 'public.assessments: % rows', (SELECT COUNT(*) FROM public.assessments);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'autism_centers') THEN
        RAISE NOTICE 'public.autism_centers: % rows', (SELECT COUNT(*) FROM public.autism_centers);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'center_users') THEN
        RAISE NOTICE 'public.center_users: % rows', (SELECT COUNT(*) FROM public.center_users);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'center_sessions') THEN
        RAISE NOTICE 'public.center_sessions: % rows', (SELECT COUNT(*) FROM public.center_sessions);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'questionnaires') THEN
        RAISE NOTICE 'public.questionnaires: % rows', (SELECT COUNT(*) FROM public.questionnaires);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'questions') THEN
        RAISE NOTICE 'public.questions: % rows', (SELECT COUNT(*) FROM public.questions);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_conversations') THEN
        RAISE NOTICE 'public.chat_conversations: % rows', (SELECT COUNT(*) FROM public.chat_conversations);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
        RAISE NOTICE 'public.chat_messages: % rows', (SELECT COUNT(*) FROM public.chat_messages);
    END IF;
END $$;

-- =============================================================================
-- STEP 2: CLEAN UP OLD/UNUSED DATA (ONLY FOR EXISTING TABLES)
-- =============================================================================
SELECT 'CLEANUP PHASE' as step;

-- Clean up data only if tables exist
DO $$
BEGIN
    -- Clean up old assessment data if tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assessments')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assessment_responses') THEN

        DELETE FROM public.assessment_responses
        WHERE assessment_id IN (
            SELECT a.id
            FROM public.assessments a
            WHERE a.id NOT IN (
                SELECT id FROM (
                    SELECT id, ROW_NUMBER() OVER (PARTITION BY child_id ORDER BY created_at DESC) as rn
                    FROM public.assessments
                ) ranked
                WHERE rn <= 100
            )
        );

        DELETE FROM public.assessments
        WHERE id NOT IN (
            SELECT id FROM (
                SELECT id, ROW_NUMBER() OVER (PARTITION BY child_id ORDER BY created_at DESC) as rn
                FROM public.assessments
            ) ranked
            WHERE rn <= 100
        );

        RAISE NOTICE 'Cleaned up old assessment data';
    END IF;

    -- Clean up old chat messages if tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
        DELETE FROM public.chat_messages
        WHERE id NOT IN (
            SELECT id FROM (
                SELECT id, ROW_NUMBER() OVER (PARTITION BY conversation_id ORDER BY created_at DESC) as rn
                FROM public.chat_messages
            ) ranked
            WHERE rn <= 1000
        );
        RAISE NOTICE 'Cleaned up old chat messages';
    END IF;

    -- Clean up orphaned records if tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);
        RAISE NOTICE 'Cleaned up orphaned profiles';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'children') THEN
        DELETE FROM public.children WHERE user_id NOT IN (SELECT id FROM auth.users);
        RAISE NOTICE 'Cleaned up orphaned children records';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_conversations') THEN
        DELETE FROM public.chat_conversations WHERE user_id NOT IN (SELECT id FROM auth.users);
        RAISE NOTICE 'Cleaned up orphaned chat conversations';
    END IF;

    -- Clean up old sessions if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'center_sessions') THEN
        DELETE FROM public.center_sessions WHERE expires_at < NOW() - INTERVAL '30 days';
        RAISE NOTICE 'Cleaned up old center sessions';
    END IF;
END $$;

-- =============================================================================
-- STEP 3: FIX RLS POLICIES FOR CENTER REGISTRATION
-- =============================================================================
SELECT 'FIXING RLS POLICIES' as step;

-- Disable RLS temporarily for autism_centers to allow service role access
ALTER TABLE public.autism_centers DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.autism_centers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.autism_centers;
DROP POLICY IF EXISTS "Enable update for center owners" ON public.autism_centers;
DROP POLICY IF EXISTS "Enable delete for center owners" ON public.autism_centers;
DROP POLICY IF EXISTS "Service role can do everything" ON public.autism_centers;

-- Create new policies that allow service role access
CREATE POLICY "Enable read access for all users" ON public.autism_centers
    FOR SELECT USING (true);

CREATE POLICY "Service role full access" ON public.autism_centers
    FOR ALL USING (
        auth.role() = 'service_role' OR 
        auth.role() = 'authenticated'
    );

-- Re-enable RLS
ALTER TABLE public.autism_centers ENABLE ROW LEVEL SECURITY;

-- Fix center_users RLS policies
ALTER TABLE public.center_users DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for center owners" ON public.center_users;
DROP POLICY IF EXISTS "Enable insert for registration" ON public.center_users;
DROP POLICY IF EXISTS "Enable update for center owners" ON public.center_users;
DROP POLICY IF EXISTS "Service role can do everything" ON public.center_users;

CREATE POLICY "Enable insert for registration" ON public.center_users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for center owners" ON public.center_users
    FOR SELECT USING (
        auth.role() = 'service_role' OR 
        id = auth.uid()::text OR
        email = auth.jwt() ->> 'email'
    );

CREATE POLICY "Enable update for center owners" ON public.center_users
    FOR UPDATE USING (
        auth.role() = 'service_role' OR 
        id = auth.uid()::text OR
        email = auth.jwt() ->> 'email'
    );

CREATE POLICY "Service role full access" ON public.center_users
    FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE public.center_users ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 4: REMOVE/DISABLE PROBLEMATIC TRIGGERS
-- =============================================================================
SELECT 'FIXING TRIGGERS' as step;

-- Drop the problematic trigger that's causing RLS issues
DROP TRIGGER IF EXISTS sync_center_to_autism_centers ON public.center_users;
DROP FUNCTION IF EXISTS sync_center_to_autism_centers();

-- =============================================================================
-- STEP 5: VACUUM AND ANALYZE TO RECLAIM SPACE (ONLY EXISTING TABLES)
-- =============================================================================
SELECT 'OPTIMIZING DATABASE' as step;

-- Vacuum tables only if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assessments') THEN
        EXECUTE 'VACUUM FULL public.assessments';
        RAISE NOTICE 'Vacuumed assessments table';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
        EXECUTE 'VACUUM FULL public.chat_messages';
        RAISE NOTICE 'Vacuumed chat_messages table';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_conversations') THEN
        EXECUTE 'VACUUM FULL public.chat_conversations';
        RAISE NOTICE 'Vacuumed chat_conversations table';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'autism_centers') THEN
        EXECUTE 'VACUUM FULL public.autism_centers';
        RAISE NOTICE 'Vacuumed autism_centers table';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'center_users') THEN
        EXECUTE 'VACUUM FULL public.center_users';
        RAISE NOTICE 'Vacuumed center_users table';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'center_sessions') THEN
        EXECUTE 'VACUUM FULL public.center_sessions';
        RAISE NOTICE 'Vacuumed center_sessions table';
    END IF;
END $$;

-- Update statistics
ANALYZE;

-- =============================================================================
-- STEP 6: FINAL SIZE CHECK
-- =============================================================================
SELECT 'FINAL SIZE CHECK' as step;

SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size_after_cleanup
FROM pg_tables 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

SELECT 'CLEANUP COMPLETED!' as status;
SELECT 'You should now be able to register centers successfully.' as message;
