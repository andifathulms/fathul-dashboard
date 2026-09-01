interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

/** Title row for the inner pages. Page actions live here — never in the top bar. */
export default function PageHeader({ title, subtitle, icon, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent1/10 text-accent1 ring-1 ring-inset ring-accent1/20">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-0.5 text-base text-muted">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  )
}
