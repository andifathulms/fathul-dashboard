import { cn } from '@/lib/utils'
import { CATEGORY_STYLES, PRIORITY_STYLES, STATUS_STYLES, STATUS_LABELS } from '@/lib/utils'
import type { ProjectCategory, ProjectPriority, ProjectStatus } from '@/lib/types'

export function CategoryBadge({ category }: { category: ProjectCategory }) {
  const s = CATEGORY_STYLES[category]
  return <span className={cn('chip', s.chip)}>{s.label}</span>
}

export function PriorityBadge({ priority }: { priority: ProjectPriority }) {
  const s = PRIORITY_STYLES[priority]
  return (
    <span className={cn('chip inline-flex items-center gap-1.5', s.chip)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  )
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={cn('chip', STATUS_STYLES[status] ?? STATUS_STYLES.archived)}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

/** A technology tag — reads as data, so it takes the mono face. */
export function TechTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="chip border border-border bg-surface2 font-mono font-normal text-text2">
      {children}
    </span>
  )
}
