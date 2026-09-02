'use client'

import { Pause, Play, Square, Timer } from 'lucide-react'
import Link from 'next/link'

import { useFocus } from '@/components/focus/FocusProvider'
import { formatClock } from '@/lib/focus'
import { cn } from '@/lib/utils'

/** The running timer, carried in the top bar so it survives navigation — the
 *  reason a self-built timer gets abandoned is losing it on a route change. */
export default function FocusPill() {
  const { session, remaining, paused, pause, resume, stop } = useFocus()
  if (!session) return null

  const isFocus = session.kind === 'focus'
  const what = session.task_title || session.project_name || session.label || 'Focus'

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-2 py-1 ring-1 ring-inset',
        isFocus
          ? 'bg-accent2/10 text-accent2 ring-accent2/25'
          : 'bg-highlight/10 text-highlight ring-highlight/25'
      )}
    >
      <Link
        href="/focus"
        className="flex items-center gap-1.5"
        title={`${what} — open the focus timer`}
      >
        <Timer size={14} className={cn('shrink-0', !paused && 'animate-pulse')} />
        <span className="font-mono text-base font-medium tnum">{formatClock(remaining)}</span>
        <span className="hidden max-w-[120px] truncate text-sm opacity-80 md:inline">{what}</span>
      </Link>

      <button
        onClick={paused ? resume : pause}
        className="icon-btn h-6 w-6 shrink-0 text-current hover:bg-current/10"
        aria-label={paused ? 'Resume timer' : 'Pause timer'}
        title={paused ? 'Resume' : 'Pause'}
      >
        {paused ? <Play size={12} /> : <Pause size={12} />}
      </button>
      <button
        onClick={() => stop({ interruptedBy: 'manual' })}
        className="icon-btn h-6 w-6 shrink-0 text-current hover:bg-current/10"
        aria-label="Stop timer"
        title="Stop"
      >
        <Square size={12} />
      </button>
    </div>
  )
}
