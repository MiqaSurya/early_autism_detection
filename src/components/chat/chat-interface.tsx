'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ChatHistoryModal } from './chat-history-modal'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  id?: number | string // Optional ID from history
}

const suggestedQuestions = [
  "What are early signs of autism in toddlers?",
  "How is autism diagnosed?",
  "What therapies are available for children with autism?",
  "How can I support my child's development?",
  "What are common sensory issues in autism?",
  "How can I help my child with social skills?",
  "What educational support is available?",
  "How to handle meltdowns and anxiety?"
]

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...messages,
            { role: 'user', content: userMessage }
          ]
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.content, timestamp: new Date() }])
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm sorry, I'm having trouble responding right now. Please try again later.",
          timestamp: new Date()
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
  }

  // Handle loading a previous conversation from history
  const handleLoadConversation = (historyMessages: any[]) => {
    if (!historyMessages || historyMessages.length === 0) return;
    
    // Convert history messages to the format used by the chat interface
    const formattedMessages = historyMessages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      id: msg.id
    }));
    
    // Set the messages state to the loaded conversation
    setMessages(formattedMessages);
    
    // Scroll to the bottom of the chat after loading history
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  return (
    <div className="card h-[600px] flex flex-col bg-white shadow-lg rounded-lg relative">
      {/* Chat History Modal */}
      <ChatHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectConversation={handleLoadConversation}
      />
      <div className="flex justify-between items-center p-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Autism Information Chat</h2>
        <button
          onClick={() => setShowHistory(true)}
          className="flex items-center gap-2 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
          </svg>
          History
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-messages-container">
        {messages.length === 0 ? (
          <div className="text-center text-neutral-600">
            <p className="mb-4 text-lg font-medium">Welcome to the Autism Information Assistant! How can I help you learn about autism?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="text-left p-3 text-sm bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex flex-col gap-1">
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 dark:bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.id && (
                    <div className="text-xs opacity-70 mt-1 text-right">
                      {typeof message.id === 'string' && message.id.includes('-response') ? 'Saved response' : 'From history'}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 p-3 border rounded-lg"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}
