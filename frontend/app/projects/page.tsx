'use client'

import { FolderKanban, Plus, Search, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import useSWR from 'swr'

import PageHeader from '@/components/layout/PageHeader'
import ProjectForm from '@/components/projects/ProjectForm'
import { CategoryBadge, StatusBadge, TechTag } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Skeleton from '@/components/ui/Skeleton'
import type { Project, ProjectStatus } from '@/lib/types'
import { CATEGORY_STYLES, cn } from '@/lib/utils'

const FILTERS: { key: ProjectStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'active', label: 'Aktif' },
  { key: 'paused', label: 'Jeda' },
  { key: 'done', label: 'Selesai' },
  { key: 'archived', label: 'Arsip' },
]

export default function ProjectsPage() {
  const [status, setStatus] = useState<ProjectStatus | 'all'>('all')
  const [q, setQ] = useState('')
  const [showForm, setShowForm] = useState(false)

  const { data: projects, isLoading, mutate } = useSWR<Project[]>('/projects/')

  const filtered = projects
    ?.filter((p) => status === 'all' || p.status === status)
    .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))

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
        <div className="relative ml-auto w-full max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari project…"
            className="input pl-9"
          />
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
            hint={q || status !== 'all' ? 'Coba ubah filter atau kata kunci.' : 'Buat project pertamamu untuk mulai.'}
            action={
              <button onClick={() => setShowForm(true)} className="btn-accent">
                <Plus size={16} /> Project Baru
              </button>
            }
          />
        </div>
      )}

      <div className="stagger-in grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered?.map((p) => (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="group card card-hover relative overflow-hidden p-4 pl-5"
          >
            <span className={cn('absolute inset-y-0 left-0 w-1', CATEGORY_STYLES[p.category].bar)} />
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold leading-tight">{p.name}</h3>
              <ArrowUpRight size={16} className="shrink-0 text-muted group-hover:text-accent1" />
            </div>
            {p.description && (
              <p className="mt-1.5 line-clamp-2 text-sm text-muted">{p.description}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <CategoryBadge category={p.category} />
              <StatusBadge status={p.status} />
            </div>
            {p.tech_stack?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.tech_stack.slice(0, 4).map((t) => (
                  <TechTag key={t}>{t}</TechTag>
                ))}
              </div>
            )}
            <div className="mt-3 border-t border-border pt-2.5 text-[11px] text-muted">
              {p.tasks_count} tugas · {p.credentials_count} kredensial
            </div>
          </Link>
        ))}
      </div>

      <ProjectForm open={showForm} onClose={() => setShowForm(false)} onSaved={mutate} />
    </div>
  )
}
