'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useAutismCenterLocatorSync } from '@/hooks/use-realtime-centers'
import { RefreshCw, Wifi, WifiOff, AlertTriangle, CheckCircle, Database } from 'lucide-react'

export default function TestRealtimePage() {
  const [events, setEvents] = useState<string[]>([])
  const [testResults, setTestResults] = useState<string[]>([])
  const [isRunningTest, setIsRunningTest] = useState(false)
  const [centerCount, setCenterCount] = useState<number>(0)

  const {
    isConnected,
    lastUpdate,
    error,
    retry,
    isPolling
  } = useAutismCenterLocatorSync()

  useEffect(() => {
    // Load initial center count
    loadCenterCount()
  }, [])

  const loadCenterCount = async () => {
    try {
      const { count, error } = await supabase
        .from('autism_centers')
        .select('*', { count: 'exact', head: true })

      if (!error) {
        setCenterCount(count || 0)
      }
    } catch (err) {
      console.error('Failed to load center count:', err)
    }
  }

  const addEvent = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setEvents(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]) // Keep last 50 events
  }

  const runConnectivityTest = async () => {
    setIsRunningTest(true)
    setTestResults([])
    const results: string[] = []

    try {
      // Test 1: Basic database connection
      addEvent('🔄 Testing database connection...')
      results.push('🔄 Testing database connection...')
      
      const { data, error } = await supabase
        .from('autism_centers')
        .select('count')
        .limit(1)

      if (error) {
        results.push(`❌ Database connection failed: ${error.message}`)
        addEvent(`❌ Database connection failed: ${error.message}`)
      } else {
        results.push('✅ Database connection successful')
        addEvent('✅ Database connection successful')
      }

      // Test 2: Real-time subscription test
      addEvent('🔄 Testing real-time subscription...')
      results.push('🔄 Testing real-time subscription...')

      let subscriptionSuccess = false
      const testChannel = supabase
        .channel('connectivity_test')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'autism_centers'
        }, (payload) => {
          subscriptionSuccess = true
          addEvent(`✅ Real-time event received: ${payload.eventType}`)
          results.push(`✅ Real-time event received: ${payload.eventType}`)
        })
        .subscribe((status) => {
          addEvent(`📡 Subscription status: ${status}`)
          results.push(`📡 Subscription status: ${status}`)
        })

      // Wait for subscription
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Test 3: Trigger a test update
      addEvent('🔄 Triggering test update...')
      results.push('🔄 Triggering test update...')

      try {
        // Create and immediately delete a test record
        const { data: insertData, error: insertError } = await supabase
          .from('autism_centers')
          .insert({
            name: 'TEST_REALTIME_DELETE_ME',
            type: 'diagnostic',
            address: 'Test Address',
            latitude: 3.1390,
            longitude: 101.6869,
            verified: false
          })
          .select()
          .single()

        if (insertError) {
          results.push(`❌ Test insert failed: ${insertError.message}`)
          addEvent(`❌ Test insert failed: ${insertError.message}`)
        } else {
          results.push('✅ Test record inserted')
          addEvent('✅ Test record inserted')

          // Delete the test record
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const { error: deleteError } = await supabase
            .from('autism_centers')
            .delete()
            .eq('id', insertData.id)

          if (deleteError) {
            results.push(`❌ Test delete failed: ${deleteError.message}`)
            addEvent(`❌ Test delete failed: ${deleteError.message}`)
          } else {
            results.push('✅ Test record deleted')
            addEvent('✅ Test record deleted')
          }
        }
      } catch (err) {
        results.push(`❌ Test update error: ${err}`)
        addEvent(`❌ Test update error: ${err}`)
      }

      // Wait for real-time events
      await new Promise(resolve => setTimeout(resolve, 3000))

      if (!subscriptionSuccess) {
        results.push('❌ No real-time events received')
        addEvent('❌ No real-time events received')
      }

      // Cleanup
      testChannel.unsubscribe()

    } catch (err) {
      results.push(`❌ Test error: ${err}`)
      addEvent(`❌ Test error: ${err}`)
    }

    setTestResults(results)
    setIsRunningTest(false)
    loadCenterCount() // Refresh count
  }

  const clearEvents = () => {
    setEvents([])
    setTestResults([])
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Real-time Connection Test</h1>
        <Button onClick={() => window.history.back()} variant="outline">
          ← Back
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
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
                <Badge variant="secondary">Polling</Badge>
              )}
            </div>
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
            {lastUpdate && (
              <p className="text-xs text-gray-500 mt-1">
                Last update: {lastUpdate.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Database Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              <span className="text-lg font-semibold">{centerCount}</span>
              <span className="text-sm text-gray-600">centers</span>
            </div>
            <Button
              onClick={loadCenterCount}
              variant="ghost"
              size="sm"
              className="mt-1 h-6 px-2 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={runConnectivityTest}
              disabled={isRunningTest}
              size="sm"
              className="w-full"
            >
              {isRunningTest ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Testing...
                </>
              ) : (
                'Run Connectivity Test'
              )}
            </Button>
            <Button onClick={retry} variant="outline" size="sm" className="w-full">
              Retry Connection
            </Button>
            <Button onClick={clearEvents} variant="ghost" size="sm" className="w-full">
              Clear Events
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-3 rounded space-y-1 max-h-60 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Events */}
      <Card>
        <CardHeader>
          <CardTitle>Live Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-3 rounded font-mono text-sm max-h-80 overflow-y-auto">
            {events.length === 0 ? (
              <div className="text-gray-500">No events yet... Run a test to see real-time events.</div>
            ) : (
              events.map((event, index) => (
                <div key={index} className="mb-1">
                  {event}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Check the connection status above</li>
            <li>Run the connectivity test to verify real-time functionality</li>
            <li>Open another tab and update a center via the center portal</li>
            <li>Watch for real-time events in the Live Events section</li>
            <li>If no events appear, check the browser console for errors</li>
            <li>Verify Supabase real-time settings in the dashboard</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
