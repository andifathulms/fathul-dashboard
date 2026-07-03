'use client'

import { ChevronLeft, ChevronRight, Clock, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

import PageHeader from '@/components/layout/PageHeader'
import WidgetCard from '@/components/ui/Card'
import { useLocation } from '@/lib/location'
import { fetchPrayerTimes, type PrayerTimings } from '@/lib/prayer'
import api from '@/lib/api'
import type { IbadahLog } from '@/lib/types'
import {
  PRAYERS,
  SUNNAH,
  fardhuComplete,
  shiftDate,
  type IbadahField as Field,
  type IbadahMatrix as Matrix,
} from '@/lib/ibadah'
import { cn, formatDateID, todayISO } from '@/lib/utils'

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export default function IbadahPage() {
  const location = useLocation()
  const today = todayISO()
  const [date, setDate] = useState(today)
  const isToday = date === today

  const [timings, setTimings] = useState<PrayerTimings | null>(null)
  const [now, setNow] = useState<Date | null>(null)
  const [data, setData] = useState<Matrix>({})
  const [logId, setLogId] = useState<number | null>(null)
  const [saved, setSaved] = useState<'idle' | 'saving' | 'done'>('idle')
  const [rangeLogs, setRangeLogs] = useState<Record<string, Matrix>>({})

  // Last 30 days of logs for the weekly summary + streaks.
  useEffect(() => {
    const start = shiftDate(today, -29)
    api
      .get<IbadahLog[]>(`/ibadah/?start=${start}&end=${today}`)
      .then((res) => {
        const map: Record<string, Matrix> = {}
        for (const log of res.data) map[log.date] = log.data || {}
        setRangeLogs(map)
      })
      .catch(() => {})
  }, [today])

  // Prayer times for the selected date + location.
  useEffect(() => {
    const [y, m, d] = date.split('-')
    setTimings(null)
    fetchPrayerTimes(`${d}-${m}-${y}`, location.lat, location.lng)
      .then(setTimings)
      .catch(() => setTimings(null))
  }, [date, location.lat, location.lng])

  // Live clock (only relevant for the "now" marker on today).
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  // Ibadah log for the selected date (backend get_or_create).
  useEffect(() => {
    let active = true
    setSaved('idle')
    api
      .get<IbadahLog>(`/ibadah/?date=${date}`)
      .then((res) => {
        if (!active) return
        setData(res.data.data || {})
        setLogId(res.data.id)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [date])

  const toggle = async (prayer: string, field: Field) => {
    const nextData: Matrix = {
      ...data,
      [prayer]: { ...data[prayer], [field]: !data[prayer]?.[field] },
    }
    // Unchecking fardhu also clears its berjamaah + on-time flags.
    if (field === 'fardhu' && !nextData[prayer].fardhu) {
      nextData[prayer].jamaah = false
      nextData[prayer].ontime = false
    }
    setData(nextData)
    if (!logId) return
    setSaved('saving')
    try {
      await api.put(`/ibadah/${logId}/`, { date, data: nextData })
      setSaved('done')
      setTimeout(() => setSaved('idle'), 1200)
    } catch {
      setSaved('idle')
    }
  }

  const fardhuDone = PRAYERS.filter((p) => data[p.key]?.fardhu).length
  const jamaahDone = PRAYERS.filter((p) => data[p.key]?.jamaah).length
  const rawatibTotal = PRAYERS.reduce((n, p) => n + (p.qabliyah ? 1 : 0) + (p.badiyah ? 1 : 0), 0)
  const rawatibDone = PRAYERS.reduce(
    (n, p) => n + (p.qabliyah && data[p.key]?.qabliyah ? 1 : 0) + (p.badiyah && data[p.key]?.badiyah ? 1 : 0),
    0
  )

  // Range map with the currently-edited day merged in for instant updates.
  const merged = { ...rangeLogs, [date]: data }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ibadah"
        subtitle="Jadwal & tracking sholat harian — fardhu, berjamaah, dan rawatib"
        icon={<Moon size={20} />}
      />

      {/* Date navigation */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setDate(shiftDate(date, -1))} className="icon-btn" aria-label="Hari sebelumnya">
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-[230px] text-center">
            <p className="text-sm font-semibold">{formatDateID(`${date}T00:00:00`)}</p>
            {isToday && <p className="text-[11px] text-highlight">Hari ini · {location.label}</p>}
          </div>
          <button
            onClick={() => setDate(shiftDate(date, 1))}
            disabled={isToday}
            className="icon-btn disabled:opacity-30"
            aria-label="Hari berikutnya"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="input w-auto"
        />
      </div>

      <WidgetCard title="Garis Waktu Sholat" icon={<Moon size={15} />}>
        {timings ? (
          <PrayerTimeline timings={timings} now={isToday ? now : null} />
        ) : (
          <p className="text-sm text-muted">Memuat jadwal…</p>
        )}
      </WidgetCard>

      <div className="grid grid-cols-3 gap-4">
        <ProgressStat label="Fardhu" done={fardhuDone} total={5} color="text-highlight" />
        <ProgressStat label="Berjamaah" done={jamaahDone} total={5} color="text-accent1" />
        <ProgressStat label="Rawatib" done={rawatibDone} total={rawatibTotal} color="text-accent2" />
      </div>

      <WidgetCard
        title="Checklist Sholat"
        action={
          <span className="text-[11px] text-muted">
            {saved === 'saving' ? 'menyimpan…' : saved === 'done' ? 'tersimpan ✓' : ''}
          </span>
        }
        bodyClassName="overflow-x-auto"
      >
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted">
              <th className="pb-2 text-left font-medium">Sholat</th>
              <th className="pb-2 text-center font-medium">Qabliyah</th>
              <th className="pb-2 text-center font-medium">Fardhu</th>
              <th className="pb-2 text-center font-medium">Tepat Waktu</th>
              <th className="pb-2 text-center font-medium">Berjamaah</th>
              <th className="pb-2 text-center font-medium">Ba&apos;diyah</th>
            </tr>
          </thead>
          <tbody>
            {PRAYERS.map((p) => (
              <tr key={p.key} className="border-t border-border transition-colors hover:bg-bg/60">
                <td className="py-2.5 font-medium">
                  {p.key}
                  {timings && (
                    <span className="ml-2 font-mono text-[11px] text-muted">{timings[keyOf(p.key)]}</span>
                  )}
                </td>
                <td className="py-2.5 text-center">
                  {p.qabliyah ? (
                    <Box checked={!!data[p.key]?.qabliyah} onClick={() => toggle(p.key, 'qabliyah')} tone="accent2" />
                  ) : (
                    <Dash />
                  )}
                </td>
                <td className="py-2.5 text-center">
                  <Box checked={!!data[p.key]?.fardhu} onClick={() => toggle(p.key, 'fardhu')} tone="highlight" />
                </td>
                <td className="py-2.5 text-center">
                  <Box
                    checked={!!data[p.key]?.ontime}
                    onClick={() => toggle(p.key, 'ontime')}
                    tone="accent1"
                    icon={<Clock size={12} />}
                    disabled={!data[p.key]?.fardhu}
                  />
                </td>
                <td className="py-2.5 text-center">
                  <Box
                    checked={!!data[p.key]?.jamaah}
                    onClick={() => toggle(p.key, 'jamaah')}
                    tone="accent1"
                    disabled={!data[p.key]?.fardhu}
                  />
                </td>
                <td className="py-2.5 text-center">
                  {p.badiyah ? (
                    <Box checked={!!data[p.key]?.badiyah} onClick={() => toggle(p.key, 'badiyah')} tone="accent2" />
                  ) : (
                    <Dash />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-[11px] text-muted">
          Bisa dicentang kapan saja (termasuk di awal waktu). <b className="text-text/80">Tepat Waktu</b> = sholat di
          awal waktu; kosongkan jika di akhir waktu. Centang Fardhu dulu untuk mengaktifkan Tepat Waktu &amp; Berjamaah.
        </p>

        {/* Sunnah (non-rawatib) prayers — single check each */}
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">Sholat Sunnah</p>
          <div className="flex flex-wrap gap-2">
            {SUNNAH.map((name) => {
              const on = !!data[name]?.done
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggle(name, 'done')}
                  aria-pressed={on}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors',
                    on
                      ? 'border-highlight/50 bg-highlight/15 text-highlight'
                      : 'border-border bg-bg text-muted hover:text-text'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded-[4px] border',
                      on ? 'border-highlight bg-highlight text-bg' : 'border-muted'
                    )}
                  >
                    {on && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6.5L4.8 9L9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {name}
                </button>
              )
            })}
          </div>
        </div>
      </WidgetCard>

      <WeeklySummary merged={merged} today={today} />
    </div>
  )
}

// ---- Weekly summary + streaks ----

const DAY_ABBR = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function WeeklySummary({ merged, today }: { merged: Record<string, Matrix>; today: string }) {
  // Last 7 days (oldest → newest).
  const week = Array.from({ length: 7 }, (_, i) => shiftDate(today, -(6 - i)))

  const count = (field: Field) =>
    week.reduce((sum, d) => sum + PRAYERS.filter((p) => merged[d]?.[p.key]?.[field]).length, 0)
  const fardhuWeek = count('fardhu')
  const jamaahWeek = count('jamaah')
  const ontimeWeek = count('ontime')

  // Consecutive days (ending today) with all 5 fardhu. Today may still be in
  // progress, so an incomplete today doesn't break the streak — it's skipped.
  let streak = 0
  for (let i = 0; i < 30; i++) {
    const d = shiftDate(today, -i)
    const complete = fardhuComplete(merged[d])
    if (i === 0 && !complete) continue
    if (complete) streak++
    else break
  }

  // Cell tone per prayer/day: best achievement wins.
  const tone = (d: string, prayer: string): string => {
    const c = merged[d]?.[prayer]
    if (!c?.fardhu) return 'bg-bg'
    if (c.jamaah) return 'bg-accent1'
    if (c.ontime) return 'bg-highlight'
    return 'bg-highlight/40'
  }

  return (
    <WidgetCard title="Ringkasan 7 Hari" bodyClassName="space-y-4">
      <div className="grid grid-cols-4 gap-3 text-center">
        <SummaryStat value={`${streak}`} label="Hari beruntun" sub="fardhu lengkap" color="text-accent2" />
        <SummaryStat value={`${fardhuWeek}/35`} label="Fardhu" color="text-highlight" />
        <SummaryStat value={`${jamaahWeek}/35`} label="Berjamaah" color="text-accent1" />
        <SummaryStat value={`${ontimeWeek}/35`} label="Tepat waktu" color="text-highlight" />
      </div>

      {/* 5 prayers × 7 days grid */}
      <div className="overflow-x-auto">
        <table className="min-w-[420px] border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="w-14" />
              {week.map((d) => {
                const dow = new Date(`${d}T00:00:00`).getDay()
                const dayNum = d.slice(8)
                return (
                  <th key={d} className="text-center text-[10px] font-medium text-muted">
                    <div>{DAY_ABBR[dow]}</div>
                    <div className="text-[9px] opacity-70">{dayNum}</div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {PRAYERS.map((p) => (
              <tr key={p.key}>
                <td className="pr-1 text-right text-[11px] text-muted">{p.key}</td>
                {week.map((d) => (
                  <td key={d} className="text-center">
                    <span
                      className={cn('inline-block h-5 w-5 rounded-[5px]', tone(d, p.key))}
                      title={`${p.key} · ${d}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted">
        <Legend cls="bg-bg border border-border" label="Belum" />
        <Legend cls="bg-highlight/40" label="Fardhu" />
        <Legend cls="bg-highlight" label="Tepat waktu" />
        <Legend cls="bg-accent1" label="Berjamaah" />
      </div>
    </WidgetCard>
  )
}

function SummaryStat({ value, label, sub, color }: { value: string; label: string; sub?: string; color: string }) {
  return (
    <div className="rounded-lg bg-bg px-2 py-3">
      <p className={cn('font-mono text-xl font-semibold', color)}>{value}</p>
      <p className="mt-0.5 text-[11px] text-muted">{label}</p>
      {sub && <p className="text-[9px] text-muted/70">{sub}</p>}
    </div>
  )
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn('h-3 w-3 rounded-[3px]', cls)} /> {label}
    </span>
  )
}

function keyOf(label: string): keyof PrayerTimings {
  const map: Record<string, keyof PrayerTimings> = {
    Subuh: 'Fajr',
    Dzuhur: 'Dhuhr',
    Ashar: 'Asr',
    Maghrib: 'Maghrib',
    Isya: 'Isha',
  }
  return map[label]
}

function ProgressStat({ label, done, total, color }: { label: string; done: number; total: number; color: string }) {
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <WidgetCard bodyClassName="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted">{label}</span>
        <span className={cn('font-mono text-sm font-semibold', color)}>
          {done}/{total}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-bg">
        <div className={cn('h-full rounded-full bg-current', color)} style={{ width: `${pct}%` }} />
      </div>
    </WidgetCard>
  )
}

function Box({
  checked,
  onClick,
  tone,
  disabled,
  icon,
}: {
  checked: boolean
  onClick: () => void
  tone: 'highlight' | 'accent1' | 'accent2'
  disabled?: boolean
  icon?: React.ReactNode
}) {
  const toneBg = {
    highlight: 'bg-highlight border-highlight',
    accent1: 'bg-accent1 border-accent1',
    accent2: 'bg-accent2 border-accent2',
  }[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={checked}
      className={cn(
        'inline-flex h-6 w-6 items-center justify-center rounded-md border transition-colors',
        checked ? `${toneBg} text-bg` : 'border-muted/50 hover:border-accent1',
        disabled && 'cursor-not-allowed opacity-30'
      )}
    >
      {checked ? (
        icon ?? (
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.5L4.8 9L9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )
      ) : (
        icon && <span className="text-muted">{icon}</span>
      )}
    </button>
  )
}

function Dash() {
  return <span className="text-muted/40">—</span>
}

// ---- Timeline ----

const SEG_COLORS: Record<string, string> = {
  Subuh: '#0EA5E9',
  Dzuhur: '#D97706',
  Ashar: '#10B981',
  Maghrib: '#a371f7',
  Isya: '#6366f1',
}

// Diagonal red hatch for forbidden (haram) prayer windows.
const HATCH =
  'repeating-linear-gradient(45deg, rgba(239,68,68,0.55) 0, rgba(239,68,68,0.55) 2px, transparent 2px, transparent 5px)'

function PrayerTimeline({ timings, now }: { timings: PrayerTimings; now: Date | null }) {
  const fajr = minutes(timings.Fajr)
  const sunrise = minutes(timings.Sunrise)
  const dhuhr = minutes(timings.Dhuhr)
  const asr = minutes(timings.Asr)
  const maghrib = minutes(timings.Maghrib)
  const isha = minutes(timings.Isha)
  const nowMin = now ? now.getHours() * 60 + now.getMinutes() : -1

  const segments = [
    { label: 'Isya', start: 0, end: fajr, color: SEG_COLORS.Isya, faded: true },
    { label: 'Subuh', start: fajr, end: sunrise, color: SEG_COLORS.Subuh },
    { label: 'Dhuha', start: sunrise + 15, end: dhuhr - 6, color: '#eab308', faded: true },
    { label: 'Dzuhur', start: dhuhr, end: asr, color: SEG_COLORS.Dzuhur },
    { label: 'Ashar', start: asr, end: maghrib, color: SEG_COLORS.Ashar },
    { label: 'Maghrib', start: maghrib, end: isha, color: SEG_COLORS.Maghrib },
    { label: 'Isya', start: isha, end: 1440, color: SEG_COLORS.Isya },
  ]

  // Forbidden windows: sunrise (~15m), zenith/istiwa (~6m before Dzuhur), sunset (~10m before Maghrib).
  const forbidden = [
    { label: 'Terbit', start: sunrise, end: sunrise + 15 },
    { label: 'Istiwa', start: dhuhr - 6, end: dhuhr },
    { label: 'Terbenam', start: maghrib - 10, end: maghrib },
  ]

  const ticks = [
    { label: 'Subuh', min: fajr },
    { label: 'Syuruq', min: sunrise },
    { label: 'Dzuhur', min: dhuhr },
    { label: 'Ashar', min: asr },
    { label: 'Maghrib', min: maghrib },
    { label: 'Isya', min: isha },
  ]

  const pct = (m: number) => `${(m / 1440) * 100}%`
  const currentIdx = nowMin >= 0 ? segments.findIndex((s) => nowMin >= s.start && nowMin < s.end) : -1

  return (
    <div className="space-y-1">
      <div className="relative h-10 overflow-hidden rounded-lg bg-bg">
        {segments.map((s, i) => {
          const isCurrent = i === currentIdx
          return (
            <div
              key={i}
              className={cn('absolute top-0 h-full transition-all', isCurrent && 'ring-2 ring-inset ring-text/70')}
              style={{
                left: pct(s.start),
                width: pct(s.end - s.start),
                backgroundColor: s.color,
                opacity: isCurrent ? 0.9 : s.faded ? 0.22 : 0.5,
              }}
              title={isCurrent ? `${s.label} (sekarang)` : s.label}
            />
          )
        })}
        {/* Forbidden windows */}
        {forbidden.map((f, i) => (
          <div
            key={`f${i}`}
            className="absolute top-0 h-full"
            style={{ left: pct(f.start), width: pct(Math.max(f.end - f.start, 3)), backgroundImage: HATCH }}
            title={`Waktu terlarang: ${f.label}`}
          />
        ))}
        {/* now marker */}
        {nowMin >= 0 && (
          <div className="absolute top-0 z-10 h-full w-[2px] bg-text" style={{ left: pct(nowMin) }}>
            <span className="absolute -top-0.5 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-text" />
          </div>
        )}
      </div>

      <div className="flex justify-between text-[9px] text-muted">
        {[0, 6, 12, 18, 24].map((h) => (
          <span key={h}>{String(h).padStart(2, '0')}:00</span>
        ))}
      </div>

      {/* Prayer time ticks */}
      <div className="relative mt-3 h-10">
        {ticks.map((t) => (
          <div key={t.label} className="absolute -translate-x-1/2 text-center" style={{ left: pct(t.min) }}>
            <div className="mx-auto h-2 w-[2px]" style={{ backgroundColor: SEG_COLORS[t.label] ?? '#8B949E' }} />
            <p className="mt-0.5 text-[10px] font-medium text-muted">{t.label}</p>
            <p className="font-mono text-[11px] text-text">{timings[tickKey(t.label)]}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[10px] text-muted">
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundImage: HATCH }} /> Waktu terlarang sholat
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm ring-1 ring-text/70" /> Waktu sekarang
        </span>
      </div>
    </div>
  )
}

function tickKey(label: string): keyof PrayerTimings {
  const map: Record<string, keyof PrayerTimings> = {
    Subuh: 'Fajr',
    Syuruq: 'Sunrise',
    Dzuhur: 'Dhuhr',
    Ashar: 'Asr',
    Maghrib: 'Maghrib',
    Isya: 'Isha',
  }
  return map[label]
}
