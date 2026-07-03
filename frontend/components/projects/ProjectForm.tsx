'use client'

import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import Modal from '@/components/ui/Modal'
import api from '@/lib/api'
import type { Project, ProjectCategory, ProjectStatus, Repo } from '@/lib/types'
import { CATEGORY_LABELS, STATUS_LABELS } from '@/lib/utils'

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

  // --- repos (dynamic list) ---
  const addRepo = () => setForm((f) => ({ ...f, repos: [...f.repos, { label: '', url: '' }] }))
  const updateRepo = (i: number, k: keyof Repo, v: string) =>
    setForm((f) => ({ ...f, repos: f.repos.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)) }))
  const removeRepo = (i: number) =>
    setForm((f) => ({ ...f, repos: f.repos.filter((_, idx) => idx !== i) }))

  const submit = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      ...form,
      tech_stack: form.tech_stack
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      repos: form.repos.filter((r) => r.url.trim()).map((r) => ({ label: r.label.trim(), url: r.url.trim() })),
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
          <button onClick={submit} disabled={saving} className="btn-accent">
            {saving && <Loader2 size={14} className="animate-spin" />}
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
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Kategori">
            <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
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

        {/* Repos — multiple, each with a label (e.g. Frontend / Backend) */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Repositories</span>
            <button type="button" onClick={addRepo} className="btn text-xs">
              <Plus size={13} /> Tambah repo
            </button>
          </div>
          <div className="space-y-2">
            {form.repos.length === 0 && (
              <p className="text-[11px] text-muted">Belum ada repo. Klik “Tambah repo”.</p>
            )}
            {form.repos.map((r, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="input w-32 shrink-0"
                  placeholder="Label"
                  value={r.label}
                  onChange={(e) => updateRepo(i, 'label', e.target.value)}
                />
                <input
                  className="input font-mono"
                  placeholder="https://github.com/…"
                  value={r.url}
                  onChange={(e) => updateRepo(i, 'url', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeRepo(i)}
                  className="icon-btn shrink-0 hover:text-red-400"
                  aria-label="Hapus repo"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <Field label="Live URL">
          <input className="input" value={form.live_url} onChange={(e) => set('live_url', e.target.value)} />
        </Field>
        <Field label="Path lokal (untuk tombol Buka di VS Code)">
          <input
            className="input font-mono"
            placeholder="/Users/fathul/Documents/Project/nama-project"
            value={form.local_path}
            onChange={(e) => set('local_path', e.target.value)}
          />
        </Field>
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
  // Fall back to the legacy single repo_url if no repos array is set yet.
  const repos: Repo[] =
    p?.repos && p.repos.length > 0
      ? p.repos.map((r) => ({ label: r.label ?? '', url: r.url ?? '' }))
      : p?.repo_url
        ? [{ label: 'Repo', url: p.repo_url }]
        : []
  return {
    name: p?.name ?? '',
    description: p?.description ?? '',
    status: p?.status ?? 'active',
    category: p?.category ?? 'personal',
    tech_stack: p?.tech_stack?.join(', ') ?? '',
    repos,
    live_url: p?.live_url ?? '',
    local_path: p?.local_path ?? '',
    notes: p?.notes ?? '',
  }
}
