'use client'

import useSWR from 'swr'

import { useLocation } from '@/lib/location'
import { fetchWeather } from '@/lib/weather'

export function useWeather() {
  const location = useLocation()
  // Refresh every 10 minutes; weather doesn't move fast. Key by coords so it
  // refetches when the location changes.
  const { data, error, isLoading } = useSWR(
    ['weather', location.lat, location.lng],
    () => fetchWeather(location.lat, location.lng),
    {
      refreshInterval: 10 * 60 * 1000,
      revalidateOnFocus: false,
    }
  )
  return { weather: data, error, isLoading }
}
