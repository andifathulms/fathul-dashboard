import { NextResponse } from 'next/server'

// Local-only app: force the browser to always revalidate HTML documents so a
// rebuild is picked up on the next refresh (Next otherwise serves prerendered
// pages with a year-long s-maxage). Hashed assets under /_next/static keep their
// own immutable caching — they're excluded by the matcher below.
export function middleware() {
  const res = NextResponse.next()
  res.headers.set('Cache-Control', 'no-store, must-revalidate')
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
