-- Fix CASCADE DELETE for child profile deletion
-- This script adds proper foreign key constraints with CASCADE DELETE
-- to ensure child profiles can be deleted without foreign key constraint errors

BEGIN;

-- 1. Drop existing foreign key constraints and recreate with CASCADE DELETE

-- Fix assessments table
ALTER TABLE IF EXISTS public.assessments 
  DROP CONSTRAINT IF EXISTS assessments_child_id_fkey;

ALTER TABLE IF EXISTS public.assessments 
  ADD CONSTRAINT assessments_child_id_fkey 
  FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE CASCADE;

-- Fix responses table (if it exists)
ALTER TABLE IF EXISTS public.responses 
  DROP CONSTRAINT IF EXISTS responses_assessment_id_fkey;

ALTER TABLE IF EXISTS public.responses 
  ADD CONSTRAINT responses_assessment_id_fkey 
  FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE;

-- Fix milestones table (if it exists)
ALTER TABLE IF EXISTS public.milestones 
  DROP CONSTRAINT IF EXISTS milestones_child_id_fkey;

ALTER TABLE IF EXISTS public.milestones 
  ADD CONSTRAINT milestones_child_id_fkey 
  FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE CASCADE;

-- Fix progress_notes table (if it exists)
ALTER TABLE IF EXISTS public.progress_notes 
  DROP CONSTRAINT IF EXISTS progress_notes_child_id_fkey;

ALTER TABLE IF EXISTS public.progress_notes 
  ADD CONSTRAINT progress_notes_child_id_fkey 
  FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE CASCADE;

-- Fix interventions table (if it exists)
ALTER TABLE IF EXISTS public.interventions 
  DROP CONSTRAINT IF EXISTS interventions_child_id_fkey;

ALTER TABLE IF EXISTS public.interventions 
  ADD CONSTRAINT interventions_child_id_fkey 
  FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE CASCADE;

-- Fix assessment_comparisons table (if it exists)
ALTER TABLE IF EXISTS public.assessment_comparisons 
  DROP CONSTRAINT IF EXISTS assessment_comparisons_child_id_fkey;

ALTER TABLE IF EXISTS public.assessment_comparisons 
  ADD CONSTRAINT assessment_comparisons_child_id_fkey 
  FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE CASCADE;

-- Fix development_photos table (if it exists)
ALTER TABLE IF EXISTS public.development_photos 
  DROP CONSTRAINT IF EXISTS development_photos_child_id_fkey;

ALTER TABLE IF EXISTS public.development_photos 
  ADD CONSTRAINT development_photos_child_id_fkey 
  FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE CASCADE;

-- Fix assessment_history table (if it exists)
ALTER TABLE IF EXISTS public.assessment_history 
  DROP CONSTRAINT IF EXISTS assessment_history_assessment_id_fkey;

ALTER TABLE IF EXISTS public.assessment_history 
  ADD CONSTRAINT assessment_history_assessment_id_fkey 
  FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE;

-- 2. Create a function to safely delete child profiles with all related data
CREATE OR REPLACE FUNCTION delete_child_profile(child_uuid UUID, user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  child_record RECORD;
  result JSON;
BEGIN
  -- Check if child exists and belongs to user
  SELECT id, name INTO child_record 
  FROM public.children 
  WHERE id = child_uuid AND parent_id = user_uuid;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Child profile not found or access denied'
    );
  END IF;
  
  -- Delete the child profile (CASCADE will handle related data)
  DELETE FROM public.children 
  WHERE id = child_uuid AND parent_id = user_uuid;
  
  RETURN json_build_object(
    'success', true, 
    'message', format('%s''s profile has been permanently deleted.', child_record.name)
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false, 
    'error', format('Failed to delete child profile: %s', SQLERRM)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_child_profile(UUID, UUID) TO authenticated;

-- 4. Create indexes for better performance on foreign key lookups
CREATE INDEX IF NOT EXISTS idx_assessments_child_id ON public.assessments(child_id);
CREATE INDEX IF NOT EXISTS idx_responses_assessment_id ON public.responses(assessment_id);
CREATE INDEX IF NOT EXISTS idx_milestones_child_id ON public.milestones(child_id);
CREATE INDEX IF NOT EXISTS idx_progress_notes_child_id ON public.progress_notes(child_id);
CREATE INDEX IF NOT EXISTS idx_interventions_child_id ON public.interventions(child_id);
CREATE INDEX IF NOT EXISTS idx_assessment_comparisons_child_id ON public.assessment_comparisons(child_id);
CREATE INDEX IF NOT EXISTS idx_development_photos_child_id ON public.development_photos(child_id);

COMMIT;

-- Test the function (uncomment to test with actual data)
-- SELECT delete_child_profile('your-child-uuid-here', 'your-user-uuid-here');

-- Verify foreign key constraints
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND (ccu.table_name = 'children' OR ccu.table_name = 'assessments')
ORDER BY tc.table_name, kcu.column_name;
