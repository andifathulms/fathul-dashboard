'use client'

import { useEffect, useState } from 'react'

import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { cn } from '@/lib/utils'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setCollapsed(localStorage.getItem('fd_sidebar_collapsed') === '1')
  }, [])

  const toggle = () =>
    setCollapsed((c) => {
      const next = !c
      localStorage.setItem('fd_sidebar_collapsed', next ? '1' : '0')
      return next
    })

  return (
    <>
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div
        className={cn(
          'flex min-h-screen flex-col transition-[margin] duration-200',
          collapsed ? 'ml-[64px]' : 'ml-[220px]'
        )}
      >
        <TopBar />
        <main className="flex-1 px-6 py-5">{children}</main>
      </div>
    </>
  )
}
