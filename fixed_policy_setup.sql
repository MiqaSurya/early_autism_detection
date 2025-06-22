-- POLICY CREATION FIX
-- This script fixes the policy creation by dropping existing policies first

-- Drop existing policies to avoid conflicts (they will be recreated)
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- First drop all existing RLS policies to avoid conflicts with new ones
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'children', 'questions', 'scoring_ranges', 
                     'assessments', 'responses', 'saved_locations', 'postgres_version')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                  policy_record.policyname, 
                  policy_record.schemaname, 
                  policy_record.tablename);
  END LOOP;
END
$$;

-- Profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Children
CREATE POLICY "Users can view their own children"
  ON children FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Users can insert their own children"
  ON children FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Users can update their own children"
  ON children FOR UPDATE
  USING (auth.uid() = parent_id);

CREATE POLICY "Users can delete their own children"
  ON children FOR DELETE
  USING (auth.uid() = parent_id);

-- Questions
CREATE POLICY "Questions are viewable by all authenticated users"
  ON questions FOR SELECT
  USING (auth.role() = 'authenticated');

-- Scoring Ranges
CREATE POLICY "Scoring ranges are viewable by all authenticated users"
  ON scoring_ranges FOR SELECT
  USING (auth.role() = 'authenticated');

-- Assessments
CREATE POLICY "Users can view their children's assessments"
  ON assessments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM children
    WHERE children.id = assessments.child_id
    AND children.parent_id = auth.uid()
  ));

CREATE POLICY "Users can insert assessments for their children"
  ON assessments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM children
    WHERE children.id = assessments.child_id
    AND children.parent_id = auth.uid()
  ));

CREATE POLICY "Users can update their children's assessments"
  ON assessments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM children
    WHERE children.id = assessments.child_id
    AND children.parent_id = auth.uid()
  ));

-- Responses
CREATE POLICY "Users can view their children's responses"
  ON responses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM assessments
    JOIN children ON children.id = assessments.child_id
    WHERE assessments.id = responses.assessment_id
    AND children.parent_id = auth.uid()
  ));

CREATE POLICY "Users can insert responses for their children's assessments"
  ON responses FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM assessments
    JOIN children ON children.id = assessments.child_id
    WHERE assessments.id = responses.assessment_id
    AND children.parent_id = auth.uid()
  ));

-- Saved Locations
CREATE POLICY "Users can view their saved locations"
  ON saved_locations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their saved locations"
  ON saved_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their saved locations"
  ON saved_locations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their saved locations"
  ON saved_locations FOR DELETE
  USING (auth.uid() = user_id);

-- Postgres_version (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'postgres_version'
  ) THEN
    EXECUTE 'CREATE POLICY "Postgres version info viewable by authenticated users" ON public.postgres_version FOR SELECT USING (auth.role() = ''authenticated'')';
  END IF;
END
$$; 