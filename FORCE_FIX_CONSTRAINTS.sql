-- AGGRESSIVE FIX: Force update foreign key constraints
-- This will definitely fix the constraint issue
-- Run this in Supabase SQL Editor

-- Step 1: Check current constraints
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
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
  AND (ccu.table_name = 'children' OR tc.table_name = 'assessments')
ORDER BY tc.table_name;

-- Step 2: Force drop ALL foreign key constraints related to children/assessments
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Drop all foreign key constraints that reference children table
    FOR constraint_record IN 
        SELECT tc.constraint_name, tc.table_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_schema = 'public'
          AND ccu.table_name = 'children'
    LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
                      constraint_record.table_name, 
                      constraint_record.constraint_name);
        RAISE NOTICE 'Dropped constraint % from table %', 
                     constraint_record.constraint_name, 
                     constraint_record.table_name;
    END LOOP;
    
    -- Drop all foreign key constraints that reference assessments table
    FOR constraint_record IN 
        SELECT tc.constraint_name, tc.table_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_schema = 'public'
          AND ccu.table_name = 'assessments'
    LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
                      constraint_record.table_name, 
                      constraint_record.constraint_name);
        RAISE NOTICE 'Dropped constraint % from table %', 
                     constraint_record.constraint_name, 
                     constraint_record.table_name;
    END LOOP;
END $$;

-- Step 3: Recreate constraints with CASCADE DELETE
-- Assessments -> Children (CASCADE DELETE)
ALTER TABLE public.assessments 
  ADD CONSTRAINT assessments_child_id_fkey 
  FOREIGN KEY (child_id) 
  REFERENCES public.children(id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- Responses -> Assessments (CASCADE DELETE)
ALTER TABLE public.responses 
  ADD CONSTRAINT responses_assessment_id_fkey 
  FOREIGN KEY (assessment_id) 
  REFERENCES public.assessments(id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- Other tables -> Children (CASCADE DELETE)
-- Only add if tables exist
DO $$
BEGIN
    -- Milestones
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'milestones') THEN
        ALTER TABLE public.milestones 
          ADD CONSTRAINT milestones_child_id_fkey 
          FOREIGN KEY (child_id) 
          REFERENCES public.children(id) 
          ON DELETE CASCADE;
        RAISE NOTICE 'Added CASCADE constraint for milestones';
    END IF;
    
    -- Progress notes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'progress_notes') THEN
        ALTER TABLE public.progress_notes 
          ADD CONSTRAINT progress_notes_child_id_fkey 
          FOREIGN KEY (child_id) 
          REFERENCES public.children(id) 
          ON DELETE CASCADE;
        RAISE NOTICE 'Added CASCADE constraint for progress_notes';
    END IF;
    
    -- Interventions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interventions') THEN
        ALTER TABLE public.interventions 
          ADD CONSTRAINT interventions_child_id_fkey 
          FOREIGN KEY (child_id) 
          REFERENCES public.children(id) 
          ON DELETE CASCADE;
        RAISE NOTICE 'Added CASCADE constraint for interventions';
    END IF;
    
    -- Assessment comparisons
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assessment_comparisons') THEN
        ALTER TABLE public.assessment_comparisons 
          ADD CONSTRAINT assessment_comparisons_child_id_fkey 
          FOREIGN KEY (child_id) 
          REFERENCES public.children(id) 
          ON DELETE CASCADE;
        RAISE NOTICE 'Added CASCADE constraint for assessment_comparisons';
    END IF;
    
    -- Development photos
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'development_photos') THEN
        ALTER TABLE public.development_photos 
          ADD CONSTRAINT development_photos_child_id_fkey 
          FOREIGN KEY (child_id) 
          REFERENCES public.children(id) 
          ON DELETE CASCADE;
        RAISE NOTICE 'Added CASCADE constraint for development_photos';
    END IF;
END $$;

-- Step 4: Verify all constraints are now CASCADE
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
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
  AND (ccu.table_name = 'children' OR ccu.table_name = 'assessments')
ORDER BY tc.table_name;

-- All delete_rule values should now be 'CASCADE'

RAISE NOTICE 'Foreign key constraints have been updated with CASCADE DELETE';
RAISE NOTICE 'Child profiles can now be deleted without constraint violations';
