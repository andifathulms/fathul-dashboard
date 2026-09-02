'use client'

import { Zap, Search, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import WidgetCard from '@/components/ui/Card'
import CopyButton from '@/components/ui/CopyButton'
import RevealToggle from '@/components/ui/RevealToggle'
import type { Command, Credential, Project } from '@/lib/types'
import { cn } from '@/lib/utils'

type Tab = 'commands' | 'credentials' | 'links'
const TABS: { key: Tab; label: string }[] = [
  { key: 'commands', label: 'Commands' },
  { key: 'credentials', label: 'Credentials' },
  { key: 'links', label: 'Links' },
]

export default function QuickAccessWidget() {
  const [tab, setTab] = useState<Tab>('commands')
  const [q, setQ] = useState('')

  return (
    <WidgetCard
      title="Quick access"
      icon={<Zap size={15} />}
      bodyClassName="flex flex-col gap-3"
    >
      <div className="flex gap-1 rounded-lg bg-surface2 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 rounded-md px-2 py-1 text-sm font-medium transition-colors',
              tab === t.key ? 'bg-surface text-text shadow-card' : 'text-muted hover:text-text'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== 'links' && (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${tab}…`}
            className="input pl-9"
          />
        </div>
      )}

      <div className="flex max-h-[340px] flex-col gap-1.5 overflow-y-auto">
        {tab === 'commands' && <CommandsTab q={q} />}
        {tab === 'credentials' && <CredentialsTab q={q} />}
        {tab === 'links' && <LinksTab />}
      </div>
    </WidgetCard>
  )
}

function CommandsTab({ q }: { q: string }) {
  const { data } = useSWR<Command[]>(`/commands/${q ? `?search=${encodeURIComponent(q)}` : ''}`)
  if (data?.length === 0) return <Empty text="No commands saved yet." />
  return (
    <>
      {data?.map((c) => (
        <div key={c.id} className="rounded-lg border border-border px-3 py-2 transition-colors hover:bg-surface2">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-base font-medium">{c.title}</span>
            <CopyButton value={c.command} />
          </div>
          <code className="mt-0.5 block truncate font-mono text-sm text-muted">{c.command}</code>
        </div>
      ))}
    </>
  )
}

function CredentialsTab({ q }: { q: string }) {
  const { data } = useSWR<Credential[]>('/credentials/')
  const filtered = data?.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()))
  if (filtered?.length === 0) return <Empty text="No credentials saved yet." />
  return (
    <>
      {filtered?.map((c) => (
        <div key={c.id} className="rounded-lg border border-border px-3 py-2 transition-colors hover:bg-surface2">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-base font-medium">{c.label}</span>
            <CopyButton value={c.password} label="Copy password" />
          </div>
          {c.username && <p className="truncate font-mono text-sm text-muted">{c.username}</p>}
          <div className="mt-1">
            <RevealToggle value={c.password} />
          </div>
        </div>
      ))}
    </>
  )
}

function projectRepos(p: Project) {
  if (p.repos?.length > 0) return p.repos
  return p.repo_url ? [{ label: 'Repo', url: p.repo_url }] : []
}

function LinksTab() {
  const { data } = useSWR<Project[]>('/projects/')
  const withLinks = data?.filter((p) => projectRepos(p).length > 0 || p.live_url)
  if (withLinks?.length === 0) return <Empty text="No project links yet." />
  return (
    <>
      {withLinks?.map((p) => (
        <div key={p.id} className="rounded-lg border border-border px-3 py-2 transition-colors hover:bg-surface2">
          <p className="mb-1.5 truncate text-base font-medium">{p.name}</p>
          <div className="flex flex-wrap gap-1.5">
            {projectRepos(p).map((r, i) => (
              <LinkChip key={i} href={r.url} label={r.label || 'Repo'} />
            ))}
            {p.live_url && <LinkChip href={p.live_url} label="Live" />}
          </div>
        </div>
      ))}
    </>
  )
}

function LinkChip({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="chip inline-flex items-center gap-1 bg-accent1/10 text-accent1 ring-1 ring-inset ring-accent1/20 hover:bg-accent1/15"
    >
      <ExternalLink size={11} /> {label}
    </a>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="px-1 py-4 text-center text-base text-muted">{text}</p>
}
