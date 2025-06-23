-- MANUAL CHILD DELETION SCRIPT
-- Use this to manually delete a specific child profile that won't delete through the UI
-- Replace 'YOUR_CHILD_ID_HERE' with the actual child ID you want to delete

-- STEP 1: Find the child you want to delete
-- Run this first to see all your children and get the correct ID
SELECT 
  id, 
  name, 
  date_of_birth,
  created_at,
  parent_id
FROM children 
WHERE parent_id = auth.uid()
ORDER BY created_at DESC;

-- STEP 2: Get detailed info about what's blocking deletion
-- Replace 'YOUR_CHILD_ID_HERE' with the actual child ID
DO $$
DECLARE
  child_uuid UUID := 'YOUR_CHILD_ID_HERE'; -- REPLACE THIS WITH ACTUAL CHILD ID
  user_uuid UUID := auth.uid();
  assessment_count INT;
  response_count INT;
  milestone_count INT;
  child_name TEXT;
BEGIN
  -- Get child info
  SELECT name INTO child_name FROM children WHERE id = child_uuid AND parent_id = user_uuid;
  
  IF child_name IS NULL THEN
    RAISE NOTICE 'Child not found or you do not have permission to delete it';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found child: %', child_name;
  
  -- Count related data
  SELECT COUNT(*) INTO assessment_count FROM assessments WHERE child_id = child_uuid;
  RAISE NOTICE 'Assessments: %', assessment_count;
  
  SELECT COUNT(*) INTO response_count 
  FROM responses r 
  JOIN assessments a ON r.assessment_id = a.id 
  WHERE a.child_id = child_uuid;
  RAISE NOTICE 'Responses: %', response_count;
  
  SELECT COUNT(*) INTO milestone_count FROM milestones WHERE child_id = child_uuid;
  RAISE NOTICE 'Milestones: %', milestone_count;
  
END $$;

-- STEP 3: FORCE DELETE (run this after replacing the child ID)
-- This will delete everything in the correct order
DO $$
DECLARE
  child_uuid UUID := 'YOUR_CHILD_ID_HERE'; -- REPLACE THIS WITH ACTUAL CHILD ID
  user_uuid UUID := auth.uid();
  child_name TEXT;
  assessment_ids UUID[];
BEGIN
  -- Verify ownership
  SELECT name INTO child_name FROM children WHERE id = child_uuid AND parent_id = user_uuid;
  
  IF child_name IS NULL THEN
    RAISE NOTICE 'Child not found or access denied';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Starting deletion of child: %', child_name;
  
  -- Get all assessment IDs for this child
  SELECT ARRAY(SELECT id FROM assessments WHERE child_id = child_uuid) INTO assessment_ids;
  RAISE NOTICE 'Found % assessments to delete', array_length(assessment_ids, 1);
  
  -- Delete in correct order to avoid foreign key violations
  
  -- 1. Delete responses (they reference assessments)
  DELETE FROM responses WHERE assessment_id = ANY(assessment_ids);
  RAISE NOTICE 'Deleted responses';
  
  -- 2. Delete assessment_history (if exists)
  DELETE FROM assessment_history WHERE assessment_id = ANY(assessment_ids);
  RAISE NOTICE 'Deleted assessment history';
  
  -- 3. Delete child-related data
  DELETE FROM assessment_comparisons WHERE child_id = child_uuid;
  RAISE NOTICE 'Deleted assessment comparisons';
  
  DELETE FROM development_photos WHERE child_id = child_uuid;
  RAISE NOTICE 'Deleted development photos';
  
  DELETE FROM interventions WHERE child_id = child_uuid;
  RAISE NOTICE 'Deleted interventions';
  
  DELETE FROM progress_notes WHERE child_id = child_uuid;
  RAISE NOTICE 'Deleted progress notes';
  
  DELETE FROM milestones WHERE child_id = child_uuid;
  RAISE NOTICE 'Deleted milestones';
  
  -- 4. Delete assessments
  DELETE FROM assessments WHERE child_id = child_uuid;
  RAISE NOTICE 'Deleted assessments';
  
  -- 5. Finally delete the child
  DELETE FROM children WHERE id = child_uuid AND parent_id = user_uuid;
  RAISE NOTICE 'Deleted child profile: %', child_name;
  
  RAISE NOTICE 'SUCCESS: Child % has been completely deleted!', child_name;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERROR during deletion: %', SQLERRM;
  ROLLBACK;
END $$;

-- STEP 4: Verify deletion worked
-- Replace 'YOUR_CHILD_ID_HERE' with the same child ID
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM children WHERE id = 'YOUR_CHILD_ID_HERE') 
    THEN 'Child still exists - deletion failed'
    ELSE 'Child successfully deleted'
  END as deletion_status;

-- STEP 5: Check your remaining children
SELECT 
  id, 
  name, 
  date_of_birth,
  created_at
FROM children 
WHERE parent_id = auth.uid()
ORDER BY created_at DESC;
