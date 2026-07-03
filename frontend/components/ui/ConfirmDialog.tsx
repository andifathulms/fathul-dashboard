'use client'

import { AlertTriangle } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>')
  return ctx
}

interface Pending {
  opts: ConfirmOptions
  resolve: (v: boolean) => void
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null)

  const confirm = useCallback<ConfirmFn>(
    (opts) => new Promise<boolean>((resolve) => setPending({ opts, resolve })),
    []
  )

  const settle = useCallback(
    (result: boolean) => {
      pending?.resolve(result)
      setPending(null)
    },
    [pending]
  )

  useEffect(() => {
    if (!pending) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') settle(false)
      if (e.key === 'Enter') settle(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pending, settle])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div
          className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-[16vh] backdrop-blur-sm"
          onClick={() => settle(false)}
        >
          <div
            className="w-full max-w-sm animate-scale-in rounded-xl border border-border bg-surface p-5 shadow-pop"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  pending.opts.danger ? 'bg-red-500/15 text-red-400' : 'bg-accent1/15 text-accent1'
                )}
              >
                <AlertTriangle size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold">{pending.opts.title ?? 'Konfirmasi'}</h2>
                <p className="mt-1 text-sm text-muted">{pending.opts.message}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => settle(false)} className="btn">
                {pending.opts.cancelLabel ?? 'Batal'}
              </button>
              <button
                onClick={() => settle(true)}
                className={cn(pending.opts.danger ? 'btn-accent bg-red-500 hover:bg-red-500/90' : 'btn-accent')}
                autoFocus
              >
                {pending.opts.confirmLabel ?? 'Ya, lanjut'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
