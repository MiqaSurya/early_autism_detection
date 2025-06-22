'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreateMilestoneRequest, MILESTONE_TYPES, MilestoneType } from '@/types/progress'

interface CreateMilestoneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateMilestoneRequest) => Promise<boolean>
  childId: string
}

export function CreateMilestoneDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  childId 
}: CreateMilestoneDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    milestone_type: '' as MilestoneType,
    title: '',
    description: '',
    target_age_months: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.milestone_type || !formData.title) return

    setLoading(true)
    
    const success = await onSubmit({
      child_id: childId,
      milestone_type: formData.milestone_type,
      title: formData.title,
      description: formData.description || undefined,
      target_age_months: formData.target_age_months ? parseInt(formData.target_age_months) : undefined
    })

    if (success) {
      setFormData({
        milestone_type: '' as MilestoneType,
        title: '',
        description: '',
        target_age_months: ''
      })
      onOpenChange(false)
    }
    
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Milestone</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Milestone Type</label>
            <Select 
              value={formData.milestone_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, milestone_type: value as MilestoneType }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select milestone type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MILESTONE_TYPES).map(([key, label]) => (
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
              placeholder="e.g., First words, Walking independently"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description (Optional)</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Additional details about this milestone"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Target Age (Months, Optional)</label>
            <Input
              type="number"
              value={formData.target_age_months}
              onChange={(e) => setFormData(prev => ({ ...prev, target_age_months: e.target.value }))}
              placeholder="e.g., 12"
              min="0"
              max="216"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.milestone_type || !formData.title}>
              {loading ? 'Creating...' : 'Create Milestone'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
