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
      title="Quick Access"
      icon={<Zap size={15} />}
      bodyClassName="space-y-3"
      className="h-full"
    >
      <div className="flex gap-1 rounded-lg bg-bg p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
              tab === t.key ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'
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
            placeholder={`Cari ${tab}…`}
            className="input pl-9"
          />
        </div>
      )}

      <div className="max-h-[320px] space-y-1.5 overflow-y-auto">
        {tab === 'commands' && <CommandsTab q={q} />}
        {tab === 'credentials' && <CredentialsTab q={q} />}
        {tab === 'links' && <LinksTab />}
      </div>
    </WidgetCard>
  )
}

function CommandsTab({ q }: { q: string }) {
  const { data } = useSWR<Command[]>(`/commands/${q ? `?search=${encodeURIComponent(q)}` : ''}`)
  if (data?.length === 0) return <Empty text="Tidak ada command." />
  return (
    <>
      {data?.map((c) => (
        <div key={c.id} className="rounded-lg border border-border bg-bg px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-medium">{c.title}</span>
            <CopyButton value={c.command} />
          </div>
          <code className="mt-1 block truncate font-mono text-[11px] text-muted">{c.command}</code>
        </div>
      ))}
    </>
  )
}

function CredentialsTab({ q }: { q: string }) {
  const { data } = useSWR<Credential[]>('/credentials/')
  const filtered = data?.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()))
  if (filtered?.length === 0) return <Empty text="Tidak ada kredensial." />
  return (
    <>
      {filtered?.map((c) => (
        <div key={c.id} className="rounded-lg border border-border bg-bg px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-medium">{c.label}</span>
            <CopyButton value={c.password} label="Copy password" />
          </div>
          {c.username && <p className="text-[11px] text-muted">{c.username}</p>}
          <div className="mt-1">
            <RevealToggle value={c.password} />
          </div>
        </div>
      ))}
    </>
  )
}

function LinksTab() {
  const { data } = useSWR<Project[]>('/projects/')
  const withLinks = data?.filter((p) => p.repo_url || p.live_url)
  if (withLinks?.length === 0) return <Empty text="Belum ada link project." />
  return (
    <>
      {withLinks?.map((p) => (
        <div key={p.id} className="rounded-lg border border-border bg-bg px-3 py-2">
          <p className="mb-1.5 text-xs font-medium">{p.name}</p>
          <div className="flex flex-wrap gap-1.5">
            {p.repo_url && <LinkChip href={p.repo_url} label="Repo" />}
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
      className="chip inline-flex items-center gap-1 border border-border bg-surface text-accent1 hover:underline"
    >
      <ExternalLink size={11} /> {label}
    </a>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="px-1 py-3 text-sm text-muted">{text}</p>
}
