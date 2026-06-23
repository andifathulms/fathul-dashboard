import { cn } from '@/lib/utils'

type Status = 'up' | 'down' | 'checking'

interface StatusDotProps {
  status: Status
  className?: string
}

const COLORS: Record<Status, string> = {
  up: 'bg-highlight',
  down: 'bg-red-500',
  checking: 'bg-accent2 animate-pulse-dot',
}

export default function StatusDot({ status, className }: StatusDotProps) {
  return (
    <span className={cn('inline-block h-2.5 w-2.5 rounded-full', COLORS[status], className)} />
  )
}
