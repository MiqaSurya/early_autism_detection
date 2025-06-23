'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/components/ui/use-toast'
import { ProgressDashboard } from '@/components/progress/progress-dashboard'
import { AssessmentHistory } from '@/components/progress/assessment-history'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Plus, Users, UserPlus, Trash2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

type Child = {
  id: string
  name: string
  date_of_birth: string
  gender?: string
}

export default function ProgressPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    childId: string
    childName: string
  }>({ isOpen: false, childId: '', childName: '' })

  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchChildren()
  }, [])

  const fetchChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('id, name, date_of_birth, gender')
        .order('created_at', { ascending: false })

      if (error) throw error

      setChildren(data || [])
      if (data && data.length > 0) {
        setSelectedChildId(data[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch children')
    } finally {
      setLoading(false)
    }
  }

  const openDeleteDialog = (childId: string, childName: string) => {
    setDeleteDialog({ isOpen: true, childId, childName })
  }

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, childId: '', childName: '' })
  }

  const confirmDeleteChild = async () => {
    const { childId, childName } = deleteDialog
    setDeleteLoading(childId)

    try {
      const { error } = await supabase
        .from('children')
        .delete()
        .eq('id', childId)

      if (error) throw error

      toast({
        title: 'Profile Deleted',
        description: `${childName}'s profile has been permanently deleted.`
      })

      // Refresh the children list
      await fetchChildren()

      // If the deleted child was selected, clear selection
      if (selectedChildId === childId) {
        setSelectedChildId('')
      }

      closeDeleteDialog()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete child profile'
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      })
    } finally {
      setDeleteLoading(null)
    }
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birth = new Date(dateOfBirth)
    const ageInMonths = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    
    if (ageInMonths < 12) {
      return `${ageInMonths} months`
    } else {
      const years = Math.floor(ageInMonths / 12)
      const months = ageInMonths % 12
      return months > 0 ? `${years}y ${months}m` : `${years} years`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (children.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <Card className="p-12 text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No Children Added Yet
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            To track progress and view development history, you need to add a child profile first.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard/add-child">
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold">
                <Plus className="h-5 w-5" />
                Add Child Profile
              </button>
            </Link>
            <Link href="/dashboard/add-child">
              <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg flex items-center gap-2 font-semibold">
                <Users className="h-4 w-4" />
                Manage Children
              </button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with Child Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Progress Tracking</h1>
          <p className="text-gray-600 mt-1">
            Monitor development milestones and assessment history
          </p>
        </div>

        <div className="flex items-center gap-4">
          {children.length > 1 && (
            <>
              <label className="text-sm font-medium text-gray-700">
                Select Child:
              </label>
              <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select a child" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{child.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {calculateAge(child.date_of_birth)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          {/* Add Child Button - Always visible when children exist */}
          {children.length > 0 && (
            <Link href="/dashboard/add-child">
              <button className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add Another Child
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Children Management Section */}
      {children.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6">Manage Children Profiles</h2>

          {/* Warning about deletion */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Important Notice</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Deleting a child profile will permanently remove all associated data including assessments,
                  progress notes, milestones, and intervention records. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => (
              <div
                key={child.id}
                className={`border rounded-lg p-6 transition-all ${
                  selectedChildId === child.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{child.name}</h3>
                    <p className="text-sm text-gray-600">
                      {calculateAge(child.date_of_birth)}
                    </p>
                    {child.gender && (
                      <p className="text-sm text-gray-500 capitalize">{child.gender}</p>
                    )}
                  </div>

                  <button
                    onClick={() => openDeleteDialog(child.id, child.name)}
                    disabled={deleteLoading === child.id}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title={`Delete ${child.name}'s profile`}
                  >
                    {deleteLoading === child.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setSelectedChildId(child.id)}
                    className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedChildId === child.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {selectedChildId === child.id ? 'Selected' : 'Select for Progress'}
                  </button>

                  <Link
                    href="/dashboard/questionnaire"
                    className="block w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium text-center hover:bg-green-700 transition-colors"
                  >
                    Take Assessment
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assessment History */}
      {selectedChildId && (
        <AssessmentHistory childId={selectedChildId} />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteChild}
        title={`Delete ${deleteDialog.childName}'s Profile?`}
        description={`This will permanently delete ${deleteDialog.childName}'s profile and all associated data. This action cannot be undone.`}
        confirmText="Delete Profile"
        cancelText="Cancel"
        variant="danger"
        loading={deleteLoading === deleteDialog.childId}
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
          <h4 className="font-medium text-red-800 mb-2">The following data will be permanently deleted:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            <li>• All assessment history and scores</li>
            <li>• All progress notes and observations</li>
            <li>• All developmental milestones</li>
            <li>• All intervention records</li>
            <li>• All saved progress data</li>
          </ul>
        </div>
      </ConfirmationDialog>
    </div>
  )
}
