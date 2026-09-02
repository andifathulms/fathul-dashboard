'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'

import api from '@/lib/api'
import {
  KIND_LABELS,
  nextBreakKind,
  notify,
  playChime,
  requestNotifyPermission,
} from '@/lib/focus'
import type { FocusKind, FocusSession, FocusSettings } from '@/lib/types'
import { todayISO } from '@/lib/utils'

export interface StartOptions {
  kind?: FocusKind
  task?: number | null
  project?: number | null
  label?: string
  /** Overrides the configured duration — used for a prayer-shortened run. */
  plannedMin?: number
}

interface StopOptions {
  completed?: boolean
  interruptedBy?: string
  note?: string
}

interface FocusContextValue {
  session: FocusSession | null
  settings: FocusSettings | null
  todaySessions: FocusSession[]
  /** Completed focus sessions today — what the session dots count. */
  completedToday: number
  focusedSecToday: number
  /** Seconds left in the running session; 0 when idle. */
  remaining: number
  elapsed: number
  running: boolean
  paused: boolean
  start: (opts?: StartOptions) => Promise<void>
  stop: (opts?: StopOptions) => Promise<void>
  pause: () => void
  resume: () => void
  /** End the current phase early and move straight to what comes next. */
  skip: () => Promise<void>
  refresh: () => void
  saveSettings: (patch: Partial<FocusSettings>) => Promise<void>
}

const FocusContext = createContext<FocusContextValue | null>(null)

export function useFocus(): FocusContextValue {
  const ctx = useContext(FocusContext)
  if (!ctx) throw new Error('useFocus must be used within <FocusProvider>')
  return ctx
}

// Pause is deliberately client-side: it is a property of you sitting at this
// browser, not of the session, and persisting it here keeps the server model
// to the one thing it must be right about — how long you actually worked.
const PAUSE_KEY = 'fd_focus_pause'

interface PauseState {
  id: number
  /** Seconds already spent paused in this session. */
  banked: number
  /** Epoch ms when the current pause began, or null while running. */
  since: number | null
}

function readPause(id: number): PauseState {
  try {
    const raw = JSON.parse(localStorage.getItem(PAUSE_KEY) || 'null') as PauseState | null
    if (raw && raw.id === id) return raw
  } catch {
    /* ignore malformed state */
  }
  return { id, banked: 0, since: null }
}

function writePause(state: PauseState | null) {
  try {
    if (state) localStorage.setItem(PAUSE_KEY, JSON.stringify(state))
    else localStorage.removeItem(PAUSE_KEY)
  } catch {
    /* storage may be unavailable */
  }
}

export default function FocusProvider({ children }: { children: React.ReactNode }) {
  const { data: active, mutate: mutateActive } = useSWR<FocusSession | ''>('/focus/active/', {
    refreshInterval: 30_000,
  })
  const { data: settings, mutate: mutateSettings } = useSWR<FocusSettings>('/focus/settings/')
  const today = todayISO()
  const { data: todayData, mutate: mutateToday } = useSWR<FocusSession[]>(`/focus/?date=${today}`)

  const session = active || null
  const todaySessions = useMemo(() => todayData ?? [], [todayData])

  // The clock is derived from started_at on every tick, never accumulated from
  // the ticks themselves — a background tab throttles setInterval and a counted
  // timer would drift minutes over a day.
  const [tick, setTick] = useState(() => Date.now())
  useEffect(() => {
    if (!session) return
    const id = setInterval(() => setTick(Date.now()), 250)
    return () => clearInterval(id)
  }, [session])

  const [pause, setPause] = useState<PauseState | null>(null)
  useEffect(() => {
    setPause(session ? readPause(session.id) : null)
  }, [session?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    requestNotifyPermission()
  }, [])

  const elapsed = session
    ? Math.max(
        0,
        (tick - new Date(session.started_at).getTime()) / 1000 -
          (pause?.banked ?? 0) -
          (pause?.since ? (tick - pause.since) / 1000 : 0)
      )
    : 0
  const total = session ? session.planned_min * 60 : 0
  const remaining = session ? Math.max(0, total - elapsed) : 0
  const paused = Boolean(pause?.since)

  const refresh = useCallback(() => {
    void mutateActive()
    void mutateToday()
  }, [mutateActive, mutateToday])

  const start = useCallback(
    async (opts: StartOptions = {}) => {
      const { data } = await api.post<FocusSession>('/focus/start/', {
        kind: opts.kind ?? 'focus',
        task: opts.task ?? null,
        project: opts.project ?? null,
        label: opts.label ?? '',
        planned_min: opts.plannedMin,
      })
      writePause(null)
      setPause({ id: data.id, banked: 0, since: null })
      setTick(Date.now())
      await mutateActive(data, { revalidate: false })
      void mutateToday()
    },
    [mutateActive, mutateToday]
  )

  const stop = useCallback(
    async (opts: StopOptions = {}) => {
      if (!session) return
      await api.post(`/focus/${session.id}/stop/`, {
        completed: opts.completed ?? false,
        interrupted_by: opts.interruptedBy ?? '',
        note: opts.note ?? '',
        actual_sec: Math.round(elapsed),
      })
      writePause(null)
      setPause(null)
      await mutateActive('', { revalidate: false })
      void mutateToday()
    },
    [session, elapsed, mutateActive, mutateToday]
  )

  const doPause = useCallback(() => {
    if (!session || paused) return
    const next: PauseState = { id: session.id, banked: pause?.banked ?? 0, since: Date.now() }
    writePause(next)
    setPause(next)
  }, [session, paused, pause])

  const resume = useCallback(() => {
    if (!session || !pause?.since) return
    const next: PauseState = {
      id: session.id,
      banked: pause.banked + (Date.now() - pause.since) / 1000,
      since: null,
    }
    writePause(next)
    setPause(next)
    setTick(Date.now())
  }, [session, pause])

  const completedToday = todaySessions.filter((s) => s.kind === 'focus' && s.completed).length
  const focusedSecToday = todaySessions
    .filter((s) => s.kind === 'focus')
    .reduce((sum, s) => sum + s.actual_sec, 0)

  // Fires once per session when the clock reaches zero. The ref guards against
  // the 250ms ticker running the finish twice before the mutate lands.
  const finishedRef = useRef<number | null>(null)
  useEffect(() => {
    if (!session || paused || remaining > 0 || finishedRef.current === session.id) return
    finishedRef.current = session.id

    const done = async () => {
      await api.post(`/focus/${session.id}/stop/`, { completed: true, actual_sec: total })
      writePause(null)
      setPause(null)
      if (settings?.sound_enabled ?? true) playChime(session.kind)

      if (session.kind === 'focus') {
        const label = session.task_title || session.project_name || session.label || 'Session'
        notify('Focus done', `${label} — time for a break.`)
        const kind = nextBreakKind(completedToday + 1, settings?.long_break_every ?? 4)
        if (settings?.auto_start_breaks ?? true) {
          await start({ kind })
          void mutateToday()
          return
        }
      } else {
        notify(`${KIND_LABELS[session.kind]} over`, 'Back to it.')
      }

      await mutateActive('', { revalidate: false })
      void mutateToday()
    }
    void done()
  }, [session, paused, remaining, total, settings, completedToday, start, mutateActive, mutateToday])

  const skip = useCallback(async () => {
    if (!session) return
    const wasFocus = session.kind === 'focus'
    await stop({ completed: false, interruptedBy: 'skipped' })
    if (wasFocus && (settings?.auto_start_breaks ?? true)) {
      await start({ kind: nextBreakKind(completedToday, settings?.long_break_every ?? 4) })
    }
  }, [session, stop, start, settings, completedToday])

  const saveSettings = useCallback(
    async (patch: Partial<FocusSettings>) => {
      const { data } = await api.patch<FocusSettings>('/focus/settings/', patch)
      await mutateSettings(data, { revalidate: false })
    },
    [mutateSettings]
  )

  const value: FocusContextValue = {
    session,
    settings: settings ?? null,
    todaySessions,
    completedToday,
    focusedSecToday,
    remaining,
    elapsed,
    running: Boolean(session) && !paused,
    paused,
    start,
    stop,
    pause: doPause,
    resume,
    skip,
    refresh,
    saveSettings,
  }

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>
}
