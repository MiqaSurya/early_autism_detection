-- Test script to verify child deletion works after fixing constraints
-- Run this AFTER running FIX_FOREIGN_KEY_CONSTRAINTS.sql

-- Step 1: Check that constraints are now CASCADE
SELECT 
  tc.table_name, 
  tc.constraint_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.constraint_name LIKE '%child_id%'
ORDER BY tc.table_name;

-- You should see delete_rule = 'CASCADE' for all constraints

-- Step 2: See your current children
SELECT 
  id, 
  name, 
  date_of_birth,
  created_at,
  (SELECT COUNT(*) FROM assessments WHERE child_id = children.id) as assessment_count
FROM children 
WHERE parent_id = auth.uid()
ORDER BY created_at DESC;

-- Step 3: Test deletion (UNCOMMENT and replace with actual child ID to test)
-- WARNING: This will actually delete the child profile!
-- 
-- DELETE FROM children 
-- WHERE id = 'REPLACE_WITH_ACTUAL_CHILD_ID' 
-- AND parent_id = auth.uid();

-- Step 4: Verify deletion worked (run after step 3)
-- SELECT 
--   id, 
--   name, 
--   date_of_birth
-- FROM children 
-- WHERE parent_id = auth.uid()
-- ORDER BY created_at DESC;

-- The child should be gone and all related assessments should be automatically deleted too!
