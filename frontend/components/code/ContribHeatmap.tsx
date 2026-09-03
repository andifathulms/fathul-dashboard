'use client'

import { useMemo } from 'react'

import type { ContribDay } from '@/lib/types'
import { cn, formatDateShort } from '@/lib/utils'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Five steps of one hue. Sequential magnitude is never a rainbow — the only
 *  thing changing between steps is how much ink is on the square. */
function levelOf(count: number, p: number[]): number {
  if (count <= 0) return 0
  if (count <= p[0]) return 1
  if (count <= p[1]) return 2
  if (count <= p[2]) return 3
  return 4
}

const LEVEL_ALPHA = [0, 0.22, 0.42, 0.66, 1]

interface HeatmapProps {
  days: ContribDay[]
  selected: string | null
  onSelect: (date: string) => void
}

export default function ContribHeatmap({ days, selected, onSelect }: HeatmapProps) {
  // Quartile thresholds over the days you actually worked, so a quiet year and
  // a loud one both use the full range instead of one washing out.
  const thresholds = useMemo(() => {
    const active = days.filter((d) => d.count > 0).map((d) => d.count).sort((a, b) => a - b)
    if (active.length === 0) return [1, 2, 3]
    const at = (q: number) => active[Math.min(active.length - 1, Math.floor(active.length * q))]
    return [at(0.25), at(0.5), at(0.75)]
  }, [days])

  // GitHub's calendar starts each week on Sunday; pad so column 0 lines up.
  const columns = useMemo(() => {
    if (days.length === 0) return []
    const cells: (ContribDay | null)[] = [...Array(days[0].weekday).fill(null), ...days]
    const cols: (ContribDay | null)[][] = []
    for (let i = 0; i < cells.length; i += 7) cols.push(cells.slice(i, i + 7))
    return cols
  }, [days])

  return (
    <div className="overflow-x-auto pb-1">
      <div className="inline-flex flex-col gap-1">
        {/* Month labels, printed once per month at the column it starts in. */}
        <div className="flex gap-[3px] pl-[26px]">
          {columns.map((col, i) => {
            const first = col.find((d) => d)
            const prev = columns[i - 1]?.find((d) => d)
            const show =
              first && (!prev || new Date(first.date).getMonth() !== new Date(prev.date).getMonth())
            return (
              <span key={i} className="w-[11px] shrink-0 text-xs text-muted">
                {show ? MONTHS[new Date(`${first!.date}T00:00:00`).getMonth()] : ''}
              </span>
            )
          })}
        </div>

        <div className="flex gap-[3px]">
          <div className="flex w-[22px] shrink-0 flex-col gap-[3px] pr-1 text-xs text-muted">
            {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((l, i) => (
              <span key={i} className="h-[11px] leading-[11px]">
                {l}
              </span>
            ))}
          </div>

          {columns.map((col, i) => (
            <div key={i} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }).map((_, r) => {
                const day = col[r]
                if (!day) return <span key={r} className="h-[11px] w-[11px]" />
                const level = levelOf(day.count, thresholds)
                const isSelected = selected === day.date
                return (
                  <button
                    key={r}
                    onClick={() => onSelect(day.date)}
                    title={`${formatDateShort(day.date)} — ${day.count} contribution${day.count === 1 ? '' : 's'}`}
                    aria-label={`${day.date}, ${day.count} contributions`}
                    className={cn(
                      'h-[11px] w-[11px] rounded-[2px] transition-transform hover:scale-125',
                      level === 0 && 'bg-surface2 ring-1 ring-inset ring-border/60',
                      isSelected && 'ring-2 ring-accent1 ring-offset-1 ring-offset-surface'
                    )}
                    style={
                      level > 0
                        ? { backgroundColor: `rgb(var(--highlight) / ${LEVEL_ALPHA[level]})` }
                        : undefined
                    }
                  />
                )
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5 pl-[26px] pt-1 text-xs text-muted">
          <span>Less</span>
          {LEVEL_ALPHA.map((a, i) => (
            <span
              key={i}
              className={cn('h-[11px] w-[11px] rounded-[2px]', i === 0 && 'bg-surface2 ring-1 ring-inset ring-border/60')}
              style={i > 0 ? { backgroundColor: `rgb(var(--highlight) / ${a})` } : undefined}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
