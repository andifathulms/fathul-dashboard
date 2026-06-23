'use client'

import { useState } from 'react'

import Modal from '@/components/ui/Modal'
import api from '@/lib/api'
import type { Command, CommandCategory, Project } from '@/lib/types'

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
}

export default function CommandForm({ open, onClose, onSaved, projects, initial }: CommandFormProps) {
  const [form, setForm] = useState(() => seed(initial))
  const [saving, setSaving] = useState(false)

  const [seedId, setSeedId] = useState(initial?.id ?? 0)
  if ((initial?.id ?? 0) !== seedId) {
    setSeedId(initial?.id ?? 0)
    setForm(seed(initial))
  }

  const set = (k: keyof ReturnType<typeof seed>, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.title.trim() || !form.command.trim()) return
    setSaving(true)
    const payload = { ...form, project: form.project ? Number(form.project) : null }
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
      title={initial ? 'Edit Command' : 'Command Baru'}
      footer={
        <>
          <button onClick={onClose} className="btn">
            Batal
          </button>
          <button onClick={submit} disabled={saving} className="btn-accent disabled:opacity-50">
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Judul</span>
          <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Command</span>
          <textarea
            className="input resize-none font-mono text-[13px]"
            rows={3}
            value={form.command}
            onChange={(e) => set('command', e.target.value)}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Kategori</span>
            <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Project</span>
            <select className="input" value={form.project} onChange={(e) => set('project', e.target.value)}>
              <option value="">Tanpa project</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </Modal>
  )
}

function seed(c?: Command | null) {
  return {
    title: c?.title ?? '',
    command: c?.command ?? '',
    category: c?.category ?? 'general',
    project: c?.project ? String(c.project) : '',
  }
}
