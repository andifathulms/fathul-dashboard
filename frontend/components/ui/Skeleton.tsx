import { cn } from '@/lib/utils'

/** A shimmering placeholder block. Compose several to mock a loading layout. */
export default function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

/** A few stacked skeleton rows — handy default for list/widget loading. */
export function SkeletonRows({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  )
}
