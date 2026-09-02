'use client'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import Modal from '@/components/ui/Modal'
import api from '@/lib/api'
import type { Command, CommandCategory, Project } from '@/lib/types'
import { cn } from '@/lib/utils'

export const CATEGORIES: CommandCategory[] = [
  'docker',
  'git',
  'pm2',
  'django',
  'nginx',
  'ssh',
  'python',
  'general',
]

interface CommandFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  projects?: Project[]
  initial?: Command | null
  /** When set (creating from a project page), pin that project and hide the picker. */
  lockedProjectId?: number
}

export default function CommandForm({
  open,
  onClose,
  onSaved,
  projects,
  initial,
  lockedProjectId,
}: CommandFormProps) {
  const [form, setForm] = useState(() => seed(initial, lockedProjectId))
  const [saving, setSaving] = useState(false)

  const [seedId, setSeedId] = useState(initial?.id ?? 0)
  if ((initial?.id ?? 0) !== seedId) {
    setSeedId(initial?.id ?? 0)
    setForm(seed(initial, lockedProjectId))
  }

  const set = (k: 'title' | 'command' | 'category', v: string) => setForm((f) => ({ ...f, [k]: v }))

  const toggleProject = (pid: number) =>
    setForm((f) => ({
      ...f,
      projects: f.projects.includes(pid) ? f.projects.filter((id) => id !== pid) : [...f.projects, pid],
    }))

  const submit = async () => {
    if (!form.title.trim() || !form.command.trim()) return
    setSaving(true)
    const payload = { title: form.title, command: form.command, category: form.category, projects: form.projects }
    try {
      if (initial) await api.patch(`/commands/${initial.id}/`, payload)
      else await api.post('/commands/', payload)
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit Command' : 'New Command'}
      footer={
        <>
          <button onClick={onClose} className="btn">
            Cancel
          </button>
          <button onClick={submit} disabled={saving} className="btn-accent">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block">
          <span className="field-label">Title</span>
          <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} />
        </label>
        <label className="block">
          <span className="field-label">Command</span>
          <textarea
            className="textarea resize-none font-mono"
            rows={3}
            value={form.command}
            onChange={(e) => set('command', e.target.value)}
          />
        </label>
        <label className="block">
          <span className="field-label">Category</span>
          <select className="select" value={form.category} onChange={(e) => set('category', e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        {lockedProjectId == null && (
          <div>
            <span className="field-label">
              Projects (optional — same command can belong to more than one)
            </span>
            {projects && projects.length > 0 ? (
              <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-border bg-surface2/40 p-2">
                {projects.map((p) => {
                  const active = form.projects.includes(p.id)
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => toggleProject(p.id)}
                      className={cn(
                        'rounded-md px-2.5 py-1 text-sm font-medium transition-colors',
                        active
                          ? 'bg-accent1/10 text-accent1 ring-1 ring-inset ring-accent1/25'
                          : 'bg-surface2 text-muted hover:text-text'
                      )}
                    >
                      {p.name}
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted">No projects yet.</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

function seed(c?: Command | null, lockedProjectId?: number) {
  return {
    title: c?.title ?? '',
    command: c?.command ?? '',
    category: c?.category ?? 'general',
    projects: c?.projects ?? (lockedProjectId != null ? [lockedProjectId] : []),
  }
}
