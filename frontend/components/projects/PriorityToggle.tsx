'use client'

import { useState } from 'react'

import api from '@/lib/api'
import type { Project, ProjectPriority } from '@/lib/types'
import { PRIORITY_STYLES, cn } from '@/lib/utils'

const ORDER: ProjectPriority[] = ['high', 'medium', 'low']

interface PriorityToggleProps {
  project: Project
  onChanged: () => void
  /** dot-only compact form (for tight rows) */
  compact?: boolean
}

/** Inline chip that cycles a project's priority on click — no form needed. */
export default function PriorityToggle({ project, onChanged, compact }: PriorityToggleProps) {
  const [busy, setBusy] = useState(false)
  const s = PRIORITY_STYLES[project.priority]

  const cycle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    const next = ORDER[(ORDER.indexOf(project.priority) + 1) % ORDER.length]
    try {
      await api.patch(`/projects/${project.id}/`, { priority: next })
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  if (compact) {
    return (
      <button
        onClick={cycle}
        disabled={busy}
        title={`Priority: ${s.label} — click to change`}
        aria-label={`Priority ${s.label}`}
        className={cn('inline-flex h-4 w-4 items-center justify-center rounded-full transition-transform hover:scale-125', busy && 'opacity-50')}
      >
        <span className={cn('h-2.5 w-2.5 rounded-full', s.dot)} />
      </button>
    )
  }

  return (
    <button
      onClick={cycle}
      disabled={busy}
      title="Click to change priority"
      className={cn('chip inline-flex items-center gap-1 transition-opacity hover:opacity-80', s.chip, busy && 'opacity-50')}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      {s.label}
    </button>
  )
}
