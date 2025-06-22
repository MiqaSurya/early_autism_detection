'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MilestoneProgress, MILESTONE_TYPES } from '@/types/progress'
import { CheckCircle2, Circle, Plus, Target } from 'lucide-react'

interface MilestoneTrackerProps {
  childId: string
  milestones: MilestoneProgress[]
}

export function MilestoneTracker({ childId, milestones }: MilestoneTrackerProps) {
  const [selectedType, setSelectedType] = useState<string>('all')

  const filteredMilestones = selectedType === 'all' 
    ? milestones 
    : milestones.filter(m => m.milestone_type === selectedType)

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedType === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedType('all')}
        >
          All Areas
        </Button>
        {Object.entries(MILESTONE_TYPES).map(([key, label]) => (
          <Button
            key={key}
            variant={selectedType === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Milestone Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMilestones.map((milestone) => (
          <Card key={milestone.milestone_type} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg capitalize">
                {MILESTONE_TYPES[milestone.milestone_type]}
              </h3>
              <Target className="h-5 w-5 text-blue-600" />
            </div>

            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{milestone.achieved_milestones}/{milestone.total_milestones}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${milestone.progress_percentage}%` }}
                  />
                </div>
                <div className="text-center">
                  <Badge variant="secondary">
                    {milestone.progress_percentage.toFixed(0)}% Complete
                  </Badge>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-lg font-bold text-green-600">
                      {milestone.achieved_milestones}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Achieved</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <Circle className="h-4 w-4 text-gray-400" />
                    <span className="text-lg font-bold text-gray-600">
                      {milestone.total_milestones - milestone.achieved_milestones}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Remaining</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredMilestones.length === 0 && (
        <Card className="p-12 text-center">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No milestones yet
          </h3>
          <p className="text-gray-600 mb-4">
            Start tracking your child's development by adding milestones.
          </p>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add First Milestone
          </Button>
        </Card>
      )}

      {/* Summary Card */}
      {milestones.length > 0 && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">
                Overall Milestone Progress
              </h3>
              <p className="text-blue-700 text-sm">
                Your child has achieved{' '}
                <span className="font-semibold">
                  {milestones.reduce((sum, m) => sum + m.achieved_milestones, 0)}
                </span>{' '}
                out of{' '}
                <span className="font-semibold">
                  {milestones.reduce((sum, m) => sum + m.total_milestones, 0)}
                </span>{' '}
                tracked milestones across all development areas.
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-900">
                  {milestones.length > 0 
                    ? Math.round(
                        milestones.reduce((sum, m) => sum + m.progress_percentage, 0) / milestones.length
                      )
                    : 0
                  }%
                </div>
                <div className="text-sm text-blue-700">Average</div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
