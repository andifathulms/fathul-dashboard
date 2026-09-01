import { cn } from '@/lib/utils'

/** A shimmering placeholder block. Compose several to mock the real layout. */
export default function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

/** Stacked rows that match the shape of a list — not generic grey bars. */
export function SkeletonRows({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-1 py-1.5">
          <Skeleton className="h-7 w-7 shrink-0 rounded-lg" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 rounded" />
            <Skeleton className="h-2.5 w-1/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** A grid of card-shaped placeholders. */
export function SkeletonCards({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', className)} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-36 rounded-xl" />
      ))}
    </div>
  )
}
