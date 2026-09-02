'use client'

import { PauseCircle, Sunset, Target, Timer } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'

import { useFocus } from '@/components/focus/FocusProvider'
import { usePrayer } from '@/hooks/usePrayer'
import { formatCountdown } from '@/lib/prayer'
import type { Task } from '@/lib/types'
import { cn, todayISO } from '@/lib/utils'

/** Minutes from now until a HH:MM time today; negative once it has passed. */
function minutesUntil(hhmm: string | undefined, now: Date): number | null {
  if (!hhmm) return null
  const [h, m] = hhmm.split(':').map(Number)
  const target = new Date(now)
  target.setHours(h, m, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / 60000)
}

/** Does today's list fit in the day that is left?
 *
 *  Task estimates and prayer times are both already in the app; this is the
 *  one place that puts them next to each other, which is the only way to know
 *  a day is overcommitted before you have already lost it. */
export default function DayPlan() {
  const today = todayISO()
  const { data: tasks } = useSWR<Task[]>(`/tasks/?agenda=${today}`)
  const { data: waiting } = useSWR<Task[]>('/tasks/?is_waiting=true&is_done=false')
  const { settings, completedToday } = useFocus()
  const { timings, now } = usePrayer()

  const open = (tasks ?? []).filter((t) => !t.is_done)
  const estimated = open.reduce((sum, t) => sum + (t.estimate_pomodoros ?? 0), 0)
  const remainingOnEstimated = open.reduce(
    (sum, t) => sum + Math.max(0, (t.estimate_pomodoros ?? 0) - t.pomodoros_done),
    0
  )
  const unestimated = open.filter((t) => t.estimate_pomodoros == null).length

  // Maghrib is the end of the working day here, not midnight.
  const left = now ? minutesUntil(timings?.Maghrib, now) : null
  const cycle = (settings?.focus_min ?? 25) + (settings?.short_break_min ?? 5)
  const capacity = left != null && left > 0 ? Math.floor(left / cycle) : 0

  if (open.length === 0 && (waiting?.length ?? 0) === 0) return null

  let verdict: { text: string; tone: 'good' | 'tight' | 'over' | 'neutral' }
  if (estimated === 0) {
    verdict = {
      tone: 'neutral',
      text:
        unestimated > 0
          ? `${unestimated} task${unestimated > 1 ? 's' : ''} with no estimate — click a task's timer chip to size it.`
          : 'Nothing sized yet today.',
    }
  } else if (left == null || left <= 0) {
    verdict = { tone: 'neutral', text: 'Past Maghrib — whatever is left is tomorrow’s problem.' }
  } else if (remainingOnEstimated > capacity) {
    verdict = {
      tone: 'over',
      text: `That is ${remainingOnEstimated - capacity} pomodoro${remainingOnEstimated - capacity > 1 ? 's' : ''} more than fits before Maghrib. Something moves.`,
    }
  } else if (remainingOnEstimated === capacity) {
    verdict = { tone: 'tight', text: 'It fits exactly — no room for anything unplanned.' }
  } else {
    verdict = {
      tone: 'good',
      text: `Room for ${capacity - remainingOnEstimated} more before Maghrib.`,
    }
  }

  const TONES = {
    good: 'text-highlight',
    tight: 'text-warning',
    over: 'text-danger',
    neutral: 'text-muted',
  }

  return (
    <section className="card flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5">
      <Metric
        icon={<Target size={14} />}
        label="On the list"
        value={`${open.length}`}
        foot={estimated > 0 ? `${remainingOnEstimated} pomodoros left` : 'not sized'}
        href="/tasks"
      />
      <Metric
        icon={<Sunset size={14} />}
        label="Until Maghrib"
        value={left != null && left > 0 ? formatCountdown(left) : '—'}
        foot={left != null && left > 0 ? `room for ${capacity}` : 'day is done'}
      />
      <Metric
        icon={<Timer size={14} />}
        label="Done today"
        value={`${completedToday}`}
        foot="sessions"
        href="/focus"
      />
      {(waiting?.length ?? 0) > 0 && (
        <Metric
          icon={<PauseCircle size={14} />}
          label="Blocked"
          value={`${waiting?.length}`}
          foot="waiting on someone"
          href="/tasks"
        />
      )}

      <p className={cn('ml-auto min-w-0 text-base font-medium', TONES[verdict.tone])}>
        {verdict.text}
      </p>
    </section>
  )
}

function Metric({
  icon,
  label,
  value,
  foot,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: string
  foot: string
  href?: string
}) {
  const body = (
    <>
      <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.06em] text-muted">
        {icon}
        {label}
      </span>
      <p className="mt-0.5 flex items-baseline gap-1.5">
        <span className="font-display text-lg font-semibold tnum">{value}</span>
        <span className="truncate text-sm text-muted">{foot}</span>
      </p>
    </>
  )
  return href ? (
    <Link href={href} className="shrink-0 rounded-lg transition-opacity hover:opacity-70">
      {body}
    </Link>
  ) : (
    <div className="shrink-0">{body}</div>
  )
}
