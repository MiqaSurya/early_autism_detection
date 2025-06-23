-- Create a database function for reliable child deletion
-- Run this ONCE in Supabase SQL Editor to create the function

CREATE OR REPLACE FUNCTION delete_child_completely(child_uuid UUID)
RETURNS JSON AS $$
DECLARE
  current_user_id UUID := auth.uid();
  child_record RECORD;
  deleted_assessments INT := 0;
  deleted_responses INT := 0;
  result JSON;
BEGIN
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  END IF;
  
  -- Check if child exists and belongs to user
  SELECT id, name, parent_id INTO child_record 
  FROM children 
  WHERE id = child_uuid AND parent_id = current_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Child profile not found or access denied'
    );
  END IF;
  
  -- Start deletion process
  RAISE NOTICE 'Starting deletion of child: %', child_record.name;
  
  -- Delete responses first (they reference assessments)
  WITH deleted_resp AS (
    DELETE FROM responses 
    WHERE assessment_id IN (
      SELECT id FROM assessments WHERE child_id = child_uuid
    )
    RETURNING *
  )
  SELECT COUNT(*) INTO deleted_responses FROM deleted_resp;
  
  -- Delete assessments (they reference children)
  WITH deleted_assess AS (
    DELETE FROM assessments 
    WHERE child_id = child_uuid
    RETURNING *
  )
  SELECT COUNT(*) INTO deleted_assessments FROM deleted_assess;
  
  -- Delete other related data (ignore errors if tables don't exist)
  BEGIN
    DELETE FROM milestones WHERE child_id = child_uuid;
  EXCEPTION WHEN undefined_table THEN
    NULL; -- Ignore if table doesn't exist
  END;
  
  BEGIN
    DELETE FROM progress_notes WHERE child_id = child_uuid;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  BEGIN
    DELETE FROM interventions WHERE child_id = child_uuid;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  BEGIN
    DELETE FROM assessment_comparisons WHERE child_id = child_uuid;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  BEGIN
    DELETE FROM development_photos WHERE child_id = child_uuid;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  BEGIN
    DELETE FROM assessment_history 
    WHERE assessment_id IN (
      SELECT id FROM assessments WHERE child_id = child_uuid
    );
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  -- Finally delete the child profile
  DELETE FROM children 
  WHERE id = child_uuid AND parent_id = current_user_id;
  
  -- Verify deletion
  IF EXISTS (SELECT 1 FROM children WHERE id = child_uuid) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Child profile still exists after deletion attempt'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', format('%s''s profile has been completely deleted', child_record.name),
    'details', json_build_object(
      'deleted_assessments', deleted_assessments,
      'deleted_responses', deleted_responses
    )
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', format('Deletion failed: %s', SQLERRM)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_child_completely(UUID) TO authenticated;

-- Test the function (uncomment and replace with actual child ID to test)
-- SELECT delete_child_completely('your-child-id-here');

-- Example usage:
-- 1. First, find your child ID:
-- SELECT id, name FROM children WHERE parent_id = auth.uid();
-- 
-- 2. Then delete using the function:
-- SELECT delete_child_completely('paste-child-id-here');
--
-- The function will return a JSON response showing success/failure
