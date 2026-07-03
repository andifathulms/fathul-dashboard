import { cn } from '@/lib/utils'
import { CATEGORY_STYLES, PRIORITY_STYLES, STATUS_STYLES } from '@/lib/utils'
import type { ProjectCategory, ProjectPriority, ProjectStatus } from '@/lib/types'

export function CategoryBadge({ category }: { category: ProjectCategory }) {
  const s = CATEGORY_STYLES[category]
  return <span className={cn('chip', s.chip)}>{s.label}</span>
}

export function PriorityBadge({ priority }: { priority: ProjectPriority }) {
  const s = PRIORITY_STYLES[priority]
  return (
    <span className={cn('chip inline-flex items-center gap-1', s.chip)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  )
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={cn('chip capitalize', STATUS_STYLES[status] ?? 'bg-muted/20 text-muted')}>
      {status}
    </span>
  )
}

export function TechTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="chip border border-border bg-bg font-mono text-muted">{children}</span>
  )
}
