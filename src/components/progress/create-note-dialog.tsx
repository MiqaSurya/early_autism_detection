'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreateProgressNoteRequest, NOTE_TYPES, NoteType } from '@/types/progress'

interface CreateNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateProgressNoteRequest) => Promise<boolean>
  childId: string
}

export function CreateNoteDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  childId 
}: CreateNoteDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    note_type: '' as NoteType,
    title: '',
    content: '',
    tags: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.note_type || !formData.title || !formData.content) return

    setLoading(true)
    
    const success = await onSubmit({
      child_id: childId,
      note_type: formData.note_type,
      title: formData.title,
      content: formData.content,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined
    })

    if (success) {
      setFormData({
        note_type: '' as NoteType,
        title: '',
        content: '',
        tags: ''
      })
      onOpenChange(false)
    }
    
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Progress Note</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Note Type</label>
            <Select 
              value={formData.note_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, note_type: value as NoteType }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select note type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(NOTE_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief title for this note"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Content</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Describe what you observed or want to note..."
              rows={4}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Tags (Optional)</label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="e.g., speech, behavior, social (comma-separated)"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.note_type || !formData.title || !formData.content}>
              {loading ? 'Saving...' : 'Save Note'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
