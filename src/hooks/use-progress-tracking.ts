import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/components/ui/use-toast'
import {
  ProgressDashboardData,
  Milestone,
  ProgressNote,
  Intervention,
  CreateMilestoneRequest,
  CreateProgressNoteRequest,
  CreateInterventionRequest,
  UpdateMilestoneRequest,
  UpdateInterventionRequest,
  ProgressFilter,
  TimelineEvent,
  ProgressChartData
} from '@/types/progress'

export function useProgressTracking(childId: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<ProgressDashboardData | null>(null)
  
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Fetch complete dashboard data
  const fetchDashboardData = async () => {
    if (!childId) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Fetch child data
      const { data: child, error: childError } = await supabase
        .from('children')
        .select('*')
        .eq('id', childId)
        .single()

      if (childError) throw childError

      // Fetch recent assessments for chart
      const { data: assessments, error: assessmentsError } = await supabase
        .from('assessments')
        .select('id, score, risk_level, completed_at')
        .eq('child_id', childId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(10)

      if (assessmentsError) throw assessmentsError

      // Fetch milestone progress (simplified version without RPC)
      const { data: milestones, error: milestonesError } = await supabase
        .from('milestones')
        .select('milestone_type, achieved')
        .eq('child_id', childId)

      // Calculate milestone progress manually
      const milestoneProgress = milestones ?
        Object.entries(
          milestones.reduce((acc: any, milestone) => {
            if (!acc[milestone.milestone_type]) {
              acc[milestone.milestone_type] = { total: 0, achieved: 0 }
            }
            acc[milestone.milestone_type].total += 1
            if (milestone.achieved) {
              acc[milestone.milestone_type].achieved += 1
            }
            return acc
          }, {})
        ).map(([type, data]: [string, any]) => ({
          milestone_type: type,
          total_milestones: data.total,
          achieved_milestones: data.achieved,
          progress_percentage: data.total > 0 ? (data.achieved / data.total) * 100 : 0
        })) : []

      if (milestonesError && milestonesError.code !== 'PGRST116') {
        console.warn('Milestones table not found, skipping milestone progress')
      }

      // Fetch recent notes (handle missing table gracefully)
      let notes = []
      try {
        const { data: notesData, error: notesError } = await supabase
          .from('progress_notes')
          .select('*')
          .eq('child_id', childId)
          .order('created_at', { ascending: false })
          .limit(5)

        if (notesError && notesError.code !== 'PGRST116') throw notesError
        notes = notesData || []
      } catch (err) {
        console.warn('Progress notes table not found, skipping notes')
        notes = []
      }

      // Fetch active interventions (handle missing table gracefully)
      let interventions = []
      try {
        const { data: interventionsData, error: interventionsError } = await supabase
          .from('interventions')
          .select('*')
          .eq('child_id', childId)
          .eq('is_active', true)
          .order('start_date', { ascending: false })

        if (interventionsError && interventionsError.code !== 'PGRST116') throw interventionsError
        interventions = interventionsData || []
      } catch (err) {
        console.warn('Interventions table not found, skipping interventions')
        interventions = []
      }

      // Create timeline events
      const timelineEvents: TimelineEvent[] = [
        ...assessments.map(assessment => ({
          id: assessment.id,
          type: 'assessment' as const,
          title: `M-CHAT-R Assessment`,
          description: `Score: ${assessment.score}/20 (${assessment.risk_level})`,
          date: assessment.completed_at,
          child_id: childId,
          related_id: assessment.id,
          icon: 'clipboard',
          color: assessment.risk_level === 'low' ? 'green' : 
                 assessment.risk_level === 'medium' ? 'yellow' : 'red'
        })),
        ...notes.map(note => ({
          id: note.id,
          type: 'note' as const,
          title: note.title,
          description: note.content.substring(0, 100) + '...',
          date: note.created_at,
          child_id: childId,
          related_id: note.id,
          icon: 'note',
          color: 'blue'
        })),
        ...interventions.map(intervention => ({
          id: intervention.id,
          type: 'intervention' as const,
          title: `Started ${intervention.name}`,
          description: intervention.description || '',
          date: intervention.start_date,
          child_id: childId,
          related_id: intervention.id,
          icon: 'therapy',
          color: 'purple'
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      // Create chart data
      const chartData: ProgressChartData[] = assessments.map(assessment => {
        const assessmentDate = new Date(assessment.completed_at)
        const birthDate = new Date(child.date_of_birth)
        const ageMonths = Math.floor((assessmentDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
        
        return {
          date: assessment.completed_at,
          score: assessment.score,
          risk_level: assessment.risk_level,
          age_months: ageMonths
        }
      }).reverse() // Reverse to show chronological order

      setDashboardData({
        child: {
          ...child,
          latest_assessment: assessments[0] || null,
          milestone_progress: milestoneProgress || [],
          active_interventions_count: interventions.length
        },
        recent_assessments: assessments,
        milestone_progress: milestoneProgress || [],
        recent_notes: notes,
        active_interventions: interventions,
        timeline_events: timelineEvents.slice(0, 20), // Limit to 20 most recent
        chart_data: chartData
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch progress data'
      setError(errorMessage)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  // Create milestone
  const createMilestone = async (data: CreateMilestoneRequest) => {
    try {
      const { error } = await supabase
        .from('milestones')
        .insert([{
          ...data,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Milestone created successfully'
      })

      await fetchDashboardData() // Refresh data
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create milestone'
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      })
      return false
    }
  }

  // Update milestone
  const updateMilestone = async (milestoneId: string, data: UpdateMilestoneRequest) => {
    try {
      const { error } = await supabase
        .from('milestones')
        .update(data)
        .eq('id', milestoneId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Milestone updated successfully'
      })

      await fetchDashboardData()
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update milestone'
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      })
      return false
    }
  }

  // Create progress note
  const createProgressNote = async (data: CreateProgressNoteRequest) => {
    try {
      const { error } = await supabase
        .from('progress_notes')
        .insert([{
          ...data,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Progress note created successfully'
      })

      await fetchDashboardData()
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create progress note'
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      })
      return false
    }
  }

  // Create intervention
  const createIntervention = async (data: CreateInterventionRequest) => {
    try {
      const { error } = await supabase
        .from('interventions')
        .insert([{
          ...data,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Intervention created successfully'
      })

      await fetchDashboardData()
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create intervention'
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      })
      return false
    }
  }

  // Update intervention
  const updateIntervention = async (interventionId: string, data: UpdateInterventionRequest) => {
    try {
      const { error } = await supabase
        .from('interventions')
        .update(data)
        .eq('id', interventionId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Intervention updated successfully'
      })

      await fetchDashboardData()
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update intervention'
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      })
      return false
    }
  }

  // Delete milestone
  const deleteMilestone = async (milestoneId: string) => {
    try {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', milestoneId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Milestone deleted successfully'
      })

      await fetchDashboardData()
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete milestone'
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      })
      return false
    }
  }

  // Load data on mount
  useEffect(() => {
    if (childId) {
      fetchDashboardData()
    }
  }, [childId])

  return {
    loading,
    error,
    dashboardData,
    fetchDashboardData,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    createProgressNote,
    createIntervention,
    updateIntervention
  }
}
