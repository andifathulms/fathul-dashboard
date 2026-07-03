interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

/** Consistent page title row used across the inner pages. */
export default function PageHeader({ title, subtitle, icon, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-3.5">
        {icon && (
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent1/20 to-accent1/[0.04] text-accent1 ring-1 ring-inset ring-accent1/20">
            {icon}
          </span>
        )}
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-[1.35rem]">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}
