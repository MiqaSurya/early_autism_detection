-- Enable RLS on the tables that are missing it
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postgres_version ENABLE ROW LEVEL SECURITY;

-- Create an appropriate policy for questions table (read-only for authenticated users)
CREATE POLICY "Questions are viewable by all authenticated users"
  ON public.questions FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create scoring_ranges table if it doesn't exist yet, with RLS enabled
CREATE TABLE IF NOT EXISTS public.scoring_ranges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  min_score INT NOT NULL,
  max_score INT NOT NULL,
  percentage_range TEXT,
  risk_category TEXT NOT NULL,
  interpretation TEXT,
  age_group TEXT CHECK (age_group IN ('0-3', '4-7', '8-12', '13-18')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create policy for scoring_ranges table (read-only for authenticated users)
CREATE POLICY "Scoring ranges are viewable by all authenticated users"
  ON public.scoring_ranges FOR SELECT
  USING (auth.role() = 'authenticated');

-- Insert some default scoring ranges if the table is empty
INSERT INTO public.scoring_ranges (min_score, max_score, percentage_range, risk_category, interpretation, age_group)
SELECT * FROM (
  VALUES
    (0, 2, '0-33%', 'low', 'No significant concerns detected', '0-3'),
    (3, 4, '34-66%', 'medium', 'Some behaviors of concern detected', '0-3'),
    (5, 6, '67-100%', 'high', 'Multiple behaviors of concern detected', '0-3'),
    (0, 2, '0-33%', 'low', 'No significant concerns detected', '4-7'),
    (3, 4, '34-66%', 'medium', 'Some behaviors of concern detected', '4-7'),
    (5, 6, '67-100%', 'high', 'Multiple behaviors of concern detected', '4-7')
) AS values_to_insert
WHERE NOT EXISTS (SELECT 1 FROM public.scoring_ranges LIMIT 1);

-- For postgres_version table (this is likely a system table)
-- First check if this is actually a custom table or a system table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'postgres_version'
  ) THEN
    -- It's a custom table, create a restrictive policy
    EXECUTE 'CREATE POLICY "Postgres version info viewable by authenticated users" ON public.postgres_version FOR SELECT USING (auth.role() = ''authenticated'')';
  END IF;
END
$$; 