import axios from 'axios'

// Use 127.0.0.1 (not localhost) so the browser reliably reaches Django over
// IPv4 — on macOS `localhost` may resolve to ::1 first and collide with other
// services (e.g. OrbStack) listening on :8000. Override with NEXT_PUBLIC_API_URL
// (baked at build time) when running in Docker or against a different host.
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api',
  headers: { 'Content-Type': 'application/json' },
})

// SWR fetcher — returns the response body directly.
export const fetcher = (url: string) => api.get(url).then((res) => res.data)

export default api
