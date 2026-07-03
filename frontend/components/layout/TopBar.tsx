'use client'

import { LocateFixed, MapPin } from 'lucide-react'
import { useState } from 'react'

import { useToast } from '@/components/ui/Toast'
import { usePrayer } from '@/hooks/usePrayer'
import { useWeather } from '@/hooks/useWeather'
import { detectLocation } from '@/lib/location'
import { PRAYER_SEQUENCE, formatCountdown } from '@/lib/prayer'
import { describeWeather } from '@/lib/weather'
import { cn } from '@/lib/utils'

export default function TopBar() {
  const { timings, now, next, location } = usePrayer()
  const { weather } = useWeather()
  const w = weather ? describeWeather(weather.weathercode) : null

  const [locating, setLocating] = useState(false)
  const toast = useToast()

  const detect = async () => {
    setLocating(true)
    try {
      const loc = await detectLocation()
      toast.success(`Lokasi diperbarui ke ${loc.label}`, 'Lokasi')
    } catch (e) {
      toast.error((e as Error).message, 'Gagal mendapatkan lokasi')
    } finally {
      setLocating(false)
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
        {/* Prayer times row */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {timings ? (
            PRAYER_SEQUENCE.map((p) => {
              const isNext = next?.key === p.key
              return (
                <div
                  key={p.key}
                  className={cn(
                    'flex min-w-[64px] flex-col items-center rounded-lg px-2.5 py-1.5 transition-colors',
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
            <span className="text-xs text-muted">Memuat jadwal sholat…</span>
          )}
        </div>

        {/* Right cluster: countdown · weather · clock */}
        <div className="flex items-center gap-4">
          {next && (
            <div className="hidden text-right md:block">
              <p className="text-[11px] text-muted">Berikutnya</p>
              <p className="text-sm font-semibold text-accent1">
                {next.label} · {formatCountdown(next.minutesUntil)}
              </p>
            </div>
          )}

          {w && weather && (
            <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-1.5">
              <span className="text-lg leading-none">{w.icon}</span>
              <div className="leading-tight">
                <p className="text-sm font-semibold">{Math.round(weather.temperature)}°C</p>
                <button
                  onClick={detect}
                  title="Perbarui lokasi (GPS)"
                  className="flex items-center gap-1 text-[10px] text-muted transition-colors hover:text-accent1"
                >
                  {locating ? (
                    <LocateFixed size={9} className="animate-spin" />
                  ) : (
                    <MapPin size={9} />
                  )}
                  <span className="max-w-[100px] truncate">{locating ? 'Mencari…' : location.label}</span>
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
  if (!now) return <div className="w-[120px]" />
  return (
    <div className="text-right">
      <p className="font-mono text-sm font-semibold tabular-nums">
        {now.toLocaleTimeString('id-ID')}
      </p>
      <p className="text-[10px] text-muted">
        {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
      </p>
    </div>
  )
}
