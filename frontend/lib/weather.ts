// Weather via Open-Meteo (free, no API key). Coords: Balikpapan.
import { BALIKPAPAN } from './prayer'

export interface Weather {
  temperature: number
  weathercode: number
}

export async function fetchWeather(
  lat: number = BALIKPAPAN.lat,
  lng: number = BALIKPAPAN.lng
): Promise<Weather> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode&timezone=auto`
  )
  const data = await res.json()
  return {
    temperature: data.current.temperature_2m,
    weathercode: data.current.weathercode,
  }
}

// Map WMO weather codes to a label + emoji icon.
export function describeWeather(code: number): { label: string; icon: string } {
  if (code === 0) return { label: 'Clear', icon: '☀️' }
  if (code <= 2) return { label: 'Partly Cloudy', icon: '🌤️' }
  if (code === 3) return { label: 'Cloudy', icon: '☁️' }
  if (code <= 48) return { label: 'Foggy', icon: '🌫️' }
  if (code <= 57) return { label: 'Drizzle', icon: '🌦️' }
  if (code <= 67) return { label: 'Rain', icon: '🌧️' }
  if (code <= 77) return { label: 'Snow', icon: '🌨️' }
  if (code <= 82) return { label: 'Heavy Rain', icon: '⛈️' }
  if (code <= 99) return { label: 'Thunderstorm', icon: '⛈️' }
  return { label: 'Unknown', icon: '🌡️' }
}
