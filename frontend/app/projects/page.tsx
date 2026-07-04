'use client'

import {
  FolderKanban,
  Plus,
  Search,
  ArrowUpRight,
  LayoutGrid,
  List,
  CheckSquare,
  KeyRound,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

import PageHeader from '@/components/layout/PageHeader'
import ProjectAvatar from '@/components/projects/ProjectAvatar'
import PriorityToggle from '@/components/projects/PriorityToggle'
import ProjectForm from '@/components/projects/ProjectForm'
import { CategoryBadge, StatusBadge } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Skeleton from '@/components/ui/Skeleton'
import type { Project, ProjectCategory, ProjectStatus } from '@/lib/types'
import { CATEGORY_LABELS, PRIORITY_STYLES, STATUS_RANK, cn } from '@/lib/utils'

function ago(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m`
  const h = Math.floor(s / 3600)
  if (h < 24) return `${h}j`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}h`
  return `${Math.floor(d / 30)}bln`
}

const FILTERS: { key: ProjectStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'active', label: 'Aktif' },
  { key: 'paused', label: 'Jeda' },
  { key: 'done', label: 'Selesai' },
  { key: 'archived', label: 'Arsip' },
]

const CATEGORIES: ProjectCategory[] = ['oikn', 'freelance', 'personal', 'side']

type Sort = 'priority' | 'status' | 'recent' | 'name'
const SORTS: { key: Sort; label: string }[] = [
  { key: 'priority', label: 'Prioritas' },
  { key: 'status', label: 'Status' },
  { key: 'recent', label: 'Terbaru' },
  { key: 'name', label: 'Nama' },
]

export default function ProjectsPage() {
  const [status, setStatus] = useState<ProjectStatus | 'all'>('all')
  const [category, setCategory] = useState<ProjectCategory | 'all'>('all')
  const [sort, setSort] = useState<Sort>('priority')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [q, setQ] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const v = localStorage.getItem('fd_projects_view')
    if (v === 'list' || v === 'grid') setView(v)
  }, [])
  const changeView = (v: 'grid' | 'list') => {
    setView(v)
    localStorage.setItem('fd_projects_view', v)
  }

  const { data: projects, isLoading, mutate } = useSWR<Project[]>('/projects/')

  const filtered = projects
    ?.filter((p) => status === 'all' || p.status === status)
    .filter((p) => category === 'all' || p.category === category)
    .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
    .slice()
    .sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'recent') return b.updated_at.localeCompare(a.updated_at)
      const pa = PRIORITY_STYLES[a.priority].rank
      const pb = PRIORITY_STYLES[b.priority].rank
      const sa = STATUS_RANK[a.status]
      const sb = STATUS_RANK[b.status]
      // priority → status, or status → priority, depending on the chosen sort.
      if (sort === 'status') return sa - sb || pa - pb || a.name.localeCompare(b.name)
      return pa - pb || sa - sb || a.name.localeCompare(b.name)
    })

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Semua proyek yang sedang & pernah kamu kerjakan"
        icon={<FolderKanban size={20} />}
        action={
          <button onClick={() => setShowForm(true)} className="btn-accent">
            <Plus size={16} /> Project Baru
          </button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg bg-surface p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatus(f.key)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                status === f.key ? 'bg-accent1/15 text-accent1' : 'text-muted hover:text-text'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ProjectCategory | 'all')}
            className="input w-auto text-xs"
            aria-label="Filter kategori"
          >
            <option value="all">Semua kategori</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="input w-auto text-xs"
            aria-label="Urutkan"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                Urut: {s.label}
              </option>
            ))}
          </select>
          <div className="flex rounded-lg bg-surface p-0.5">
            <button
              onClick={() => changeView('grid')}
              className={cn('flex h-7 w-7 items-center justify-center rounded-md transition-colors', view === 'grid' ? 'bg-accent1/15 text-accent1' : 'text-muted hover:text-text')}
              aria-label="Tampilan grid"
              title="Grid"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => changeView('list')}
              className={cn('flex h-7 w-7 items-center justify-center rounded-md transition-colors', view === 'list' ? 'bg-accent1/15 text-accent1' : 'text-muted hover:text-text')}
              aria-label="Tampilan list"
              title="List"
            >
              <List size={15} />
            </button>
          </div>
          <div className="relative w-full max-w-[200px] sm:w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari…"
              className="input pl-9"
            />
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      )}
      {filtered?.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<FolderKanban size={22} />}
            title="Belum ada project di sini"
            hint={q || status !== 'all' || category !== 'all' ? 'Coba ubah filter atau kata kunci.' : 'Buat project pertamamu untuk mulai.'}
            action={
              <button onClick={() => setShowForm(true)} className="btn-accent">
                <Plus size={16} /> Project Baru
              </button>
            }
          />
        </div>
      )}

      {/* Grid view */}
      {view === 'grid' && (
        <div className="stagger-in grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered?.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="group card card-hover relative flex flex-col overflow-hidden p-4 pl-5"
            >
              <span className={cn('absolute inset-y-0 left-0 z-10 w-1', PRIORITY_STYLES[p.priority].dot)} />
              {p.lockup_horizontal_url ? (
                <div className="relative -mx-4 -mt-4 mb-3 h-24 overflow-hidden border-b border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.lockup_horizontal_url}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                  <ArrowUpRight
                    size={16}
                    className="absolute right-3 top-3 text-text/70 drop-shadow transition-colors group-hover:text-accent1"
                  />
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <ProjectAvatar project={p} size={34} />
                    <h3 className="truncate font-semibold leading-tight">{p.name}</h3>
                  </div>
                  <ArrowUpRight size={16} className="shrink-0 text-muted transition-colors group-hover:text-accent1" />
                </div>
              )}
              {p.description && <p className="mt-1 line-clamp-2 text-[13px] text-muted">{p.description}</p>}
              <div className="mt-auto pt-2.5" />
              <div className="flex items-center gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <PriorityToggle project={p} onChanged={mutate} />
                  <CategoryBadge category={p.category} />
                  <StatusBadge status={p.status} />
                </div>
                {p.tech_stack?.length > 0 && (
                  <div className="ml-auto flex shrink-0 items-center gap-1.5 font-mono text-[11px] text-muted">
                    {p.tech_stack.slice(0, 3).map((t, i) => (
                      <span key={t} className="inline-flex items-center gap-1.5">
                        {i > 0 && <span className="text-border">·</span>}
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center gap-3 border-t border-border pt-2.5 text-[11px] text-muted">
                <span className="inline-flex items-center gap-1">
                  <CheckSquare size={12} /> {p.tasks_count}
                </span>
                <span className="inline-flex items-center gap-1">
                  <KeyRound size={12} /> {p.credentials_count}
                </span>
                <span className="ml-auto" title={`Diperbarui ${p.updated_at.slice(0, 10)}`}>
                  {ago(p.updated_at)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="card stagger-in divide-y divide-border overflow-hidden">
          {filtered?.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="group relative flex items-center gap-3 py-2.5 pl-4 pr-3 transition-colors hover:bg-surface2/40"
            >
              <span className={cn('absolute inset-y-0 left-0 w-1', PRIORITY_STYLES[p.priority].dot)} />
              <ProjectAvatar project={p} size={30} />
              <div className="min-w-0 flex-1">
                <span className="truncate text-sm font-medium">{p.name}</span>
                <div className="mt-0.5 flex items-center gap-2.5 text-[11px] text-muted">
                  <span className="inline-flex items-center gap-1">
                    <CheckSquare size={11} /> {p.tasks_count}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <KeyRound size={11} /> {p.credentials_count}
                  </span>
                  {p.tech_stack?.length > 0 && (
                    <span className="hidden truncate font-mono md:inline">{p.tech_stack.slice(0, 3).join(' · ')}</span>
                  )}
                </div>
              </div>
              <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                <PriorityToggle project={p} onChanged={mutate} />
                <CategoryBadge category={p.category} />
                <StatusBadge status={p.status} />
              </div>
              <ArrowUpRight size={15} className="shrink-0 text-muted transition-colors group-hover:text-accent1" />
            </Link>
          ))}
        </div>
      )}

      <ProjectForm open={showForm} onClose={() => setShowForm(false)} onSaved={mutate} />
    </div>
  )
}
