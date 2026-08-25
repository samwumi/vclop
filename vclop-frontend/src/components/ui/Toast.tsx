/**
 * Custom toast notification styles
 * Enhances the default sonner toast with better animations and styling
 */

import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast: 'backdrop-blur-sm bg-white/95 border border-gray-200 shadow-lg rounded-xl animate-scale-in',
          title: 'text-sm font-medium text-gray-900',
          description: 'text-xs text-gray-600',
          actionButton: 'btn-primary btn-sm',
          cancelButton: 'btn-secondary btn-sm',
          closeButton: 'hover:bg-gray-100 transition-colors',
          success: 'border-emerald-200 bg-emerald-50/95',
          error: 'border-red-200 bg-red-50/95',
          warning: 'border-amber-200 bg-amber-50/95',
          info: 'border-blue-200 bg-blue-50/95',
        },
      }}
    />
  );
}
