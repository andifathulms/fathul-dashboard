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
  Search,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import Logo from '@/components/ui/Logo'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/ibadah', label: 'Ibadah', icon: Moon },
  { href: '/vault', label: 'Vault', icon: KeyRound },
  { href: '/commands', label: 'Commands', icon: TerminalSquare },
  { href: '/servers', label: 'VMs', icon: Server },
  { href: '/log', label: 'Daily Log', icon: NotebookPen },
]

interface SidebarProps {
  /** Desktop: collapse to an icon rail. Ignored on mobile (drawer is full). */
  collapsed: boolean
  onToggle: () => void
  /** Mobile: drawer open state + close handler. */
  mobileOpen: boolean
  onCloseMobile: () => void
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col border-r border-border bg-gradient-to-b from-surface to-[#12161d]',
        'transition-transform duration-200 lg:transition-[width]',
        mobileOpen ? 'translate-x-0 shadow-pop' : '-translate-x-full',
        'lg:translate-x-0 lg:shadow-none',
        collapsed ? 'lg:w-[64px]' : 'lg:w-[220px]'
      )}
    >
      {/* Brand + toggle */}
      <div className={cn('flex items-center gap-2 px-4 py-5', collapsed && 'lg:justify-center lg:px-0')}>
        {/* Icon-only when collapsed (desktop) */}
        <Logo
          size={32}
          className={cn('rounded-lg shadow-[0_2px_12px_-3px_rgba(141,95,240,0.7)]', collapsed ? 'hidden lg:block' : 'hidden')}
        />
        {/* Full horizontal lockup when expanded (and always on mobile) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-lockup-horizontal.png"
          alt="fathul-dashboard"
          className={cn('h-8 w-auto', collapsed && 'lg:hidden')}
        />
        {/* Desktop collapse (hidden when already collapsed) */}
        <button
          onClick={onToggle}
          className={cn('icon-btn ml-auto hidden lg:flex', collapsed && 'lg:hidden')}
          title="Ciutkan sidebar"
          aria-label="Ciutkan sidebar"
        >
          <ChevronsLeft size={16} />
        </button>
        {/* Mobile close */}
        <button onClick={onCloseMobile} className="icon-btn ml-auto lg:hidden" aria-label="Tutup menu">
          <X size={18} />
        </button>
      </div>

      {/* Desktop expand button (only when collapsed) */}
      {collapsed && (
        <button
          onClick={onToggle}
          className="icon-btn mx-auto mb-2 hidden lg:flex"
          title="Lebarkan sidebar"
          aria-label="Lebarkan sidebar"
        >
          <ChevronsRight size={16} />
        </button>
      )}

      {/* Command palette trigger */}
      <div className={cn('px-3 pb-1', collapsed && 'lg:px-2')}>
        <button
          onClick={() => window.dispatchEvent(new Event('fd-open-cmdk'))}
          title="Cari (⌘K)"
          className={cn(
            'flex w-full items-center gap-2 rounded-lg border border-border bg-bg text-sm text-muted transition-colors hover:border-accent1/40 hover:text-text',
            collapsed ? 'lg:h-10 lg:w-10 lg:justify-center lg:px-0 px-3 py-2' : 'px-3 py-2'
          )}
        >
          <Search size={16} className="shrink-0" />
          <span className={cn('flex-1 text-left', collapsed && 'lg:hidden')}>Cari…</span>
          <kbd className={cn('rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px]', collapsed && 'lg:hidden')}>
            ⌘K
          </kbd>
        </button>
      </div>

      <nav className={cn('flex flex-1 flex-col gap-1 py-2', collapsed ? 'px-3 lg:items-center lg:px-2' : 'px-3')}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onCloseMobile}
              title={collapsed ? label : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                collapsed && 'lg:h-10 lg:w-10 lg:justify-center lg:gap-0 lg:px-0',
                active
                  ? 'bg-accent1/12 text-accent1 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.18)]'
                  : 'text-muted hover:bg-border/50 hover:text-text'
              )}
            >
              {active && (
                <span
                  className={cn(
                    'absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent1 shadow-[0_0_10px_rgba(56,189,248,0.7)]',
                    collapsed && 'lg:hidden'
                  )}
                />
              )}
              <Icon size={17} className={cn('shrink-0 transition-transform', !active && 'group-hover:scale-110')} />
              <span className={cn(collapsed && 'lg:hidden')}>{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className={cn('border-t border-border px-5 py-4 text-[11px] text-muted', collapsed && 'lg:hidden')}>
        <p>© {new Date().getFullYear()} Andi Fathul Mukminin</p>
      </div>
    </aside>
  )
}
