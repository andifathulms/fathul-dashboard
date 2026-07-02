'use client'

import { TerminalSquare, Plus, Search, Pencil, Trash2, Terminal } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import PageHeader from '@/components/layout/PageHeader'
import CommandForm, { CATEGORIES } from '@/components/commands/CommandForm'
import WidgetCard from '@/components/ui/Card'
import CopyButton from '@/components/ui/CopyButton'
import api from '@/lib/api'
import { sshUrl } from '@/lib/ssh'
import type { Command, CommandCategory, Project } from '@/lib/types'
import { cn } from '@/lib/utils'

const CAT_COLORS: Record<CommandCategory, string> = {
  docker: 'bg-accent1/15 text-accent1',
  git: 'bg-accent2/15 text-accent2',
  pm2: 'bg-highlight/15 text-highlight',
  django: 'bg-highlight/15 text-highlight',
  nginx: 'bg-accent1/15 text-accent1',
  ssh: 'bg-accent2/15 text-accent2',
  python: 'bg-accent1/15 text-accent1',
  general: 'bg-muted/20 text-muted',
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

  const remove = async (id: number) => {
    if (!confirm('Hapus command ini?')) return
    await api.delete(`/commands/${id}/`)
    mutate()
  }

  return (
    <div>
      <PageHeader
        title="Commands"
        subtitle="Snippet & perintah yang sering dipakai — sekali klik untuk salin"
        icon={<TerminalSquare size={20} />}
        action={
          <button
            onClick={() => {
              setEditing(null)
              setShowForm(true)
            }}
            className="btn-accent"
          >
            <Plus size={16} /> Command Baru
          </button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-lg bg-surface p-1">
          <Chip active={category === 'all'} onClick={() => setCategory('all')}>
            semua
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
            </Chip>
          ))}
        </div>
        <div className="relative ml-auto w-full max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari command…"
            className="input pl-9"
          />
        </div>
      </div>

      {commands?.length === 0 && (
        <div className="card flex flex-col items-center gap-2 py-16 text-center">
          <TerminalSquare size={28} className="text-muted" />
          <p className="text-sm text-muted">Belum ada command.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {commands?.map((c) => (
          <WidgetCard key={c.id} bodyClassName="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={cn('chip capitalize', CAT_COLORS[c.category])}>{c.category}</span>
                <span className="text-sm font-medium">{c.title}</span>
              </div>
              <div className="flex items-center gap-1">
                {sshUrl(c.command) && (
                  <a
                    href={sshUrl(c.command)!}
                    title="Buka di Terminal (SSH)"
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
                  aria-label="Edit"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => remove(c.id)}
                  className="icon-btn h-7 w-7 hover:text-red-400"
                  aria-label="Hapus"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <pre className="overflow-x-auto rounded-lg bg-bg px-3 py-2 font-mono text-[12.5px] text-text/90">
              {c.command}
            </pre>
            {c.project_name && <p className="text-[11px] text-muted">↳ {c.project_name}</p>}
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

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
        active ? 'bg-accent1/15 text-accent1' : 'text-muted hover:text-text'
      )}
    >
      {children}
    </button>
  )
}
