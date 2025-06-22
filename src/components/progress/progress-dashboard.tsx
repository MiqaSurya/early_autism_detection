'use client'

import { useState } from 'react'
import { useProgressTracking } from '@/hooks/use-progress-tracking'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Target, 
  FileText, 
  Activity,
  Plus,
  BarChart3,
  Clock,
  Award,
  AlertCircle
} from 'lucide-react'
import { ProgressChart } from './progress-chart'
import { MilestoneTracker } from './milestone-tracker'
import { ProgressNotes } from './progress-notes'
import { InterventionTracker } from './intervention-tracker'
import { Timeline } from './timeline'
import { CreateMilestoneDialog } from './create-milestone-dialog'
import { CreateNoteDialog } from './create-note-dialog'
import { CreateInterventionDialog } from './create-intervention-dialog'

interface ProgressDashboardProps {
  childId: string
}

export function ProgressDashboard({ childId }: ProgressDashboardProps) {
  const { 
    loading, 
    error, 
    dashboardData, 
    createMilestone,
    createProgressNote,
    createIntervention 
  } = useProgressTracking(childId)

  const [showCreateMilestone, setShowCreateMilestone] = useState(false)
  const [showCreateNote, setShowCreateNote] = useState(false)
  const [showCreateIntervention, setShowCreateIntervention] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No progress data available</p>
      </div>
    )
  }

  const { child, recent_assessments, milestone_progress, chart_data } = dashboardData

  // Calculate progress indicators
  const latestAssessment = recent_assessments[0]
  const previousAssessment = recent_assessments[1]
  const scoreChange = latestAssessment && previousAssessment 
    ? latestAssessment.score - previousAssessment.score 
    : null

  const totalMilestones = milestone_progress.reduce((sum, mp) => sum + mp.total_milestones, 0)
  const achievedMilestones = milestone_progress.reduce((sum, mp) => sum + mp.achieved_milestones, 0)
  const milestonePercentage = totalMilestones > 0 ? (achievedMilestones / totalMilestones) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {child.name}'s Progress
          </h1>
          <p className="text-gray-600 mt-1">
            Track development milestones and assessment history
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowCreateMilestone(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Milestone
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowCreateNote(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Note
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowCreateIntervention(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Intervention
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Latest Assessment */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Latest Assessment</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold">
                  {latestAssessment ? `${latestAssessment.score}/20` : 'N/A'}
                </span>
                {scoreChange !== null && (
                  <div className={`flex items-center gap-1 text-sm ${
                    scoreChange < 0 ? 'text-green-600' : scoreChange > 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {scoreChange < 0 ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : scoreChange > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : null}
                    {Math.abs(scoreChange)}
                  </div>
                )}
              </div>
              {latestAssessment && (
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                  latestAssessment.risk_level === 'low' ? 'bg-green-100 text-green-800' :
                  latestAssessment.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {latestAssessment.risk_level} risk
                </span>
              )}
            </div>
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        {/* Milestones Progress */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Milestones</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold">
                  {achievedMilestones}/{totalMilestones}
                </span>
                <span className="text-sm text-gray-500">
                  ({milestonePercentage.toFixed(0)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${milestonePercentage}%` }}
                />
              </div>
            </div>
            <Target className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        {/* Active Interventions */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Interventions</p>
              <span className="text-2xl font-bold">
                {dashboardData.active_interventions.length}
              </span>
              <p className="text-sm text-gray-500 mt-1">
                Currently active
              </p>
            </div>
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        {/* Recent Notes */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Recent Notes</p>
              <span className="text-2xl font-bold">
                {dashboardData.recent_notes.length}
              </span>
              <p className="text-sm text-gray-500 mt-1">
                This month
              </p>
            </div>
            <FileText className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="interventions">Interventions</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Assessment Progress</h3>
              <ProgressChart data={chart_data} />
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Milestone Progress by Area</h3>
              <div className="space-y-4">
                {milestone_progress.map((mp) => (
                  <div key={mp.milestone_type} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium capitalize">{mp.milestone_type}</span>
                      <span>{mp.achieved_milestones}/{mp.total_milestones}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${mp.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="milestones">
          <MilestoneTracker 
            childId={childId}
            milestones={dashboardData.milestone_progress}
          />
        </TabsContent>

        <TabsContent value="notes">
          <ProgressNotes 
            childId={childId}
            notes={dashboardData.recent_notes}
          />
        </TabsContent>

        <TabsContent value="interventions">
          <InterventionTracker 
            childId={childId}
            interventions={dashboardData.active_interventions}
          />
        </TabsContent>

        <TabsContent value="timeline">
          <Timeline 
            events={dashboardData.timeline_events}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateMilestoneDialog
        open={showCreateMilestone}
        onOpenChange={setShowCreateMilestone}
        onSubmit={createMilestone}
        childId={childId}
      />

      <CreateNoteDialog
        open={showCreateNote}
        onOpenChange={setShowCreateNote}
        onSubmit={createProgressNote}
        childId={childId}
      />

      <CreateInterventionDialog
        open={showCreateIntervention}
        onOpenChange={setShowCreateIntervention}
        onSubmit={createIntervention}
        childId={childId}
      />
    </div>
  )
}
