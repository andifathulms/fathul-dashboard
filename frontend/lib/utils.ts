import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import type { ProjectCategory, ProjectPriority, ProjectStatus } from './types'

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

// Tailwind classes per project category. `bar` is a solid color for accents.
export const CATEGORY_STYLES: Record<
  ProjectCategory,
  { dot: string; bar: string; chip: string; label: string }
> = {
  oikn: { dot: 'bg-accent1', bar: 'bg-accent1', chip: 'bg-accent1/15 text-accent1 ring-1 ring-inset ring-accent1/25', label: 'OIKN' },
  freelance: { dot: 'bg-accent2', bar: 'bg-accent2', chip: 'bg-accent2/15 text-accent2 ring-1 ring-inset ring-accent2/25', label: 'Freelance' },
  personal: { dot: 'bg-highlight', bar: 'bg-highlight', chip: 'bg-highlight/15 text-highlight ring-1 ring-inset ring-highlight/25', label: 'Personal' },
  side: { dot: 'bg-muted', bar: 'bg-muted', chip: 'bg-muted/20 text-muted ring-1 ring-inset ring-muted/25', label: 'Side' },
}

export const STATUS_STYLES: Record<string, string> = {
  active: 'bg-highlight/15 text-highlight ring-1 ring-inset ring-highlight/25',
  paused: 'bg-accent2/15 text-accent2 ring-1 ring-inset ring-accent2/25',
  done: 'bg-accent1/15 text-accent1 ring-1 ring-inset ring-accent1/25',
  archived: 'bg-muted/20 text-muted ring-1 ring-inset ring-muted/25',
}

// Friendly labels for the status/category dropdowns and badges.
export const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  done: 'Done',
  archived: 'Archived',
}

export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  oikn: 'OIKN',
  freelance: 'Freelance',
  personal: 'Personal',
  side: 'Side Project',
}

// Priority: styling, label, and sort rank (lower = more urgent / sorts first).
export const PRIORITY_STYLES: Record<
  ProjectPriority,
  { label: string; chip: string; dot: string; rank: number }
> = {
  high: { label: 'High', chip: 'bg-danger/15 text-danger ring-1 ring-inset ring-danger/25', dot: 'bg-danger', rank: 0 },
  medium: { label: 'Medium', chip: 'bg-warning/15 text-warning ring-1 ring-inset ring-warning/25', dot: 'bg-warning', rank: 1 },
  low: { label: 'Low', chip: 'bg-muted/20 text-muted ring-1 ring-inset ring-muted/25', dot: 'bg-muted', rank: 2 },
}

export const STATUS_RANK: Record<ProjectStatus, number> = {
  active: 0,
  paused: 1,
  done: 2,
  archived: 3,
}

export function formatDateID(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
