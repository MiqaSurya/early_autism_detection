'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useAutismCenterLocatorSync } from '@/hooks/use-realtime-centers'
import { RefreshCw, Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react'

interface RealtimeDebugPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function RealtimeDebugPanel({ isOpen, onClose }: RealtimeDebugPanelProps) {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [testResults, setTestResults] = useState<string[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)

  const {
    isConnected,
    lastUpdate,
    error,
    retry,
    isPolling
  } = useAutismCenterLocatorSync()

  useEffect(() => {
    if (isOpen) {
      collectDebugInfo()
    }
  }, [isOpen])

  const collectDebugInfo = async () => {
    const info: any = {
      timestamp: new Date().toISOString(),
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      userAgent: navigator.userAgent,
      connection: navigator.onLine ? 'online' : 'offline',
      realtimeStatus: {
        isConnected,
        lastUpdate: lastUpdate?.toISOString(),
        error,
        isPolling
      }
    }

    try {
      // Test basic database connection
      const { data, error: dbError } = await supabase
        .from('autism_centers')
        .select('count')
        .limit(1)

      info.databaseConnection = {
        success: !dbError,
        error: dbError?.message,
        recordCount: data?.length || 0
      }
    } catch (err) {
      info.databaseConnection = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    setDebugInfo(info)
  }

  const runRealtimeTests = async () => {
    setIsRunningTests(true)
    setTestResults([])
    const results: string[] = []

    try {
      // Test 1: Basic connection
      results.push('🔄 Testing basic Supabase connection...')
      const { data, error } = await supabase
        .from('autism_centers')
        .select('id')
        .limit(1)

      if (error) {
        results.push(`❌ Database connection failed: ${error.message}`)
      } else {
        results.push('✅ Database connection successful')
      }

      // Test 2: Real-time subscription
      results.push('🔄 Testing real-time subscription...')
      let subscriptionWorking = false

      const testChannel = supabase
        .channel('test_realtime_connection')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'autism_centers'
        }, (payload) => {
          subscriptionWorking = true
          results.push('✅ Real-time event received!')
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            results.push('✅ Real-time subscription established')
          } else if (status === 'CHANNEL_ERROR') {
            results.push('❌ Real-time subscription failed')
          }
        })

      // Wait for subscription to establish
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Test 3: Trigger a test update
      results.push('🔄 Triggering test update...')
      try {
        const { error: updateError } = await supabase.rpc('test_realtime_update')
        if (updateError) {
          results.push(`❌ Test update failed: ${updateError.message}`)
        } else {
          results.push('✅ Test update triggered')
        }
      } catch (err) {
        results.push('⚠️ Test update function not available (this is normal)')
      }

      // Wait for real-time event
      await new Promise(resolve => setTimeout(resolve, 3000))

      if (!subscriptionWorking) {
        results.push('❌ No real-time events received')
      }

      // Cleanup
      testChannel.unsubscribe()

      // Test 4: Check RLS policies
      results.push('🔄 Testing RLS policies...')
      const { data: policyData, error: policyError } = await supabase
        .from('autism_centers')
        .select('*')
        .limit(1)

      if (policyError) {
        results.push(`❌ RLS policy issue: ${policyError.message}`)
      } else {
        results.push('✅ RLS policies allow read access')
      }

    } catch (err) {
      results.push(`❌ Test error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    setTestResults(results)
    setIsRunningTests(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Real-time Debug Panel
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Connection Status</h3>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Connected
                    </Badge>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-red-500" />
                    <Badge variant="destructive">Disconnected</Badge>
                  </>
                )}
                {isPolling && (
                  <Badge variant="secondary">Polling Mode</Badge>
                )}
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              )}
              {lastUpdate && (
                <p className="text-sm text-gray-600">
                  Last update: {lastUpdate.toLocaleString()}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Actions</h3>
              <div className="flex gap-2">
                <Button onClick={retry} size="sm">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry Connection
                </Button>
                <Button onClick={collectDebugInfo} variant="outline" size="sm">
                  Refresh Info
                </Button>
              </div>
            </div>
          </div>

          {/* Debug Information */}
          <div>
            <h3 className="font-semibold mb-2">Debug Information</h3>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>

          {/* Real-time Tests */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Real-time Tests</h3>
              <Button 
                onClick={runRealtimeTests} 
                disabled={isRunningTests}
                size="sm"
              >
                {isRunningTests ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  'Run Tests'
                )}
              </Button>
            </div>
            {testResults.length > 0 && (
              <div className="bg-gray-100 p-3 rounded space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div>
            <h3 className="font-semibold mb-2">Troubleshooting Steps</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Check if real-time is enabled in Supabase dashboard</li>
              <li>Verify RLS policies allow public read access</li>
              <li>Ensure REPLICA IDENTITY is set to FULL</li>
              <li>Check browser console for WebSocket errors</li>
              <li>Try refreshing the page</li>
              <li>Check network connectivity</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
