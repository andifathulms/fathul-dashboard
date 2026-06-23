'use client'

import { useState } from 'react'

import Modal from '@/components/ui/Modal'
import api from '@/lib/api'
import type { Project, ProjectCategory, ProjectStatus } from '@/lib/types'

const STATUSES: ProjectStatus[] = ['active', 'paused', 'done', 'archived']
const CATEGORIES: ProjectCategory[] = ['oikn', 'freelance', 'personal', 'side']

interface ProjectFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  initial?: Project | null
}

export default function ProjectForm({ open, onClose, onSaved, initial }: ProjectFormProps) {
  const [form, setForm] = useState(() => seed(initial))
  const [saving, setSaving] = useState(false)

  // Re-seed when the target project changes.
  const [seedId, setSeedId] = useState(initial?.id ?? 0)
  if ((initial?.id ?? 0) !== seedId) {
    setSeedId(initial?.id ?? 0)
    setForm(seed(initial))
  }

  const set = (k: keyof ReturnType<typeof seed>, v: string) =>
    setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      ...form,
      tech_stack: form.tech_stack
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    }
    try {
      if (initial) await api.patch(`/projects/${initial.id}/`, payload)
      else await api.post('/projects/', payload)
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
      title={initial ? 'Edit Project' : 'Project Baru'}
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
        <Field label="Nama">
          <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Deskripsi">
          <textarea
            className="input resize-none"
            rows={2}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Kategori">
            <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Tech stack (pisahkan dengan koma)">
          <input
            className="input font-mono"
            placeholder="Next.js, Django, SQLite"
            value={form.tech_stack}
            onChange={(e) => set('tech_stack', e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Repo URL">
            <input className="input" value={form.repo_url} onChange={(e) => set('repo_url', e.target.value)} />
          </Field>
          <Field label="Live URL">
            <input className="input" value={form.live_url} onChange={(e) => set('live_url', e.target.value)} />
          </Field>
        </div>
        <Field label="Catatan">
          <textarea
            className="input resize-none"
            rows={2}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  )
}

function seed(p?: Project | null) {
  return {
    name: p?.name ?? '',
    description: p?.description ?? '',
    status: p?.status ?? 'active',
    category: p?.category ?? 'personal',
    tech_stack: p?.tech_stack?.join(', ') ?? '',
    repo_url: p?.repo_url ?? '',
    live_url: p?.live_url ?? '',
    notes: p?.notes ?? '',
  }
}
