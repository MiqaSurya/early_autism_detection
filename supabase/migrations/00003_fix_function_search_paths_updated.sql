-- First drop all existing functions to avoid conflicts
DROP FUNCTION IF EXISTS public.update_modified_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_email_confirmation() CASCADE;
DROP FUNCTION IF EXISTS public.get_assessment_counts_by_risk(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_statistics(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_child_assessment_history(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.track_assessment_history() CASCADE;
DROP FUNCTION IF EXISTS public.get_children_age_distribution(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.manually_verify_user_email(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.manually_verify_user_email(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_recommendations_for_assessment(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_assessment_score(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_assessment_score(UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.update_assessment_score(assessment_id UUID, OUT result BOOLEAN)
RETURNS BOOLEAN

GRANT EXECUTE ON FUNCTION public.update_assessment_score(UUID, BOOLEAN) TO authenticated;