'use client'

import {
  Home,
  FolderKanban,
  CheckSquare,
  KeyRound,
  TerminalSquare,
  Timer,
  CalendarRange,
  Server,
  NotebookPen,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import Logo from '@/components/ui/Logo'
import { cn } from '@/lib/utils'

/** Navigation grouped by what part of the day it belongs to (DESIGN.md §9). */
const GROUPS = [
  {
    label: null,
    items: [{ href: '/', label: 'Dashboard', icon: Home }],
  },
  {
    label: 'Work',
    items: [
      { href: '/projects', label: 'Projects', icon: FolderKanban },
      { href: '/tasks', label: 'Tasks', icon: CheckSquare },
      { href: '/focus', label: 'Focus', icon: Timer },
      { href: '/review', label: 'Review', icon: CalendarRange },
    ],
  },
  {
    label: 'Life',
    items: [
      { href: '/log', label: 'Daily Log', icon: NotebookPen },
      { href: '/ibadah', label: 'Ibadah', icon: Moon },
    ],
  },
  {
    label: 'Infra',
    items: [
      { href: '/servers', label: 'VMs', icon: Server },
      { href: '/vault', label: 'Vault', icon: KeyRound },
      { href: '/commands', label: 'Commands', icon: TerminalSquare },
    ],
  },
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
        'fixed inset-y-0 left-0 z-40 flex w-[232px] flex-col border-r border-border bg-surface',
        'transition-transform duration-200 lg:transition-[width]',
        mobileOpen ? 'translate-x-0 shadow-pop' : '-translate-x-full',
        'lg:translate-x-0 lg:shadow-none',
        collapsed ? 'lg:w-[64px]' : 'lg:w-[232px]'
      )}
    >
      {/* Brand + collapse */}
      <div className={cn('flex h-14 items-center gap-2.5 px-4', collapsed && 'lg:justify-center lg:px-0')}>
        <Logo size={26} className="rounded-md" />
        <span
          className={cn(
            'font-display text-md font-semibold tracking-[-0.02em]',
            collapsed && 'lg:hidden'
          )}
        >
          fathul<span className="text-muted">.</span>
        </span>
        <button
          onClick={onToggle}
          className={cn('icon-btn ml-auto hidden lg:flex', collapsed && 'lg:hidden')}
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose size={17} />
        </button>
        <button onClick={onCloseMobile} className="icon-btn ml-auto lg:hidden" aria-label="Close menu">
          <X size={18} />
        </button>
      </div>

      {collapsed && (
        <button
          onClick={onToggle}
          className="icon-btn mx-auto mb-1 hidden lg:flex"
          title="Expand sidebar"
          aria-label="Expand sidebar"
        >
          <PanelLeftOpen size={17} />
        </button>
      )}

      {/* Search */}
      <div className={cn('px-3 pb-3', collapsed && 'lg:px-2')}>
        <button
          onClick={() => window.dispatchEvent(new Event('fd-open-cmdk'))}
          title="Search (⌘K)"
          aria-label="Search"
          className={cn(
            'flex w-full items-center gap-2 rounded-lg border border-border bg-surface2 text-base text-muted transition-colors hover:border-borderStrong hover:text-text',
            collapsed ? 'px-3 py-2 lg:h-9 lg:w-9 lg:justify-center lg:px-0' : 'px-2.5 py-1.5'
          )}
        >
          <Search size={15} className="shrink-0" />
          <span className={cn('flex-1 text-left', collapsed && 'lg:hidden')}>Search</span>
          <kbd
            className={cn(
              'rounded border border-border bg-surface px-1 py-px font-mono text-xs',
              collapsed && 'lg:hidden'
            )}
          >
            ⌘K
          </kbd>
        </button>
      </div>

      <nav className={cn('flex flex-1 flex-col gap-4 overflow-y-auto pb-4', collapsed ? 'px-2' : 'px-3')}>
        {GROUPS.map((group, gi) => (
          <div key={group.label ?? `g${gi}`} className="flex flex-col gap-0.5">
            {group.label && (
              <p
                className={cn(
                  'px-2.5 pb-1 text-xs font-semibold uppercase tracking-[0.1em] text-muted',
                  collapsed && 'lg:hidden'
                )}
              >
                {group.label}
              </p>
            )}
            {/* Collapsed rail: a hairline stands in for the group label. */}
            {group.label && collapsed && <span className="mx-auto mb-1 hidden h-px w-5 bg-border lg:block" />}

            {group.items.map(({ href, label, icon: Icon }) => {
              const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onCloseMobile}
                  title={collapsed ? label : undefined}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-base font-medium transition-colors duration-150',
                    collapsed && 'lg:h-9 lg:w-9 lg:justify-center lg:gap-0 lg:px-0',
                    active
                      ? 'bg-accent1/10 text-accent1'
                      : 'text-text2 hover:bg-surface2 hover:text-text'
                  )}
                >
                  <Icon size={17} className="shrink-0" />
                  <span className={cn('truncate', collapsed && 'lg:hidden')}>{label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className={cn('border-t border-border px-4 py-3 text-xs text-muted', collapsed && 'lg:hidden')}>
        <p>© {new Date().getFullYear()} Andi Fathul Mukminin</p>
      </div>
    </aside>
  )
}
