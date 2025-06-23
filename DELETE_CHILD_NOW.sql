-- IMMEDIATE WORKAROUND: Delete child profile right now
-- This bypasses all constraint issues by deleting in the correct order
-- Replace 'YOUR_CHILD_ID_HERE' with the actual child ID

-- Step 1: Find your child ID
SELECT 
  id, 
  name, 
  date_of_birth,
  created_at,
  (SELECT COUNT(*) FROM assessments WHERE child_id = children.id) as assessment_count
FROM children 
WHERE parent_id = auth.uid()
ORDER BY created_at DESC;

-- Step 2: Manual deletion (replace YOUR_CHILD_ID_HERE with actual ID)
DO $$
DECLARE
    target_child_id UUID := 'YOUR_CHILD_ID_HERE'; -- REPLACE THIS!
    current_user_id UUID := auth.uid();
    child_name_var TEXT;
    assessment_ids UUID[];
    deleted_responses INT := 0;
    deleted_assessments INT := 0;
BEGIN
    -- Verify ownership
    SELECT name INTO child_name_var 
    FROM children 
    WHERE id = target_child_id AND parent_id = current_user_id;
    
    IF child_name_var IS NULL THEN
        RAISE EXCEPTION 'Child not found or you do not have permission to delete it';
    END IF;
    
    RAISE NOTICE 'Starting deletion of child: %', child_name_var;
    
    -- Get all assessment IDs for this child
    SELECT ARRAY(SELECT id FROM assessments WHERE child_id = target_child_id) INTO assessment_ids;
    RAISE NOTICE 'Found % assessments to delete', COALESCE(array_length(assessment_ids, 1), 0);
    
    -- Delete responses first (they reference assessments)
    IF assessment_ids IS NOT NULL AND array_length(assessment_ids, 1) > 0 THEN
        DELETE FROM responses WHERE assessment_id = ANY(assessment_ids);
        GET DIAGNOSTICS deleted_responses = ROW_COUNT;
        RAISE NOTICE 'Deleted % responses', deleted_responses;
    END IF;
    
    -- Delete assessments (they reference children)
    DELETE FROM assessments WHERE child_id = target_child_id;
    GET DIAGNOSTICS deleted_assessments = ROW_COUNT;
    RAISE NOTICE 'Deleted % assessments', deleted_assessments;
    
    -- Delete other child-related data (ignore errors if tables don't exist)
    BEGIN
        DELETE FROM milestones WHERE child_id = target_child_id;
        RAISE NOTICE 'Deleted milestones';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Milestones table does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting milestones: %', SQLERRM;
    END;
    
    BEGIN
        DELETE FROM progress_notes WHERE child_id = target_child_id;
        RAISE NOTICE 'Deleted progress notes';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Progress notes table does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting progress notes: %', SQLERRM;
    END;
    
    BEGIN
        DELETE FROM interventions WHERE child_id = target_child_id;
        RAISE NOTICE 'Deleted interventions';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Interventions table does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting interventions: %', SQLERRM;
    END;
    
    BEGIN
        DELETE FROM assessment_comparisons WHERE child_id = target_child_id;
        RAISE NOTICE 'Deleted assessment comparisons';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Assessment comparisons table does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting assessment comparisons: %', SQLERRM;
    END;
    
    BEGIN
        DELETE FROM development_photos WHERE child_id = target_child_id;
        RAISE NOTICE 'Deleted development photos';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Development photos table does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting development photos: %', SQLERRM;
    END;
    
    -- Finally delete the child profile
    DELETE FROM children 
    WHERE id = target_child_id AND parent_id = current_user_id;
    
    -- Verify deletion
    IF EXISTS (SELECT 1 FROM children WHERE id = target_child_id) THEN
        RAISE EXCEPTION 'Child profile still exists after deletion attempt!';
    END IF;
    
    RAISE NOTICE '🎉 SUCCESS: Child "%" has been completely deleted!', child_name_var;
    RAISE NOTICE 'Summary: Deleted % assessments and % responses', deleted_assessments, deleted_responses;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ ERROR: %', SQLERRM;
    RAISE EXCEPTION 'Deletion failed: %', SQLERRM;
END $$;

-- Step 3: Verify deletion worked
SELECT 
  id, 
  name, 
  date_of_birth
FROM children 
WHERE parent_id = auth.uid()
ORDER BY created_at DESC;

-- The problematic child should be gone!
