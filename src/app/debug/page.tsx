'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DebugPage() {
  const [email, setEmail] = useState('')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkUser = async () => {
    if (!email) return
    
    setLoading(true)
    try {
      // Check profiles table for this email
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)

      console.log('Profiles:', profiles)
      console.log('Profiles error:', profilesError)

      // Check autism_centers table
      const { data: centers, error: centersError } = await supabase
        .from('autism_centers')
        .select('*')
        .eq('email', email)

      console.log('Centers:', centers)
      console.log('Centers error:', centersError)

      setResults({
        profiles: profiles || [],
        profilesError,
        centers: centers || [],
        centersError
      })

    } catch (error) {
      console.error('Debug error:', error)
      setResults({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Database Debug Tool</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Email to check:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter email address"
            />
          </div>
          
          <button
            onClick={checkUser}
            disabled={loading || !email}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check User'}
          </button>
        </div>

        {results && (
          <div className="mt-6 bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Results:</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
