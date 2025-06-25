'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { testGeoapifyAPI, searchAutismRelatedPOI } from '@/lib/poi'

export default function TestPOIPage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testAPI = async () => {
    setLoading(true)
    setLogs([])
    addLog('Testing Geoapify API...')
    
    try {
      await testGeoapifyAPI()
      addLog('API test completed - check browser console for details')
    } catch (error) {
      addLog(`API test failed: ${error}`)
    }
    
    setLoading(false)
  }

  const searchPOI = async () => {
    setLoading(true)
    setLogs([])
    setResults([])
    addLog('Searching for autism centers around KL...')
    
    try {
      // Search around KL coordinates
      const places = await searchAutismRelatedPOI(3.1390, 101.6869, 25000, 20)
      setResults(places)
      addLog(`Found ${places.length} autism-related places`)
      places.forEach(place => {
        addLog(`- ${place.name} (${place.category})`)
      })
    } catch (error) {
      addLog(`Search failed: ${error}`)
    }
    
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">POI Search Test</h1>
      
      <div className="space-y-4 mb-6">
        <Button onClick={testAPI} disabled={loading}>
          Test Geoapify API
        </Button>
        
        <Button onClick={searchPOI} disabled={loading}>
          Search Autism Centers (KL)
        </Button>
      </div>

      {loading && (
        <div className="text-blue-600 mb-4">
          Loading... Check browser console for detailed logs.
        </div>
      )}

      {logs.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Logs:</h2>
          <div className="bg-gray-100 p-4 rounded-lg max-h-60 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-sm font-mono">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Search Results ({results.length}):</h2>
          <div className="space-y-2">
            {results.map((place, index) => (
              <div key={index} className="border p-3 rounded-lg">
                <h3 className="font-semibold">{place.name}</h3>
                <p className="text-sm text-gray-600">{place.category}</p>
                <p className="text-sm">{place.formatted}</p>
                {place.distance && (
                  <p className="text-sm text-blue-600">{place.distance}m away</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
