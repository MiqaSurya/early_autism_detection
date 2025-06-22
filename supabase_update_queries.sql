-- SUPABASE UPDATE QUERIES
-- This file contains queries to update or extend the existing database schema

-- 1. ADD EMAIL TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

COMMIT;

-- Enable RLS on the new table
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for email templates (admin only)
CREATE POLICY "Email templates are viewable by authenticated users"
  ON email_templates FOR SELECT
  USING (auth.role() = 'authenticated');

COMMIT;

-- 2. EXPAND CHILDREN TABLE WITH ADDITIONAL FIELDS
ALTER TABLE public.children 
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS additional_notes TEXT,
  ADD COLUMN IF NOT EXISTS has_diagnosis BOOLEAN DEFAULT FALSE;

COMMIT;

-- 3. ADD ASSESSMENT HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.assessment_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assessment_id UUID REFERENCES assessments(id) NOT NULL,
  status TEXT NOT NULL,
  score INT,
  risk_level TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  changed_by UUID REFERENCES auth.users(id) NOT NULL
);

COMMIT;

-- Enable RLS on the history table
ALTER TABLE public.assessment_history ENABLE ROW LEVEL SECURITY;

-- Create policies for assessment history
CREATE POLICY "Users can view history of their children's assessments"
  ON assessment_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM assessments
    JOIN children ON children.id = assessments.child_id
    WHERE assessments.id = assessment_history.assessment_id
    AND children.parent_id = auth.uid()
  ));

COMMIT;

-- 4. CREATE TRIGGER TO TRACK ASSESSMENT HISTORY
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

COMMIT;

-- 5. ADD A RECOMMENDATIONS TABLE
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

COMMIT;

-- Enable RLS on recommendations
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Create policy for recommendations
CREATE POLICY "Recommendations are viewable by all authenticated users"
  ON recommendations FOR SELECT
  USING (auth.role() = 'authenticated');

COMMIT;

-- 6. POPULATE SAMPLE RECOMMENDATIONS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM recommendations LIMIT 1) THEN
    INSERT INTO recommendations (risk_level, age_group, title, description, resource_links)
    VALUES
      ('low', '0-3', 'Continue Development Monitoring', 
       'While there are no significant concerns at this time, continue to monitor your child''s development and engage in activities that promote social interaction.', 
       '{"websites": ["https://www.cdc.gov/ncbddd/actearly/milestones/index.html"], "books": ["The Whole-Brain Child"]}'::jsonb),
      
      ('medium', '0-3', 'Consider Professional Assessment', 
       'Some behaviors may indicate potential developmental concerns. Consider discussing with your pediatrician for further evaluation.', 
       '{"websites": ["https://www.autismspeaks.org/screen-your-child"], "specialists": ["Developmental Pediatrician", "Early Intervention Programs"]}'::jsonb),
      
      ('high', '0-3', 'Seek Professional Evaluation', 
       'Multiple indicators suggest your child would benefit from professional evaluation. Early intervention is key for the best developmental outcomes.', 
       '{"websites": ["https://www.autismspeaks.org/tool-kit/100-day-kit-young-children"], "specialists": ["Developmental Pediatrician", "Child Psychologist", "Speech Therapist"]}'::jsonb),
      
      ('low', '4-7', 'Support Social Skills', 
       'Continue supporting your child''s development with structured social activities and playdates to build on their existing skills.', 
       '{"activities": ["Structured playdates", "Team sports"], "books": ["How to Talk So Kids Will Listen & Listen So Kids Will Talk"]}'::jsonb),
       
      ('medium', '4-7', 'Consider Social Skills Support', 
       'Your child may benefit from additional support in developing social and communication skills. Consider speaking with school counselors or child psychologists.', 
       '{"specialists": ["School Counselor", "Speech Therapist"], "activities": ["Social skills groups"]}'::jsonb),
       
      ('high', '4-7', 'Comprehensive Evaluation Recommended', 
       'A comprehensive evaluation by specialists would be beneficial to identify specific challenges and appropriate interventions for your child.', 
       '{"specialists": ["Child Psychologist", "Occupational Therapist"], "resources": ["School IEP or 504 Plan information"]}'::jsonb),
      
      ('low', '8-12', 'Foster Emotional Intelligence', 
       'Continue supporting your child''s emotional and social development through activities that promote understanding emotions and social cues.', 
       '{"activities": ["Emotion-focused discussions", "Cooperative games"], "books": ["The Social Skills Picture Book"]}'::jsonb),
       
      ('medium', '8-12', 'Target Specific Social Challenges', 
       'Working with school counselors or therapists on specific social challenges can help your child develop strategies for success.', 
       '{"specialists": ["School Psychologist", "Cognitive Behavioral Therapist"], "groups": ["Social skills training groups"]}'::jsonb),
       
      ('high', '8-12', 'Multi-disciplinary Support Approach', 
       'A team-based approach involving school, home, and specialists can help address the complex challenges your child may be experiencing.', 
       '{"specialists": ["Developmental Pediatrician", "Child Psychologist", "School Support Team"], "accommodations": ["Classroom accommodations", "Structured social opportunities"]}'::jsonb),
      
      ('low', '13-18', 'Support Independence and Social Navigation', 
       'Focus on helping your teen navigate increasingly complex social situations and develop independence skills.', 
       '{"activities": ["Peer mentoring", "Interest-based groups"], "books": ["The Teenage Brain"]}'::jsonb),
       
      ('medium', '13-18', 'Targeted Skill Development', 
       'Working with specialists on specific challenges can help your teen develop strategies for social success and emotional regulation.', 
       '{"specialists": ["Adolescent Psychologist", "School Counselor"], "resources": ["Transition planning resources"]}'::jsonb),
       
      ('high', '13-18', 'Comprehensive Support and Planning', 
       'A comprehensive approach including therapy, school accommodations, and transition planning will support your teen''s current and future needs.', 
       '{"specialists": ["Adolescent Psychologist", "Occupational Therapist"], "planning": ["Transition planning", "Life skills development resources"]}'::jsonb);
  END IF;
END
$$;

COMMIT;

-- 7. ADD NEW FUNCTIONS FOR ANALYTICS

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
LANGUAGE SQL SECURITY DEFINER
AS $$
  SELECT 
    id as assessment_id,
    started_at,
    completed_at,
    score,
    risk_level
  FROM assessments
  WHERE child_id = child_uuid
  AND status = 'completed'
  ORDER BY completed_at DESC;
$$;

COMMIT;

-- 8. IMPROVE EMAIL VERIFICATION MANAGEMENT

-- Add function to manually verify a user's email
CREATE OR REPLACE FUNCTION public.manually_verify_user_email(user_email TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the user ID
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Update auth.users to mark email as confirmed
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = user_id
  AND email_confirmed_at IS NULL;
  
  -- Update profiles to mark email as verified
  UPDATE public.profiles
  SET email_verified = TRUE
  WHERE id = user_id
  AND email_verified = FALSE;
END;
$$;

COMMIT; 