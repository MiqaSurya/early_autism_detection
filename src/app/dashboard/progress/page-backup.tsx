'use client'

import React, { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Child = {
  id: string
  name: string
  date_of_birth: string
  gender?: string
}

export default function ProgressPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch children')
    } finally {
      setLoading(false)
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 px-4">
        <div className="max-w-4xl mx-auto py-12">
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg border border-white/30 text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-semibold">Back to Dashboard</span>
            </Link>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 text-center shadow-2xl">
            <h2 className="text-3xl font-bold text-blue-600 mb-6">No Children Added Yet</h2>
            <p className="text-xl text-gray-700 mb-8">
              To track progress and view development history, you need to add a child profile first.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 px-4">
      <div className="max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg border border-white/30 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-semibold">Back to Dashboard</span>
          </Link>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-blue-600 mb-6">Progress Tracking</h1>
          <p className="text-gray-700">Children found: {children.length}</p>
        </div>
      </div>
    </div>
  )
}
