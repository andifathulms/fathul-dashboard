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
// Chips follow DESIGN.md §2: a 10% tint, the color as ink, a 25% inset ring.
export const CATEGORY_STYLES: Record<
  ProjectCategory,
  { dot: string; bar: string; chip: string; banner: string; label: string }
> = {
  oikn: { dot: 'bg-accent1', bar: 'bg-accent1', chip: 'bg-accent1/10 text-accent1 ring-1 ring-inset ring-accent1/25', banner: 'bg-accent1/5', label: 'OIKN' },
  freelance: { dot: 'bg-accent2', bar: 'bg-accent2', chip: 'bg-accent2/10 text-accent2 ring-1 ring-inset ring-accent2/25', banner: 'bg-accent2/5', label: 'Freelance' },
  personal: { dot: 'bg-highlight', bar: 'bg-highlight', chip: 'bg-highlight/10 text-highlight ring-1 ring-inset ring-highlight/25', banner: 'bg-highlight/5', label: 'Personal' },
  side: { dot: 'bg-muted', bar: 'bg-muted', chip: 'bg-muted/10 text-muted ring-1 ring-inset ring-muted/30', banner: 'bg-muted/10', label: 'Side' },
}

export const STATUS_STYLES: Record<string, string> = {
  active: 'bg-highlight/10 text-highlight ring-1 ring-inset ring-highlight/25',
  paused: 'bg-warning/10 text-warning ring-1 ring-inset ring-warning/25',
  done: 'bg-accent1/10 text-accent1 ring-1 ring-inset ring-accent1/25',
  archived: 'bg-muted/10 text-muted ring-1 ring-inset ring-muted/30',
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
  high: { label: 'High', chip: 'bg-danger/10 text-danger ring-1 ring-inset ring-danger/25', dot: 'bg-danger', rank: 0 },
  medium: { label: 'Medium', chip: 'bg-warning/10 text-warning ring-1 ring-inset ring-warning/25', dot: 'bg-warning', rank: 1 },
  low: { label: 'Low', chip: 'bg-muted/10 text-muted ring-1 ring-inset ring-muted/30', dot: 'bg-muted', rank: 2 },
}

// Recurrence, phrased the way you would say it out loud.
export const REPEAT_LABELS: Record<string, string> = {
  daily: 'Every day',
  weekdays: 'Every weekday',
  weekly: 'Every week',
  monthly: 'Every month',
}

/** "Every 2 weeks" when the interval is more than one. */
export function repeatLabel(repeat: string, interval: number): string {
  if (!repeat) return ''
  if (interval > 1) {
    const unit = { daily: 'days', weekdays: 'weekdays', weekly: 'weeks', monthly: 'months' }[repeat]
    return `Every ${interval} ${unit}`
  }
  return REPEAT_LABELS[repeat] ?? ''
}

/** Whole days between an ISO date and today — "waiting 6 days". */
export function daysSince(iso: string): number {
  const then = new Date(`${iso}T00:00:00`).getTime()
  const now = new Date(todayISO() + 'T00:00:00').getTime()
  return Math.max(0, Math.round((now - then) / 86_400_000))
}

export const STATUS_RANK: Record<ProjectStatus, number> = {
  active: 0,
  paused: 1,
  done: 2,
  archived: 3,
}

// Dates are formatted from fixed tables rather than toLocaleDateString: Node's
// ICU and the browser disagree on the en-GB short month ("Sept" vs "Sep",
// comma or none), and that mismatch fails hydration for the whole tree.
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function asDate(date: Date | string): Date {
  if (typeof date !== 'string') return date
  // A bare YYYY-MM-DD parses as UTC — pin it to local midnight instead.
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00` : date)
}

/** Full date for page headers: "Wednesday, 2 September 2026". */
export function formatDateID(date: Date | string): string {
  const d = asDate(date)
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** Compact date for rows and metadata: "Wed, 2 Sep". */
export function formatDateShort(date: Date | string): string {
  const d = asDate(date)
  return `${WEEKDAYS[d.getDay()].slice(0, 3)}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`
}
