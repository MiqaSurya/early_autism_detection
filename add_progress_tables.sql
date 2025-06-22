-- Add Progress Tracking Tables to Existing Database
-- Run this in your Supabase SQL Editor

-- 1. Add additional columns to children table if they don't exist
ALTER TABLE public.children 
  ADD COLUMN IF NOT EXISTS additional_notes TEXT;

-- 2. Create milestones table
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id UUID REFERENCES children(id) NOT NULL,
  milestone_type TEXT CHECK (milestone_type IN ('communication', 'social', 'motor', 'cognitive', 'behavioral')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_age_months INT,
  achieved BOOLEAN DEFAULT FALSE,
  achieved_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create progress notes table
CREATE TABLE IF NOT EXISTS public.progress_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id UUID REFERENCES children(id) NOT NULL,
  note_type TEXT CHECK (note_type IN ('observation', 'behavior', 'development', 'concern', 'achievement')) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  is_private BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Create interventions table
CREATE TABLE IF NOT EXISTS public.interventions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id UUID REFERENCES children(id) NOT NULL,
  intervention_type TEXT CHECK (intervention_type IN ('therapy', 'medication', 'educational', 'behavioral', 'dietary', 'other')) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  provider_name TEXT,
  provider_contact TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  frequency TEXT,
  goals TEXT[],
  progress_notes TEXT,
  effectiveness_rating INT CHECK (effectiveness_rating BETWEEN 1 AND 5),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_milestones_child_id ON milestones(child_id);
CREATE INDEX IF NOT EXISTS idx_milestones_type ON milestones(milestone_type);
CREATE INDEX IF NOT EXISTS idx_progress_notes_child_id ON progress_notes(child_id);
CREATE INDEX IF NOT EXISTS idx_progress_notes_type ON progress_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_interventions_child_id ON interventions(child_id);
CREATE INDEX IF NOT EXISTS idx_interventions_active ON interventions(is_active);

-- 6. Enable Row Level Security
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
-- Milestones policies
CREATE POLICY IF NOT EXISTS "Users can manage milestones for their children" ON public.milestones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM children c 
      WHERE c.id = milestones.child_id 
      AND c.parent_id = auth.uid()
    )
  );

-- Progress notes policies
CREATE POLICY IF NOT EXISTS "Users can manage progress notes for their children" ON public.progress_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM children c 
      WHERE c.id = progress_notes.child_id 
      AND c.parent_id = auth.uid()
    )
  );

-- Interventions policies
CREATE POLICY IF NOT EXISTS "Users can manage interventions for their children" ON public.interventions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM children c 
      WHERE c.id = interventions.child_id 
      AND c.parent_id = auth.uid()
    )
  );

-- 8. Create helper function for milestone progress
CREATE OR REPLACE FUNCTION public.get_milestone_progress(child_id_param UUID)
RETURNS TABLE (
  milestone_type TEXT,
  total_milestones BIGINT,
  achieved_milestones BIGINT,
  progress_percentage DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.milestone_type,
    COUNT(*) as total_milestones,
    COUNT(*) FILTER (WHERE m.achieved = true) as achieved_milestones,
    ROUND(
      (COUNT(*) FILTER (WHERE m.achieved = true)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
      2
    ) as progress_percentage
  FROM milestones m
  WHERE m.child_id = child_id_param
  GROUP BY m.milestone_type;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_milestone_progress(UUID) TO authenticated;

COMMIT;
