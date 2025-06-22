import { ChatInterface } from '@/components/chat/chat-interface'

export default function ChatPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">
          AI Information Assistant
        </h1>
        <p className="text-neutral-600 mb-4">
          Get reliable, research-based information about autism spectrum disorder from our AI assistant.
          Ask questions about early signs, interventions, support strategies, and more.
        </p>
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-sm font-medium text-blue-800 mb-2">Important Note</h2>
          <p className="text-sm text-blue-700">
            This AI assistant provides educational information only. Always consult healthcare professionals
            for medical advice, diagnosis, or treatment. In case of immediate concerns, please contact your
            healthcare provider.
          </p>
        </div>
      </div>

      <ChatInterface />

      <div className="mt-8 text-sm text-neutral-500">
        <p>Information sources include:</p>
        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
          <li>World Health Organization (WHO)</li>
          <li>Centers for Disease Control and Prevention (CDC)</li>
          <li>National Institutes of Health (NIH)</li>
          <li>Autism Research Centers</li>
          <li>Peer-reviewed Scientific Literature</li>
        </ul>
      </div>
    </div>
  )
}
