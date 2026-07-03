'use client'

import {
  Home,
  FolderKanban,
  CheckSquare,
  Moon,
  KeyRound,
  TerminalSquare,
  Server,
  NotebookPen,
  Search,
  CornerDownLeft,
  type LucideIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'

import { useToast } from '@/components/ui/Toast'
import type { Command, Project } from '@/lib/types'
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

interface Item {
  id: string
  label: string
  hint?: string
  group: string
  icon: LucideIcon
  run: () => void
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const router = useRouter()
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Only fetch the searchable data while the palette is open.
  const { data: projects } = useSWR<Project[]>(open ? '/projects/' : null)
  const { data: commands } = useSWR<Command[]>(open ? '/commands/' : null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('fd-open-cmdk', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('fd-open-cmdk', onOpen)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const items: Item[] = useMemo(() => {
    const nav: Item[] = NAV.map((n) => ({
      id: `nav:${n.href}`,
      label: n.label,
      hint: 'Halaman',
      group: 'Navigasi',
      icon: n.icon,
      run: () => router.push(n.href),
    }))
    const proj: Item[] = (projects ?? []).map((p) => ({
      id: `proj:${p.id}`,
      label: p.name,
      hint: 'Project',
      group: 'Projects',
      icon: FolderKanban,
      run: () => router.push(`/projects/${p.id}`),
    }))
    const cmds: Item[] = (commands ?? []).map((c) => ({
      id: `cmd:${c.id}`,
      label: c.title,
      hint: c.command,
      group: 'Commands (salin)',
      icon: TerminalSquare,
      run: async () => {
        try {
          await navigator.clipboard.writeText(c.command)
          toast.success(c.command, 'Command disalin')
        } catch {
          /* clipboard unavailable */
        }
      },
    }))
    return [...nav, ...proj, ...cmds]
  }, [projects, commands, router, toast])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return items
    return items.filter(
      (i) => i.label.toLowerCase().includes(s) || i.hint?.toLowerCase().includes(s)
    )
  }, [items, q])

  useEffect(() => setActive(0), [q])

  // Keep the active item in view.
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${active}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const run = (i?: Item) => {
    if (!i) return
    setOpen(false)
    i.run()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(filtered[active])
    }
  }

  if (!open) return null

  let lastGroup = ''

  return (
    <div
      className="fixed inset-0 z-[95] flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl animate-scale-in overflow-hidden rounded-xl border border-border bg-surface shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search size={17} className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Cari halaman, project, command…"
            className="w-full bg-transparent py-3.5 text-sm text-text outline-none placeholder:text-muted"
          />
          <kbd className="hidden shrink-0 rounded border border-border bg-bg px-1.5 py-0.5 font-mono text-[10px] text-muted sm:block">
            esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted">Tidak ada hasil.</p>
          )}
          {filtered.map((it, idx) => {
            const header = it.group !== lastGroup ? it.group : null
            lastGroup = it.group
            const Icon = it.icon
            return (
              <div key={it.id}>
                {header && (
                  <p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted first:pt-1">
                    {header}
                  </p>
                )}
                <button
                  data-idx={idx}
                  onMouseMove={() => setActive(idx)}
                  onClick={() => run(it)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors',
                    idx === active ? 'bg-accent1/12 text-text' : 'text-muted hover:bg-border/40'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                      idx === active ? 'bg-accent1/15 text-accent1' : 'bg-bg text-muted'
                    )}
                  >
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-text">{it.label}</span>
                    {it.hint && (
                      <span className="block truncate font-mono text-[11px] text-muted">{it.hint}</span>
                    )}
                  </span>
                  {idx === active && <CornerDownLeft size={14} className="shrink-0 text-muted" />}
                </button>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> pindah
          </span>
          <span className="flex items-center gap-1">
            <Kbd>↵</Kbd> pilih
          </span>
          <span className="ml-auto flex items-center gap-1">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd> buka
          </span>
        </div>
      </div>
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-bg px-1.5 py-0.5 font-mono text-[10px] text-muted">
      {children}
    </kbd>
  )
}
