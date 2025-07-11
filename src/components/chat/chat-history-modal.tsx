'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { X, MessageCircle, Calendar, Trash2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  id?: number | string
}

interface ChatHistoryItem {
  id: number
  question: string
  answer: string
  timestamp: string
  created_at: string
}

interface ChatHistoryModalProps {
  onClose: () => void
  onLoadChat: (messages: Message[]) => void
}

export function ChatHistoryModal({ onClose, onLoadChat }: ChatHistoryModalProps) {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadChatHistory()
  }, [])

  const loadChatHistory = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('Please log in to view chat history')
        return
      }

      const { data, error: fetchError } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (fetchError) {
        console.error('Error fetching chat history:', fetchError)
        setError('Failed to load chat history')
        return
      }

      setChatHistory(data || [])
    } catch (err) {
      console.error('Error loading chat history:', err)
      setError('Failed to load chat history')
    } finally {
      setLoading(false)
    }
  }

  const deleteChatItem = async (id: number) => {
    try {
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting chat item:', error)
        return
      }

      // Remove from local state
      setChatHistory(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      console.error('Error deleting chat item:', err)
    }
  }

  const loadChatConversation = (item: ChatHistoryItem) => {
    const messages: Message[] = [
      {
        role: 'user',
        content: item.question,
        timestamp: new Date(item.timestamp || item.created_at),
        id: `${item.id}-user`
      },
      {
        role: 'assistant',
        content: item.answer,
        timestamp: new Date(item.timestamp || item.created_at),
        id: `${item.id}-assistant`
      }
    ]
    
    onLoadChat(messages)
  }

  const clearAllHistory = async () => {
    if (!confirm('Are you sure you want to delete all chat history? This cannot be undone.')) {
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('user_id', session.user.id)

      if (error) {
        console.error('Error clearing chat history:', error)
        return
      }

      setChatHistory([])
    } catch (err) {
      console.error('Error clearing chat history:', err)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Chat History</h2>
          </div>
          <div className="flex items-center gap-2">
            {chatHistory.length > 0 && (
              <button
                onClick={clearAllHistory}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading chat history...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">⚠️ {error}</div>
              <button
                onClick={loadChatHistory}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : chatHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No chat history found.</p>
              <p className="text-sm">Start a conversation to see your chat history here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {chatHistory.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => loadChatConversation(item)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {formatDate(item.timestamp || item.created_at)}
                        </span>
                      </div>
                      
                      <div className="mb-2">
                        <div className="text-sm font-medium text-gray-700 mb-1">Question:</div>
                        <div className="text-sm text-gray-900">{truncateText(item.question)}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Answer:</div>
                        <div className="text-sm text-gray-600">{truncateText(item.answer, 150)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteChatItem(item.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all text-red-600"
                        title="Delete this chat"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            Click on any conversation to load it in the chat. Your chat history is private and secure.
          </p>
        </div>
      </div>
    </div>
  )
}
