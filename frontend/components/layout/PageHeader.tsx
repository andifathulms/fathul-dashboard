interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

/** Consistent page title row used across the inner pages. */
export default function PageHeader({ title, subtitle, icon, action }: PageHeaderProps) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent1/10 text-accent1">
            {icon}
          </span>
        )}
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}
