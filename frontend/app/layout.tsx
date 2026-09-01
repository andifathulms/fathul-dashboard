import type { Metadata } from 'next'
import { Bricolage_Grotesque, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google'

import AppShell from '@/components/layout/AppShell'
import Providers from './providers'
import '@/styles/globals.css'

// Self-hosted at build time — no render-blocking request to Google, and the
// app keeps its typography offline. DESIGN.md §3.
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'fathul-dashboard',
  description: 'Personal local command center — projects, tasks, vault, servers, and more.',
}

// Render pages per-request (not prerendered with a year-long cache header) so a
// rebuild is always reflected on the next refresh — this is a local-only app.
export const dynamic = 'force-dynamic'

// Applies the saved theme before first paint so there is no light/dark flash.
const THEME_BOOTSTRAP = `
try {
  if (localStorage.getItem('fd_theme') === 'dark') document.documentElement.classList.add('dark')
} catch (e) {}
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="min-h-screen bg-bg text-text">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  )
}
