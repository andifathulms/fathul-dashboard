'use client'

import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  type: ToastType
  message: string
  title?: string
}

interface ToastApi {
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

const STYLES: Record<ToastType, { icon: React.ReactNode; stripe: string; iconCls: string }> = {
  success: { icon: <CheckCircle2 size={17} />, stripe: 'bg-highlight', iconCls: 'text-highlight' },
  error: { icon: <XCircle size={17} />, stripe: 'bg-danger', iconCls: 'text-danger' },
  info: { icon: <Info size={17} />, stripe: 'bg-accent1', iconCls: 'text-accent1' },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const push = useCallback(
    (type: ToastType, message: string, title?: string) => {
      const id = nextId.current++
      setToasts((t) => [...t, { id, type, message, title }])
      setTimeout(() => remove(id), 4000)
    },
    [remove]
  )

  const api: ToastApi = {
    success: (m, t) => push('success', m, t),
    error: (m, t) => push('error', m, t),
    info: (m, t) => push('info', m, t),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const s = STYLES[t.type]
          return (
            <div
              key={t.id}
              className="pointer-events-auto relative flex animate-slide-in-right items-start gap-3 overflow-hidden rounded-xl border border-border bg-surface py-3 pl-4 pr-3 shadow-pop"
              role="status"
            >
              {/* A severity stripe reads before the icon does. */}
              <span className={cn('absolute inset-y-0 left-0 w-1', s.stripe)} />
              <span className={cn('mt-px shrink-0', s.iconCls)}>{s.icon}</span>
              <div className="min-w-0 flex-1">
                {t.title && <p className="text-base font-semibold">{t.title}</p>}
                <p className={cn('text-base', t.title ? 'text-text2' : 'text-text')}>{t.message}</p>
              </div>
              <button
                onClick={() => remove(t.id)}
                className="icon-btn h-6 w-6 shrink-0"
                aria-label="Dismiss"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
