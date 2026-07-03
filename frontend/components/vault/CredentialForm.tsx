'use client'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import Modal from '@/components/ui/Modal'
import api from '@/lib/api'
import type { Credential, Project } from '@/lib/types'

interface CredentialFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  projects?: Project[]
  initial?: Credential | null
  /** When set (creating from a project page), pin the project and hide the picker. */
  lockedProjectId?: number
}

export default function CredentialForm({
  open,
  onClose,
  onSaved,
  projects,
  initial,
  lockedProjectId,
}: CredentialFormProps) {
  const [form, setForm] = useState(() => seed(initial, lockedProjectId))
  const [saving, setSaving] = useState(false)

  const [seedId, setSeedId] = useState(initial?.id ?? 0)
  if ((initial?.id ?? 0) !== seedId) {
    setSeedId(initial?.id ?? 0)
    setForm(seed(initial, lockedProjectId))
  }

  const set = (k: keyof ReturnType<typeof seed>, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.label.trim()) return
    setSaving(true)
    const payload = { ...form, project: form.project ? Number(form.project) : null }
    try {
      if (initial) await api.patch(`/credentials/${initial.id}/`, payload)
      else await api.post('/credentials/', payload)
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
      title={initial ? 'Edit Kredensial' : 'Kredensial Baru'}
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
        <Field label="Label">
          <input className="input" value={form.label} onChange={(e) => set('label', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Username">
            <input className="input" value={form.username} onChange={(e) => set('username', e.target.value)} />
          </Field>
          <Field label="Password / Token">
            <input
              className="input font-mono"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
            />
          </Field>
        </div>
        <Field label="URL">
          <input className="input" value={form.url} onChange={(e) => set('url', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kategori">
            <input
              className="input"
              placeholder="mis. database, email"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
            />
          </Field>
          {lockedProjectId == null && (
            <Field label="Project">
              <select className="input" value={form.project} onChange={(e) => set('project', e.target.value)}>
                <option value="">Tanpa project</option>
                {projects?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
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

function seed(c?: Credential | null, lockedProjectId?: number) {
  return {
    label: c?.label ?? '',
    username: c?.username ?? '',
    password: c?.password ?? '',
    url: c?.url ?? '',
    category: c?.category ?? '',
    notes: c?.notes ?? '',
    project: c?.project ? String(c.project) : lockedProjectId != null ? String(lockedProjectId) : '',
  }
}
