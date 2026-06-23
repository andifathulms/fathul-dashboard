'use client'

import { useEffect, useState } from 'react'

import {
  fetchPrayerTimes,
  getNextPrayer,
  type PrayerTimings,
} from '@/lib/prayer'
import { todayISO } from '@/lib/utils'

export function usePrayer() {
  const [timings, setTimings] = useState<PrayerTimings | null>(null)
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    // Aladhan wants DD-MM-YYYY for the /timings/{date} path.
    const [y, m, d] = todayISO().split('-')
    fetchPrayerTimes(`${d}-${m}-${y}`)
      .then(setTimings)
      .catch(() => setTimings(null))
  }, [])

  // Live clock — ticks every second so the countdown stays fresh.
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const next = timings && now ? getNextPrayer(timings, now) : null

  return { timings, now, next }
}
