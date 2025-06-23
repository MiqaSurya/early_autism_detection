'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from './button'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
  children?: React.ReactNode
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
  children
}: ConfirmationDialogProps) {
  if (!isOpen) return null

  const variantStyles = {
    danger: {
      icon: 'text-red-600',
      iconBg: 'bg-red-100',
      button: 'bg-red-600 hover:bg-red-700 text-white',
      border: 'border-red-200'
    },
    warning: {
      icon: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      border: 'border-yellow-200'
    },
    info: {
      icon: 'text-blue-600',
      iconBg: 'bg-blue-100',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      border: 'border-blue-200'
    }
  }

  const styles = variantStyles[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={loading}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className={`w-12 h-12 ${styles.iconBg} rounded-full flex items-center justify-center mb-4`}>
          <AlertTriangle className={`h-6 w-6 ${styles.icon}`} />
        </div>

        {/* Content */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {description}
          </p>
          {children && (
            <div className="mt-4">
              {children}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 ${styles.button} disabled:opacity-50`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </div>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Hook for easier usage
export function useConfirmationDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<Partial<ConfirmationDialogProps>>({})

  const openDialog = (dialogConfig: Partial<ConfirmationDialogProps>) => {
    setConfig(dialogConfig)
    setIsOpen(true)
  }

  const closeDialog = () => {
    setIsOpen(false)
    setConfig({})
  }

  const ConfirmationDialogComponent = (props: Partial<ConfirmationDialogProps>) => (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={closeDialog}
      title=""
      description=""
      {...config}
      {...props}
    />
  )

  return {
    openDialog,
    closeDialog,
    ConfirmationDialog: ConfirmationDialogComponent,
    isOpen
  }
}
