import { cn } from '@/lib/utils'

type Status = 'up' | 'down' | 'checking'

interface StatusDotProps {
  status: Status
  className?: string
}

const COLORS: Record<Status, string> = {
  up: 'bg-highlight shadow-[0_0_0_3px_rgba(16,185,129,0.16)]',
  down: 'bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.16)]',
  checking: 'bg-accent2 animate-pulse-dot shadow-[0_0_0_3px_rgba(217,119,6,0.16)]',
}

export default function StatusDot({ status, className }: StatusDotProps) {
  return (
    <span className={cn('inline-block h-2.5 w-2.5 rounded-full', COLORS[status], className)} />
  )
}
