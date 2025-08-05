'use client'

import { useEffect } from 'react'

export interface ToastProps {
  open: boolean
  setOpen: (open: boolean) => void
  title: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

export function Toast({
  open,
  setOpen,
  title,
  description,
  variant = 'default',
  duration = 5000,
}: ToastProps) {
  // Auto-close toast after duration
  useEffect(() => {
    if (open && duration > 0) {
      const timer = setTimeout(() => {
        setOpen(false)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [open, duration, setOpen])

  if (!open) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
      <div className="w-full flex flex-col items-end space-y-4">
        <div
          className={`
            max-w-sm w-full shadow-lg rounded-lg pointer-events-auto overflow-hidden
            transition-all duration-300 transform translate-y-0 opacity-100 border cursor-pointer
            ${variant === 'destructive' ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'bg-white border-gray-200 hover:bg-gray-50'}
          `}
          onClick={() => setOpen(false)}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {variant === 'destructive' ? (
                  <div className="h-6 w-6 text-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <div className="h-6 w-6 text-green-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="ml-3 w-0 flex-1 pt-0.5">
                <p className={`text-sm font-medium ${variant === 'destructive' ? 'text-red-800' : 'text-gray-900'}`}>
                  {title}
                </p>
                {description && (
                  <p className={`mt-1 text-sm ${variant === 'destructive' ? 'text-red-700' : 'text-gray-500'}`}>
                    {description}
                  </p>
                )}
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  type="button"
                  className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 p-1 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setOpen(false)
                  }}
                  aria-label="Close notification"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

export const ToastViewport = () => {
  return null // The viewport is handled in the Toast component itself
}

export const ToastTitle = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

export const ToastDescription = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

export const ToastClose = () => {
  return null // The close button is handled in the Toast component itself
}
