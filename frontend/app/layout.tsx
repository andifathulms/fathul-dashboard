import type { Metadata } from 'next'

import AppShell from '@/components/layout/AppShell'
import Providers from './providers'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'fathul-dashboard',
  description: 'Personal local command center — projects, tasks, vault, servers, and more.',
}

// Render pages per-request (not prerendered with a year-long cache header) so a
// rebuild is always reflected on the next refresh — this is a local-only app.
export const dynamic = 'force-dynamic'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-bg text-text">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  )
}
