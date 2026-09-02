'use client'

import { formatClock } from '@/lib/focus'
import { cn } from '@/lib/utils'

interface TimerRingProps {
  /** 0..1 — how much of the session is spent. */
  progress: number
  remaining: number
  /** Shown under the clock: the phase, or what you are working on. */
  caption: string
  tone: 'focus' | 'break' | 'idle'
  paused?: boolean
  size?: number
}

const TONES = {
  focus: 'text-accent2',
  break: 'text-highlight',
  idle: 'text-muted',
}

/** The clock face. A ring rather than a bar because the whole point is to read
 *  "how much is left" from across the desk, without parsing digits. */
export default function TimerRing({
  progress,
  remaining,
  caption,
  tone,
  paused,
  size = 240,
}: TimerRingProps) {
  const stroke = 10
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const spent = Math.min(1, Math.max(0, progress))

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-surface2"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - spent)}
          className={cn('stroke-current transition-[stroke-dashoffset] duration-500 ease-out', TONES[tone])}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-6 text-center">
        <span
          className={cn(
            'font-display text-3xl font-semibold tabular-nums',
            paused && 'opacity-50'
          )}
          style={{ fontSize: size / 5 }}
        >
          {formatClock(remaining)}
        </span>
        <span className={cn('text-sm font-medium', TONES[tone])}>
          {paused ? 'Paused' : caption}
        </span>
      </div>
    </div>
  )
}
