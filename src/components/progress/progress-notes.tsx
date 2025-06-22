'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProgressNote, NOTE_TYPES } from '@/types/progress'
import { FileText, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface ProgressNotesProps {
  childId: string
  notes: ProgressNote[]
}

export function ProgressNotes({ childId, notes }: ProgressNotesProps) {
  if (notes.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No progress notes yet
        </h3>
        <p className="text-gray-600">
          Start documenting your child's development and observations.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <Card key={note.id} className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg">{note.title}</h3>
              <Badge variant="secondary">
                {NOTE_TYPES[note.note_type]}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              {format(new Date(note.created_at), 'MMM dd, yyyy')}
            </div>
          </div>
          
          <p className="text-gray-700 mb-3">{note.content}</p>
          
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {note.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
