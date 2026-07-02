// Shared prayer-tracking config + helpers used by the Ibadah page and the
// dashboard widget so they never drift apart.
import { toISODate } from './utils'

export interface PrayerDef {
  key: string
  qabliyah: boolean
  badiyah: boolean
}

// Fardhu prayers and which rawatib (sunnah muakkad) apply to each.
// Ashar's qabliyah is ghairu muakkad but commonly tracked, so it's included.
export const PRAYERS: PrayerDef[] = [
  { key: 'Subuh', qabliyah: true, badiyah: false },
  { key: 'Dzuhur', qabliyah: true, badiyah: true },
  { key: 'Ashar', qabliyah: true, badiyah: false },
  { key: 'Maghrib', qabliyah: false, badiyah: true },
  { key: 'Isya', qabliyah: false, badiyah: true },
]

export type IbadahField = 'qabliyah' | 'fardhu' | 'ontime' | 'jamaah' | 'badiyah'
export type IbadahMatrix = Record<string, Partial<Record<IbadahField, boolean>>>

export function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export function fardhuComplete(m?: IbadahMatrix): boolean {
  return PRAYERS.every((p) => !!m?.[p.key]?.fardhu)
}

/** Consecutive days (ending today) with all 5 fardhu complete. An unfinished
 *  today doesn't break the streak — the day isn't over yet, so it's skipped. */
export function computeStreak(byDate: Record<string, IbadahMatrix>, today: string): number {
  let streak = 0
  for (let i = 0; i < 60; i++) {
    const d = shiftDate(today, -i)
    const complete = fardhuComplete(byDate[d])
    if (i === 0 && !complete) continue
    if (complete) streak++
    else break
  }
  return streak
}
