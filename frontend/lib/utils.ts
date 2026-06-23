import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import type { ProjectCategory } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Local YYYY-MM-DD (avoids UTC off-by-one from toISOString).
export function todayISO(): string {
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().slice(0, 10)
}

export function toISODate(d: Date): string {
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().slice(0, 10)
}

// Tailwind text/bg classes per project category badge.
export const CATEGORY_STYLES: Record<ProjectCategory, { dot: string; chip: string; label: string }> = {
  oikn: { dot: 'bg-accent1', chip: 'bg-accent1/15 text-accent1', label: 'OIKN' },
  freelance: { dot: 'bg-accent2', chip: 'bg-accent2/15 text-accent2', label: 'Freelance' },
  personal: { dot: 'bg-highlight', chip: 'bg-highlight/15 text-highlight', label: 'Personal' },
  side: { dot: 'bg-muted', chip: 'bg-muted/20 text-muted', label: 'Side' },
}

export const STATUS_STYLES: Record<string, string> = {
  active: 'bg-highlight/15 text-highlight',
  paused: 'bg-accent2/15 text-accent2',
  done: 'bg-accent1/15 text-accent1',
  archived: 'bg-muted/20 text-muted',
}

export function formatDateID(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
