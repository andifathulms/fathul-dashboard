// Local prayer-time calculation — no network needed.
// Method: Kemenag RI (Fajr 20°, Isha 18°), Shafi'i Asr (shadow factor 1).
// Ported from the well-known PrayTimes.org algorithm.
import type { PrayerTimings } from './prayer'

// Degree-based trig helpers.
const dtr = (d: number) => (d * Math.PI) / 180
const rtd = (r: number) => (r * 180) / Math.PI
const sin = (d: number) => Math.sin(dtr(d))
const cos = (d: number) => Math.cos(dtr(d))
const tan = (d: number) => Math.tan(dtr(d))
const arcsin = (x: number) => rtd(Math.asin(x))
const arccos = (x: number) => rtd(Math.acos(x))
const arctan2 = (y: number, x: number) => rtd(Math.atan2(y, x))
const arccot = (x: number) => rtd(Math.atan2(1, x))

function fix(a: number, b: number): number {
  const r = a - b * Math.floor(a / b)
  return r < 0 ? r + b : r
}
const fixAngle = (a: number) => fix(a, 360)
const fixHour = (a: number) => fix(a, 24)

function julian(year: number, month: number, day: number): number {
  if (month <= 2) {
    year -= 1
    month += 12
  }
  const A = Math.floor(year / 100)
  const B = 2 - A + Math.floor(A / 4)
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5
}

// Sun declination + equation of time for a Julian day.
function sunPosition(jd: number) {
  const D = jd - 2451545.0
  const g = fixAngle(357.529 + 0.98560028 * D)
  const q = fixAngle(280.459 + 0.98564736 * D)
  const L = fixAngle(q + 1.915 * sin(g) + 0.02 * sin(2 * g))
  const e = 23.439 - 0.00000036 * D
  const RA = arctan2(cos(e) * sin(L), cos(L)) / 15
  const eqt = q / 15 - fixHour(RA)
  const decl = arcsin(sin(e) * sin(L))
  return { decl, eqt }
}

const RISE_SET_ANGLE = 0.833 // sun altitude at sunrise/sunset (refraction + radius)

function fmt(t: number): string {
  const r = fixHour(t + 0.5 / 60) // round to nearest minute
  const h = Math.floor(r)
  const m = Math.floor((r - h) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Compute prayer times for a date + coordinates.
 * @param tz UTC offset in hours; defaults to the device offset for that date.
 */
export function computePrayerTimes(
  year: number,
  month: number,
  day: number,
  lat: number,
  lng: number,
  tz?: number
): PrayerTimings {
  const timezone = tz ?? -new Date(year, month - 1, day).getTimezoneOffset() / 60
  const jDate = julian(year, month, day) - lng / (15 * 24)

  const sunPos = (t: number) => sunPosition(jDate + t)
  const midDay = (t: number) => fixHour(12 - sunPos(t).eqt)
  const sunAngleTime = (angle: number, t: number, ccw = false) => {
    const decl = sunPos(t).decl
    const noon = midDay(t)
    const a = (-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat))
    const T = (1 / 15) * arccos(a)
    return noon + (ccw ? -T : T)
  }
  const asrTime = (factor: number, t: number) => {
    const decl = sunPos(t).decl
    const angle = -arccot(factor + tan(Math.abs(lat - decl)))
    return sunAngleTime(angle, t)
  }

  // Iterate from initial guesses (hours), feeding day-fractions each round.
  let times = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, sunset: 18, isha: 18 }
  for (let i = 0; i < 2; i++) {
    const t = {
      fajr: times.fajr / 24,
      sunrise: times.sunrise / 24,
      dhuhr: times.dhuhr / 24,
      asr: times.asr / 24,
      sunset: times.sunset / 24,
      isha: times.isha / 24,
    }
    times = {
      fajr: sunAngleTime(20, t.fajr, true),
      sunrise: sunAngleTime(RISE_SET_ANGLE, t.sunrise, true),
      dhuhr: midDay(t.dhuhr),
      asr: asrTime(1, t.asr),
      sunset: sunAngleTime(RISE_SET_ANGLE, t.sunset),
      isha: sunAngleTime(18, t.isha),
    }
  }

  const adjust = (t: number) => t + timezone - lng / 15
  return {
    Fajr: fmt(adjust(times.fajr)),
    Sunrise: fmt(adjust(times.sunrise)),
    Dhuhr: fmt(adjust(times.dhuhr)),
    Asr: fmt(adjust(times.asr)),
    Maghrib: fmt(adjust(times.sunset)),
    Isha: fmt(adjust(times.isha)),
  }
}
