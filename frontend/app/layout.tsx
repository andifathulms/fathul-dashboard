import type { Metadata } from 'next'

import AppShell from '@/components/layout/AppShell'
import Providers from './providers'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'fathul-dashboard',
  description: 'Personal local command center — projects, tasks, vault, servers, and more.',
}

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
