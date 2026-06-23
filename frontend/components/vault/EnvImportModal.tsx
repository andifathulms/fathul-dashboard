'use client'

import { useState } from 'react'

import Modal from '@/components/ui/Modal'
import api from '@/lib/api'
import type { Project } from '@/lib/types'

interface EnvImportModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  projects?: Project[]
}

export default function EnvImportModal({ open, onClose, onSaved, projects }: EnvImportModalProps) {
  const [content, setContent] = useState('')
  const [project, setProject] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!content.trim()) return
    setSaving(true)
    try {
      const { data } = await api.post('/envvars/bulk/', {
        content,
        project: project ? Number(project) : null,
      })
      onSaved()
      onClose()
      setContent('')
      alert(`${data.created} variable berhasil diimpor.`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import .env"
      footer={
        <>
          <button onClick={onClose} className="btn">
            Batal
          </button>
          <button onClick={submit} disabled={saving} className="btn-accent disabled:opacity-50">
            {saving ? 'Mengimpor…' : 'Import'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Tempel isi file .env</span>
          <textarea
            className="input resize-none font-mono text-[13px] leading-relaxed"
            rows={10}
            placeholder={'DATABASE_URL=postgres://...\nSECRET_KEY=abc123\n# komentar diabaikan'}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Tautkan ke project</span>
          <select className="input" value={project} onChange={(e) => setProject(e.target.value)}>
            <option value="">Tanpa project</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <p className="text-[11px] text-muted">
          Baris kosong dan komentar (#) dilewati. Setiap KEY=VALUE disimpan terpisah.
        </p>
      </div>
    </Modal>
  )
}
