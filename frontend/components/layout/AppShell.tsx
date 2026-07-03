'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import CommandPalette from './CommandPalette'
import PageTransition from './PageTransition'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { cn } from '@/lib/utils'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setCollapsed(localStorage.getItem('fd_sidebar_collapsed') === '1')
  }, [])

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const toggle = () =>
    setCollapsed((c) => {
      const next = !c
      localStorage.setItem('fd_sidebar_collapsed', next ? '1' : '0')
      return next
    })

  return (
    <>
      <Sidebar
        collapsed={collapsed}
        onToggle={toggle}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <div
        className={cn(
          'flex min-h-screen flex-col transition-[margin] duration-200',
          collapsed ? 'lg:ml-[64px]' : 'lg:ml-[220px]'
        )}
      >
        <TopBar onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-5 sm:px-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      <CommandPalette />
    </>
  )
}
