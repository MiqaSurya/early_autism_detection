-- Fix assessments table structure
-- Run this in your Supabase SQL Editor

-- First, let's check the current structure and add missing columns if needed
DO $$
BEGIN
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'notes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.assessments ADD COLUMN notes TEXT;
    END IF;

    -- Add completed_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'completed_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.assessments ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add score column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'score'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.assessments ADD COLUMN score INT;
    END IF;

    -- Add risk_level column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'risk_level'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.assessments ADD COLUMN risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'inconclusive'));
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.assessments ADD COLUMN status TEXT CHECK (status IN ('in_progress', 'completed')) DEFAULT 'in_progress';
    END IF;

    -- Add child_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'child_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.assessments ADD COLUMN child_id UUID REFERENCES children(id);
    END IF;

    -- Add started_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'assessments'
        AND column_name = 'started_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.assessments ADD COLUMN started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    END IF;

    -- Add responses column if it doesn't exist (THIS IS THE MISSING COLUMN!)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'assessments'
        AND column_name = 'responses'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.assessments ADD COLUMN responses JSONB;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assessments_child_id ON public.assessments(child_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON public.assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_completed_at ON public.assessments(completed_at);
CREATE INDEX IF NOT EXISTS idx_assessments_responses ON public.assessments USING GIN (responses);

-- Enable RLS if not already enabled
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Create or update RLS policies
DROP POLICY IF EXISTS "Users can view their children's assessments" ON public.assessments;
CREATE POLICY "Users can view their children's assessments" ON public.assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = assessments.child_id
      AND children.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert assessments for their children" ON public.assessments;
CREATE POLICY "Users can insert assessments for their children" ON public.assessments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = assessments.child_id
      AND children.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their children's assessments" ON public.assessments;
CREATE POLICY "Users can update their children's assessments" ON public.assessments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = assessments.child_id
      AND children.parent_id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.assessments TO authenticated;

COMMIT;
