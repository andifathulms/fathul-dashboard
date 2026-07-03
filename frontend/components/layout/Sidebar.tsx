'use client'

import {
  Home,
  FolderKanban,
  CheckSquare,
  KeyRound,
  TerminalSquare,
  Server,
  NotebookPen,
  Moon,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

const NAV = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/ibadah', label: 'Ibadah', icon: Moon },
  { href: '/vault', label: 'Vault', icon: KeyRound },
  { href: '/commands', label: 'Commands', icon: TerminalSquare },
  { href: '/servers', label: 'Servers', icon: Server },
  { href: '/log', label: 'Daily Log', icon: NotebookPen },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-surface transition-[width] duration-200',
        collapsed ? 'w-[64px]' : 'w-[220px]'
      )}
    >
      {/* Brand + toggle */}
      <div className={cn('flex items-center py-5', collapsed ? 'justify-center px-0' : 'gap-2 px-5')}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent1/15 font-mono text-sm font-bold text-accent1">
          f.
        </span>
        {!collapsed && (
          <>
            <span className="font-mono text-sm font-semibold tracking-tight">
              fathul<span className="text-muted">-dashboard</span>
            </span>
            <button onClick={onToggle} className="icon-btn ml-auto" title="Ciutkan sidebar" aria-label="Ciutkan sidebar">
              <ChevronsLeft size={16} />
            </button>
          </>
        )}
      </div>

      {collapsed && (
        <button
          onClick={onToggle}
          className="icon-btn mx-auto mb-2"
          title="Lebarkan sidebar"
          aria-label="Lebarkan sidebar"
        >
          <ChevronsRight size={16} />
        </button>
      )}

      <nav className={cn('flex flex-1 flex-col gap-1 py-2', collapsed ? 'items-center px-2' : 'px-3')}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'group relative flex items-center rounded-lg text-sm font-medium transition-all duration-150',
                collapsed ? 'h-10 w-10 justify-center' : 'gap-3 px-3 py-2',
                active ? 'bg-accent1/10 text-accent1' : 'text-muted hover:bg-border/50 hover:text-text'
              )}
            >
              {active && !collapsed && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent1" />
              )}
              <Icon size={17} className={cn('shrink-0 transition-transform', !active && 'group-hover:scale-110')} />
              {!collapsed && label}
            </Link>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="border-t border-border px-5 py-4 text-[11px] text-muted">
          <p className="font-mono">localhost only</p>
          <p className="mt-0.5">Balikpapan · IKN</p>
        </div>
      )}
    </aside>
  )
}
