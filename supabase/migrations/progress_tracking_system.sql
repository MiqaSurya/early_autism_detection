-- PROGRESS TRACKING & HISTORY SYSTEM
-- Enhanced database schema for tracking child development progress

-- 1. ENHANCE CHILDREN TABLE
ALTER TABLE public.children 
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS additional_notes TEXT,
  ADD COLUMN IF NOT EXISTS has_diagnosis BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS diagnosis_date DATE,
  ADD COLUMN IF NOT EXISTS diagnosis_details TEXT;

-- 2. CREATE MILESTONES TABLE
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id UUID REFERENCES children(id) NOT NULL,
  milestone_type TEXT CHECK (milestone_type IN ('communication', 'social', 'motor', 'cognitive', 'behavioral')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_age_months INT, -- Expected age in months
  achieved BOOLEAN DEFAULT FALSE,
  achieved_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. CREATE PROGRESS NOTES TABLE
CREATE TABLE IF NOT EXISTS public.progress_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id UUID REFERENCES children(id) NOT NULL,
  note_type TEXT CHECK (note_type IN ('observation', 'behavior', 'development', 'concern', 'achievement')) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[], -- Array of tags for categorization
  is_private BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. CREATE ASSESSMENT COMPARISONS TABLE
CREATE TABLE IF NOT EXISTS public.assessment_comparisons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id UUID REFERENCES children(id) NOT NULL,
  assessment_1_id UUID REFERENCES assessments(id) NOT NULL,
  assessment_2_id UUID REFERENCES assessments(id) NOT NULL,
  score_change INT, -- Difference in scores
  risk_level_change TEXT, -- Description of risk level change
  improvement_areas TEXT[], -- Areas showing improvement
  concern_areas TEXT[], -- Areas showing increased concern
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. CREATE INTERVENTION TRACKING TABLE
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
  frequency TEXT, -- e.g., "2x per week", "daily"
  goals TEXT[],
  progress_notes TEXT,
  effectiveness_rating INT CHECK (effectiveness_rating BETWEEN 1 AND 5),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. CREATE DEVELOPMENT PHOTOS TABLE
CREATE TABLE IF NOT EXISTS public.development_photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id UUID REFERENCES children(id) NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  milestone_id UUID REFERENCES milestones(id),
  age_at_photo_months INT,
  tags TEXT[],
  is_private BOOLEAN DEFAULT TRUE,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. ENHANCE ASSESSMENT HISTORY TABLE
ALTER TABLE public.assessment_history 
  ADD COLUMN IF NOT EXISTS comparison_notes TEXT,
  ADD COLUMN IF NOT EXISTS parent_observations TEXT;

-- 8. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_milestones_child_id ON milestones(child_id);
CREATE INDEX IF NOT EXISTS idx_milestones_type ON milestones(milestone_type);
CREATE INDEX IF NOT EXISTS idx_progress_notes_child_id ON progress_notes(child_id);
CREATE INDEX IF NOT EXISTS idx_progress_notes_type ON progress_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_interventions_child_id ON interventions(child_id);
CREATE INDEX IF NOT EXISTS idx_interventions_active ON interventions(is_active);
CREATE INDEX IF NOT EXISTS idx_development_photos_child_id ON development_photos(child_id);
CREATE INDEX IF NOT EXISTS idx_assessment_comparisons_child_id ON assessment_comparisons(child_id);

-- 9. CREATE FUNCTIONS FOR PROGRESS TRACKING

-- Function to calculate progress between assessments
CREATE OR REPLACE FUNCTION public.calculate_assessment_progress(
  child_id_param UUID,
  assessment1_id UUID,
  assessment2_id UUID
)
RETURNS TABLE (
  score_change INT,
  risk_level_change TEXT,
  time_between_days INT,
  improvement_percentage DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  score1 INT;
  score2 INT;
  risk1 TEXT;
  risk2 TEXT;
  date1 TIMESTAMP;
  date2 TIMESTAMP;
BEGIN
  -- Get assessment data
  SELECT a1.score, a1.risk_level, a1.completed_at INTO score1, risk1, date1
  FROM assessments a1 WHERE a1.id = assessment1_id;
  
  SELECT a2.score, a2.risk_level, a2.completed_at INTO score2, risk2, date2
  FROM assessments a2 WHERE a2.id = assessment2_id;
  
  -- Calculate changes
  score_change := score2 - score1;
  risk_level_change := risk1 || ' → ' || risk2;
  time_between_days := EXTRACT(DAY FROM date2 - date1);
  
  -- Calculate improvement percentage (lower score is better in M-CHAT-R)
  IF score1 > 0 THEN
    improvement_percentage := ((score1 - score2)::DECIMAL / score1::DECIMAL) * 100;
  ELSE
    improvement_percentage := 0;
  END IF;
  
  RETURN QUERY SELECT score_change, risk_level_change, time_between_days, improvement_percentage;
END;
$$;

-- Function to get child's milestone progress
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

-- 10. CREATE TRIGGERS FOR AUTOMATIC PROGRESS TRACKING

-- Trigger to automatically create assessment comparison when new assessment is completed
CREATE OR REPLACE FUNCTION public.auto_create_assessment_comparison()
RETURNS TRIGGER AS $$
DECLARE
  previous_assessment_id UUID;
BEGIN
  -- Only proceed if assessment is being completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Find the most recent previous completed assessment for this child
    SELECT id INTO previous_assessment_id
    FROM assessments
    WHERE child_id = NEW.child_id 
      AND id != NEW.id 
      AND status = 'completed'
    ORDER BY completed_at DESC
    LIMIT 1;
    
    -- If there's a previous assessment, create a comparison
    IF previous_assessment_id IS NOT NULL THEN
      INSERT INTO assessment_comparisons (
        child_id,
        assessment_1_id,
        assessment_2_id,
        score_change,
        risk_level_change,
        created_by
      )
      SELECT 
        NEW.child_id,
        previous_assessment_id,
        NEW.id,
        NEW.score - prev.score,
        prev.risk_level || ' → ' || NEW.risk_level,
        auth.uid()
      FROM assessments prev
      WHERE prev.id = previous_assessment_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_assessment_completed ON public.assessments;
CREATE TRIGGER on_assessment_completed
  AFTER UPDATE ON public.assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_assessment_comparison();

-- 11. ROW LEVEL SECURITY POLICIES

-- Milestones policies
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage milestones for their children" ON public.milestones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM children c 
      WHERE c.id = milestones.child_id 
      AND c.parent_id = auth.uid()
    )
  );

-- Progress notes policies
ALTER TABLE public.progress_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage progress notes for their children" ON public.progress_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM children c 
      WHERE c.id = progress_notes.child_id 
      AND c.parent_id = auth.uid()
    )
  );

-- Interventions policies
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage interventions for their children" ON public.interventions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM children c 
      WHERE c.id = interventions.child_id 
      AND c.parent_id = auth.uid()
    )
  );

-- Development photos policies
ALTER TABLE public.development_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage photos for their children" ON public.development_photos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM children c 
      WHERE c.id = development_photos.child_id 
      AND c.parent_id = auth.uid()
    )
  );

-- Assessment comparisons policies
ALTER TABLE public.assessment_comparisons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view comparisons for their children" ON public.assessment_comparisons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM children c 
      WHERE c.id = assessment_comparisons.child_id 
      AND c.parent_id = auth.uid()
    )
  );

COMMIT;
