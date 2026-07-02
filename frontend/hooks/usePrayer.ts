'use client'

import { useEffect, useState } from 'react'

import { useLocation } from '@/lib/location'
import {
  fetchPrayerTimes,
  getNextPrayer,
  type PrayerTimings,
} from '@/lib/prayer'
import { todayISO } from '@/lib/utils'

export function usePrayer() {
  const location = useLocation()
  const [timings, setTimings] = useState<PrayerTimings | null>(null)
  const [now, setNow] = useState<Date | null>(null)

  // Refetch whenever the location changes.
  useEffect(() => {
    // Aladhan wants DD-MM-YYYY for the /timings/{date} path.
    const [y, m, d] = todayISO().split('-')
    fetchPrayerTimes(`${d}-${m}-${y}`, location.lat, location.lng)
      .then(setTimings)
      .catch(() => setTimings(null))
  }, [location.lat, location.lng])

  // Live clock — ticks every second so the countdown stays fresh.
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const next = timings && now ? getNextPrayer(timings, now) : null

  return { timings, now, next, location }
}
