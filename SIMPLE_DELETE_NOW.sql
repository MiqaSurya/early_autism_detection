-- SIMPLE IMMEDIATE DELETION SCRIPT
-- This will delete the child profile that's causing problems
-- Run this in Supabase SQL Editor RIGHT NOW

-- STEP 1: See all your children and find the one you want to delete
SELECT 
  id, 
  name, 
  date_of_birth,
  created_at
FROM children 
WHERE parent_id = auth.uid()
ORDER BY created_at DESC;

-- STEP 2: Copy the ID of the child you want to delete from the results above
-- Then replace 'PASTE_CHILD_ID_HERE' below with that ID and run this:

BEGIN;

-- Replace this with the actual child ID you want to delete
-- Example: SET @child_id = '123e4567-e89b-12d3-a456-426614174000';
-- IMPORTANT: Replace PASTE_CHILD_ID_HERE with the actual UUID from step 1
DO $$
DECLARE
    target_child_id UUID := 'PASTE_CHILD_ID_HERE';
    current_user_id UUID := auth.uid();
    child_name_var TEXT;
    deleted_assessments INT := 0;
    deleted_responses INT := 0;
BEGIN
    -- Verify this child belongs to you
    SELECT name INTO child_name_var 
    FROM children 
    WHERE id = target_child_id AND parent_id = current_user_id;
    
    IF child_name_var IS NULL THEN
        RAISE EXCEPTION 'Child not found or you do not own this child profile';
    END IF;
    
    RAISE NOTICE 'Deleting child: %', child_name_var;
    
    -- Delete responses first (they depend on assessments)
    WITH deleted_resp AS (
        DELETE FROM responses 
        WHERE assessment_id IN (
            SELECT id FROM assessments WHERE child_id = target_child_id
        )
        RETURNING *
    )
    SELECT COUNT(*) INTO deleted_responses FROM deleted_resp;
    
    RAISE NOTICE 'Deleted % responses', deleted_responses;
    
    -- Delete assessments (they depend on children)
    WITH deleted_assess AS (
        DELETE FROM assessments 
        WHERE child_id = target_child_id
        RETURNING *
    )
    SELECT COUNT(*) INTO deleted_assessments FROM deleted_assess;
    
    RAISE NOTICE 'Deleted % assessments', deleted_assessments;
    
    -- Delete other related data (these tables might not exist, so we'll ignore errors)
    BEGIN
        DELETE FROM milestones WHERE child_id = target_child_id;
        RAISE NOTICE 'Deleted milestones';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Milestones table does not exist, skipping';
    END;
    
    BEGIN
        DELETE FROM progress_notes WHERE child_id = target_child_id;
        RAISE NOTICE 'Deleted progress notes';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Progress notes table does not exist, skipping';
    END;
    
    BEGIN
        DELETE FROM interventions WHERE child_id = target_child_id;
        RAISE NOTICE 'Deleted interventions';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Interventions table does not exist, skipping';
    END;
    
    BEGIN
        DELETE FROM assessment_comparisons WHERE child_id = target_child_id;
        RAISE NOTICE 'Deleted assessment comparisons';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Assessment comparisons table does not exist, skipping';
    END;
    
    BEGIN
        DELETE FROM development_photos WHERE child_id = target_child_id;
        RAISE NOTICE 'Deleted development photos';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Development photos table does not exist, skipping';
    END;
    
    BEGIN
        DELETE FROM assessment_history WHERE assessment_id IN (
            SELECT id FROM assessments WHERE child_id = target_child_id
        );
        RAISE NOTICE 'Deleted assessment history';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Assessment history table does not exist, skipping';
    END;
    
    -- Finally delete the child profile
    DELETE FROM children 
    WHERE id = target_child_id AND parent_id = current_user_id;
    
    RAISE NOTICE 'SUCCESS: Child "%" has been completely deleted!', child_name_var;
    RAISE NOTICE 'Summary: Deleted % assessments and % responses', deleted_assessments, deleted_responses;
    
END $$;

COMMIT;

-- STEP 3: Verify the deletion worked
-- This should show your remaining children (the deleted one should be gone)
SELECT 
  id, 
  name, 
  date_of_birth,
  created_at
FROM children 
WHERE parent_id = auth.uid()
ORDER BY created_at DESC;

-- If you see a message like "SUCCESS: Child has been completely deleted!" 
-- then it worked and the child profile is gone!
