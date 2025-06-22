'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Intervention, INTERVENTION_TYPES } from '@/types/progress'
import { Activity, Calendar, Phone, Star } from 'lucide-react'
import { format } from 'date-fns'

interface InterventionTrackerProps {
  childId: string
  interventions: Intervention[]
}

export function InterventionTracker({ childId, interventions }: InterventionTrackerProps) {
  if (interventions.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No interventions tracked
        </h3>
        <p className="text-gray-600">
          Track therapies, treatments, and other interventions here.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {interventions.map((intervention) => (
        <Card key={intervention.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg">{intervention.name}</h3>
              <Badge variant="secondary">
                {INTERVENTION_TYPES[intervention.intervention_type]}
              </Badge>
              {intervention.is_active && (
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              )}
            </div>
            
            {intervention.effectiveness_rating && (
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < intervention.effectiveness_rating!
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {intervention.description && (
            <p className="text-gray-700 mb-4">{intervention.description}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Started: {format(new Date(intervention.start_date), 'MMM dd, yyyy')}</span>
              </div>
              {intervention.frequency && (
                <div className="text-sm text-gray-600">
                  Frequency: {intervention.frequency}
                </div>
              )}
            </div>

            {intervention.provider_name && (
              <div className="space-y-2">
                <div className="text-sm font-medium">{intervention.provider_name}</div>
                {intervention.provider_contact && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    {intervention.provider_contact}
                  </div>
                )}
              </div>
            )}
          </div>

          {intervention.goals && intervention.goals.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-sm mb-2">Goals:</h4>
              <ul className="list-disc list-inside space-y-1">
                {intervention.goals.map((goal, index) => (
                  <li key={index} className="text-sm text-gray-700">{goal}</li>
                ))}
              </ul>
            </div>
          )}

          {intervention.progress_notes && (
            <div className="mb-4">
              <h4 className="font-medium text-sm mb-2">Progress Notes:</h4>
              <p className="text-sm text-gray-700">{intervention.progress_notes}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Edit
            </Button>
            <Button variant="outline" size="sm">
              Add Progress Note
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
