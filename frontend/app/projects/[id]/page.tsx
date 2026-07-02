'use client'

import {
  ArrowLeft,
  Code2,
  ExternalLink,
  Github,
  KeyRound,
  Pencil,
  Plus,
  Terminal,
  TerminalSquare,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'

import GithubActivity from '@/components/projects/GithubActivity'
import UptimeWidget from '@/components/projects/UptimeWidget'
import ProjectForm from '@/components/projects/ProjectForm'
import CommandForm from '@/components/commands/CommandForm'
import CredentialForm from '@/components/vault/CredentialForm'
import EnvImportModal from '@/components/vault/EnvImportModal'
import TaskItem from '@/components/tasks/TaskItem'
import WidgetCard from '@/components/ui/Card'
import { CategoryBadge, StatusBadge, TechTag } from '@/components/ui/Badge'
import CopyButton from '@/components/ui/CopyButton'
import RevealToggle from '@/components/ui/RevealToggle'
import api from '@/lib/api'
import { sshUrl } from '@/lib/ssh'
import type { Command, Credential, EnvVar, Project, Task } from '@/lib/types'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const pid = Number(id)
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [showCred, setShowCred] = useState(false)
  const [showCmd, setShowCmd] = useState(false)
  const [showEnv, setShowEnv] = useState(false)
  const [newTask, setNewTask] = useState('')

  const { data: project, isLoading, mutate } = useSWR<Project>(`/projects/${id}/`)
  const { data: tasks, mutate: mutateTasks } = useSWR<Task[]>(`/tasks/?project=${id}`)
  const { data: creds, mutate: mutateCreds } = useSWR<Credential[]>(`/credentials/?project=${id}`)
  const { data: envs, mutate: mutateEnvs } = useSWR<EnvVar[]>(`/envvars/?project=${id}`)
  const { data: commands, mutate: mutateCommands } = useSWR<Command[]>(`/commands/?project=${id}`)

  const remove = async () => {
    if (!confirm('Hapus project ini? Tindakan tidak bisa dibatalkan.')) return
    await api.delete(`/projects/${id}/`)
    router.push('/projects')
  }

  const addTask = async () => {
    const title = newTask.trim()
    if (!title) return
    try {
      await api.post('/tasks/', { title, project: pid })
      setNewTask('')
      mutateTasks()
    } catch (e) {
      alert('Gagal menambah tugas: ' + (e as Error).message)
    }
  }

  const deleteCred = async (cid: number) => {
    if (!confirm('Hapus kredensial ini?')) return
    await api.delete(`/credentials/${cid}/`)
    mutateCreds()
  }
  const deleteCommand = async (cid: number) => {
    if (!confirm('Hapus command ini?')) return
    await api.delete(`/commands/${cid}/`)
    mutateCommands()
  }
  const deleteEnv = async (eid: number) => {
    await api.delete(`/envvars/${eid}/`)
    mutateEnvs()
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

      {(repos.length > 0 || project.live_url || project.local_path) && (
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
          {project.local_path && (
            <a href={`vscode://file/${project.local_path}`} className="btn text-xs">
              <Code2 size={14} /> Buka di VS Code
            </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Web uptime/status — only when a live_url is set */}
        <UptimeWidget projectId={pid} hasUrl={!!project.live_url} />

        {/* GitHub analytics — one card per linked repo, half-width in the grid */}
        <GithubActivity projectId={pid} hasRepo={repos.some((r) => /github\.com/.test(r.url))} />

        <WidgetCard title="Tugas" bodyClassName="space-y-2">
          <div className="flex gap-2">
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="Tambah tugas untuk project ini…"
              className="input"
            />
            <button onClick={addTask} className="btn-accent shrink-0" aria-label="Tambah tugas">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-0.5">
            {tasks?.length === 0 && <p className="px-2 py-2 text-sm text-muted">Belum ada tugas.</p>}
            {tasks?.map((t) => (
              <TaskItem key={t.id} task={t} onChange={mutateTasks} showDelete />
            ))}
          </div>
        </WidgetCard>

        <WidgetCard
          title="Kredensial"
          icon={<KeyRound size={15} />}
          action={<AddButton onClick={() => setShowCred(true)} />}
          bodyClassName="space-y-2"
        >
          {creds?.length === 0 && <p className="px-1 py-3 text-sm text-muted">Belum ada kredensial.</p>}
          {creds?.map((c) => (
            <div key={c.id} className="group rounded-lg border border-border bg-bg px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{c.label}</span>
                <div className="flex items-center gap-1">
                  <CopyButton value={c.password} label="Copy password" />
                  <button
                    onClick={() => deleteCred(c.id)}
                    className="icon-btn h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                    aria-label="Hapus kredensial"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {c.username && <p className="text-[11px] text-muted">{c.username}</p>}
              <div className="mt-1">
                <RevealToggle value={c.password} />
              </div>
            </div>
          ))}
        </WidgetCard>

        <WidgetCard
          title="Commands"
          icon={<TerminalSquare size={15} />}
          action={<AddButton onClick={() => setShowCmd(true)} />}
          bodyClassName="space-y-1.5"
        >
          {commands?.length === 0 && <p className="px-1 py-3 text-sm text-muted">Belum ada command.</p>}
          {commands?.map((c) => (
            <div key={c.id} className="group rounded-lg border border-border bg-bg px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-medium">{c.title}</span>
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
                    onClick={() => deleteCommand(c.id)}
                    className="icon-btn h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                    aria-label="Hapus command"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <code className="mt-1 block truncate font-mono text-[11px] text-muted">{c.command}</code>
            </div>
          ))}
        </WidgetCard>

        <WidgetCard
          title="Environment Variables"
          action={<AddButton onClick={() => setShowEnv(true)} />}
          bodyClassName="space-y-1.5"
        >
          {envs?.length === 0 && <p className="px-1 py-3 text-sm text-muted">Belum ada env var.</p>}
          {envs?.map((e) => (
            <div
              key={e.id}
              className="group flex items-center justify-between gap-2 rounded-lg border border-border bg-bg px-3 py-2"
            >
              <code className="truncate font-mono text-[11px] text-accent2">{e.key}</code>
              <div className="flex items-center gap-1">
                <RevealToggle value={e.value} />
                <CopyButton value={e.value} />
                <button
                  onClick={() => deleteEnv(e.id)}
                  className="icon-btn h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                  aria-label="Hapus env var"
                >
                  <Trash2 size={13} />
                </button>
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

      <ProjectForm open={editing} onClose={() => setEditing(false)} onSaved={mutate} initial={project} />
      <CredentialForm
        open={showCred}
        onClose={() => setShowCred(false)}
        onSaved={mutateCreds}
        lockedProjectId={pid}
      />
      <CommandForm
        open={showCmd}
        onClose={() => setShowCmd(false)}
        onSaved={mutateCommands}
        lockedProjectId={pid}
      />
      <EnvImportModal
        open={showEnv}
        onClose={() => setShowEnv(false)}
        onSaved={mutateEnvs}
        lockedProjectId={pid}
      />
    </div>
  )
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="btn text-xs" aria-label="Tambah">
      <Plus size={13} /> Tambah
    </button>
  )
}
