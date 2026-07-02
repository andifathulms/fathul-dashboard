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

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[220px] flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent1/15 font-mono text-sm font-bold text-accent1">
          f.
        </span>
        <span className="font-mono text-sm font-semibold tracking-tight">
          fathul<span className="text-muted">-dashboard</span>
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-accent1/10 text-accent1'
                  : 'text-muted hover:bg-border/50 hover:text-text'
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border px-5 py-4 text-[11px] text-muted">
        <p className="font-mono">localhost only</p>
        <p className="mt-0.5">Balikpapan · IKN</p>
      </div>
    </aside>
  )
}
