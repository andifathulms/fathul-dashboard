// Natural-language parsing for quick capture: "deploy staging besok #ekiosk"
// becomes a task due tomorrow on eKiosk, titled "deploy staging".
//
// Deliberately small and predictable. Everything it recognises is stripped
// from the title and surfaced back to you as a preview before you commit —
// a parser you cannot see is worse than no parser, because "review monday
// notes" is a real task and "monday" is a real date word.
import type { Project, TaskRepeat } from './types'
import { formatDateShort, toISODate } from './utils'

export interface ParsedTask {
  title: string
  dueDate: string | null
  project: Project | null
  repeat: TaskRepeat
  repeatInterval: number
  estimate: number | null
  /** True when you said "today" — the flag, not just the date. */
  forToday: boolean
  /** What was recognised, in the order it appears — drives the preview. */
  matched: { kind: 'date' | 'project' | 'repeat' | 'estimate'; text: string; label: string }[]
}

// Monday-indexed so weekday arithmetic reads naturally. Indonesian and English
// both appear because that is how the notes in this app are actually written.
const WEEKDAYS: Record<string, number> = {
  monday: 0, senin: 0,
  tuesday: 1, selasa: 1,
  wednesday: 2, rabu: 2,
  thursday: 3, kamis: 3,
  friday: 4, jumat: 4, jumaat: 4,
  saturday: 5, sabtu: 5,
  sunday: 6, minggu: 6, ahad: 6,
}

const REPEAT_WORDS: { re: RegExp; repeat: TaskRepeat; label: string }[] = [
  { re: /\b(?:every|setiap)\s+(?:weekday|hari\s+kerja)\b/i, repeat: 'weekdays', label: 'Every weekday' },
  { re: /\b(?:every|setiap)\s+day\b/i, repeat: 'daily', label: 'Every day' },
  { re: /\b(?:every|setiap)\s+hari\b/i, repeat: 'daily', label: 'Every day' },
  { re: /\b(?:every|setiap)\s+(?:week|minggu|pekan)\b/i, repeat: 'weekly', label: 'Every week' },
  { re: /\b(?:every|setiap)\s+(?:month|bulan)\b/i, repeat: 'monthly', label: 'Every month' },
]

function addDays(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

/** Days forward to the next occurrence of a weekday — never today, always ahead. */
function daysUntilWeekday(base: Date, target: number): number {
  const current = (base.getDay() + 6) % 7 // Monday = 0
  const delta = (target - current + 7) % 7
  return delta === 0 ? 7 : delta
}

export function parseTask(input: string, projects: Project[] = [], now = new Date()): ParsedTask {
  let rest = ` ${input} `
  const matched: ParsedTask['matched'] = []

  const take = (re: RegExp, kind: ParsedTask['matched'][0]['kind'], label: string) => {
    const m = rest.match(re)
    if (!m) return null
    matched.push({ kind, text: m[0].trim(), label })
    rest = rest.replace(m[0], ' ')
    return m
  }

  // Repeat first: "every week" contains no date word, but "setiap hari" would
  // otherwise be half-eaten by a date matcher looking for "hari ini".
  let repeat: TaskRepeat = ''
  let repeatInterval = 1
  const everyN = rest.match(/\b(?:every|setiap)\s+(\d+)\s+(days?|hari|weeks?|minggu|pekan|months?|bulan)\b/i)
  if (everyN) {
    const unit = everyN[2].toLowerCase()
    repeat = /^(day|hari)/.test(unit) ? 'daily' : /^(month|bulan)/.test(unit) ? 'monthly' : 'weekly'
    repeatInterval = Math.max(1, parseInt(everyN[1], 10))
    matched.push({
      kind: 'repeat',
      text: everyN[0].trim(),
      label: `Every ${repeatInterval} ${unit}`,
    })
    rest = rest.replace(everyN[0], ' ')
  } else {
    for (const r of REPEAT_WORDS) {
      if (take(r.re, 'repeat', r.label)) {
        repeat = r.repeat
        break
      }
    }
  }

  // Project: #token matched against project names, ignoring spaces and case.
  let project: Project | null = null
  const hash = rest.match(/#([\p{L}\p{N}_-]+)/u)
  if (hash) {
    const needle = hash[1].toLowerCase().replace(/[-_]/g, '')
    const flat = (p: Project) => p.name.toLowerCase().replace(/[\s\-_]/g, '')
    project =
      projects.find((p) => flat(p) === needle) ??
      projects.find((p) => flat(p).startsWith(needle)) ??
      projects.find((p) => flat(p).includes(needle)) ??
      null
    if (project) {
      matched.push({ kind: 'project', text: hash[0], label: project.name })
      rest = rest.replace(hash[0], ' ')
    }
  }

  // Estimate: "~3" reads as three pomodoros.
  const est = rest.match(/~\s*(\d{1,2})\b/)
  let estimate: number | null = null
  if (est) {
    estimate = Math.min(20, Math.max(1, parseInt(est[1], 10)))
    matched.push({ kind: 'estimate', text: est[0].trim(), label: `${estimate} pomodoros` })
    rest = rest.replace(est[0], ' ')
  }

  // Dates, most specific first.
  let dueDate: string | null = null
  let forToday = false

  const explicit = rest.match(/\b(\d{4}-\d{2}-\d{2})\b/)
  const inDays = rest.match(/\bin\s+(\d{1,3})\s*(d|days?|hari)\b/i)
  const inWeeks = rest.match(/\bin\s+(\d{1,2})\s*(w|weeks?|minggu)\b/i)
  const nextWeek = rest.match(/\b(next week|minggu depan|pekan depan)\b/i)
  const dayAfter = rest.match(/\b(lusa|day after tomorrow)\b/i)
  const tomorrow = rest.match(/\b(tomorrow|besok|esok)\b/i)
  const todayWord = rest.match(/\b(today|hari ini)\b/i)

  const setDate = (d: Date, m: RegExpMatchArray) => {
    dueDate = toISODate(d)
    matched.push({ kind: 'date', text: m[0].trim(), label: formatDateShort(d) })
    rest = rest.replace(m[0], ' ')
  }

  if (explicit) setDate(new Date(`${explicit[1]}T00:00:00`), explicit)
  else if (inDays) setDate(addDays(now, parseInt(inDays[1], 10)), inDays)
  else if (inWeeks) setDate(addDays(now, parseInt(inWeeks[1], 10) * 7), inWeeks)
  else if (nextWeek) setDate(addDays(now, 7), nextWeek)
  else if (dayAfter) setDate(addDays(now, 2), dayAfter)
  else if (tomorrow) setDate(addDays(now, 1), tomorrow)
  else if (todayWord) {
    forToday = true
    setDate(now, todayWord)
    matched[matched.length - 1].label = 'Today'
  } else {
    // A bare weekday always means the next one ahead, never the one just gone.
    const wd = rest.match(/\b(monday|senin|tuesday|selasa|wednesday|rabu|thursday|kamis|friday|jumat|jumaat|saturday|sabtu|sunday|minggu|ahad)\b/i)
    const trimmed = rest.trim()
    const atEdge =
      wd != null &&
      (trimmed.toLowerCase().startsWith(wd[1].toLowerCase()) ||
        trimmed.toLowerCase().endsWith(wd[1].toLowerCase()))
    if (wd && atEdge) {
      const target = WEEKDAYS[wd[1].toLowerCase()]
      const d = addDays(now, daysUntilWeekday(now, target))
      setDate(d, wd)
    }
  }

  // "on"/"pada" left dangling by a stripped date reads as a typo, not a word.
  const title = rest
    .replace(/\s+(on|pada|by|due)\s*$/i, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

  return { title, dueDate, project, repeat, repeatInterval, estimate, forToday, matched }
}
