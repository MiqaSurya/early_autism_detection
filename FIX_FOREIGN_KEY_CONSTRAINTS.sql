-- DEFINITIVE FIX: Update foreign key constraints to allow CASCADE DELETE
-- This will permanently fix the child deletion issue
-- Run this in Supabase SQL Editor

BEGIN;

-- Step 1: Check current foreign key constraints
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND ccu.table_name = 'children'
ORDER BY tc.table_name;

-- Step 2: Drop the problematic constraint and recreate with CASCADE DELETE
ALTER TABLE public.assessments 
  DROP CONSTRAINT IF EXISTS assessments_child_id_fkey;

-- Recreate with CASCADE DELETE
ALTER TABLE public.assessments 
  ADD CONSTRAINT assessments_child_id_fkey 
  FOREIGN KEY (child_id) 
  REFERENCES public.children(id) 
  ON DELETE CASCADE;

-- Step 3: Fix responses table constraint too (if it exists)
ALTER TABLE public.responses 
  DROP CONSTRAINT IF EXISTS responses_assessment_id_fkey;

ALTER TABLE public.responses 
  ADD CONSTRAINT responses_assessment_id_fkey 
  FOREIGN KEY (assessment_id) 
  REFERENCES public.assessments(id) 
  ON DELETE CASCADE;

-- Step 4: Fix any other tables that reference children
-- Milestones
ALTER TABLE public.milestones 
  DROP CONSTRAINT IF EXISTS milestones_child_id_fkey;

ALTER TABLE public.milestones 
  ADD CONSTRAINT milestones_child_id_fkey 
  FOREIGN KEY (child_id) 
  REFERENCES public.children(id) 
  ON DELETE CASCADE;

-- Progress notes
ALTER TABLE public.progress_notes 
  DROP CONSTRAINT IF EXISTS progress_notes_child_id_fkey;

ALTER TABLE public.progress_notes 
  ADD CONSTRAINT progress_notes_child_id_fkey 
  FOREIGN KEY (child_id) 
  REFERENCES public.children(id) 
  ON DELETE CASCADE;

-- Interventions
ALTER TABLE public.interventions 
  DROP CONSTRAINT IF EXISTS interventions_child_id_fkey;

ALTER TABLE public.interventions 
  ADD CONSTRAINT interventions_child_id_fkey 
  FOREIGN KEY (child_id) 
  REFERENCES public.children(id) 
  ON DELETE CASCADE;

COMMIT;

-- Step 5: Verify the constraints are now set to CASCADE
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND ccu.table_name IN ('children', 'assessments')
ORDER BY tc.table_name;

-- You should now see delete_rule = 'CASCADE' for all constraints

-- Step 6: Test deletion (optional - replace with actual child ID to test)
-- SELECT id, name FROM children WHERE parent_id = auth.uid();
-- DELETE FROM children WHERE id = 'your-test-child-id' AND parent_id = auth.uid();
