'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { supabaseConfig } from '@/lib/env'

export function SupabaseDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSupabaseConfig = async () => {
      try {
        // Check environment variables
        const envInfo = {
          url: supabaseConfig.url,
          hasAnonKey: !!supabaseConfig.anonKey,
          anonKeyLength: supabaseConfig.anonKey?.length || 0,
          anonKeyStart: supabaseConfig.anonKey?.substring(0, 20) + '...',
        }

        // Test authentication
        let authInfo = null
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          authInfo = {
            hasSession: !!session,
            userId: session?.user?.id || null,
            userEmail: session?.user?.email || null,
            sessionError: sessionError?.message || null
          }
        } catch (authError) {
          authInfo = {
            authError: authError instanceof Error ? authError.message : 'Unknown auth error'
          }
        }

        // Test database connection
        let dbInfo = null
        try {
          const { data, error } = await supabase
            .from('children')
            .select('count', { count: 'exact', head: true })
          
          dbInfo = {
            canConnect: !error,
            error: error?.message || null,
            count: data || 0
          }
        } catch (dbError) {
          dbInfo = {
            dbError: dbError instanceof Error ? dbError.message : 'Unknown DB error'
          }
        }

        setDebugInfo({
          env: envInfo,
          auth: authInfo,
          db: dbInfo,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        setDebugInfo({
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      } finally {
        setLoading(false)
      }
    }

    checkSupabaseConfig()
  }, [])

  if (loading) {
    return <div className="p-4 bg-gray-100 rounded">Loading debug info...</div>
  }

  return (
    <div className="p-4 bg-gray-100 rounded text-sm">
      <h3 className="font-bold mb-2">Supabase Debug Info</h3>
      <pre className="whitespace-pre-wrap overflow-auto max-h-96">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  )
}
