'use client'

import { ImagePlus, Loader2, Plus, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'

import AssetPicker from '@/components/projects/AssetPicker'
import ProjectAvatar from '@/components/projects/ProjectAvatar'
import Modal from '@/components/ui/Modal'
import api from '@/lib/api'
import type { Project, ProjectCategory, ProjectPriority, ProjectStatus, Repo } from '@/lib/types'
import { CATEGORY_LABELS, PRIORITY_STYLES, STATUS_LABELS } from '@/lib/utils'

const STATUSES: ProjectStatus[] = ['active', 'paused', 'done', 'archived']
const CATEGORIES: ProjectCategory[] = ['oikn', 'freelance', 'personal', 'side']
const PRIORITIES: ProjectPriority[] = ['high', 'medium', 'low']

interface ProjectFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  initial?: Project | null
}

export default function ProjectForm({ open, onClose, onSaved, initial }: ProjectFormProps) {
  const [form, setForm] = useState(() => seed(initial))
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Re-seed when the target project changes.
  const [seedId, setSeedId] = useState(initial?.id ?? 0)
  if ((initial?.id ?? 0) !== seedId) {
    setSeedId(initial?.id ?? 0)
    setForm(seed(initial))
  }

  const set = (k: keyof ReturnType<typeof seed>, v: string) =>
    setForm((f) => ({ ...f, [k]: v }))

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post('/upload/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      set('icon_url', data.url)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

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
        <div className="flex items-end gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            title="Pilih file icon"
            className="group relative mb-[1px] shrink-0"
          >
            <ProjectAvatar
              project={{ name: form.name || '?', icon_url: form.icon_url, category: form.category }}
              size={46}
              className="rounded-xl"
            />
            <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
              {uploading ? (
                <Loader2 size={16} className="animate-spin text-white" />
              ) : (
                <ImagePlus size={15} className="text-white" />
              )}
            </span>
            {uploading && (
              <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/45">
                <Loader2 size={16} className="animate-spin text-white" />
              </span>
            )}
          </button>
          <div className="flex-1">
            <Field label="Nama">
              <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
        <Field label="Icon: klik avatar untuk pilih file, atau tempel URL/path">
          <div className="flex gap-2">
            <input
              className="input font-mono text-[13px]"
              placeholder="https://… atau /logo.png"
              value={form.icon_url}
              onChange={(e) => set('icon_url', e.target.value)}
            />
            <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-sm shrink-0">
              <ImagePlus size={13} /> File
            </button>
            {form.icon_url && (
              <button type="button" onClick={() => set('icon_url', '')} className="btn btn-sm shrink-0" title="Hapus icon">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </Field>

        {/* Optional brand lockups */}
        <details className="rounded-lg border border-border bg-bg/40 px-3 py-2 [&_summary]:cursor-pointer">
          <summary className="text-xs font-medium text-muted">Brand lockup (opsional)</summary>
          <div className="mt-3 space-y-3">
            <AssetPicker
              label="Lockup horizontal"
              shape="wide"
              value={form.lockup_horizontal_url}
              onChange={(v) => set('lockup_horizontal_url', v)}
            />
            <AssetPicker
              label="Lockup vertikal"
              shape="tall"
              value={form.lockup_vertical_url}
              onChange={(v) => set('lockup_vertical_url', v)}
            />
          </div>
        </details>
        <Field label="Deskripsi">
          <textarea
            className="input resize-none"
            rows={2}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-3 gap-3">
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
          <Field label="Prioritas">
            <select className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_STYLES[p].label}
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
    icon_url: p?.icon_url ?? '',
    lockup_horizontal_url: p?.lockup_horizontal_url ?? '',
    lockup_vertical_url: p?.lockup_vertical_url ?? '',
    status: p?.status ?? 'active',
    category: p?.category ?? 'personal',
    priority: p?.priority ?? 'medium',
    tech_stack: p?.tech_stack?.join(', ') ?? '',
    repos,
    live_url: p?.live_url ?? '',
    local_path: p?.local_path ?? '',
    notes: p?.notes ?? '',
  }
}
