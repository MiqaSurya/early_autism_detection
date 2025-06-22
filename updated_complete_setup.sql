-- COMPREHENSIVE DATABASE SETUP WITH FIXED USER STATISTICS
-- This script fixes the issues with user_statistics and provides a comprehensive setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CORE TABLES
-- User profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  notification_preferences JSONB DEFAULT '{"email": true, "push": false}'::jsonb,
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
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. ASSESSMENT SYSTEM
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

-- 3. LOCATION SYSTEM
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

-- 4. ADDITIONAL FEATURES
-- Email templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Assessment history for tracking changes
CREATE TABLE IF NOT EXISTS public.assessment_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assessment_id UUID REFERENCES assessments(id) NOT NULL,
  status TEXT,
  score INT,
  risk_level TEXT,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Recommendations based on assessment results
CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'inconclusive')),
  age_group TEXT NOT NULL CHECK (age_group IN ('0-3', '4-7', '8-12', '13-18')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  resource_links JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. USER VERIFICATION
-- Verification requests tracking
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  document_urls JSONB,
  reviewer_notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Create a partial unique index instead of the WHERE clause in the table definition
CREATE UNIQUE INDEX IF NOT EXISTS verification_requests_pending_user_idx 
  ON public.verification_requests (user_id) 
  WHERE status = 'pending';

-- 6. NOTIFICATION SYSTEM
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('assessment', 'system', 'reminder')),
  read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. TRIGGERS & FUNCTIONS
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

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update email verified status when email is confirmed
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.profiles
    SET email_verified = TRUE
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for email confirmations
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION public.handle_email_confirmation();

-- Track assessment history
CREATE OR REPLACE FUNCTION public.track_assessment_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO assessment_history (
    assessment_id, status, score, risk_level, changed_by
  ) VALUES (
    NEW.id, NEW.status, NEW.score, NEW.risk_level, auth.uid()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for assessment updates
DROP TRIGGER IF EXISTS on_assessment_updated ON public.assessments;
CREATE TRIGGER on_assessment_updated
  AFTER UPDATE ON public.assessments
  FOR EACH ROW
  WHEN (OLD.status != NEW.status OR OLD.score != NEW.score OR OLD.risk_level != NEW.risk_level)
  EXECUTE FUNCTION public.track_assessment_history();

-- 8. USER STATISTICS FUNCTION INSTEAD OF VIEW
-- Create a secure function to access user statistics (avoiding view policy issues)
CREATE OR REPLACE FUNCTION public.get_user_statistics(target_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  children_count BIGINT,
  assessments_count BIGINT,
  completed_assessments BIGINT,
  saved_locations_count BIGINT,
  first_child_added TIMESTAMP WITH TIME ZONE,
  last_assessment_completed TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  viewing_user_id UUID;
BEGIN
  -- Get the current user ID
  viewing_user_id := auth.uid();
  
  -- If no target_user_id is provided, use the current user
  IF target_user_id IS NULL THEN
    target_user_id := viewing_user_id;
  END IF;
  
  -- Only allow users to view their own statistics unless they have admin role
  IF viewing_user_id = target_user_id OR EXISTS (
    SELECT 1 FROM auth.users WHERE id = viewing_user_id AND raw_app_meta_data->>'role' = 'admin'
  ) THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.display_name,
      COUNT(DISTINCT c.id)::BIGINT as children_count,
      COUNT(DISTINCT a.id)::BIGINT as assessments_count,
      COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END)::BIGINT as completed_assessments,
      COUNT(DISTINCT sl.id)::BIGINT as saved_locations_count,
      MIN(c.created_at) as first_child_added,
      MAX(a.completed_at) as last_assessment_completed
    FROM 
      profiles p
    LEFT JOIN children c ON p.id = c.parent_id
    LEFT JOIN assessments a ON c.id = a.child_id
    LEFT JOIN saved_locations sl ON p.id = sl.user_id
    WHERE p.id = target_user_id
    GROUP BY p.id, p.display_name;
  ELSE
    RAISE EXCEPTION 'Access denied: You can only view your own statistics';
  END IF;
END;
$$;

COMMENT ON FUNCTION get_user_statistics IS 'Provides aggregate statistics on user activity in the application';

-- Add additional useful functions
-- Function to get assessment counts by risk level
CREATE OR REPLACE FUNCTION public.get_assessment_counts_by_risk(user_id UUID)
RETURNS TABLE (risk_level TEXT, count BIGINT) 
LANGUAGE SQL SECURITY DEFINER
AS $$
  SELECT 
    a.risk_level, 
    COUNT(*) as count
  FROM assessments a
  JOIN children c ON a.child_id = c.id
  WHERE c.parent_id = user_id
  AND a.status = 'completed'
  GROUP BY a.risk_level
  ORDER BY 
    CASE a.risk_level
      WHEN 'low' THEN 1
      WHEN 'medium' THEN 2
      WHEN 'high' THEN 3
      WHEN 'inconclusive' THEN 4
      ELSE 5
    END;
$$;

-- Function to get assessment history for a child
CREATE OR REPLACE FUNCTION public.get_child_assessment_history(child_uuid UUID)
RETURNS TABLE (
  assessment_id UUID,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  score INT,
  risk_level TEXT
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  parent_id UUID;
BEGIN
  -- Get the parent ID of the child
  SELECT c.parent_id INTO parent_id
  FROM children c
  WHERE c.id = child_uuid;
  
  -- Only allow the parent to view their child's assessment history
  IF parent_id = auth.uid() THEN
    RETURN QUERY
    SELECT 
      a.id,
      a.started_at,
      a.completed_at,
      a.score,
      a.risk_level
    FROM assessments a
    WHERE a.child_id = child_uuid
    ORDER BY a.started_at DESC;
  ELSE
    RAISE EXCEPTION 'Access denied: You can only view your own children''s assessments';
  END IF;
END;
$$;

-- 9. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 10. POLICY CREATION
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

-- Email Templates
CREATE POLICY "Email templates are viewable by all authenticated users"
  ON email_templates FOR SELECT
  USING (auth.role() = 'authenticated');

-- Assessment History
CREATE POLICY "Users can view history for their children's assessments"
  ON assessment_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM assessments
    JOIN children ON children.id = assessments.child_id
    WHERE assessments.id = assessment_history.assessment_id
    AND children.parent_id = auth.uid()
  ));

-- Recommendations
CREATE POLICY "Recommendations are viewable by all authenticated users"
  ON recommendations FOR SELECT
  USING (auth.role() = 'authenticated');

-- Verification Requests
CREATE POLICY "Users can view their own verification requests"
  ON verification_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verification requests"
  ON verification_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id AND (OLD.read IS DISTINCT FROM NEW.read));

-- 11. SAMPLE DATA
-- Insert sample questions (if table is empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM questions LIMIT 1) THEN
    INSERT INTO questions (category, text, age_group, order_number, is_reverse_scored)
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
      ('Behavior', 'Does your teen show excessive anxiety over unexpected changes?', '13-18', 6, false);
  END IF;
END
$$;

-- Insert sample scoring ranges (if table is empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM scoring_ranges LIMIT 1) THEN
    INSERT INTO scoring_ranges (min_score, max_score, percentage_range, risk_category, interpretation, age_group)
    VALUES
      (0, 2, '0-33%', 'low', 'No significant concerns detected', '0-3'),
      (3, 4, '34-66%', 'medium', 'Some behaviors of concern detected', '0-3'),
      (5, 6, '67-100%', 'high', 'Multiple behaviors of concern detected', '0-3'),
      (0, 2, '0-33%', 'low', 'No significant concerns detected', '4-7'),
      (3, 4, '34-66%', 'medium', 'Some behaviors of concern detected', '4-7'),
      (5, 6, '67-100%', 'high', 'Multiple behaviors of concern detected', '4-7'),
      (0, 2, '0-33%', 'low', 'No significant concerns detected', '8-12'),
      (3, 4, '34-66%', 'medium', 'Some behaviors of concern detected', '8-12'),
      (5, 6, '67-100%', 'high', 'Multiple behaviors of concern detected', '8-12'),
      (0, 2, '0-33%', 'low', 'No significant concerns detected', '13-18'),
      (3, 4, '34-66%', 'medium', 'Some behaviors of concern detected', '13-18'),
      (5, 6, '67-100%', 'high', 'Multiple behaviors of concern detected', '13-18');
  END IF;
END
$$;

-- Insert sample recommendations (if table is empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM recommendations LIMIT 1) THEN
    INSERT INTO recommendations (risk_level, age_group, title, description, resource_links)
    VALUES
      ('low', '0-3', 'Continue Monitoring Development', 
       'While no significant concerns were detected, continue to monitor your child''s development.', 
       '{"websites": ["cdc.gov/milestones"], "activities": ["Reading together", "Interactive play"]}'::jsonb),
       
      ('medium', '0-3', 'Consider Developmental Screening', 
       'Some behaviors of concern were detected. Consider discussing with your pediatrician.', 
       '{"specialists": ["Pediatrician", "Early Intervention"], "screening_tools": ["ASQ", "M-CHAT"]}'::jsonb),
       
      ('high', '0-3', 'Seek Professional Evaluation', 
       'Multiple behaviors of concern were detected. A professional evaluation is recommended.', 
       '{"specialists": ["Developmental Pediatrician", "Child Psychologist"], "resources": ["Early Intervention Services"]}'::jsonb),
       
      ('low', '4-7', 'Support Social Development', 
       'Continue supporting your child''s social development through peer interaction.', 
       '{"activities": ["Playgroups", "Team sports"], "books": ["Social skills stories"]}'::jsonb),
       
      ('medium', '4-7', 'Skills-Focused Support', 
       'Some behaviors of concern were detected. Consider focused support for specific skills.', 
       '{"specialists": ["School Counselor", "Speech Therapist"], "resources": ["Social skills groups"]}'::jsonb),
       
      ('high', '4-7', 'Comprehensive Evaluation', 
       'A comprehensive evaluation by specialists is recommended.', 
       '{"specialists": ["Child Psychologist", "Developmental Pediatrician"], "resources": ["IEP Information", "School-based services"]}'::jsonb);
  END IF;
END
$$;

-- Sample email templates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM email_templates LIMIT 1) THEN
    INSERT INTO email_templates (name, subject, body)
    VALUES
      ('welcome', 'Welcome to Early Autism Detector', 
       'Dear {{name}},\n\nWelcome to Early Autism Detector! We''re here to support you on your journey.\n\nGet started by adding your child''s profile and taking your first assessment.\n\nRegards,\nThe Early Autism Detector Team'),
       
      ('assessment_complete', 'Assessment Results Available', 
       'Dear {{name}},\n\nYour assessment for {{child_name}} has been processed and results are now available.\n\nPlease log in to view the results and recommendations.\n\nRegards,\nThe Early Autism Detector Team'),
       
      ('verification_approved', 'Your Account Has Been Verified', 
       'Dear {{name}},\n\nWe''re pleased to inform you that your account verification has been approved.\n\nYou now have access to all verified user features.\n\nRegards,\nThe Early Autism Detector Team');
  END IF;
END
$$; 