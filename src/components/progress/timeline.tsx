'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TimelineEvent } from '@/types/progress'
import { 
  Calendar, 
  FileText, 
  Target, 
  Activity, 
  BarChart3, 
  Camera 
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

interface TimelineProps {
  events: TimelineEvent[]
}

const getEventIcon = (type: string) => {
  switch (type) {
    case 'assessment':
      return <BarChart3 className="h-4 w-4" />
    case 'milestone':
      return <Target className="h-4 w-4" />
    case 'intervention':
      return <Activity className="h-4 w-4" />
    case 'note':
      return <FileText className="h-4 w-4" />
    case 'photo':
      return <Camera className="h-4 w-4" />
    default:
      return <Calendar className="h-4 w-4" />
  }
}

const getEventColor = (type: string, color?: string) => {
  if (color) {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'red':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'blue':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'purple':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  switch (type) {
    case 'assessment':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'milestone':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'intervention':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'note':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'photo':
      return 'bg-pink-100 text-pink-800 border-pink-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function Timeline({ events }: TimelineProps) {
  if (events.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No timeline events yet
        </h3>
        <p className="text-gray-600">
          Complete assessments and add milestones to see your child's progress timeline.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        {/* Timeline events */}
        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={event.id} className="relative flex items-start gap-4">
              {/* Timeline dot */}
              <div className={`
                flex-shrink-0 w-16 h-16 rounded-full border-4 border-white shadow-md
                flex items-center justify-center
                ${getEventColor(event.type, event.color)}
              `}>
                {getEventIcon(event.type)}
              </div>

              {/* Event content */}
              <Card className="flex-1 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {event.type}
                    </Badge>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>{format(new Date(event.date), 'MMM dd, yyyy')}</div>
                    <div className="text-xs">
                      {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
                    </div>
                  </div>
                </div>

                {event.description && (
                  <p className="text-gray-700 text-sm">{event.description}</p>
                )}
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Load more button (placeholder) */}
      {events.length >= 20 && (
        <div className="text-center">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Load more events
          </button>
        </div>
      )}
    </div>
  )
}
