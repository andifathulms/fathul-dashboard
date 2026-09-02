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
import Segmented from '@/components/ui/Segmented'
import { SearchField, FilterBar } from '@/components/ui/Segmented'
import { SkeletonCards } from '@/components/ui/Skeleton'
import type { Project, ProjectCategory, ProjectStatus } from '@/lib/types'
import { CATEGORY_LABELS, PRIORITY_STYLES, STATUS_RANK, cn } from '@/lib/utils'

function ago(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m`
  const h = Math.floor(s / 3600)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d`
  return `${Math.floor(d / 30)}mo`
}

const FILTERS: { key: ProjectStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'paused', label: 'Paused' },
  { key: 'done', label: 'Done' },
  { key: 'archived', label: 'Archived' },
]

const CATEGORIES: ProjectCategory[] = ['oikn', 'freelance', 'personal', 'side']

type Sort = 'priority' | 'status' | 'recent' | 'name'
const SORTS: { key: Sort; label: string }[] = [
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'recent', label: 'Recent' },
  { key: 'name', label: 'Name' },
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
        subtitle="Every project you're working on or have worked on"
        icon={<FolderKanban size={20} />}
        action={
          <button onClick={() => setShowForm(true)} className="btn-accent">
            <Plus size={16} /> Add project
          </button>
        }
      />

      <FilterBar>
        <Segmented ariaLabel="Filter by status" value={status} onChange={setStatus} options={FILTERS} />

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ProjectCategory | 'all')}
            className="select w-auto"
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="select w-auto"
            aria-label="Sort projects"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                Sort: {s.label}
              </option>
            ))}
          </select>
          <div className="flex rounded-lg border border-border bg-surface p-0.5">
            <button
              onClick={() => changeView('grid')}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                view === 'grid' ? 'bg-accent1/10 text-accent1' : 'text-muted hover:text-text'
              )}
              aria-label="Grid view"
              aria-pressed={view === 'grid'}
              title="Grid view"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => changeView('list')}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                view === 'list' ? 'bg-accent1/10 text-accent1' : 'text-muted hover:text-text'
              )}
              aria-label="List view"
              aria-pressed={view === 'list'}
              title="List view"
            >
              <List size={15} />
            </button>
          </div>
          <SearchField value={q} onChange={setQ} placeholder="Search projects" className="sm:w-48" />
        </div>
      </FilterBar>

      {isLoading && <SkeletonCards count={6} />}
      {filtered?.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<FolderKanban size={22} />}
            title={q || status !== 'all' || category !== 'all' ? 'Nothing matches those filters' : 'No projects yet'}
            hint={
              q || status !== 'all' || category !== 'all'
                ? 'Clear the search or pick a different status.'
                : 'A project holds its tasks, credentials, repos and servers in one place.'
            }
            action={
              <button onClick={() => setShowForm(true)} className="btn-accent">
                <Plus size={16} /> Add project
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
              className="group card card-hover flex flex-col overflow-hidden p-4"
            >
              {p.lockup_horizontal_url ? (
                <div className="relative -mx-4 -mt-4 mb-3 h-24 overflow-hidden border-b border-border bg-surface2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.lockup_horizontal_url}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                  <ArrowUpRight
                    size={16}
                    className="absolute right-3 top-3 rounded bg-surface/80 p-px text-muted backdrop-blur transition-colors group-hover:text-accent1"
                  />
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <ProjectAvatar project={p} size={32} />
                    <h3 className="truncate font-display text-md font-semibold leading-tight">
                      {p.name}
                    </h3>
                  </div>
                  <ArrowUpRight size={16} className="shrink-0 text-muted transition-colors group-hover:text-accent1" />
                </div>
              )}
              {p.description && (
                <p className="mt-1.5 line-clamp-2 text-base text-muted">{p.description}</p>
              )}
              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <PriorityToggle project={p} onChanged={mutate} />
                  <CategoryBadge category={p.category} />
                  <StatusBadge status={p.status} />
                </div>
                {p.tech_stack?.length > 0 && (
                  <div className="ml-auto flex shrink-0 items-center gap-1.5 font-mono text-sm text-muted">
                    {p.tech_stack.slice(0, 3).map((t, i) => (
                      <span key={t} className="inline-flex items-center gap-1.5">
                        {i > 0 && <span className="text-border">·</span>}
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-auto flex items-center gap-3 border-t border-border pt-2.5 text-sm text-muted tnum">
                <span className="inline-flex items-center gap-1" title="Tasks">
                  <CheckSquare size={12} /> {p.tasks_count}
                </span>
                <span className="inline-flex items-center gap-1" title="Credentials">
                  <KeyRound size={12} /> {p.credentials_count}
                </span>
                <span className="ml-auto" title={`Updated ${p.updated_at.slice(0, 10)}`}>
                  {ago(p.updated_at)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="card stagger-in flex flex-col overflow-hidden p-1.5">
          {filtered?.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="row group"
            >
              <ProjectAvatar project={p} size={28} />
              <div className="min-w-0 flex-1">
                <span className="truncate text-base font-medium">{p.name}</span>
                <div className="flex items-center gap-2.5 text-sm text-muted tnum">
                  <span className="inline-flex items-center gap-1">
                    <CheckSquare size={11} /> {p.tasks_count}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <KeyRound size={11} /> {p.credentials_count}
                  </span>
                  {p.tech_stack?.length > 0 && (
                    <span className="hidden truncate font-mono md:inline">
                    {p.tech_stack.slice(0, 3).join(' · ')}
                  </span>
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
