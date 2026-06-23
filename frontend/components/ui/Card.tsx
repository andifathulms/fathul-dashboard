import { cn } from '@/lib/utils'

interface WidgetCardProps {
  title?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
  bodyClassName?: string
  children: React.ReactNode
}

/** A surface card with an optional title row — the building block for widgets. */
export default function WidgetCard({
  title,
  icon,
  action,
  className,
  bodyClassName,
  children,
}: WidgetCardProps) {
  return (
    <section className={cn('card flex flex-col', className)}>
      {title && (
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-muted">
            {icon}
            <h3 className="widget-title">{title}</h3>
          </div>
          {action}
        </header>
      )}
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </section>
  )
}
