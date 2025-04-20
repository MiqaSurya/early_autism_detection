'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const suggestedQuestions = [
  "What are early signs of autism in toddlers?",
  "How is autism diagnosed?",
  "What therapies are available for children with autism?",
  "How can I support my child's development?",
]

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are an autism information specialist providing accurate, research-based information about autism spectrum disorder (ASD). Your responses should be clear, supportive, and based on current scientific understanding. Always remind users to consult healthcare professionals for medical advice."
            },
            ...messages,
            { role: 'user', content: userMessage }
          ]
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm sorry, I'm having trouble responding right now. Please try again later."
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
  }

  return (
    <div className="card h-[600px] flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-neutral-600">
            <p className="mb-4">Welcome! How can I help you learn about autism?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="text-left p-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
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
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-neutral-100'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 p-2 border rounded-lg"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary whitespace-nowrap"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}
