'use client'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import Modal from '@/components/ui/Modal'
import api from '@/lib/api'
import type { Credential, Project, Server, ServerProvider } from '@/lib/types'

const PROVIDERS: { value: ServerProvider; label: string }[] = [
  { value: 'gcp', label: 'GCP' },
  { value: 'pdns', label: 'PDNS' },
  { value: 'other', label: 'Lainnya' },
]

interface ServerFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  projects?: Project[]
  credentials?: Credential[]
  initial?: Server | null
}

export default function ServerForm({ open, onClose, onSaved, projects, credentials, initial }: ServerFormProps) {
  const [form, setForm] = useState(() => seed(initial))
  const [saving, setSaving] = useState(false)

  const [seedId, setSeedId] = useState(initial?.id ?? 0)
  if ((initial?.id ?? 0) !== seedId) {
    setSeedId(initial?.id ?? 0)
    setForm(seed(initial))
  }

  const set = (k: keyof ReturnType<typeof seed>, v: string | number[] | boolean) =>
    setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.name.trim() || (!form.ssh_alias.trim() && !form.ip_address.trim())) return
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      provider: form.provider,
      ssh_alias: form.ssh_alias.trim(),
      ip_address: form.ip_address.trim() || null,
      ssh_user: form.ssh_user.trim(),
      ssh_port: Number(form.ssh_port) || 22,
      requires_vpn: form.requires_vpn,
      gcp_project: form.gcp_project.trim(),
      gcp_zone: form.gcp_zone.trim(),
      gcp_instance: form.gcp_instance.trim(),
      credential: form.credential ? Number(form.credential) : null,
      description: form.description,
      projects: form.projects,
    }
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
    set('projects', form.projects.includes(id) ? form.projects.filter((p) => p !== id) : [...form.projects, id])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit VM' : 'VM Baru'}
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
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Field label="Nama VM">
              <input className="input" placeholder="vm-ekiosk" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
          </div>
          <Field label="Provider">
            <select className="input" value={form.provider} onChange={(e) => set('provider', e.target.value)}>
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="rounded-lg border border-border bg-bg/40 p-3">
          <p className="mb-2 text-xs font-medium text-muted">Akses SSH — isi alias, atau user@ip</p>
          <Field label="SSH alias (~/.ssh/config)">
            <input
              className="input font-mono"
              placeholder="vm-ekiosk"
              value={form.ssh_alias}
              onChange={(e) => set('ssh_alias', e.target.value)}
            />
          </Field>
          <div className="mt-2 grid grid-cols-6 gap-2">
            <div className="col-span-2">
              <Field label="User">
                <input className="input font-mono" placeholder="root" value={form.ssh_user} onChange={(e) => set('ssh_user', e.target.value)} />
              </Field>
            </div>
            <div className="col-span-3">
              <Field label="IP">
                <input className="input font-mono" placeholder="10.184.0.7" value={form.ip_address} onChange={(e) => set('ip_address', e.target.value)} />
              </Field>
            </div>
            <Field label="Port">
              <input className="input font-mono" value={form.ssh_port} onChange={(e) => set('ssh_port', e.target.value)} />
            </Field>
          </div>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.requires_vpn}
              onChange={(e) => set('requires_vpn', e.target.checked)}
              className="h-4 w-4 accent-accent1"
            />
            <span className="text-muted">Butuh VPN untuk diakses (lewati ping)</span>
          </label>
        </div>

        {form.provider === 'gcp' && (
          <div className="grid grid-cols-3 gap-2">
            <Field label="GCP project">
              <input className="input font-mono text-[13px]" value={form.gcp_project} onChange={(e) => set('gcp_project', e.target.value)} />
            </Field>
            <Field label="Zone">
              <input className="input font-mono text-[13px]" placeholder="asia-southeast2-a" value={form.gcp_zone} onChange={(e) => set('gcp_zone', e.target.value)} />
            </Field>
            <Field label="Instance">
              <input className="input font-mono text-[13px]" value={form.gcp_instance} onChange={(e) => set('gcp_instance', e.target.value)} />
            </Field>
          </div>
        )}

        <Field label="Password login/sudo (dari Vault)">
          <select className="input" value={form.credential} onChange={(e) => set('credential', e.target.value)}>
            <option value="">Tanpa password</option>
            {credentials?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Deskripsi">
          <textarea className="input resize-none" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>

        {projects && projects.length > 0 && (
          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted">Apps di VM ini</span>
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
    provider: (s?.provider ?? 'other') as ServerProvider,
    ssh_alias: s?.ssh_alias ?? '',
    ip_address: s?.ip_address ?? '',
    ssh_user: s?.ssh_user ?? '',
    ssh_port: s?.ssh_port ? String(s.ssh_port) : '22',
    requires_vpn: s?.requires_vpn ?? false,
    gcp_project: s?.gcp_project ?? '',
    gcp_zone: s?.gcp_zone ?? '',
    gcp_instance: s?.gcp_instance ?? '',
    credential: s?.credential ? String(s.credential) : '',
    description: s?.description ?? '',
    projects: s?.projects ?? [],
  }
}
