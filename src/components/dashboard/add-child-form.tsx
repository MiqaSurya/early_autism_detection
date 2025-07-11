'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

type Props = {
  onSuccess: () => void
  onCancel: () => void
}

export function AddChildForm({ onSuccess, onCancel }: Props) {
  const [name, setName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male')
  const [loading, setLoading] = useState(false)

  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get the current user
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('children')
        .insert({
          parent_id: user.user.id,
          name,
          date_of_birth: dateOfBirth,
          gender
        })

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Child profile created successfully'
      })
      onSuccess()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create child profile'
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label htmlFor="dateOfBirth" className="block text-sm font-medium mb-1">
          Date of Birth
        </label>
        <input
          id="dateOfBirth"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          required
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label htmlFor="gender" className="block text-sm font-medium mb-1">
          Gender
        </label>
        <select
          id="gender"
          value={gender}
          onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Creating...' : 'Create Profile'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  )
}
