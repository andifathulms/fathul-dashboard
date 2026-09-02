'use client'

import { Flame, Target, Timer, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import WidgetCard from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import Segmented from '@/components/ui/Segmented'
import { formatDuration } from '@/lib/focus'
import type { FocusStats as Stats } from '@/lib/types'
import { CATEGORY_STYLES, cn } from '@/lib/utils'

type Range = 'today' | 'week' | 'month' | 'quarter'

const RANGE_LABELS: Record<Range, string> = {
  today: 'Today',
  week: '7 days',
  month: '30 days',
  quarter: '90 days',
}

const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/** A headline figure. Not a chart — one number does not need a plot. */
function StatTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="card flex flex-col gap-1 p-4">
      <span className="flex items-center gap-1.5 text-sm text-muted">
        {icon}
        {label}
      </span>
      <span className="font-display text-2xl font-semibold tabular-nums">{value}</span>
      {hint && <span className="text-sm text-muted">{hint}</span>}
    </div>
  )
}

export default function FocusStats() {
  const [range, setRange] = useState<Range>('week')
  const { data, isLoading } = useSWR<Stats>(`/focus/stats/?range=${range}`)
  const [hovered, setHovered] = useState<string | null>(null)

  if (isLoading || !data) {
    return (
      <div className="card">
        <EmptyState icon={<Timer size={22} />} title="Loading your numbers…" />
      </div>
    )
  }

  const days = data.by_day
  const maxDay = Math.max(1, ...days.map((d) => d.sec))
  const activeDays = days.filter((d) => d.sec > 0).length
  const avgPerActiveDay = activeDays > 0 ? data.total_sec / activeDays : 0
  const maxProject = Math.max(1, ...data.by_project.map((p) => p.sec))
  const maxHour = Math.max(1, ...data.by_hour)
  const nothing = data.total_sec === 0

  return (
    <div className="flex flex-col gap-4">
      <Segmented
        ariaLabel="Stats range"
        value={range}
        onChange={setRange}
        options={(Object.keys(RANGE_LABELS) as Range[]).map((k) => ({
          key: k,
          label: RANGE_LABELS[k],
        }))}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon={<Timer size={14} />}
          label="Focused"
          value={formatDuration(data.total_sec)}
          hint={`over ${RANGE_LABELS[range].toLowerCase()}`}
        />
        <StatTile
          icon={<Target size={14} />}
          label="Sessions"
          value={String(data.sessions)}
          hint={`${data.today_sessions} of ${data.target} today`}
        />
        <StatTile
          icon={<Flame size={14} />}
          label="Streak"
          value={data.streak === 0 ? '—' : `${data.streak}d`}
          hint={data.streak === 0 ? 'no session today yet' : 'days in a row'}
        />
        <StatTile
          icon={<TrendingUp size={14} />}
          label="Average"
          value={formatDuration(avgPerActiveDay)}
          hint="per day you worked"
        />
      </div>

      {nothing ? (
        <div className="card">
          <EmptyState
            icon={<Timer size={22} />}
            title="No sessions in this range"
            hint="Run the timer and the numbers fill in here."
          />
        </div>
      ) : (
        <>
          {/* Change over time: one series, so no legend — the title names it. */}
          <WidgetCard title="Focus per day" icon={<TrendingUp size={16} />}>
            <div className="flex h-40 items-end gap-1">
              {days.map((d) => {
                const height = (d.sec / maxDay) * 100
                const date = new Date(`${d.date}T00:00:00`)
                return (
                  <div
                    key={d.date}
                    className="group relative flex flex-1 flex-col items-center justify-end gap-1.5"
                    onMouseEnter={() => setHovered(d.date)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {hovered === d.date && (
                      <div className="pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-sm shadow-pop">
                        <span className="font-medium">{formatDuration(d.sec)}</span>
                        <span className="text-muted"> · {d.sessions} sessions</span>
                      </div>
                    )}
                    <div
                      className={cn(
                        'w-full rounded-t-[4px] transition-colors',
                        d.sec > 0 ? 'bg-accent2' : 'bg-surface2',
                        hovered === d.date && d.sec > 0 && 'bg-accent2/80'
                      )}
                      style={{ height: `${Math.max(d.sec > 0 ? 4 : 2, height)}%` }}
                    />
                    {days.length <= 31 && (
                      <span className="text-xs text-muted tnum">
                        {days.length <= 7
                          ? WEEKDAY_INITIALS[date.getDay()]
                          : date.getDate() % 5 === 0
                            ? date.getDate()
                            : ''}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </WidgetCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Magnitude by identity. Bars are labeled, so colour never carries
                the identity on its own. */}
            <WidgetCard title="Where the time went" icon={<Target size={16} />}>
              <div className="flex flex-col gap-3">
                {data.by_project.slice(0, 8).map((p) => (
                  <div key={p.project ?? 'none'} className="flex flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-2 text-base">
                      <span className="min-w-0 truncate">{p.name}</span>
                      <span className="shrink-0 text-muted tnum">
                        {formatDuration(p.sec)}
                        <span className="ml-1.5 text-sm">· {p.sessions}</span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          p.category ? CATEGORY_STYLES[p.category].bar : 'bg-muted'
                        )}
                        style={{ width: `${Math.max(2, (p.sec / maxProject) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </WidgetCard>

            {/* Sequential magnitude: one hue, light to dark. */}
            <WidgetCard title="When you focus" icon={<Timer size={16} />}>
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-12 gap-1">
                  {data.by_hour.map((sec, hour) => {
                    const intensity = sec / maxHour
                    return (
                      <div
                        key={hour}
                        title={`${String(hour).padStart(2, '0')}:00 — ${formatDuration(sec)}`}
                        className={cn(
                          'h-7 rounded-[4px] ring-1 ring-inset ring-border/60',
                          sec === 0 && 'bg-surface2'
                        )}
                        style={
                          sec > 0
                            ? { backgroundColor: `rgb(var(--accent2) / ${0.15 + intensity * 0.85})` }
                            : undefined
                        }
                      />
                    )
                  })}
                </div>
                <div className="flex justify-between text-xs text-muted tnum">
                  <span>00:00</span>
                  <span>12:00</span>
                  <span>23:00</span>
                </div>
              </div>
            </WidgetCard>
          </div>
        </>
      )}
    </div>
  )
}
