'use client'

import useSWR from 'swr'

import { fetchWeather } from '@/lib/weather'

export function useWeather() {
  // Refresh every 10 minutes; weather doesn't move fast.
  const { data, error, isLoading } = useSWR('weather', fetchWeather, {
    refreshInterval: 10 * 60 * 1000,
    revalidateOnFocus: false,
  })
  return { weather: data, error, isLoading }
}
