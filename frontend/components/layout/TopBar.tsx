'use client'

import { LocateFixed, MapPin, Menu } from 'lucide-react'
import { useState } from 'react'

import FocusPill from '@/components/focus/FocusPill'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useToast } from '@/components/ui/Toast'
import { usePrayer } from '@/hooks/usePrayer'
import { useWeather } from '@/hooks/useWeather'
import { detectLocation } from '@/lib/location'
import { formatCountdown } from '@/lib/prayer'
import { describeWeather } from '@/lib/weather'

/** Orientation only — clock, next prayer, weather, theme. Page actions belong
 *  to the page header, never here (DESIGN.md §9). */
export default function TopBar({ onMenu }: { onMenu: () => void }) {
  const { now, next, location } = usePrayer()
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
      toast.error((e as Error).message, "Couldn't get your location")
    } finally {
      setLocating(false)
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <button onClick={onMenu} className="icon-btn -ml-1 shrink-0 lg:hidden" aria-label="Open menu">
            <Menu size={18} />
          </button>
          {now && (
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-md font-medium tnum">
                {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="hidden text-base text-muted sm:inline">
                {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <FocusPill />

          {next && (
            <div className="flex items-center gap-2 rounded-lg bg-accent1/10 px-2.5 py-1 ring-1 ring-inset ring-accent1/20">
              <span className="text-sm font-semibold text-accent1">{next.label}</span>
              <span className="font-mono text-base text-accent1 tnum">{next.time}</span>
              <span className="hidden text-sm text-accent1/80 sm:inline">
                · in {formatCountdown(next.minutesUntil)}
              </span>
            </div>
          )}

          {w && weather && (
            <button
              onClick={detect}
              title="Update location from GPS"
              className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-surface2"
            >
              <span className="text-md leading-none">{w.icon}</span>
              <span className="font-mono text-base font-medium tnum">
                {Math.round(weather.temperature)}°
              </span>
              <span className="hidden max-w-[130px] items-center gap-1 text-sm text-muted md:flex">
                {locating ? <LocateFixed size={11} className="animate-spin" /> : <MapPin size={11} />}
                <span className="truncate">{locating ? 'Searching…' : location.label}</span>
              </span>
            </button>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
