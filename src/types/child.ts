export type Child = {
  id: string
  parent_id: string
  name: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other'
  created_at: string
  updated_at: string
  assessments?: Assessment[]
}

export type Assessment = {
  id: string
  child_id: string
  status: 'in_progress' | 'completed'
  started_at: string
  completed_at?: string
  score?: number
}
