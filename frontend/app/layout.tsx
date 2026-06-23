import type { Metadata } from 'next'

import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
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
          <Sidebar />
          <div className="ml-[220px] flex min-h-screen flex-col">
            <TopBar />
            <main className="flex-1 px-6 py-5">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
