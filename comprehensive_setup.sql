-- COMPREHENSIVE DATABASE SETUP FOR EARLY AUTISM DETECTOR
-- This script sets up all tables, functions, and security policies

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CORE TABLES
-- User profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Children table 
CREATE TABLE IF NOT EXISTS public.children (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  parent_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. ASSESSMENT SYSTEM
-- Assessment questions
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category TEXT NOT NULL,
  text TEXT NOT NULL,
  age_group TEXT CHECK (age_group IN ('0-3', '4-7', '8-12', '13-18')) NOT NULL,
  order_number INT NOT NULL,
  is_reverse_scored BOOLEAN DEFAULT FALSE
);

-- Scoring ranges for interpreting results
CREATE TABLE IF NOT EXISTS public.scoring_ranges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  min_score INT NOT NULL,
  max_score INT NOT NULL,
  percentage_range TEXT,
  risk_category TEXT NOT NULL CHECK (risk_category IN ('low', 'medium', 'high', 'inconclusive')),
  interpretation TEXT,
  age_group TEXT CHECK (age_group IN ('0-3', '4-7', '8-12', '13-18')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Assessments 
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id UUID REFERENCES children(id) NOT NULL,
  status TEXT CHECK (status IN ('in_progress', 'completed')) DEFAULT 'in_progress',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMP WITH TIME ZONE,
  score INT,
  notes TEXT,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'inconclusive'))
);

-- Responses to assessment questions
CREATE TABLE IF NOT EXISTS public.responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assessment_id UUID REFERENCES assessments(id) NOT NULL,
  question_id UUID REFERENCES questions(id) NOT NULL,
  answer TEXT CHECK (answer IN ('yes', 'no')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE (assessment_id, question_id)
);

-- 4. LOCATION SYSTEM
-- Saved locations for treatment centers
CREATE TABLE IF NOT EXISTS public.saved_locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('diagnostic', 'therapy', 'support', 'education')) NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. TRIGGERS & FUNCTIONS
-- Create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email_verified)
  VALUES (NEW.id, split_part(NEW.email, '@', 1), 
          CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN TRUE ELSE FALSE END);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update email verified status when email is confirmed
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email_verified = TRUE
  WHERE id = NEW.id AND NEW.email_confirmed_at IS NOT NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate assessment score
CREATE OR REPLACE FUNCTION public.calculate_assessment_score()
RETURNS TRIGGER AS $$
DECLARE
  total_questions INTEGER;
  total_yes INTEGER;
  assessment_age_group TEXT;
  child_birthdate DATE;
  child_age_years INTEGER;
  matching_range RECORD;
BEGIN
  -- Skip if not completed
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  -- Determine age group
  SELECT date_of_birth INTO child_birthdate FROM children WHERE id = NEW.child_id;
  child_age_years := EXTRACT(YEAR FROM age(current_date, child_birthdate));
  
  IF child_age_years BETWEEN 0 AND 3 THEN
    assessment_age_group := '0-3';
  ELSIF child_age_years BETWEEN 4 AND 7 THEN
    assessment_age_group := '4-7';
  ELSIF child_age_years BETWEEN 8 AND 12 THEN
    assessment_age_group := '8-12';
  ELSE
    assessment_age_group := '13-18';
  END IF;

  -- Count yes answers (accounting for reverse scored questions)
  SELECT 
    COUNT(*), 
    SUM(CASE 
      WHEN (q.is_reverse_scored = true AND r.answer = 'no') OR 
           (q.is_reverse_scored = false AND r.answer = 'yes') 
      THEN 1 ELSE 0 
    END)
  INTO total_questions, total_yes
  FROM responses r
  JOIN questions q ON r.question_id = q.id
  WHERE r.assessment_id = NEW.id
    AND q.age_group = assessment_age_group;

  -- Calculate score
  NEW.score := total_yes;
  
  -- Determine risk level
  SELECT * INTO matching_range 
  FROM scoring_ranges 
  WHERE age_group = assessment_age_group
    AND NEW.score BETWEEN min_score AND max_score
  LIMIT 1;
  
  IF matching_range.id IS NOT NULL THEN
    NEW.risk_level := matching_range.risk_category;
  ELSE
    NEW.risk_level := 'inconclusive';
  END IF;
  
  -- Set completion time
  NEW.completed_at := timezone('utc'::text, now());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CREATE TRIGGERS
-- Create user profile trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Email confirmation trigger
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_email_confirmation();

-- Assessment scoring trigger
DROP TRIGGER IF EXISTS on_assessment_completed ON public.assessments;
CREATE TRIGGER on_assessment_completed
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW
  WHEN (OLD.status = 'in_progress' AND NEW.status = 'completed')
  EXECUTE FUNCTION public.calculate_assessment_score();

-- 7. ROW LEVEL SECURITY
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

-- Attempt to enable RLS on postgres_version if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'postgres_version'
  ) THEN
    EXECUTE 'ALTER TABLE public.postgres_version ENABLE ROW LEVEL SECURITY';
  END IF;
END
$$;

-- 8. POLICIES
-- Profiles
CREATE POLICY IF NOT EXISTS "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Children
CREATE POLICY IF NOT EXISTS "Users can view their own children"
  ON children FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own children"
  ON children FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY IF NOT EXISTS "Users can update their own children"
  ON children FOR UPDATE
  USING (auth.uid() = parent_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own children"
  ON children FOR DELETE
  USING (auth.uid() = parent_id);

-- Questions
CREATE POLICY IF NOT EXISTS "Questions are viewable by all authenticated users"
  ON questions FOR SELECT
  USING (auth.role() = 'authenticated');

-- Scoring Ranges
CREATE POLICY IF NOT EXISTS "Scoring ranges are viewable by all authenticated users"
  ON scoring_ranges FOR SELECT
  USING (auth.role() = 'authenticated');

-- Assessments
CREATE POLICY IF NOT EXISTS "Users can view their children's assessments"
  ON assessments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM children
    WHERE children.id = assessments.child_id
    AND children.parent_id = auth.uid()
  ));

CREATE POLICY IF NOT EXISTS "Users can insert assessments for their children"
  ON assessments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM children
    WHERE children.id = assessments.child_id
    AND children.parent_id = auth.uid()
  ));

CREATE POLICY IF NOT EXISTS "Users can update their children's assessments"
  ON assessments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM children
    WHERE children.id = assessments.child_id
    AND children.parent_id = auth.uid()
  ));

-- Responses
CREATE POLICY IF NOT EXISTS "Users can view their children's responses"
  ON responses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM assessments
    JOIN children ON children.id = assessments.child_id
    WHERE assessments.id = responses.assessment_id
    AND children.parent_id = auth.uid()
  ));

CREATE POLICY IF NOT EXISTS "Users can insert responses for their children's assessments"
  ON responses FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM assessments
    JOIN children ON children.id = assessments.child_id
    WHERE assessments.id = responses.assessment_id
    AND children.parent_id = auth.uid()
  ));

-- Saved Locations
CREATE POLICY IF NOT EXISTS "Users can view their saved locations"
  ON saved_locations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their saved locations"
  ON saved_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their saved locations"
  ON saved_locations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their saved locations"
  ON saved_locations FOR DELETE
  USING (auth.uid() = user_id);

-- Postgres_version (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'postgres_version'
  ) THEN
    EXECUTE 'CREATE POLICY IF NOT EXISTS "Postgres version info viewable by authenticated users" ON public.postgres_version FOR SELECT USING (auth.role() = ''authenticated'')';
  END IF;
END
$$;

-- 9. SAMPLE DATA
-- Insert sample questions (if table is empty)
INSERT INTO questions (category, text, age_group, order_number, is_reverse_scored)
SELECT * FROM (
  VALUES
    ('Social', 'Does your child maintain eye contact during interactions?', '0-3', 1, true),
    ('Social', 'Does your child respond to their name when called?', '0-3', 2, true),
    ('Communication', 'Does your child point to objects to show interest?', '0-3', 3, true),
    ('Communication', 'Does your child use gestures like waving bye-bye?', '0-3', 4, true),
    ('Behavior', 'Does your child engage in repetitive behaviors like rocking or hand-flapping?', '0-3', 5, false),
    ('Behavior', 'Does your child show unusual sensitivity to certain sounds, textures, or lights?', '0-3', 6, false),
    ('Social', 'Does your child enjoy playing with other children?', '4-7', 1, true),
    ('Social', 'Can your child understand and follow social rules in games?', '4-7', 2, true),
    ('Communication', 'Can your child carry on a back-and-forth conversation?', '4-7', 3, true),
    ('Communication', 'Does your child use language in a creative or flexible way?', '4-7', 4, true),
    ('Behavior', 'Does your child have intense interests in specific topics?', '4-7', 5, false),
    ('Behavior', 'Does your child insist on specific routines or rituals?', '4-7', 6, false),
    
    -- Add questions for older age groups
    ('Social', 'Does your child form friendships with peers?', '8-12', 1, true),
    ('Social', 'Is your child able to understand non-literal language and jokes?', '8-12', 2, true),
    ('Communication', 'Can your child maintain appropriate conversation on various topics?', '8-12', 3, true),
    ('Communication', 'Does your child express emotions appropriately?', '8-12', 4, true),
    ('Behavior', 'Does your child have obsessive interests in specific topics?', '8-12', 5, false),
    ('Behavior', 'Does your child become unusually upset with changes in routine?', '8-12', 6, false),
    
    ('Social', 'Can your teen maintain friendships and social relationships?', '13-18', 1, true),
    ('Social', 'Does your teen understand complex social cues and situations?', '13-18', 2, true),
    ('Communication', 'Can your teen engage in abstract or hypothetical discussions?', '13-18', 3, true),
    ('Communication', 'Does your teen adapt communication style to different social contexts?', '13-18', 4, true),
    ('Behavior', 'Does your teen exhibit rigid thinking or extreme black-and-white views?', '13-18', 5, false),
    ('Behavior', 'Does your teen show excessive anxiety over unexpected changes?', '13-18', 6, false)
) AS values_to_insert
WHERE NOT EXISTS (SELECT 1 FROM questions LIMIT 1);

-- Insert sample scoring ranges (if table is empty)
INSERT INTO scoring_ranges (min_score, max_score, percentage_range, risk_category, interpretation, age_group)
SELECT * FROM (
  VALUES
    (0, 2, '0-33%', 'low', 'No significant concerns detected. Continue to monitor development.', '0-3'),
    (3, 4, '34-66%', 'medium', 'Some behaviors of concern detected. Consider consulting with a healthcare provider.', '0-3'),
    (5, 6, '67-100%', 'high', 'Multiple behaviors of concern detected. Strongly recommend professional evaluation.', '0-3'),
    
    (0, 2, '0-33%', 'low', 'No significant concerns detected. Continue to monitor development.', '4-7'),
    (3, 4, '34-66%', 'medium', 'Some behaviors of concern detected. Consider consulting with a healthcare provider.', '4-7'),
    (5, 6, '67-100%', 'high', 'Multiple behaviors of concern detected. Strongly recommend professional evaluation.', '4-7'),
    
    (0, 2, '0-33%', 'low', 'No significant concerns detected. Continue to monitor development.', '8-12'),
    (3, 4, '34-66%', 'medium', 'Some behaviors of concern detected. Consider consulting with a healthcare provider.', '8-12'),
    (5, 6, '67-100%', 'high', 'Multiple behaviors of concern detected. Strongly recommend professional evaluation.', '8-12'),
    
    (0, 2, '0-33%', 'low', 'No significant concerns detected. Continue to monitor development.', '13-18'),
    (3, 4, '34-66%', 'medium', 'Some behaviors of concern detected. Consider consulting with a healthcare provider.', '13-18'),
    (5, 6, '67-100%', 'high', 'Multiple behaviors of concern detected. Strongly recommend professional evaluation.', '13-18')
) AS values_to_insert
WHERE NOT EXISTS (SELECT 1 FROM scoring_ranges LIMIT 1); 