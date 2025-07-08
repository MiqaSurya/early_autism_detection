'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToastContextType {
  toasts: Toast[]
  toast: (toast: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = ({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((toasts) => [...toasts, { id, title, description, variant }])
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      dismiss(id)
    }, 5000)
    
    return id
  }

  const dismiss = (id: string) => {
    setToasts((toasts) => toasts.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 p-4 space-y-4 z-40">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`p-4 rounded-md shadow-lg ${
                toast.variant === 'destructive' ? 'bg-red-50 text-red-800' : 'bg-white text-gray-900'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{toast.title}</h3>
                  {toast.description && <p className="text-sm mt-1">{toast.description}</p>}
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    dismiss(toast.id)
                  }}
                  className="text-gray-400 hover:text-gray-500 ml-2 flex-shrink-0 cursor-pointer"
                  type="button"
                  aria-label="Close notification"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  
  return context
} 