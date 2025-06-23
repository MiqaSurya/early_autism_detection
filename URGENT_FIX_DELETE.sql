-- URGENT FIX: Add CASCADE DELETE to resolve child profile deletion issues
-- Run this in your Supabase SQL Editor immediately

BEGIN;

-- 1. First, let's see what foreign key constraints exist
-- (This is just for information - you can see the output)
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND ccu.table_name = 'children';

-- 2. Drop and recreate the assessments foreign key constraint with CASCADE DELETE
ALTER TABLE public.assessments 
  DROP CONSTRAINT IF EXISTS assessments_child_id_fkey;

ALTER TABLE public.assessments 
  ADD CONSTRAINT assessments_child_id_fkey 
  FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE CASCADE;

-- 3. Also fix responses table if it exists
ALTER TABLE public.responses 
  DROP CONSTRAINT IF EXISTS responses_assessment_id_fkey;

ALTER TABLE public.responses 
  ADD CONSTRAINT responses_assessment_id_fkey 
  FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE;

-- 4. Fix any other tables that might reference children
-- Milestones
ALTER TABLE public.milestones 
  DROP CONSTRAINT IF EXISTS milestones_child_id_fkey;

ALTER TABLE public.milestones 
  ADD CONSTRAINT milestones_child_id_fkey 
  FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE CASCADE;

-- Progress notes
ALTER TABLE public.progress_notes 
  DROP CONSTRAINT IF EXISTS progress_notes_child_id_fkey;

ALTER TABLE public.progress_notes 
  ADD CONSTRAINT progress_notes_child_id_fkey 
  FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE CASCADE;

-- Interventions
ALTER TABLE public.interventions 
  DROP CONSTRAINT IF EXISTS interventions_child_id_fkey;

ALTER TABLE public.interventions 
  ADD CONSTRAINT interventions_child_id_fkey 
  FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE CASCADE;

-- Assessment comparisons
ALTER TABLE public.assessment_comparisons 
  DROP CONSTRAINT IF EXISTS assessment_comparisons_child_id_fkey;

ALTER TABLE public.assessment_comparisons 
  ADD CONSTRAINT assessment_comparisons_child_id_fkey 
  FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE CASCADE;

-- Development photos
ALTER TABLE public.development_photos 
  DROP CONSTRAINT IF EXISTS development_photos_child_id_fkey;

ALTER TABLE public.development_photos 
  ADD CONSTRAINT development_photos_child_id_fkey 
  FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE CASCADE;

-- Assessment history
ALTER TABLE public.assessment_history 
  DROP CONSTRAINT IF EXISTS assessment_history_assessment_id_fkey;

ALTER TABLE public.assessment_history 
  ADD CONSTRAINT assessment_history_assessment_id_fkey 
  FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE;

COMMIT;

-- 5. Verify the constraints are now set to CASCADE
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule,
  tc.constraint_name
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

-- You should see delete_rule = 'CASCADE' for all constraints
