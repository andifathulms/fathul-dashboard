'use client'

import {
  ArrowLeft,
  ExternalLink,
  Github,
  KeyRound,
  Pencil,
  TerminalSquare,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'

import ProjectForm from '@/components/projects/ProjectForm'
import TaskItem from '@/components/tasks/TaskItem'
import WidgetCard from '@/components/ui/Card'
import { CategoryBadge, StatusBadge, TechTag } from '@/components/ui/Badge'
import CopyButton from '@/components/ui/CopyButton'
import RevealToggle from '@/components/ui/RevealToggle'
import api from '@/lib/api'
import type { Command, Credential, EnvVar, Project, Task } from '@/lib/types'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [editing, setEditing] = useState(false)

  const { data: project, isLoading, mutate } = useSWR<Project>(`/projects/${id}/`)
  const { data: tasks, mutate: mutateTasks } = useSWR<Task[]>(`/tasks/?project=${id}`)
  const { data: creds } = useSWR<Credential[]>(`/credentials/?project=${id}`)
  const { data: envs } = useSWR<EnvVar[]>(`/envvars/?project=${id}`)
  const { data: commands } = useSWR<Command[]>(`/commands/?project=${id}`)

  const remove = async () => {
    if (!confirm('Hapus project ini? Tindakan tidak bisa dibatalkan.')) return
    await api.delete(`/projects/${id}/`)
    router.push('/projects')
  }

  if (isLoading) return <p className="text-sm text-muted">Memuat…</p>
  if (!project) return <p className="text-sm text-muted">Project tidak ditemukan.</p>

  // Prefer the repos list; fall back to the legacy single repo_url.
  const repos =
    project.repos?.length > 0
      ? project.repos
      : project.repo_url
        ? [{ label: 'Repository', url: project.repo_url }]
        : []

  return (
    <div className="space-y-5">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"
      >
        <ArrowLeft size={15} /> Projects
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          {project.description && <p className="mt-1.5 max-w-2xl text-muted">{project.description}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <CategoryBadge category={project.category} />
            <StatusBadge status={project.status} />
            {project.tech_stack?.map((t) => (
              <TechTag key={t}>{t}</TechTag>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => setEditing(true)} className="btn">
            <Pencil size={14} /> Edit
          </button>
          <button onClick={remove} className="btn hover:border-red-500/50 hover:text-red-400">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {(repos.length > 0 || project.live_url) && (
        <div className="flex flex-wrap gap-2">
          {repos.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noreferrer" className="btn text-xs">
              <Github size={14} /> {r.label || 'Repository'}
            </a>
          ))}
          {project.live_url && (
            <a href={project.live_url} target="_blank" rel="noreferrer" className="btn text-xs">
              <ExternalLink size={14} /> Live
            </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <WidgetCard title="Tugas" bodyClassName="space-y-0.5">
          {tasks?.length === 0 && <p className="px-2 py-3 text-sm text-muted">Belum ada tugas.</p>}
          {tasks?.map((t) => (
            <TaskItem key={t.id} task={t} onChange={mutateTasks} showDelete />
          ))}
        </WidgetCard>

        <WidgetCard title="Kredensial" icon={<KeyRound size={15} />} bodyClassName="space-y-2">
          {creds?.length === 0 && <p className="px-1 py-3 text-sm text-muted">Belum ada kredensial.</p>}
          {creds?.map((c) => (
            <div key={c.id} className="rounded-lg border border-border bg-bg px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{c.label}</span>
                <CopyButton value={c.password} label="Copy password" />
              </div>
              {c.username && <p className="text-[11px] text-muted">{c.username}</p>}
              <div className="mt-1">
                <RevealToggle value={c.password} />
              </div>
            </div>
          ))}
        </WidgetCard>

        <WidgetCard title="Commands" icon={<TerminalSquare size={15} />} bodyClassName="space-y-1.5">
          {commands?.length === 0 && <p className="px-1 py-3 text-sm text-muted">Belum ada command.</p>}
          {commands?.map((c) => (
            <div key={c.id} className="rounded-lg border border-border bg-bg px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-medium">{c.title}</span>
                <CopyButton value={c.command} />
              </div>
              <code className="mt-1 block truncate font-mono text-[11px] text-muted">{c.command}</code>
            </div>
          ))}
        </WidgetCard>

        <WidgetCard title="Environment Variables" bodyClassName="space-y-1.5">
          {envs?.length === 0 && <p className="px-1 py-3 text-sm text-muted">Belum ada env var.</p>}
          {envs?.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-bg px-3 py-2"
            >
              <code className="truncate font-mono text-[11px] text-accent2">{e.key}</code>
              <div className="flex items-center gap-1">
                <RevealToggle value={e.value} />
                <CopyButton value={e.value} />
              </div>
            </div>
          ))}
        </WidgetCard>
      </div>

      {project.notes && (
        <WidgetCard title="Catatan">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-text/90">{project.notes}</p>
        </WidgetCard>
      )}

      <ProjectForm
        open={editing}
        onClose={() => setEditing(false)}
        onSaved={mutate}
        initial={project}
      />
    </div>
  )
}
