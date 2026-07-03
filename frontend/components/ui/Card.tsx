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
        <header className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon && (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent1/10 text-accent1 ring-1 ring-inset ring-accent1/15">
                {icon}
              </span>
            )}
            <h3 className="widget-title truncate">{title}</h3>
          </div>
          {action}
        </header>
      )}
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </section>
  )
}
