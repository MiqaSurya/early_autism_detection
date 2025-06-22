// Progress Tracking & History Types

export type MilestoneType = 'communication' | 'social' | 'motor' | 'cognitive' | 'behavioral'

export type Milestone = {
  id: string
  child_id: string
  milestone_type: MilestoneType
  title: string
  description?: string
  target_age_months?: number
  achieved: boolean
  achieved_date?: string
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
}

export type NoteType = 'observation' | 'behavior' | 'development' | 'concern' | 'achievement'

export type ProgressNote = {
  id: string
  child_id: string
  note_type: NoteType
  title: string
  content: string
  tags?: string[]
  is_private: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export type InterventionType = 'therapy' | 'medication' | 'educational' | 'behavioral' | 'dietary' | 'other'

export type Intervention = {
  id: string
  child_id: string
  intervention_type: InterventionType
  name: string
  description?: string
  provider_name?: string
  provider_contact?: string
  start_date: string
  end_date?: string
  frequency?: string
  goals?: string[]
  progress_notes?: string
  effectiveness_rating?: number // 1-5
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export type DevelopmentPhoto = {
  id: string
  child_id: string
  photo_url: string
  caption?: string
  milestone_id?: string
  age_at_photo_months?: number
  tags?: string[]
  is_private: boolean
  uploaded_by: string
  created_at: string
}

export type AssessmentComparison = {
  id: string
  child_id: string
  assessment_1_id: string
  assessment_2_id: string
  score_change?: number
  risk_level_change?: string
  improvement_areas?: string[]
  concern_areas?: string[]
  notes?: string
  created_by: string
  created_at: string
}

export type ProgressSummary = {
  child_id: string
  total_assessments: number
  latest_score?: number
  latest_risk_level?: string
  score_trend: 'improving' | 'stable' | 'concerning' | 'insufficient_data'
  milestones_achieved: number
  total_milestones: number
  active_interventions: number
  last_assessment_date?: string
  next_recommended_assessment?: string
}

export type MilestoneProgress = {
  milestone_type: MilestoneType
  total_milestones: number
  achieved_milestones: number
  progress_percentage: number
}

export type AssessmentProgress = {
  score_change: number
  risk_level_change: string
  time_between_days: number
  improvement_percentage: number
}

export type TimelineEvent = {
  id: string
  type: 'assessment' | 'milestone' | 'intervention' | 'note' | 'photo'
  title: string
  description?: string
  date: string
  child_id: string
  related_id?: string // ID of the related record
  icon?: string
  color?: string
}

export type ProgressChartData = {
  date: string
  score: number
  risk_level: string
  age_months: number
}

export type DevelopmentArea = {
  area: string
  current_level: string
  target_level: string
  progress_percentage: number
  recommendations: string[]
}

// Enhanced Child type with progress tracking
export type ChildWithProgress = {
  id: string
  parent_id: string
  name: string
  date_of_birth: string
  gender?: 'male' | 'female' | 'other'
  photo_url?: string
  additional_notes?: string
  has_diagnosis: boolean
  diagnosis_date?: string
  diagnosis_details?: string
  created_at: string
  updated_at: string
  
  // Progress data
  progress_summary?: ProgressSummary
  latest_assessment?: {
    id: string
    score: number
    risk_level: string
    completed_at: string
  }
  milestone_progress?: MilestoneProgress[]
  active_interventions_count?: number
}

// API Response types
export type ProgressDashboardData = {
  child: ChildWithProgress
  recent_assessments: Array<{
    id: string
    score: number
    risk_level: string
    completed_at: string
  }>
  milestone_progress: MilestoneProgress[]
  recent_notes: ProgressNote[]
  active_interventions: Intervention[]
  timeline_events: TimelineEvent[]
  chart_data: ProgressChartData[]
}

export type CreateMilestoneRequest = {
  child_id: string
  milestone_type: MilestoneType
  title: string
  description?: string
  target_age_months?: number
}

export type CreateProgressNoteRequest = {
  child_id: string
  note_type: NoteType
  title: string
  content: string
  tags?: string[]
  is_private?: boolean
}

export type CreateInterventionRequest = {
  child_id: string
  intervention_type: InterventionType
  name: string
  description?: string
  provider_name?: string
  provider_contact?: string
  start_date: string
  frequency?: string
  goals?: string[]
}

export type UpdateMilestoneRequest = {
  achieved?: boolean
  achieved_date?: string
  notes?: string
}

export type UpdateInterventionRequest = {
  description?: string
  provider_name?: string
  provider_contact?: string
  end_date?: string
  frequency?: string
  goals?: string[]
  progress_notes?: string
  effectiveness_rating?: number
  is_active?: boolean
}

// Filter and sort options
export type ProgressFilter = {
  note_type?: NoteType[]
  milestone_type?: MilestoneType[]
  intervention_type?: InterventionType[]
  date_range?: {
    start: string
    end: string
  }
  achieved_only?: boolean
  active_only?: boolean
}

export type ProgressSortOption = {
  field: 'date' | 'type' | 'title' | 'progress'
  direction: 'asc' | 'desc'
}

// Chart configuration
export type ChartConfig = {
  type: 'line' | 'bar' | 'area'
  timeframe: '3months' | '6months' | '1year' | 'all'
  show_milestones: boolean
  show_interventions: boolean
}

export const MILESTONE_TYPES: Record<MilestoneType, string> = {
  communication: 'Communication',
  social: 'Social Interaction',
  motor: 'Motor Skills',
  cognitive: 'Cognitive Development',
  behavioral: 'Behavioral'
}

export const NOTE_TYPES: Record<NoteType, string> = {
  observation: 'Observation',
  behavior: 'Behavior',
  development: 'Development',
  concern: 'Concern',
  achievement: 'Achievement'
}

export const INTERVENTION_TYPES: Record<InterventionType, string> = {
  therapy: 'Therapy',
  medication: 'Medication',
  educational: 'Educational',
  behavioral: 'Behavioral',
  dietary: 'Dietary',
  other: 'Other'
}
