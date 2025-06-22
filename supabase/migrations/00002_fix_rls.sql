-- Enable RLS on the tables
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_ranges ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Questions are viewable by authenticated users" ON public.questions;
DROP POLICY IF EXISTS "Scoring ranges are viewable by authenticated users" ON public.scoring_ranges;
DROP POLICY IF EXISTS "Postgres version viewable by authenticated users" ON public.postgres_version;

-- Create policies for questions table
CREATE POLICY "Questions are viewable by authenticated users"
ON public.questions
FOR SELECT
TO authenticated
USING (true);

-- Create policies for scoring_ranges table
CREATE POLICY "Scoring ranges are viewable by authenticated users"
ON public.scoring_ranges
FOR SELECT
TO authenticated
USING (true);

-- For postgres_version table, first check if it exists
DO $$
BEGIN
    -- Check if the postgres_version table exists
    IF EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'postgres_version'
    ) THEN
        -- Enable RLS if the table exists
        ALTER TABLE public.postgres_version ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for postgres_version table
        CREATE POLICY "Postgres version viewable by authenticated users"
        ON public.postgres_version
        FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END
$$;

-- Additional security measures

-- Revoke all privileges from public on these tables
REVOKE ALL ON public.questions FROM public;
REVOKE ALL ON public.scoring_ranges FROM public;

-- Grant specific privileges to authenticated users
GRANT SELECT ON public.questions TO authenticated;
GRANT SELECT ON public.scoring_ranges TO authenticated;

-- Grant privileges to service role (for admin operations)
GRANT ALL ON public.questions TO service_role;
GRANT ALL ON public.scoring_ranges TO service_role;

-- If postgres_version table exists, set its permissions
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'postgres_version'
    ) THEN
        REVOKE ALL ON public.postgres_version FROM public;
        GRANT SELECT ON public.postgres_version TO authenticated;
        GRANT ALL ON public.postgres_version TO service_role;
    END IF;
END
$$;

-- Add comments to document the security setup
COMMENT ON TABLE public.questions IS 'Assessment questions with RLS enabled - read-only access for authenticated users';
COMMENT ON TABLE public.scoring_ranges IS 'Scoring ranges for assessments with RLS enabled - read-only access for authenticated users';
