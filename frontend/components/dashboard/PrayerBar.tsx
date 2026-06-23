'use client'

import { Moon } from 'lucide-react'

import { usePrayer } from '@/hooks/usePrayer'
import { formatCountdown } from '@/lib/prayer'

export default function PrayerBar() {
  const { next, timings } = usePrayer()

  if (!timings || !next) return null

  return (
    <div className="card flex items-center justify-between bg-gradient-to-r from-accent1/10 via-surface to-surface px-5 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent1/15 text-accent1">
          <Moon size={18} />
        </span>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted">Sholat berikutnya</p>
          <p className="text-base font-semibold">
            {next.label}{' '}
            <span className="font-mono text-sm text-muted">· {next.time}</span>
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold tabular-nums text-accent1">
          {formatCountdown(next.minutesUntil)}
        </p>
        <p className="text-[11px] text-muted">lagi</p>
      </div>
    </div>
  )
}
