import { cn } from '@/lib/utils'

interface WidgetCardProps {
  title?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
  bodyClassName?: string
  /** Tier 2 elevation — at most one per view. See DESIGN.md §5. */
  lift?: boolean
  children: React.ReactNode
}

/** A surface card with an optional title row — the building block for widgets. */
export default function WidgetCard({
  title,
  icon,
  action,
  className,
  bodyClassName,
  lift,
  children,
}: WidgetCardProps) {
  return (
    <section className={cn(lift ? 'card-lift' : 'card', 'flex flex-col', className)}>
      {title && (
        <header className="flex items-center justify-between gap-3 px-4 pb-2 pt-3.5">
          <div className="flex min-w-0 items-center gap-2">
            {icon && <span className="shrink-0 text-muted">{icon}</span>}
            <h3 className="widget-title truncate">{title}</h3>
          </div>
          {action}
        </header>
      )}
      <div className={cn('px-4 pb-4', !title && 'pt-4', bodyClassName)}>{children}</div>
    </section>
  )
}
