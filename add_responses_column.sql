-- Add responses column to assessments table to store user answers
-- This allows admin to review individual question responses

ALTER TABLE public.assessments 
ADD COLUMN IF NOT EXISTS responses JSONB;

-- Add comment to explain the column
COMMENT ON COLUMN public.assessments.responses IS 'JSON object storing user responses to questionnaire questions';

-- Create index for better performance when querying responses
CREATE INDEX IF NOT EXISTS idx_assessments_responses ON public.assessments USING GIN (responses);

-- Update existing assessments to have empty responses object if null
UPDATE public.assessments 
SET responses = '{}'::jsonb 
WHERE responses IS NULL;
