-- Fix RLS policies for questionnaire_questions table

-- First, disable RLS temporarily to clean up
ALTER TABLE public.questionnaire_questions DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.questionnaire_questions;
DROP POLICY IF EXISTS "Allow read access for all users" ON public.questionnaire_questions;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.questionnaire_questions;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.questionnaire_questions;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.questionnaire_questions;
DROP POLICY IF EXISTS "Service role full access" ON public.questionnaire_questions;

-- Re-enable RLS
ALTER TABLE public.questionnaire_questions ENABLE ROW LEVEL SECURITY;

-- Create new policies that allow service role access and public read access
CREATE POLICY "Public read access" ON public.questionnaire_questions
    FOR SELECT USING (true);

CREATE POLICY "Service role full access" ON public.questionnaire_questions
    FOR ALL USING (auth.role() = 'service_role');

-- Also allow authenticated users to read (for regular users taking assessments)
CREATE POLICY "Authenticated users can read" ON public.questionnaire_questions
    FOR SELECT TO authenticated USING (true);

-- Grant necessary permissions
GRANT SELECT ON public.questionnaire_questions TO anon;
GRANT SELECT ON public.questionnaire_questions TO authenticated;
GRANT ALL ON public.questionnaire_questions TO service_role;
