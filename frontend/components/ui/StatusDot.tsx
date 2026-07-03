import { cn } from '@/lib/utils'

type Status = 'up' | 'down' | 'checking'

interface StatusDotProps {
  status: Status
  className?: string
}

const COLORS: Record<Status, string> = {
  up: 'bg-highlight shadow-[0_0_0_3px_rgba(52,211,153,0.18)]',
  down: 'bg-danger shadow-[0_0_0_3px_rgba(248,113,113,0.18)]',
  checking: 'bg-warning animate-pulse-dot shadow-[0_0_0_3px_rgba(251,191,36,0.18)]',
}

export default function StatusDot({ status, className }: StatusDotProps) {
  return (
    <span className={cn('inline-block h-2.5 w-2.5 rounded-full', COLORS[status], className)} />
  )
}
