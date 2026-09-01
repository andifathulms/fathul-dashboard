import { cn } from '@/lib/utils'

type Status = 'up' | 'down' | 'checking'

interface StatusDotProps {
  status: Status
  className?: string
}

// A dot alone never carries meaning — pair it with the label the caller renders.
const COLORS: Record<Status, string> = {
  up: 'bg-highlight ring-highlight/20',
  down: 'bg-danger ring-danger/20',
  checking: 'bg-warning ring-warning/20 animate-pulse-dot',
}

export default function StatusDot({ status, className }: StatusDotProps) {
  return (
    <span
      className={cn('inline-block h-2 w-2 shrink-0 rounded-full ring-4', COLORS[status], className)}
    />
  )
}
