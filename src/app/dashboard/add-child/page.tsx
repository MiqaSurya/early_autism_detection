'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, User, Calendar, Save } from 'lucide-react'
import Link from 'next/link'

export default function AddChildPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    date_of_birth: '',
    gender: '',
    additional_notes: ''
  })

  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.date_of_birth) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all required fields'
      })
      return
    }

    setLoading(true)
    
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('children')
        .insert([{
          parent_id: user.user.id,
          name: formData.name,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender || null,
          additional_notes: formData.additional_notes || null
        }])

      if (error) throw error

      toast({
        title: 'Success!',
        description: `${formData.name}'s profile has been created successfully!`
      })

      // Redirect back to progress page
      router.push('/dashboard/progress')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create child profile'
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return ''
    
    const today = new Date()
    const birth = new Date(dateOfBirth)
    const ageInMonths = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    
    if (ageInMonths < 12) {
      return `${ageInMonths} months old`
    } else {
      const years = Math.floor(ageInMonths / 12)
      const months = ageInMonths % 12
      return months > 0 ? `${years} years ${months} months old` : `${years} years old`
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard/progress"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Progress
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add Child Profile</h1>
              <p className="text-gray-600">Create a profile to start tracking development progress</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Child's Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Child's Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your child's name"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Calendar className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
              {formData.date_of_birth && (
                <p className="text-sm text-blue-600 mt-2 font-medium">
                  {calculateAge(formData.date_of_birth)}
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender (Optional)
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={formData.additional_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
                placeholder="Any additional information about your child (medical conditions, special needs, etc.)"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Privacy & Security</h3>
              <p className="text-sm text-blue-700">
                Your child's information is securely encrypted and stored. Only you can access this data. 
                We use this information to personalize the assessment experience and track development progress.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Link
                href="/dashboard/progress"
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !formData.name || !formData.date_of_birth}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Create Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-2">What happens next?</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Your child's profile will be created securely</li>
            <li>• You can start taking M-CHAT-R assessments</li>
            <li>• Track development milestones and progress over time</li>
            <li>• Add notes and observations about your child's development</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
