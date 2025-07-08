'use client'

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'
import { useToast } from '@/hooks/use-toast'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast
            key={id}
            open={true}
            setOpen={(open) => {
              if (!open) {
                dismiss(id)
              }
            }}
            title={title || ''}
            description={description}
            {...props}
          />
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
