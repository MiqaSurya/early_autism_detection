'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface ChatMessage {
  id: number | string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface Conversation {
  date: string
  messages: ChatMessage[]
}

interface ChatHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectConversation: (messages: ChatMessage[]) => void
}

export function ChatHistoryModal({ isOpen, onClose, onSelectConversation }: ChatHistoryModalProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (isOpen) {
      checkHistoryTableAndFetch()
    }
  }, [isOpen])
  
  const checkHistoryTableAndFetch = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Check if user is authenticated first
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('Please log in to view your chat history.')
        setLoading(false)
        return
      }
      
      // Check if chat history table exists
      const initResponse = await fetch('/api/chat/init-history', {
        method: 'GET',
        credentials: 'include'
      })
      
      const initData = await initResponse.json()
      console.log('Init response:', initData)
      
      if (initResponse.ok && initData.success) {
        // Table exists, proceed to fetch history
        fetchChatHistory()
      } else if (initData.needsSetup) {
        // Table doesn't exist
        setError(`Chat history is not yet set up in the database. Details: ${initData.details || 'No details provided'}`)
        setLoading(false)
      } else {
        // Other error
        setError(`Unable to access chat history: ${initData.error || 'Unknown error'}. ${initData.details ? `Details: ${initData.details}` : ''}`)
        setLoading(false)
      }
    } catch (err) {
      console.error('Error checking chat history table:', err)
      setError('Failed to check chat history availability. Please try again.')
      setLoading(false)
    }
  }

  const fetchChatHistory = async () => {
    try {      
      // Fetch chat history with credentials
      const response = await fetch('/api/chat/history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Important for including cookies
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Failed to fetch chat history')
      }
      
      const data = await response.json()
      
      if (!data.history) {
        console.warn('No history data in response:', data)
        setConversations([])
      } else {
        console.log(`Loaded ${data.history.length} conversation groups`)
        setConversations(data.history)
      }
    } catch (err) {
      console.error('Error fetching chat history:', err)
      setError('Failed to load chat history. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  const getConversationPreview = (messages: ChatMessage[]) => {
    // Find the first user message to use as preview
    const firstUserMessage = messages.find(msg => msg.role === 'user')
    return firstUserMessage?.content || 'Conversation'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Chat History</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-500 dark:text-gray-400">Loading chat history...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 dark:text-red-400 p-4">
              {error}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 p-4">
              No chat history found.
            </div>
          ) : (
            <div className="space-y-6">
              {conversations.map((conversation, index) => (
                <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2 px-2">
                    {conversation.date}
                  </h3>
                  <ul className="space-y-2">
                    <li 
                      className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                      onClick={() => {
                        onSelectConversation(conversation.messages)
                        onClose()
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-gray-900 dark:text-white truncate max-w-[80%]">
                          {getConversationPreview(conversation.messages)}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {conversation.messages.length / 2} messages
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                        Click to continue this conversation
                      </p>
                    </li>
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
