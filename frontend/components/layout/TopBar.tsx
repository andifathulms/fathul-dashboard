'use client'

import { LocateFixed, MapPin, Menu } from 'lucide-react'
import { useState } from 'react'

import { useToast } from '@/components/ui/Toast'
import { usePrayer } from '@/hooks/usePrayer'
import { useWeather } from '@/hooks/useWeather'
import { detectLocation } from '@/lib/location'
import { PRAYER_SEQUENCE, formatCountdown } from '@/lib/prayer'
import { describeWeather } from '@/lib/weather'
import { cn } from '@/lib/utils'

export default function TopBar({ onMenu }: { onMenu: () => void }) {
  const { timings, now, next, location } = usePrayer()
  const { weather } = useWeather()
  const w = weather ? describeWeather(weather.weathercode) : null

  const [locating, setLocating] = useState(false)
  const toast = useToast()

  const detect = async () => {
    setLocating(true)
    try {
      const loc = await detectLocation()
      toast.success(`Location updated to ${loc.label}`, 'Location')
    } catch (e) {
      toast.error((e as Error).message, 'Failed to get location')
    } finally {
      setLocating(false)
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Left: hamburger (mobile) + prayer times */}
        <div className="flex min-w-0 items-center gap-2">
          <button onClick={onMenu} className="icon-btn shrink-0 lg:hidden" aria-label="Open menu">
            <Menu size={18} />
          </button>

          {/* Full prayer grid — md and up */}
          <div className="hidden items-center gap-1.5 overflow-x-auto md:flex">
            {timings ? (
              PRAYER_SEQUENCE.map((p) => {
                const isNext = next?.key === p.key
                return (
                  <div
                    key={p.key}
                    className={cn(
                      'flex min-w-[62px] flex-col items-center rounded-lg px-2.5 py-1.5 transition-colors',
                      isNext ? 'bg-accent1/15 ring-1 ring-accent1/40' : 'bg-surface'
                    )}
                  >
                    <span className={cn('text-[10px] uppercase tracking-wide', isNext ? 'text-accent1' : 'text-muted')}>
                      {p.label}
                    </span>
                    <span className={cn('font-mono text-sm', isNext ? 'text-accent1' : 'text-text')}>
                      {timings[p.key]}
                    </span>
                  </div>
                )
              })
            ) : (
              <span className="text-xs text-muted">Loading prayer times…</span>
            )}
          </div>

          {/* Compact next-prayer — below md */}
          {next && (
            <div className="flex items-center gap-2 rounded-lg bg-accent1/15 px-2.5 py-1 ring-1 ring-accent1/30 md:hidden">
              <span className="text-[10px] uppercase tracking-wide text-accent1">{next.label}</span>
              <span className="font-mono text-sm text-accent1">{next.time}</span>
              <span className="text-[10px] text-muted">· {formatCountdown(next.minutesUntil)}</span>
            </div>
          )}
        </div>

        {/* Right cluster: countdown · weather · clock */}
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          {next && (
            <div className="hidden text-right lg:block">
              <p className="text-[11px] text-muted">Next</p>
              <p className="text-sm font-semibold text-accent1">
                {next.label} · {formatCountdown(next.minutesUntil)}
              </p>
            </div>
          )}

          {w && weather && (
            <div className="flex items-center gap-2 rounded-lg bg-surface px-2.5 py-1.5 sm:px-3">
              <span className="text-lg leading-none">{w.icon}</span>
              <div className="leading-tight">
                <p className="text-sm font-semibold">{Math.round(weather.temperature)}°C</p>
                <button
                  onClick={detect}
                  title="Update location (GPS)"
                  className="flex items-center gap-1 text-[10px] text-muted transition-colors hover:text-accent1"
                >
                  {locating ? <LocateFixed size={9} className="animate-spin" /> : <MapPin size={9} />}
                  <span className="max-w-[80px] truncate sm:max-w-[110px]">
                    {locating ? 'Searching…' : location.label}
                  </span>
                </button>
              </div>
            </div>
          )}

          <Clock now={now} />
        </div>
      </div>
    </header>
  )
}

function Clock({ now }: { now: Date | null }) {
  if (!now) return <div className="hidden w-[110px] sm:block" />
  return (
    <div className="hidden text-right sm:block">
      <p className="font-mono text-sm font-semibold tabular-nums">{now.toLocaleTimeString('en-US')}</p>
      <p className="text-[10px] text-muted">
        {now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
      </p>
    </div>
  )
}
