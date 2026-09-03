'use client'

import {
  Home,
  FolderKanban,
  CheckSquare,
  Timer,
  CalendarRange,
  Github,
  CheckCircle2,
  Plus,
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
import useSWR, { mutate as globalMutate } from 'swr'

import { useToast } from '@/components/ui/Toast'
import api from '@/lib/api'
import { parseTask } from '@/lib/nlp'
import type { Command, DailyLog, Project, Task } from '@/lib/types'
import { cn, formatDateShort, todayISO } from '@/lib/utils'

/** Pull the matching line out of a journal entry, so the result shows the
 *  sentence you searched for rather than the first line of that day. */
function snippet(text: string, needle: string): string {
  const at = text.toLowerCase().indexOf(needle.toLowerCase())
  if (at < 0) return text.slice(0, 90)
  const from = Math.max(0, at - 30)
  return `${from > 0 ? '…' : ''}${text.slice(from, from + 90).trim()}`
}

const NAV = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/focus', label: 'Focus', icon: Timer },
  { href: '/review', label: 'Weekly review', icon: CalendarRange },
  { href: '/code', label: 'Code activity', icon: Github },
  { href: '/ibadah', label: 'Ibadah', icon: Moon },
  { href: '/vault', label: 'Vault', icon: KeyRound },
  { href: '/commands', label: 'Commands', icon: TerminalSquare },
  { href: '/servers', label: 'VMs', icon: Server },
  { href: '/log', label: 'Daily Log', icon: NotebookPen },
]

interface Item {
  id: string
  label: string
  hint?: string
  /** Rendered under the label instead of `hint` — used for the capture preview. */
  preview?: React.ReactNode
  group: string
  icon: LucideIcon
  run: () => void
}

const MATCH_TONES: Record<string, string> = {
  date: 'bg-accent1/10 text-accent1 ring-accent1/25',
  project: 'bg-accent2/10 text-accent2 ring-accent2/25',
  repeat: 'bg-highlight/10 text-highlight ring-highlight/25',
  estimate: 'bg-muted/10 text-muted ring-muted/30',
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
  const { data: tasks } = useSWR<Task[]>(open ? '/tasks/?is_done=false' : null)
  const { data: logs } = useSWR<DailyLog[]>(open ? '/logs/' : null)

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
      hint: 'Page',
      group: 'Navigation',
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
      group: 'Commands (copy)',
      icon: TerminalSquare,
      run: async () => {
        try {
          await navigator.clipboard.writeText(c.command)
          toast.success(c.command, 'Command copied')
        } catch {
          /* clipboard unavailable */
        }
      },
    }))
    const taskItems: Item[] = (tasks ?? []).map((t) => ({
      id: `task:${t.id}`,
      label: t.title,
      hint: t.project_name ?? (t.due_date ? formatDateShort(t.due_date) : 'No project'),
      group: 'Tasks',
      icon: CheckSquare,
      run: () => router.push(t.project ? `/projects/${t.project}` : '/tasks'),
    }))
    return [...nav, ...proj, ...cmds, ...taskItems]
  }, [projects, commands, tasks, router, toast])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return items
    const matches = items.filter(
      (i) => i.label.toLowerCase().includes(s) || i.hint?.toLowerCase().includes(s)
    )

    // The journal is searched only once you type — it is the slowest thing to
    // scan and the least likely thing you want with an empty query.
    const journal: Item[] = (logs ?? [])
      .filter((l) => l.journal.toLowerCase().includes(s))
      .slice(0, 6)
      .map((l) => ({
        id: `log:${l.id}`,
        label: formatDateShort(l.date),
        hint: snippet(l.journal, s),
        group: 'Daily log',
        icon: NotebookPen,
        run: () => router.push(`/log?date=${l.date}`),
      }))

    return [...matches, ...journal]
  }, [items, q, logs, router])

  // Quick capture: whatever you typed can always become a task. It sits last
  // so it never steals Enter from a real match — and first by default when
  // nothing matched, which is exactly when you meant to capture something.
  const results = useMemo(() => {
    const raw = q.trim()
    if (!raw) return filtered

    // "deploy staging besok #ekiosk" carries its own due date and project —
    // the preview below shows what was understood before you commit to it.
    const parsed = parseTask(raw, projects ?? [])
    const title = parsed.title || raw
    const capture: Item = {
      id: 'capture',
      label: `Add task “${title}”`,
      preview:
        parsed.matched.length > 0 ? (
          <span className="mt-0.5 flex flex-wrap items-center gap-1">
            {parsed.matched.map((m) => (
              <span
                key={m.kind + m.text}
                className={cn('chip text-xs ring-1 ring-inset', MATCH_TONES[m.kind])}
              >
                {m.label}
              </span>
            ))}
          </span>
        ) : undefined,
      hint: parsed.matched.length === 0 ? 'Captured with no due date' : undefined,
      group: 'Capture',
      icon: Plus,
      run: async () => {
        try {
          await api.post('/tasks/', {
            title,
            project: parsed.project?.id ?? null,
            due_date: parsed.dueDate,
            repeat: parsed.repeat,
            repeat_interval: parsed.repeatInterval,
            estimate_pomodoros: parsed.estimate,
            today_on: parsed.forToday ? todayISO() : null,
          })
          await globalMutate((key) => typeof key === 'string' && key.startsWith('/tasks'))
          toast.success(title, 'Task added')
        } catch (e) {
          toast.error((e as Error).message, "Couldn't add the task")
        }
      },
    }
    return [...filtered, capture]
  }, [filtered, q, projects, toast])

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
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(results[active])
    }
  }

  if (!open) return null

  let lastGroup = ''

  return (
    <div
      className="scrim fixed inset-0 z-[95] flex items-start justify-center overflow-y-auto p-4 pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl animate-scale-in overflow-hidden rounded-2xl border border-border bg-surface shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search size={17} className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search anything, or type to capture a task…"
            className="w-full bg-transparent py-3.5 text-md text-text outline-none placeholder:text-muted"
          />
          <kbd className="hidden shrink-0 rounded border border-border bg-surface2 px-1.5 py-0.5 font-mono text-xs text-muted sm:block">
            esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <p className="px-3 py-10 text-center text-base text-muted">
              Nothing matches “{q}”.
            </p>
          )}
          {results.map((it, idx) => {
            const header = it.group !== lastGroup ? it.group : null
            lastGroup = it.group
            const Icon = it.icon
            return (
              <div key={it.id}>
                {header && (
                  <p className="px-2 pb-1 pt-3 text-xs font-semibold uppercase tracking-[0.1em] text-muted first:pt-1">
                    {header}
                  </p>
                )}
                <button
                  data-idx={idx}
                  onMouseMove={() => setActive(idx)}
                  onClick={() => run(it)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors',
                    idx === active ? 'bg-accent1/10' : 'hover:bg-surface2'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                      idx === active ? 'bg-accent1/15 text-accent1' : 'bg-surface2 text-muted'
                    )}
                  >
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-medium text-text">{it.label}</span>
                    {it.hint && (
                      <span className="block truncate font-mono text-xs text-muted">{it.hint}</span>
                    )}
                    {it.preview}
                  </span>
                  {idx === active && <CornerDownLeft size={14} className="shrink-0 text-muted" />}
                </button>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-3 border-t border-border bg-surface2/50 px-4 py-2 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <Kbd>↵</Kbd> select
          </span>
          <span className="ml-auto flex items-center gap-1">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd> open
          </span>
        </div>
      </div>
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-xs text-muted">
      {children}
    </kbd>
  )
}
