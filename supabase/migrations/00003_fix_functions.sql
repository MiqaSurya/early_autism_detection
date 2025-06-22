-- Drop all existing functions first
DO $$ 
DECLARE 
  func_name text;
BEGIN 
  FOR func_name IN (
    SELECT 'public.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')'
    FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public'
    AND p.proname IN (
      'update_modified_column',
      'handle_email_confirmation',
      'get_assessment_counts_by_risk',
      'get_user_statistics',
      'get_child_assessment_history',
      'track_assessment_history',
      'get_children_age_distribution',
      'manually_verify_user_email',
      'get_recommendations_for_assessment',
      'update_assessment_score',
      'handle_new_user',
      'calculate_assessment_score'
    )
  )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || func_name || ' CASCADE;';
  END LOOP;
END $$;

-- Create functions with proper search paths and security settings

CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.profiles
    SET email_verified = TRUE
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_assessment_counts_by_risk(user_id UUID)
RETURNS TABLE (risk_level TEXT, count BIGINT)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(a.risk_level, 'inconclusive') as risk_level,
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  viewing_user_id UUID;
BEGIN
  viewing_user_id := auth.uid();
  IF target_user_id IS NULL THEN
    target_user_id := viewing_user_id;
  END IF;
  
  IF viewing_user_id = target_user_id OR EXISTS (
    SELECT 1 FROM auth.users WHERE id = viewing_user_id AND raw_app_meta_data->>'role' = 'admin'
  ) THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.display_name,
      COUNT(DISTINCT c.id)::BIGINT,
      COUNT(DISTINCT a.id)::BIGINT,
      COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END)::BIGINT,
      COUNT(DISTINCT sl.id)::BIGINT,
      MIN(c.created_at),
      MAX(a.completed_at)
    FROM profiles p
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

CREATE OR REPLACE FUNCTION public.get_child_assessment_history(child_uuid UUID)
RETURNS TABLE (
  assessment_id UUID,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  score INT,
  risk_level TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_id UUID;
BEGIN
  SELECT c.parent_id INTO parent_id
  FROM children c
  WHERE c.id = child_uuid;
  
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

CREATE OR REPLACE FUNCTION public.track_assessment_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO assessment_history (
    assessment_id, status, score, risk_level, changed_by
  ) VALUES (
    NEW.id, NEW.status, NEW.score, NEW.risk_level, auth.uid()
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_children_age_distribution(user_id UUID)
RETURNS TABLE (age_group TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN age < 4 THEN '0-3'
      WHEN age < 8 THEN '4-7'
      WHEN age < 13 THEN '8-12'
      ELSE '13-18'
    END as age_group,
    COUNT(*) as count
  FROM (
    SELECT EXTRACT(YEAR FROM age(date_of_birth)) as age
    FROM children
    WHERE parent_id = user_id
  ) age_calc
  GROUP BY age_group
  ORDER BY age_group;
END;
$$;

CREATE OR REPLACE FUNCTION public.manually_verify_user_email(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_app_meta_data->>'role' = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can manually verify emails';
  END IF;

  UPDATE profiles
  SET email_verified = TRUE,
      updated_at = NOW()
  WHERE id = target_user_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_recommendations_for_assessment(assessment_id UUID)
RETURNS TABLE (
  title TEXT,
  description TEXT,
  resource_links JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_risk_level TEXT;
  v_age_group TEXT;
  v_parent_id UUID;
BEGIN
  SELECT 
    a.risk_level,
    CASE 
      WHEN EXTRACT(YEAR FROM age(c.date_of_birth)) < 4 THEN '0-3'
      WHEN EXTRACT(YEAR FROM age(c.date_of_birth)) < 8 THEN '4-7'
      WHEN EXTRACT(YEAR FROM age(c.date_of_birth)) < 13 THEN '8-12'
      ELSE '13-18'
    END,
    c.parent_id
  INTO v_risk_level, v_age_group, v_parent_id
  FROM assessments a
  JOIN children c ON a.child_id = c.id
  WHERE a.id = assessment_id;

  IF v_parent_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: You can only view recommendations for your own assessments';
  END IF;

  RETURN QUERY
  SELECT r.title, r.description, r.resource_links
  FROM recommendations r
  WHERE r.risk_level = v_risk_level
  AND r.age_group = v_age_group;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_assessment_score(assessment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score INT;
  v_risk_level TEXT;
  v_parent_id UUID;
BEGIN
  SELECT c.parent_id INTO v_parent_id
  FROM assessments a
  JOIN children c ON a.child_id = c.id
  WHERE a.id = assessment_id;

  IF v_parent_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: You can only update your own assessments';
  END IF;

  SELECT COUNT(*) INTO v_score
  FROM responses r
  WHERE r.assessment_id = assessment_id
  AND r.answer = 'yes';

  SELECT risk_category INTO v_risk_level
  FROM scoring_ranges sr
  WHERE v_score BETWEEN sr.min_score AND sr.max_score;

  UPDATE assessments
  SET score = v_score,
      risk_level = v_risk_level,
      updated_at = NOW()
  WHERE id = assessment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, display_name, email_verified)
  VALUES (
    NEW.id,
    split_part(NEW.email, '@', 1),
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN TRUE ELSE FALSE END
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_assessment_score(assessment_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score INT;
  v_parent_id UUID;
BEGIN
  SELECT c.parent_id INTO v_parent_id
  FROM assessments a
  JOIN children c ON a.child_id = c.id
  WHERE a.id = assessment_id;

  IF v_parent_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: You can only calculate scores for your own assessments';
  END IF;

  SELECT COUNT(*) INTO v_score
  FROM responses r
  JOIN questions q ON r.question_id = q.id
  WHERE r.assessment_id = assessment_id
  AND (
    (r.answer = 'yes' AND NOT q.is_reverse_scored) OR
    (r.answer = 'no' AND q.is_reverse_scored)
  );

  RETURN v_score;
END;
$$;

-- Recreate all triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION public.handle_email_confirmation();

DROP TRIGGER IF EXISTS on_assessment_updated ON public.assessments;
CREATE TRIGGER on_assessment_updated
  AFTER UPDATE ON public.assessments
  FOR EACH ROW
  WHEN (OLD.status != NEW.status OR OLD.score != NEW.score OR OLD.risk_level != NEW.risk_level)
  EXECUTE FUNCTION public.track_assessment_history();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.update_modified_column() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_email_confirmation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_assessment_counts_by_risk(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_statistics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_child_assessment_history(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_assessment_history() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_children_age_distribution(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manually_verify_user_email(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recommendations_for_assessment(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_assessment_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_assessment_score(UUID) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION public.update_modified_column IS 'Trigger function to update modified timestamp';
COMMENT ON FUNCTION public.handle_email_confirmation IS 'Handles email confirmation updates';
COMMENT ON FUNCTION public.get_assessment_counts_by_risk IS 'Gets assessment counts grouped by risk level';
COMMENT ON FUNCTION public.get_user_statistics IS 'Gets user statistics with proper access control';
COMMENT ON FUNCTION public.get_child_assessment_history IS 'Gets assessment history for a child';
COMMENT ON FUNCTION public.track_assessment_history IS 'Tracks changes to assessments';
COMMENT ON FUNCTION public.get_children_age_distribution IS 'Gets age distribution of children';
COMMENT ON FUNCTION public.manually_verify_user_email IS 'Allows admins to manually verify user emails';
COMMENT ON FUNCTION public.get_recommendations_for_assessment IS 'Gets recommendations based on assessment results';
COMMENT ON FUNCTION public.update_assessment_score IS 'Updates assessment score and risk level';
COMMENT ON FUNCTION public.handle_new_user IS 'Creates profile for new users';
COMMENT ON FUNCTION public.calculate_assessment_score IS 'Calculates assessment score based on responses';
