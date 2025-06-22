'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreateInterventionRequest, INTERVENTION_TYPES, InterventionType } from '@/types/progress'

interface CreateInterventionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateInterventionRequest) => Promise<boolean>
  childId: string
}

export function CreateInterventionDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  childId 
}: CreateInterventionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    intervention_type: '' as InterventionType,
    name: '',
    description: '',
    provider_name: '',
    provider_contact: '',
    start_date: '',
    frequency: '',
    goals: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.intervention_type || !formData.name || !formData.start_date) return

    setLoading(true)
    
    const success = await onSubmit({
      child_id: childId,
      intervention_type: formData.intervention_type,
      name: formData.name,
      description: formData.description || undefined,
      provider_name: formData.provider_name || undefined,
      provider_contact: formData.provider_contact || undefined,
      start_date: formData.start_date,
      frequency: formData.frequency || undefined,
      goals: formData.goals ? formData.goals.split('\n').filter(Boolean) : undefined
    })

    if (success) {
      setFormData({
        intervention_type: '' as InterventionType,
        name: '',
        description: '',
        provider_name: '',
        provider_contact: '',
        start_date: '',
        frequency: '',
        goals: ''
      })
      onOpenChange(false)
    }
    
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Intervention</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
          <div>
            <label className="text-sm font-medium">Intervention Type</label>
            <Select 
              value={formData.intervention_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, intervention_type: value as InterventionType }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select intervention type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INTERVENTION_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Speech Therapy, ABA Therapy"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description (Optional)</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the intervention"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Provider Name (Optional)</label>
              <Input
                value={formData.provider_name}
                onChange={(e) => setFormData(prev => ({ ...prev, provider_name: e.target.value }))}
                placeholder="Dr. Smith"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Provider Contact (Optional)</label>
              <Input
                value={formData.provider_contact}
                onChange={(e) => setFormData(prev => ({ ...prev, provider_contact: e.target.value }))}
                placeholder="Phone or email"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Frequency (Optional)</label>
              <Input
                value={formData.frequency}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                placeholder="e.g., 2x per week"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Goals (Optional)</label>
            <Textarea
              value={formData.goals}
              onChange={(e) => setFormData(prev => ({ ...prev, goals: e.target.value }))}
              placeholder="Enter each goal on a new line"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.intervention_type || !formData.name || !formData.start_date}>
              {loading ? 'Creating...' : 'Create Intervention'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
