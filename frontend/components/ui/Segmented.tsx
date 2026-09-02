'use client'

import { cn } from '@/lib/utils'

export interface SegmentOption<T extends string> {
  key: T
  label: string
  /** Optional count shown after the label. */
  count?: number
}

interface SegmentedProps<T extends string> {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  className?: string
}

/** The one filter control used across every list page (DESIGN.md §9). */
export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex w-fit gap-0.5 rounded-lg border border-border bg-surface p-0.5',
        className
      )}
    >
      {options.map((o) => {
        const active = o.key === value
        return (
          <button
            key={o.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.key)}
            className={cn(
              'rounded-md px-2.5 py-1 text-base font-medium transition-colors',
              active ? 'bg-accent1/10 text-accent1' : 'text-muted hover:bg-surface2 hover:text-text'
            )}
          >
            {o.label}
            {o.count != null && (
              <span className={cn('ml-1.5 tnum', active ? 'text-accent1/70' : 'text-muted')}>
                {o.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** A search field sized for a filter bar. */
export function SearchField({
  value,
  onChange,
  placeholder = 'Search',
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn('relative w-full sm:w-56', className)}>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="input pl-8"
      />
    </div>
  )
}

/** The row that holds filters above a list. Never reflows the rows below it. */
export function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>
}
