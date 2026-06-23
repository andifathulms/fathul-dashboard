import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
})

// SWR fetcher — returns the response body directly.
export const fetcher = (url: string) => api.get(url).then((res) => res.data)

export default api
