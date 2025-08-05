'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, User, Calendar, Save, Edit } from 'lucide-react'
import Link from 'next/link'

export default function AddChildPage() {
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [childId, setChildId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    date_of_birth: '',
    gender: '',
    additional_notes: ''
  })

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { toast } = useToast()

  // Check if we're editing an existing child
  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId) {
      setIsEditing(true)
      setChildId(editId)
      fetchChildData(editId)
    }
  }, [searchParams])

  const fetchChildData = async (id: string) => {
    try {
      const { data: child, error } = await supabase
        .from('children')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (child) {
        setFormData({
          name: child.name || '',
          date_of_birth: child.date_of_birth || '',
          gender: child.gender || '',
          additional_notes: child.additional_notes || ''
        })
      }
    } catch (error) {
      console.error('Error fetching child data:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load child information. Please try again.'
      })
    }
  }

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
      const { data: user, error: userError } = await supabase.auth.getUser()

      if (!user.user) {
        throw new Error('Not authenticated')
      }

      if (isEditing && childId) {
        // Update existing child
        console.log('📝 Updating child with data:', {
          name: formData.name,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender || null,
          additional_notes: formData.additional_notes || null
        })

        const { data: child, error } = await supabase
          .from('children')
          .update({
            name: formData.name,
            date_of_birth: formData.date_of_birth,
            gender: formData.gender || null,
            additional_notes: formData.additional_notes || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', childId)
          .eq('parent_id', user.user.id)
          .select()
          .single()

        if (error) {
          console.error('❌ Update error:', error)
          throw error
        }

        console.log('✅ Child profile updated successfully:', child)

        toast({
          title: 'Success! 🎉',
          description: `${formData.name}'s profile has been updated successfully.`
        })
      } else {
        // Create new child
        console.log('🔍 Starting child creation process...')

        // Check if user has a profile, create one if missing
        console.log('🔍 Checking user profile...')
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.user.id)
          .single()

        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          console.log('📝 Creating missing user profile...')
          const { error: createProfileError } = await supabase
            .from('profiles')
            .insert({
              id: user.user.id,
              display_name: user.user.email?.split('@')[0] || 'User',
              email: user.user.email,
              email_verified: true
            })

          if (createProfileError) {
            console.error('❌ Error creating profile:', createProfileError)
            throw new Error('Failed to create user profile. Please contact support.')
          }
          console.log('✅ User profile created successfully')
        }

        console.log('📝 Creating child with data:', {
          parent_id: user.user.id,
          name: formData.name,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender || null,
          additional_notes: formData.additional_notes || null
        })

        const { data: child, error } = await supabase
          .from('children')
          .insert([{
            parent_id: user.user.id,
            name: formData.name,
            date_of_birth: formData.date_of_birth,
            gender: formData.gender || null,
            additional_notes: formData.additional_notes || null
          }])
          .select()
          .single()

        console.log('💾 Database result:', { child, error: error?.message })

        if (error) {
          console.error('❌ Database error:', error)
          throw error
        }

        console.log('✅ Child created successfully!')

        toast({
          title: 'Success!',
          description: `${formData.name}'s profile has been created successfully!`
        })
      }

      // Redirect back to progress page
      router.push('/dashboard/progress')
    } catch (err) {
      console.error('❌ Error saving child:', err)

      let errorMessage = isEditing ? 'Failed to update child profile' : 'Failed to create child profile'

      if (err instanceof Error) {
        errorMessage = err.message

        // Handle specific error types
        if (err.message.includes('duplicate key')) {
          errorMessage = 'A child with this information already exists'
        } else if (err.message.includes('foreign key') || err.message.includes('23503')) {
          errorMessage = 'User profile issue detected. Please refresh the page and try again. If the problem persists, contact support.'
        } else if (err.message.includes('permission denied')) {
          errorMessage = 'Permission denied. Please check your account permissions.'
        } else if (err.message.includes('row-level security')) {
          errorMessage = 'Database security error. Please contact support.'
        } else if (err.message.includes('children_parent_id_fkey')) {
          errorMessage = 'User profile not found. Please log out and log back in, then try again.'
        }
      }

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 relative overflow-hidden">
      {/* Background decorative autism-themed elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Learning blocks - top right */}
        <div className="absolute top-10 right-10 opacity-8 transform -rotate-6">
          <div className="grid grid-cols-3 gap-2">
            <div className="w-6 h-6 bg-red-400 rounded"></div>
            <div className="w-6 h-6 bg-blue-400 rounded"></div>
            <div className="w-6 h-6 bg-green-400 rounded"></div>
            <div className="w-6 h-6 bg-yellow-400 rounded"></div>
            <div className="w-6 h-6 bg-purple-400 rounded"></div>
            <div className="w-6 h-6 bg-pink-400 rounded"></div>
          </div>
        </div>

        {/* Heart puzzle - bottom left */}
        <div className="absolute bottom-20 left-10 opacity-10 transform rotate-12">
          <div className="relative w-20 h-16">
            <div className="absolute top-0 left-0 w-10 h-10 bg-pink-400 rounded-full transform rotate-45"></div>
            <div className="absolute top-0 right-0 w-10 h-10 bg-pink-400 rounded-full transform rotate-45"></div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-10 border-r-10 border-t-12 border-l-transparent border-r-transparent border-t-pink-400"></div>
            {/* Small puzzle piece overlay */}
            <div className="absolute top-2 left-2 w-4 h-4 bg-white rounded relative">
              <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
              <div className="absolute -right-0.5 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-pink-400 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Floating puzzle pieces */}
        <div className="absolute top-1/3 left-1/4 opacity-6">
          <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded relative">
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full"></div>
            <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>

        <div className="absolute top-2/3 right-1/3 opacity-6">
          <div className="w-5 h-5 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded relative">
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
            <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full"></div>
          </div>
        </div>

        {/* Scattered colorful dots */}
        <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-blue-400 rounded-full opacity-20"></div>
        <div className="absolute top-3/4 left-1/3 w-1.5 h-1.5 bg-red-400 rounded-full opacity-20"></div>
        <div className="absolute bottom-1/3 right-1/2 w-3 h-3 bg-yellow-400 rounded-full opacity-15"></div>

        {/* Small rainbow arc */}
        <div className="absolute top-1/2 right-10 opacity-8">
          <div className="w-16 h-8 border-t-2 border-red-400 rounded-t-full"></div>
          <div className="w-14 h-7 border-t-2 border-orange-400 rounded-t-full mt-0.5 ml-1"></div>
          <div className="w-12 h-6 border-t-2 border-yellow-400 rounded-t-full mt-0.5 ml-2"></div>
          <div className="w-10 h-5 border-t-2 border-green-400 rounded-t-full mt-0.5 ml-3"></div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 relative z-10">
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
              {isEditing ? (
                <Edit className="h-6 w-6 text-blue-600" />
              ) : (
                <User className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEditing ? 'Edit Child Profile' : 'Add Child Profile'}
              </h1>
              <p className="text-gray-600">
                {isEditing
                  ? 'Update your child\'s profile information'
                  : 'Create a profile to start tracking development progress'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
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
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isEditing ? 'Update Profile' : 'Create Profile'}
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
