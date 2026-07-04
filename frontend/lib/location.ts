'use client'

import { useEffect, useState } from 'react'

export interface Coords {
  lat: number
  lng: number
  label: string
}

export const DEFAULT_LOCATION: Coords = { lat: -1.2654, lng: 116.8312, label: 'Balikpapan' }

const KEY = 'fd_location'
const EVENT = 'fd-location-change'

export function getLocation(): Coords {
  if (typeof window === 'undefined') return DEFAULT_LOCATION
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCATION
}

export function saveLocation(c: Coords) {
  localStorage.setItem(KEY, JSON.stringify(c))
  window.dispatchEvent(new CustomEvent(EVENT))
}

/** Ask the browser for GPS, reverse-geocode to a city name, and persist it. */
export function detectLocation(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        let label = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`
          )
          const d = await res.json()
          label = d.city || d.locality || d.principalSubdivision || label
        } catch {
          /* keep coord label */
        }
        const coords: Coords = { lat: latitude, lng: longitude, label }
        saveLocation(coords)
        resolve(coords)
      },
      (err) => reject(new Error(err.message || 'Failed to get location.')),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    )
  })
}

/** Reactive location — updates whenever saveLocation fires (this tab or others). */
export function useLocation(): Coords {
  const [loc, setLoc] = useState<Coords>(DEFAULT_LOCATION)
  useEffect(() => {
    setLoc(getLocation())
    const handler = () => setLoc(getLocation())
    window.addEventListener(EVENT, handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener(EVENT, handler)
      window.removeEventListener('storage', handler)
    }
  }, [])
  return loc
}
