import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  hint?: string
  action?: React.ReactNode
  className?: string
  /** Compact variant for inside small widgets. */
  compact?: boolean
}

/** Consistent, friendly empty state used across lists and widgets. */
export default function EmptyState({ icon, title, hint, action, className, compact }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-1.5 py-6' : 'gap-2.5 py-14',
        className
      )}
    >
      {icon && (
        <span
          className={cn(
            'flex items-center justify-center rounded-2xl bg-border/40 text-muted',
            compact ? 'h-9 w-9' : 'h-12 w-12'
          )}
        >
          {icon}
        </span>
      )}
      <p className={cn('font-medium text-text/90', compact ? 'text-sm' : 'text-[15px]')}>{title}</p>
      {hint && <p className="max-w-xs text-xs text-muted">{hint}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
