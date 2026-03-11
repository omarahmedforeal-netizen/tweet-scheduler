'use client'

import React from 'react'
import type { Toast } from './types'

interface ToastContainerProps {
  toasts: Toast[]
  removeToast: (id: number) => void
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-[60] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          className={`pointer-events-auto max-w-md w-full px-4 py-3 rounded-xl shadow-lg border cursor-pointer transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}
          dir="rtl"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>{toast.type === 'success' ? '\u2713' : toast.type === 'error' ? '\u2717' : '\u2139'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ToastContainer
