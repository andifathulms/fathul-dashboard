'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'

import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export default function Modal({ open, onClose, title, subtitle, children, footer, className }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    // Keep the page behind from scrolling under the dialog.
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="scrim fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-[8vh]"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full max-w-lg animate-scale-in rounded-2xl border border-border bg-surface shadow-pop',
          className
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
          <div className="min-w-0">
            <h2 className="font-display text-md font-semibold">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="icon-btn -mr-1 shrink-0" aria-label="Close" title="Close">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[64vh] overflow-y-auto px-5 pb-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-border bg-surface2/50 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
