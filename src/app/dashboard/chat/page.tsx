import { ChatInterface } from '@/components/chat/chat-interface'

export default function ChatPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">AI Information Chat</h1>
        <p className="text-neutral-600">
          Ask questions about autism spectrum disorder and get reliable information
          from our AI assistant. The responses are based on reputable sources and
          current research.
        </p>
      </div>

      <ChatInterface />
    </div>
  )
}
