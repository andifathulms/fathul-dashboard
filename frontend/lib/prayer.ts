// Prayer times computed locally with the Kemenag method (Fajr 20°, Isha 18°,
// Shafi'i Asr) — see lib/prayerCalc. Default coords: Balikpapan.
import { computePrayerTimes } from './prayerCalc'

export const BALIKPAPAN = { lat: -1.2654, lng: 116.8312 }

export interface PrayerTimings {
  Fajr: string
  Sunrise: string
  Dhuhr: string
  Asr: string
  Maghrib: string
  Isha: string
  [key: string]: string
}

// Order + Indonesian labels for the six rows we display.
export const PRAYER_SEQUENCE: { key: keyof PrayerTimings; label: string }[] = [
  { key: 'Fajr', label: 'Subuh' },
  { key: 'Sunrise', label: 'Syuruq' },
  { key: 'Dhuhr', label: 'Dzuhur' },
  { key: 'Asr', label: 'Ashar' },
  { key: 'Maghrib', label: 'Maghrib' },
  { key: 'Isha', label: 'Isya' },
]

// Computed locally (Kemenag method) — no network. `date` is DD-MM-YYYY.
// Kept async + same signature so callers (usePrayer, Ibadah page) don't change.
export async function fetchPrayerTimes(
  date: string,
  lat: number = BALIKPAPAN.lat,
  lng: number = BALIKPAPAN.lng
): Promise<PrayerTimings> {
  const [dd, mm, yyyy] = date.split('-').map(Number)
  return computePrayerTimes(yyyy, mm, dd, lat, lng)
}

// Given timings and "now", return the next prayer and minutes until it.
export function getNextPrayer(timings: PrayerTimings, now: Date) {
  const prayersOnly = PRAYER_SEQUENCE.filter((p) => p.key !== 'Sunrise')

  for (const p of prayersOnly) {
    const time = timings[p.key]
    if (!time) continue
    const [h, m] = time.split(':').map(Number)
    // Build the target from `now` in LOCAL time (not UTC) so the comparison is
    // correct regardless of timezone.
    const target = new Date(now)
    target.setHours(h, m, 0, 0)
    if (target > now) {
      const diffMs = target.getTime() - now.getTime()
      return {
        label: p.label,
        key: p.key,
        time,
        minutesUntil: Math.round(diffMs / 60000),
      }
    }
  }
  // All of today's prayers passed → next is tomorrow's Subuh.
  return { label: 'Subuh', key: 'Fajr' as const, time: timings.Fajr, minutesUntil: null }
}

export function formatCountdown(minutes: number | null): string {
  if (minutes === null) return 'besok'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}j ${m}m`
  return `${m}m`
}
