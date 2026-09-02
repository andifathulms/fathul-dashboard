'use client'

import { Pause, Play, Square, Timer } from 'lucide-react'
import Link from 'next/link'

import { useFocus } from '@/components/focus/FocusProvider'
import WidgetCard from '@/components/ui/Card'
import { formatClock, formatDuration } from '@/lib/focus'
import { cn } from '@/lib/utils'

/** Today's focus at a glance, with the one control the dashboard needs: start
 *  a session without leaving the page. */
export default function FocusWidget() {
  const { session, settings, completedToday, focusedSecToday, remaining, paused, pause, resume, stop, start } =
    useFocus()

  const target = settings?.daily_target_sessions ?? 8
  const isFocus = session?.kind === 'focus'

  return (
    <WidgetCard
      title="Focus"
      icon={<Timer size={16} />}
      action={
        <Link href="/focus" className="text-sm text-accent1 hover:underline">
          Open
        </Link>
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          {session ? (
            <>
              <p
                className={cn(
                  'font-display text-2xl font-semibold tabular-nums',
                  isFocus ? 'text-accent2' : 'text-highlight',
                  paused && 'opacity-50'
                )}
              >
                {formatClock(remaining)}
              </p>
              <p className="truncate text-sm text-muted">
                {paused
                  ? 'Paused'
                  : session.task_title || session.project_name || session.label || 'In session'}
              </p>
            </>
          ) : (
            <>
              <p className="font-display text-2xl font-semibold tabular-nums">
                {formatDuration(focusedSecToday)}
              </p>
              <p className="text-sm text-muted">focused today</p>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {session ? (
            <>
              <button
                onClick={paused ? resume : pause}
                className="icon-btn"
                aria-label={paused ? 'Resume timer' : 'Pause timer'}
                title={paused ? 'Resume' : 'Pause'}
              >
                {paused ? <Play size={16} /> : <Pause size={16} />}
              </button>
              <button
                onClick={() => void stop({ interruptedBy: 'manual' })}
                className="icon-btn hover:text-danger"
                aria-label="Stop timer"
                title="Stop"
              >
                <Square size={16} />
              </button>
            </>
          ) : (
            <button className="btn-sm btn-accent" onClick={() => void start({ kind: 'focus' })}>
              <Play size={14} /> Start
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1" aria-label="Sessions completed today">
        {Array.from({ length: Math.max(target, completedToday) }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-2 w-2 rounded-full',
              i < completedToday ? 'bg-accent2' : 'bg-surface2 ring-1 ring-inset ring-border'
            )}
          />
        ))}
        <span className="ml-1 text-sm text-muted tnum">
          {completedToday}/{target}
        </span>
      </div>
    </WidgetCard>
  )
}
