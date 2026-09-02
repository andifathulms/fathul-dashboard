// Helpers shared by the Focus timer, its widgets, and the stats view.
import type { FocusKind } from './types'

export const KIND_LABELS: Record<FocusKind, string> = {
  focus: 'Focus',
  short_break: 'Short break',
  long_break: 'Long break',
}

/** Timer face: mm:ss, and h:mm:ss once a session runs past an hour. */
export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

/** Prose duration for totals: "2h 15m", "45m", "—" when nothing was tracked. */
export function formatDuration(totalSec: number): string {
  const mins = Math.round(totalSec / 60)
  if (mins <= 0) return '0m'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

/** Which break follows a focus session, given how many are already done. */
export function nextBreakKind(completedToday: number, longBreakEvery: number): FocusKind {
  if (longBreakEvery > 0 && completedToday > 0 && completedToday % longBreakEvery === 0) {
    return 'long_break'
  }
  return 'short_break'
}

/** A short two-tone chime, synthesized so the app carries no audio asset and
 *  still works offline. Silently does nothing if the browser blocks audio. */
export function playChime(kind: FocusKind) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    // Focus ends on a rising pair (get up), a break ends on a falling one.
    const notes = kind === 'focus' ? [660, 880] : [880, 660]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const at = ctx.currentTime + i * 0.18
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.exponentialRampToValueAtTime(0.25, at + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.3)
      osc.connect(gain).connect(ctx.destination)
      osc.start(at)
      osc.stop(at + 0.32)
    })
    setTimeout(() => ctx.close(), 1200)
  } catch {
    /* audio is a nicety, never a failure */
  }
}

/** Ask once, quietly — a denied permission just means no desktop notification. */
export function requestNotifyPermission() {
  try {
    if ('Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission()
    }
  } catch {
    /* not supported */
  }
}

export function notify(title: string, body: string) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, tag: 'fd-focus' })
    }
  } catch {
    /* not supported */
  }
}
