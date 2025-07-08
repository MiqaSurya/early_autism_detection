import { Loader2, Heart } from 'lucide-react'

export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="relative mb-6">
          <Heart className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin absolute top-4 left-1/2 transform -translate-x-1/2" />
        </div>
        
        <h2 className="text-xl font-semibold text-blue-900 mb-2">
          Loading Early Autism Detector
        </h2>
        
        <p className="text-blue-700 mb-4">
          Please wait while we prepare your experience...
        </p>
        
        <div className="flex justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
