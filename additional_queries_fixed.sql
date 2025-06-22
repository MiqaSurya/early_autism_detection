-- ADDITIONAL QUERIES FOR SUPABASE
-- These queries provide additional functionality for reporting and user management

-- 1. USER STATISTICS VIEW
CREATE OR REPLACE VIEW public.user_statistics AS
SELECT 
  p.id as user_id,
  p.display_name,
  COUNT(DISTINCT c.id) as children_count,
  COUNT(DISTINCT a.id) as assessments_count,
  COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_assessments,
  COUNT(DISTINCT sl.id) as saved_locations_count,
  MIN(c.created_at) as first_child_added,
  MAX(a.completed_at) as last_assessment_completed
FROM 
  profiles p
LEFT JOIN children c ON p.id = c.parent_id
LEFT JOIN assessments a ON c.id = a.child_id
LEFT JOIN saved_locations sl ON p.id = sl.user_id
GROUP BY p.id, p.display_name;

COMMENT ON VIEW public.user_statistics IS 'Provides aggregate statistics on user activity in the application';

-- Create policy for user statistics (users can only see their own stats)
CREATE POLICY "Users can view only their own statistics"
  ON user_statistics FOR SELECT
  USING (auth.uid() = user_id);

COMMIT;

-- 2. ASSESSMENT RECOMMENDATIONS FUNCTION
CREATE OR REPLACE FUNCTION public.get_recommendations_for_assessment(assessment_id UUID)
RETURNS TABLE (
  recommendation_id UUID,
  title TEXT,
  description TEXT,
  resource_links JSONB
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  assessment_record RECORD;
  child_record RECORD;
  child_age_years INTEGER;
  age_group TEXT;
BEGIN
  -- Get the assessment details
  SELECT * INTO assessment_record
  FROM assessments
  WHERE id = assessment_id;
  
  IF assessment_record.id IS NULL THEN
    RAISE EXCEPTION 'Assessment with ID % not found', assessment_id;
  END IF;
  
  -- Get the child details
  SELECT * INTO child_record
  FROM children
  WHERE id = assessment_record.child_id;
  
  -- Calculate age group
  child_age_years := EXTRACT(YEAR FROM age(current_date, child_record.date_of_birth));
  
  IF child_age_years BETWEEN 0 AND 3 THEN
    age_group := '0-3';
  ELSIF child_age_years BETWEEN 4 AND 7 THEN
    age_group := '4-7';
  ELSIF child_age_years BETWEEN 8 AND 12 THEN
    age_group := '8-12';
  ELSE
    age_group := '13-18';
  END IF;
  
  -- Return matching recommendations
  RETURN QUERY
  SELECT 
    r.id as recommendation_id,
    r.title,
    r.description,
    r.resource_links
  FROM recommendations r
  WHERE r.risk_level = assessment_record.risk_level
  AND r.age_group = age_group;
END;
$$;

COMMIT;

-- 3. CHILDREN AGE DISTRIBUTION FUNCTION
CREATE OR REPLACE FUNCTION public.get_children_age_distribution(user_id UUID)
RETURNS TABLE (
  age_group TEXT,
  count BIGINT
) 
LANGUAGE SQL SECURITY DEFINER
AS $$
  SELECT
    CASE
      WHEN EXTRACT(YEAR FROM age(current_date, date_of_birth)) BETWEEN 0 AND 3 THEN '0-3'
      WHEN EXTRACT(YEAR FROM age(current_date, date_of_birth)) BETWEEN 4 AND 7 THEN '4-7'
      WHEN EXTRACT(YEAR FROM age(current_date, date_of_birth)) BETWEEN 8 AND 12 THEN '8-12'
      ELSE '13-18'
    END as age_group,
    COUNT(*) as count
  FROM children
  WHERE parent_id = user_id
  GROUP BY age_group
  ORDER BY 
    CASE age_group
      WHEN '0-3' THEN 1
      WHEN '4-7' THEN 2
      WHEN '8-12' THEN 3
      WHEN '13-18' THEN 4
      ELSE 5
    END;
$$;

COMMIT;

-- 4. USER VERIFICATION TRACKING
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  email TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  notes TEXT
);

COMMIT;

-- Enable RLS on verification requests
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for verification requests
CREATE POLICY "Users can view their own verification requests"
  ON verification_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verification requests"
  ON verification_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMIT;

-- Function to process verification request
CREATE OR REPLACE FUNCTION public.process_verification_request(
  request_id UUID,
  new_status TEXT,
  admin_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  request_record RECORD;
BEGIN
  -- Validate status
  IF new_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status. Must be "approved" or "rejected"';
  END IF;
  
  -- Get the request
  SELECT * INTO request_record
  FROM verification_requests
  WHERE id = request_id
  AND status = 'pending';
  
  IF request_record.id IS NULL THEN
    RAISE EXCEPTION 'Pending verification request with ID % not found', request_id;
  END IF;
  
  -- Update the request
  UPDATE verification_requests
  SET 
    status = new_status,
    processed_at = NOW(),
    processed_by = auth.uid(),
    notes = admin_notes
  WHERE id = request_id;
  
  -- If approved, verify the user
  IF new_status = 'approved' THEN
    -- Update auth.users
    UPDATE auth.users
    SET email_confirmed_at = NOW()
    WHERE id = request_record.user_id
    AND email_confirmed_at IS NULL;
    
    -- Update profile
    UPDATE profiles
    SET email_verified = TRUE
    WHERE id = request_record.user_id
    AND email_verified = FALSE;
  END IF;
END;
$$;

COMMIT;

-- 5. ADD NOTIFICATION SYSTEM
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  link TEXT
);

COMMIT;

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

COMMIT;

-- Function to create assessment completion notification
CREATE OR REPLACE FUNCTION public.create_assessment_completion_notification()
RETURNS TRIGGER AS $$
DECLARE
  child_name TEXT;
  parent_id UUID;
  notification_message TEXT;
  risk_interpretation TEXT;
BEGIN
  -- Skip if not newly completed
  IF OLD.status = 'completed' OR NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;
  
  -- Get child info
  SELECT c.name, c.parent_id INTO child_name, parent_id
  FROM children c
  WHERE c.id = NEW.child_id;
  
  -- Determine message based on risk level
  CASE NEW.risk_level
    WHEN 'low' THEN risk_interpretation := 'showing low risk indicators';
    WHEN 'medium' THEN risk_interpretation := 'showing some risk indicators that may need attention';
    WHEN 'high' THEN risk_interpretation := 'showing high risk indicators that should be evaluated by a professional';
    ELSE risk_interpretation := 'with inconclusive results';
  END CASE;
  
  notification_message := 'Assessment for ' || child_name || ' has been completed ' || risk_interpretation || '.';
  
  -- Create notification
  INSERT INTO notifications (
    user_id, 
    title, 
    message, 
    link
  ) VALUES (
    parent_id,
    'Assessment Completed',
    notification_message,
    '/assessments/' || NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for assessment completion notifications
DROP TRIGGER IF EXISTS on_assessment_completion_notification ON public.assessments;
CREATE TRIGGER on_assessment_completion_notification
  AFTER UPDATE ON public.assessments
  FOR EACH ROW
  WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
  EXECUTE FUNCTION public.create_assessment_completion_notification();

COMMIT; 