'use client'

import { Flame, Moon } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'

import WidgetCard from '@/components/ui/Card'
import {
  PRAYERS,
  computeStreak,
  fardhuComplete,
  shiftDate,
  type IbadahMatrix,
} from '@/lib/ibadah'
import type { IbadahLog } from '@/lib/types'
import { todayISO } from '@/lib/utils'
import { cn } from '@/lib/utils'

const DAY_ABBR = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

// English display names for the internal prayer keys.
const PRAYER_EN: Record<string, string> = {
  Subuh: 'Fajr',
  Dzuhur: 'Dhuhr',
  Ashar: 'Asr',
  Maghrib: 'Maghrib',
  Isya: 'Isha',
}
const enName = (k: string) => PRAYER_EN[k] ?? k

export default function IbadahWidget() {
  const today = todayISO()
  const start = shiftDate(today, -29)

  const { data: todayLog } = useSWR<IbadahLog>(`/ibadah/?date=${today}`)
  const { data: range } = useSWR<IbadahLog[]>(`/ibadah/?start=${start}&end=${today}`)

  const byDate: Record<string, IbadahMatrix> = {}
  for (const log of range ?? []) byDate[log.date] = log.data || {}
  if (todayLog) byDate[today] = todayLog.data || {}

  const streak = computeStreak(byDate, today)
  const todayFardhu = PRAYERS.filter((p) => byDate[today]?.[p.key]?.fardhu).length
  const week = Array.from({ length: 7 }, (_, i) => shiftDate(today, -(6 - i)))
  const jamaahWeek = week.reduce((n, d) => n + PRAYERS.filter((p) => byDate[d]?.[p.key]?.jamaah).length, 0)

  return (
    <WidgetCard
      title="Ibadah"
      icon={<Moon size={15} />}
      action={
        <Link href="/ibadah" className="text-xs text-accent1 hover:underline">
          Detail
        </Link>
      }
      bodyClassName="space-y-3"
    >
      {/* Streak + today's fardhu */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-bg px-3 py-2">
          <Flame size={20} className={cn(streak > 0 ? 'text-accent2' : 'text-muted')} />
          <div className="leading-tight">
            <p className="font-mono text-lg font-semibold">{streak}</p>
            <p className="text-[10px] text-muted">day streak</p>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted">Fardh today</span>
            <span className="font-mono text-sm font-semibold text-highlight">{todayFardhu}/5</span>
          </div>
          <div className="mt-1.5 flex gap-1">
            {PRAYERS.map((p) => (
              <div
                key={p.key}
                title={enName(p.key)}
                className={cn(
                  'h-1.5 flex-1 rounded-full',
                  byDate[today]?.[p.key]?.jamaah
                    ? 'bg-accent1'
                    : byDate[today]?.[p.key]?.fardhu
                      ? 'bg-highlight'
                      : 'bg-border'
                )}
              />
            ))}
          </div>
          <p className="mt-1 text-[10px] text-muted">{jamaahWeek} in congregation this week</p>
        </div>
      </div>

      {/* Mini 7-day strip (fardhu complete per day) */}
      <div className="flex justify-between gap-1">
        {week.map((d) => {
          const dow = new Date(`${d}T00:00:00`).getDay()
          const complete = fardhuComplete(byDate[d])
          const partial = !complete && PRAYERS.some((p) => byDate[d]?.[p.key]?.fardhu)
          return (
            <div key={d} className="flex flex-1 flex-col items-center gap-1">
              <div
                title={d}
                className={cn(
                  'h-7 w-full rounded-md',
                  complete ? 'bg-highlight' : partial ? 'bg-highlight/40' : 'bg-bg'
                )}
              />
              <span className="text-[9px] text-muted">{DAY_ABBR[dow]}</span>
            </div>
          )
        })}
      </div>
    </WidgetCard>
  )
}
