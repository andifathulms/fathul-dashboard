'use client'

import { TerminalSquare, Plus, Pencil, Trash2, Terminal } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import PageHeader from '@/components/layout/PageHeader'
import CommandForm, { CATEGORIES } from '@/components/commands/CommandForm'
import WidgetCard from '@/components/ui/Card'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import CopyButton from '@/components/ui/CopyButton'
import EmptyState from '@/components/ui/EmptyState'
import Segmented, { FilterBar, SearchField } from '@/components/ui/Segmented'
import { useToast } from '@/components/ui/Toast'
import api from '@/lib/api'
import { sshUrl } from '@/lib/ssh'
import type { Command, CommandCategory, Project } from '@/lib/types'
import { cn } from '@/lib/utils'

// Category is a label, not a state — so these are quiet tints, all one weight.
const CAT_COLORS: Record<CommandCategory, string> = {
  docker: 'bg-accent1/10 text-accent1 ring-1 ring-inset ring-accent1/20',
  git: 'bg-accent2/10 text-accent2 ring-1 ring-inset ring-accent2/20',
  pm2: 'bg-highlight/10 text-highlight ring-1 ring-inset ring-highlight/20',
  django: 'bg-highlight/10 text-highlight ring-1 ring-inset ring-highlight/20',
  nginx: 'bg-accent1/10 text-accent1 ring-1 ring-inset ring-accent1/20',
  ssh: 'bg-accent2/10 text-accent2 ring-1 ring-inset ring-accent2/20',
  python: 'bg-accent1/10 text-accent1 ring-1 ring-inset ring-accent1/20',
  general: 'bg-muted/10 text-muted ring-1 ring-inset ring-muted/25',
}

export default function CommandsPage() {
  const [category, setCategory] = useState<CommandCategory | 'all'>('all')
  const [q, setQ] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Command | null>(null)

  const params = new URLSearchParams()
  if (category !== 'all') params.set('category', category)
  if (q) params.set('search', q)
  const key = `/commands/${params.toString() ? `?${params}` : ''}`

  const { data: commands, mutate } = useSWR<Command[]>(key)
  const { data: projects } = useSWR<Project[]>('/projects/')
  const confirm = useConfirm()
  const toast = useToast()

  const remove = async (id: number, title: string) => {
    if (!(await confirm({ title: 'Delete command', message: `Delete "${title}"?`, danger: true, confirmLabel: 'Delete' }))) return
    await api.delete(`/commands/${id}/`)
    toast.success('Command deleted')
    mutate()
  }

  return (
    <div>
      <PageHeader
        title="Commands"
        subtitle="Snippets you reach for often. One click copies."
        icon={<TerminalSquare size={20} />}
        action={
          <button
            onClick={() => {
              setEditing(null)
              setShowForm(true)
            }}
            className="btn-accent"
          >
            <Plus size={16} /> Add command
          </button>
        }
      />

      <FilterBar>
        <Segmented
          ariaLabel="Filter by category"
          value={category}
          onChange={setCategory}
          options={[
            { key: 'all' as const, label: 'All' },
            ...CATEGORIES.map((c) => ({ key: c, label: c })),
          ]}
          className="flex-wrap"
        />
        <SearchField
          className="ml-auto sm:w-64"
          value={q}
          onChange={setQ}
          placeholder="Search commands"
        />
      </FilterBar>

      {commands?.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<TerminalSquare size={22} />}
            title={q || category !== 'all' ? 'Nothing matches that filter' : 'No commands yet'}
            hint={
              q || category !== 'all'
                ? 'Clear the search or pick another category.'
                : 'Save a snippet once and copy it from anywhere, including ⌘K.'
            }
          />
        </div>
      )}

      <div className="stagger-in grid grid-cols-1 gap-4 lg:grid-cols-2">
        {commands?.map((c) => (
          <WidgetCard key={c.id} bodyClassName="flex flex-col gap-2" className="group">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className={cn('chip capitalize', CAT_COLORS[c.category])}>{c.category}</span>
                <span className="truncate text-base font-medium">{c.title}</span>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                {sshUrl(c.command) && (
                  <a
                    href={sshUrl(c.command)!}
                    title="Open in Terminal (SSH)"
                    className="icon-btn h-7 w-7"
                    aria-label="Open in Terminal"
                  >
                    <Terminal size={13} />
                  </a>
                )}
                <CopyButton value={c.command} />
                <button
                  onClick={() => {
                    setEditing(c)
                    setShowForm(true)
                  }}
                  className="icon-btn h-7 w-7"
                  aria-label="Edit command"
                  title="Edit"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => remove(c.id, c.title)}
                  className="icon-btn h-7 w-7 hover:text-danger"
                  aria-label="Delete command"
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <pre className="well overflow-x-auto font-mono text-base leading-relaxed text-text2">
              {c.command}
            </pre>
            {c.project_names.length > 0 && (
              <p className="truncate text-sm text-muted">
                Used in {c.project_names.map((p) => p.name).join(', ')}
              </p>
            )}
          </WidgetCard>
        ))}
      </div>

      <CommandForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={mutate}
        projects={projects}
        initial={editing}
      />
    </div>
  )
}
