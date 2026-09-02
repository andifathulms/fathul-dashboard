'use client'

import { Timer } from 'lucide-react'
import useSWR from 'swr'

import WidgetCard from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import { formatDuration } from '@/lib/focus'
import type { FocusSession } from '@/lib/types'
import { cn, toISODate } from '@/lib/utils'

const DAYS = 14
const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/** How much of your life this project has actually taken — the question the
 *  focus log exists to answer, asked where the project lives. */
export default function TimeInvested({ projectId }: { projectId: number }) {
  const since = new Date()
  since.setDate(since.getDate() - (DAYS - 1))
  const from = toISODate(since)

  const { data } = useSWR<FocusSession[]>(`/focus/?project=${projectId}&kind=focus`)
  const sessions = data ?? []
  const totalSec = sessions.reduce((sum, s) => sum + s.actual_sec, 0)
  const completed = sessions.filter((s) => s.completed).length

  // Bucket the recent window by local day so the bars line up with the labels.
  const buckets = new Map<string, number>()
  for (let i = 0; i < DAYS; i += 1) {
    const d = new Date(since)
    d.setDate(since.getDate() + i)
    buckets.set(toISODate(d), 0)
  }
  for (const s of sessions) {
    const key = toISODate(new Date(s.started_at))
    if (key >= from && buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + s.actual_sec)
  }
  const series = [...buckets.entries()]
  const max = Math.max(1, ...series.map(([, sec]) => sec))
  const recentSec = series.reduce((sum, [, sec]) => sum + sec, 0)

  return (
    <WidgetCard
      title="Time invested"
      icon={<Timer size={15} />}
      action={<span className="text-sm text-muted tnum">{completed} sessions</span>}
    >
      {totalSec === 0 ? (
        <EmptyState
          compact
          icon={<Timer size={18} />}
          title="No focus logged yet"
          hint="Start a session on one of this project's tasks."
        />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold tabular-nums">
              {formatDuration(totalSec)}
            </span>
            <span className="text-sm text-muted">
              all time · {formatDuration(recentSec)} in {DAYS} days
            </span>
          </div>

          <div className="flex h-16 items-stretch gap-1">
            {series.map(([day, sec]) => (
              <div key={day} className="flex flex-1 flex-col items-center gap-1">
                {/* Filler track — a percentage height needs a resolved parent. */}
                <div className="flex w-full flex-1 items-end justify-center">
                  <div
                    title={`${day} — ${formatDuration(sec)}`}
                    className={cn(
                      'w-full max-w-[18px] rounded-t-[3px]',
                      sec > 0 ? 'bg-accent2' : 'bg-surface2'
                    )}
                    style={{ height: `${Math.max(sec > 0 ? 6 : 3, (sec / max) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted">
                  {WEEKDAY_INITIALS[new Date(`${day}T00:00:00`).getDay()]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </WidgetCard>
  )
}
