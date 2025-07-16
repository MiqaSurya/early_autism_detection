-- =============================================================================
-- SIMPLE FIX FOR CENTER REGISTRATION
-- =============================================================================
-- This script only fixes the RLS issue and does basic cleanup

-- Step 1: Fix RLS policies for autism_centers
ALTER TABLE public.autism_centers DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.autism_centers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.autism_centers;
DROP POLICY IF EXISTS "Enable update for center owners" ON public.autism_centers;
DROP POLICY IF EXISTS "Enable delete for center owners" ON public.autism_centers;
DROP POLICY IF EXISTS "Service role can do everything" ON public.autism_centers;
DROP POLICY IF EXISTS "Public read access" ON public.autism_centers;
DROP POLICY IF EXISTS "Service role full access" ON public.autism_centers;

-- Create simple policies
CREATE POLICY "Public read access" ON public.autism_centers
    FOR SELECT USING (true);

CREATE POLICY "Service role full access" ON public.autism_centers
    FOR ALL USING (auth.role() = 'service_role');

-- Re-enable RLS
ALTER TABLE public.autism_centers ENABLE ROW LEVEL SECURITY;

-- Step 2: Fix RLS policies for center_users
ALTER TABLE public.center_users DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read for center owners" ON public.center_users;
DROP POLICY IF EXISTS "Enable insert for registration" ON public.center_users;
DROP POLICY IF EXISTS "Enable update for center owners" ON public.center_users;
DROP POLICY IF EXISTS "Service role can do everything" ON public.center_users;
DROP POLICY IF EXISTS "Allow registration" ON public.center_users;
DROP POLICY IF EXISTS "Service role full access" ON public.center_users;
DROP POLICY IF EXISTS "Center owners can read/update" ON public.center_users;

-- Create simple policies
CREATE POLICY "Allow registration" ON public.center_users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.center_users
    FOR ALL USING (auth.role() = 'service_role');

-- Re-enable RLS
ALTER TABLE public.center_users ENABLE ROW LEVEL SECURITY;

-- Step 3: Remove problematic triggers
DROP TRIGGER IF EXISTS sync_center_to_autism_centers ON public.center_users;
DROP FUNCTION IF EXISTS sync_center_to_autism_centers();

-- Step 4: Basic cleanup - remove old sessions if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'center_sessions') THEN
        DELETE FROM public.center_sessions WHERE expires_at < NOW() - INTERVAL '30 days';
        RAISE NOTICE 'Cleaned up old center sessions';
    END IF;
END $$;

-- Step 5: Show current table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

SELECT 'Fix completed! Try registering a center now.' as message;
