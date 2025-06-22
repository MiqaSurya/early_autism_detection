'use client'

import { useState } from 'react'
import { CreateChildDialog } from '@/components/progress/create-child-dialog'

export default function TestDialogPage() {
  const [showDialog, setShowDialog] = useState(false)

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Dialog Test Page</h1>
        
        <div className="space-y-4">
          <p>Dialog State: <strong>{showDialog ? 'OPEN' : 'CLOSED'}</strong></p>
          
          <button
            onClick={() => {
              console.log('Button clicked, setting showDialog to true')
              alert('Button clicked! Opening dialog...')
              setShowDialog(true)
            }}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Open Dialog
          </button>
          
          <button
            onClick={() => setShowDialog(false)}
            className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Close Dialog
          </button>
          
          <button
            onClick={() => setShowDialog(!showDialog)}
            className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Toggle Dialog
          </button>
        </div>
      </div>

      <CreateChildDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onChildCreated={() => {
          console.log('Child created successfully!')
          alert('Child created!')
        }}
      />
    </div>
  )
}
