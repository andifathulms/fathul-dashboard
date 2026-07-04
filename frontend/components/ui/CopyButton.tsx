'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

interface CopyButtonProps {
  value: string
  label?: string
  className?: string
  /** Show a text label next to the icon. */
  withText?: string
}

export default function CopyButton({ value, label, className, withText }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  }

  if (withText) {
    return (
      <button
        type="button"
        onClick={copy}
        aria-label={label ?? 'Copy'}
        className={cn('btn text-xs', copied && 'border-highlight/50 text-highlight', className)}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? 'Copied' : withText}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label ?? 'Copy'}
      className={cn('icon-btn', copied && 'text-highlight', className)}
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
    </button>
  )
}
