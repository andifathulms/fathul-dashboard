'use client'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import api from '@/lib/api'
import type { Project } from '@/lib/types'

interface EnvImportModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  projects?: Project[]
  /** When set (creating from a project page), pin the project and hide the picker. */
  lockedProjectId?: number
}

export default function EnvImportModal({
  open,
  onClose,
  onSaved,
  projects,
  lockedProjectId,
}: EnvImportModalProps) {
  const [content, setContent] = useState('')
  const [project, setProject] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const submit = async () => {
    if (!content.trim()) return
    setSaving(true)
    try {
      const projectId = lockedProjectId != null ? lockedProjectId : project ? Number(project) : null
      const { data } = await api.post('/envvars/bulk/', {
        content,
        project: projectId,
      })
      onSaved()
      onClose()
      setContent('')
      toast.success(`${data.created} variables imported successfully.`, 'Import .env')
    } catch (e) {
      toast.error((e as Error).message, 'Import failed')
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
            Cancel
          </button>
          <button onClick={submit} disabled={saving} className="btn-accent">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Importing…' : 'Import'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Paste your .env file contents</span>
          <textarea
            className="input resize-none font-mono text-[13px] leading-relaxed"
            rows={10}
            placeholder={'DATABASE_URL=postgres://...\nSECRET_KEY=abc123\n# comments are ignored'}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </label>
        {lockedProjectId == null && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Link to project</span>
            <select className="input" value={project} onChange={(e) => setProject(e.target.value)}>
              <option value="">No project</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <p className="text-[11px] text-muted">
          Empty lines and comments (#) are skipped. Each KEY=VALUE is saved separately.
        </p>
      </div>
    </Modal>
  )
}
