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

/** States what the thing is and offers the action that creates one. */
export default function EmptyState({ icon, title, hint, action, className, compact }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-1.5 py-6' : 'gap-2 py-12',
        className
      )}
    >
      {icon && (
        <span
          className={cn(
            'flex items-center justify-center rounded-xl border border-border bg-surface2 text-muted',
            compact ? 'h-9 w-9' : 'h-11 w-11'
          )}
        >
          {icon}
        </span>
      )}
      <p className={cn('font-display font-semibold text-text', compact ? 'text-base' : 'text-md')}>
        {title}
      </p>
      {hint && <p className="max-w-[34ch] text-sm text-muted">{hint}</p>}
      {action && <div className="mt-1.5">{action}</div>}
    </div>
  )
}
