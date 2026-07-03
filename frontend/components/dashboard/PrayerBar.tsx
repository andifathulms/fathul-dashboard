'use client'

import { Moon } from 'lucide-react'

import { usePrayer } from '@/hooks/usePrayer'
import { formatCountdown } from '@/lib/prayer'

export default function PrayerBar() {
  const { next, timings } = usePrayer()

  if (!timings || !next) return null

  return (
    <div className="card relative overflow-hidden px-5 py-4">
      {/* Accent wash + glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-accent1/[0.12] via-transparent to-transparent" />
      <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-accent1/10 blur-3xl" />
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent1/25 to-accent1/5 text-accent1 ring-1 ring-inset ring-accent1/25">
            <Moon size={20} />
          </span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted">Sholat berikutnya</p>
            <p className="text-lg font-semibold">
              {next.label}{' '}
              <span className="font-mono text-sm font-normal text-muted">· {next.time}</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="bg-gradient-to-br from-accent1 to-accent2 bg-clip-text text-3xl font-extrabold tabular-nums text-transparent">
            {formatCountdown(next.minutesUntil)}
          </p>
          <p className="text-[11px] text-muted">lagi</p>
        </div>
      </div>
    </div>
  )
}
