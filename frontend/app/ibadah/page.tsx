'use client'

import { Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

import PageHeader from '@/components/layout/PageHeader'
import WidgetCard from '@/components/ui/Card'
import { usePrayer } from '@/hooks/usePrayer'
import api from '@/lib/api'
import type { PrayerTimings } from '@/lib/prayer'
import type { IbadahLog } from '@/lib/types'
import { cn, formatDateID, todayISO } from '@/lib/utils'

// Fardhu prayers and which rawatib (sunnah muakkad) apply to each.
// Ashar's qabliyah is ghairu muakkad but commonly tracked, so it's included.
const PRAYERS: { key: string; qabliyah: boolean; badiyah: boolean }[] = [
  { key: 'Subuh', qabliyah: true, badiyah: false },
  { key: 'Dzuhur', qabliyah: true, badiyah: true },
  { key: 'Ashar', qabliyah: true, badiyah: false },
  { key: 'Maghrib', qabliyah: false, badiyah: true },
  { key: 'Isya', qabliyah: false, badiyah: true },
]

type Field = 'qabliyah' | 'fardhu' | 'jamaah' | 'badiyah'
type Matrix = Record<string, Partial<Record<Field, boolean>>>

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export default function IbadahPage() {
  const { timings, now, next } = usePrayer()
  const today = todayISO()

  const [data, setData] = useState<Matrix>({})
  const [logId, setLogId] = useState<number | null>(null)
  const [saved, setSaved] = useState<'idle' | 'saving' | 'done'>('idle')

  useEffect(() => {
    let active = true
    api
      .get<IbadahLog>(`/ibadah/?date=${today}`)
      .then((res) => {
        if (!active) return
        setData(res.data.data || {})
        setLogId(res.data.id)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [today])

  const toggle = async (prayer: string, field: Field) => {
    const nextData: Matrix = {
      ...data,
      [prayer]: { ...data[prayer], [field]: !data[prayer]?.[field] },
    }
    // Unchecking fardhu also clears its berjamaah.
    if (field === 'fardhu' && !nextData[prayer].fardhu) nextData[prayer].jamaah = false
    setData(nextData)
    if (!logId) return
    setSaved('saving')
    try {
      await api.put(`/ibadah/${logId}/`, { date: today, data: nextData })
      setSaved('done')
      setTimeout(() => setSaved('idle'), 1200)
    } catch {
      setSaved('idle')
    }
  }

  // Progress summary.
  const fardhuDone = PRAYERS.filter((p) => data[p.key]?.fardhu).length
  const jamaahDone = PRAYERS.filter((p) => data[p.key]?.jamaah).length
  const rawatibTotal = PRAYERS.reduce((n, p) => n + (p.qabliyah ? 1 : 0) + (p.badiyah ? 1 : 0), 0)
  const rawatibDone = PRAYERS.reduce(
    (n, p) => n + (p.qabliyah && data[p.key]?.qabliyah ? 1 : 0) + (p.badiyah && data[p.key]?.badiyah ? 1 : 0),
    0
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ibadah"
        subtitle="Jadwal & tracking sholat harian — fardhu, berjamaah, dan rawatib"
        icon={<Moon size={20} />}
        action={
          next && (
            <div className="text-right">
              <p className="text-[11px] text-muted">Sholat berikutnya</p>
              <p className="text-sm font-semibold text-accent1">{next.label}</p>
            </div>
          )
        }
      />

      <WidgetCard
        title="Garis Waktu Hari Ini"
        icon={<Moon size={15} />}
        action={<span className="text-[11px] text-muted">{formatDateID(new Date())}</span>}
      >
        {timings && now ? (
          <PrayerTimeline timings={timings} now={now} />
        ) : (
          <p className="text-sm text-muted">Memuat jadwal…</p>
        )}
      </WidgetCard>

      {/* Progress */}
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
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted">
              <th className="pb-2 text-left font-medium">Sholat</th>
              <th className="pb-2 text-center font-medium">Qabliyah</th>
              <th className="pb-2 text-center font-medium">Fardhu</th>
              <th className="pb-2 text-center font-medium">Berjamaah</th>
              <th className="pb-2 text-center font-medium">Ba&apos;diyah</th>
            </tr>
          </thead>
          <tbody>
            {PRAYERS.map((p) => (
              <tr key={p.key} className="border-t border-border">
                <td className="py-2.5 font-medium">{p.key}</td>
                <td className="py-2.5 text-center">
                  {p.qabliyah ? (
                    <Check checked={!!data[p.key]?.qabliyah} onClick={() => toggle(p.key, 'qabliyah')} tone="accent2" />
                  ) : (
                    <Dash />
                  )}
                </td>
                <td className="py-2.5 text-center">
                  <Check checked={!!data[p.key]?.fardhu} onClick={() => toggle(p.key, 'fardhu')} tone="highlight" />
                </td>
                <td className="py-2.5 text-center">
                  <Check
                    checked={!!data[p.key]?.jamaah}
                    onClick={() => toggle(p.key, 'jamaah')}
                    tone="accent1"
                    disabled={!data[p.key]?.fardhu}
                  />
                </td>
                <td className="py-2.5 text-center">
                  {p.badiyah ? (
                    <Check checked={!!data[p.key]?.badiyah} onClick={() => toggle(p.key, 'badiyah')} tone="accent2" />
                  ) : (
                    <Dash />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-[11px] text-muted">
          Centang Fardhu dulu untuk mengaktifkan Berjamaah. Qabliyah Ashar bersifat ghairu muakkad.
        </p>
      </WidgetCard>
    </div>
  )
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

function Check({
  checked,
  onClick,
  tone,
  disabled,
}: {
  checked: boolean
  onClick: () => void
  tone: 'highlight' | 'accent1' | 'accent2'
  disabled?: boolean
}) {
  const toneBg = { highlight: 'bg-highlight border-highlight', accent1: 'bg-accent1 border-accent1', accent2: 'bg-accent2 border-accent2' }[tone]
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
      {checked && (
        <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6.5L4.8 9L9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
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

function PrayerTimeline({ timings, now }: { timings: PrayerTimings; now: Date }) {
  const fajr = minutes(timings.Fajr)
  const sunrise = minutes(timings.Sunrise)
  const dhuhr = minutes(timings.Dhuhr)
  const asr = minutes(timings.Asr)
  const maghrib = minutes(timings.Maghrib)
  const isha = minutes(timings.Isha)
  const nowMin = now.getHours() * 60 + now.getMinutes()

  // Shaded windows across the 24h bar.
  const segments = [
    { label: 'Isya', start: 0, end: fajr, color: SEG_COLORS.Isya, faded: true },
    { label: 'Subuh', start: fajr, end: sunrise, color: SEG_COLORS.Subuh },
    { label: 'Dzuhur', start: dhuhr, end: asr, color: SEG_COLORS.Dzuhur },
    { label: 'Ashar', start: asr, end: maghrib, color: SEG_COLORS.Ashar },
    { label: 'Maghrib', start: maghrib, end: isha, color: SEG_COLORS.Maghrib },
    { label: 'Isya', start: isha, end: 1440, color: SEG_COLORS.Isya },
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

  return (
    <div className="space-y-6 pb-1">
      <div className="relative">
        {/* Bar */}
        <div className="relative h-9 overflow-hidden rounded-lg bg-bg">
          {segments.map((s, i) => (
            <div
              key={i}
              className="absolute top-0 h-full"
              style={{
                left: pct(s.start),
                width: pct(s.end - s.start),
                backgroundColor: s.color,
                opacity: s.faded ? 0.28 : 0.6,
              }}
              title={s.label}
            />
          ))}
          {/* now marker */}
          <div className="absolute top-0 z-10 h-full w-[2px] bg-text" style={{ left: pct(nowMin) }}>
            <span className="absolute -top-0.5 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-text" />
          </div>
        </div>

        {/* Hour guides */}
        <div className="mt-1 flex justify-between text-[9px] text-muted">
          {[0, 6, 12, 18, 24].map((h) => (
            <span key={h}>{String(h).padStart(2, '0')}:00</span>
          ))}
        </div>

        {/* Prayer time ticks */}
        <div className="relative mt-3 h-10">
          {ticks.map((t) => (
            <div
              key={t.label}
              className="absolute -translate-x-1/2 text-center"
              style={{ left: pct(t.min) }}
            >
              <div className="mx-auto h-2 w-[2px]" style={{ backgroundColor: SEG_COLORS[t.label] ?? '#8B949E' }} />
              <p className="mt-0.5 text-[10px] font-medium text-muted">{t.label}</p>
              <p className="font-mono text-[11px] text-text">{timings[labelKey(t.label)]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function labelKey(label: string): keyof PrayerTimings {
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
