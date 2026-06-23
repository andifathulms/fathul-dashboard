'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

interface RevealToggleProps {
  value: string
  /** Characters used for the masked state. */
  className?: string
  monoClass?: string
}

export default function RevealToggle({ value, className, monoClass }: RevealToggleProps) {
  const [revealed, setRevealed] = useState(false)

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className={cn('font-mono text-sm', monoClass)}>
        {revealed ? value || '—' : '•'.repeat(Math.min(value.length || 8, 12))}
      </span>
      <button
        type="button"
        onClick={() => setRevealed((r) => !r)}
        aria-label={revealed ? 'Hide' : 'Reveal'}
        className="icon-btn h-7 w-7"
      >
        {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </span>
  )
}
