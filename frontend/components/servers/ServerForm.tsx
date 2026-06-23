'use client'

import { useState } from 'react'

import Modal from '@/components/ui/Modal'
import api from '@/lib/api'
import type { Project, Server } from '@/lib/types'

interface ServerFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  projects?: Project[]
  initial?: Server | null
}

export default function ServerForm({ open, onClose, onSaved, projects, initial }: ServerFormProps) {
  const [form, setForm] = useState(() => seed(initial))
  const [saving, setSaving] = useState(false)

  const [seedId, setSeedId] = useState(initial?.id ?? 0)
  if ((initial?.id ?? 0) !== seedId) {
    setSeedId(initial?.id ?? 0)
    setForm(seed(initial))
  }

  const set = (k: keyof ReturnType<typeof seed>, v: string | number[]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.name.trim() || !form.ip_address.trim()) return
    setSaving(true)
    const payload = { ...form, ssh_port: Number(form.ssh_port) || 22 }
    try {
      if (initial) await api.patch(`/servers/${initial.id}/`, payload)
      else await api.post('/servers/', payload)
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const toggleProject = (id: number) =>
    set(
      'projects',
      form.projects.includes(id) ? form.projects.filter((p) => p !== id) : [...form.projects, id]
    )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit Server' : 'Server Baru'}
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
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Field label="IP Address">
              <input
                className="input font-mono"
                placeholder="192.168.1.10"
                value={form.ip_address}
                onChange={(e) => set('ip_address', e.target.value)}
              />
            </Field>
          </div>
          <Field label="SSH Port">
            <input
              className="input font-mono"
              value={form.ssh_port}
              onChange={(e) => set('ssh_port', e.target.value)}
            />
          </Field>
        </div>
        <Field label="SSH User">
          <input
            className="input font-mono"
            placeholder="root"
            value={form.ssh_user}
            onChange={(e) => set('ssh_user', e.target.value)}
          />
        </Field>
        <Field label="Deskripsi">
          <textarea
            className="input resize-none"
            rows={2}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </Field>
        {projects && projects.length > 0 && (
          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted">Project di server ini</span>
            <div className="flex flex-wrap gap-1.5">
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleProject(p.id)}
                  className={
                    'chip border transition-colors ' +
                    (form.projects.includes(p.id)
                      ? 'border-accent1/50 bg-accent1/15 text-accent1'
                      : 'border-border bg-bg text-muted hover:text-text')
                  }
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}
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

function seed(s?: Server | null) {
  return {
    name: s?.name ?? '',
    ip_address: s?.ip_address ?? '',
    ssh_user: s?.ssh_user ?? 'root',
    ssh_port: s?.ssh_port ? String(s.ssh_port) : '22',
    description: s?.description ?? '',
    projects: s?.projects ?? [],
  }
}
