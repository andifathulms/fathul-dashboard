'use client'

import { NotebookPen, Pause, Play, Settings2, SkipForward, Square, Timer } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import FocusSettingsModal from '@/components/focus/FocusSettingsModal'
import { useFocus } from '@/components/focus/FocusProvider'
import FocusStats from '@/components/focus/FocusStats'
import TimerRing from '@/components/focus/TimerRing'
import PageHeader from '@/components/layout/PageHeader'
import WidgetCard from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import Segmented from '@/components/ui/Segmented'
import { useToast } from '@/components/ui/Toast'
import { usePrayer } from '@/hooks/usePrayer'
import api from '@/lib/api'
import { KIND_LABELS, formatDuration } from '@/lib/focus'
import { formatCountdown } from '@/lib/prayer'
import type { DailyLog, FocusKind, FocusSession, Project, Task } from '@/lib/types'
import { CATEGORY_STYLES, cn, todayISO } from '@/lib/utils'

/** The phases you can start by hand. Breaks are normally automatic, but a
 *  break you choose to take is still a break worth recording. */
const PHASES: { kind: FocusKind; label: string }[] = [
  { kind: 'focus', label: 'Focus' },
  { kind: 'short_break', label: 'Short break' },
  { kind: 'long_break', label: 'Long break' },
]

function clockOf(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function FocusPage() {
  const {
    session,
    settings,
    todaySessions,
    completedToday,
    focusedSecToday,
    remaining,
    elapsed,
    paused,
    start,
    stop,
    pause,
    resume,
    skip,
  } = useFocus()

  const today = todayISO()
  const { data: tasks } = useSWR<Task[]>(`/tasks/?agenda=${today}`)
  const { data: projects } = useSWR<Project[]>('/projects/?status=active')

  const [taskId, setTaskId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [label, setLabel] = useState('')
  const [phase, setPhase] = useState<FocusKind>('focus')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tab, setTab] = useState<'timer' | 'stats'>('timer')
  const [stopped, setStopped] = useState<FocusSession | null>(null)
  const [note, setNote] = useState('')
  const { next: nextPrayer } = usePrayer()
  const toast = useToast()

  const openTasks = (tasks ?? []).filter((t) => !t.is_done)
  const target = settings?.daily_target_sessions ?? 8
  const total = session ? session.planned_min * 60 : 0
  const progress = total > 0 ? elapsed / total : 0
  const isBreak = session ? session.kind !== 'focus' : false

  // A session that would run through the adzan is a session you will not
  // finish. Offer the shorter one rather than letting it break.
  const focusMin = settings?.focus_min ?? 25
  const prayerClash =
    (settings?.pause_for_prayer ?? true) &&
    phase === 'focus' &&
    !session &&
    nextPrayer?.minutesUntil != null &&
    nextPrayer.minutesUntil >= 5 &&
    nextPrayer.minutesUntil < focusMin
      ? nextPrayer
      : null

  const begin = async (plannedMin?: number) => {
    try {
      await start({
        kind: phase,
        task: taskId ? Number(taskId) : null,
        project: projectId ? Number(projectId) : null,
        label: label.trim(),
        plannedMin,
      })
    } catch (e) {
      toast.error((e as Error).message, "Couldn't start the timer")
    }
  }

  const end = async (completed: boolean) => {
    try {
      const closed = await stop({ completed, interruptedBy: completed ? '' : 'manual' })
      // Only ask about a focus session you actually sat through — a 20-second
      // false start has no story worth recording.
      if (closed && closed.kind === 'focus' && closed.actual_sec >= 60) {
        setNote('')
        setStopped(closed)
      }
    } catch (e) {
      toast.error((e as Error).message, "Couldn't stop the timer")
    }
  }

  const saveNote = async () => {
    if (!stopped) return
    try {
      if (note.trim()) await api.patch(`/focus/${stopped.id}/`, { note: note.trim() })
      setStopped(null)
    } catch (e) {
      toast.error((e as Error).message, "Couldn't save the note")
    }
  }

  // Hand the day's sessions to the journal, where the rest of the day lives.
  const addToLog = async () => {
    const focused = todaySessions.filter((s) => s.kind === 'focus' && s.actual_sec > 0)
    if (focused.length === 0) return
    const lines = focused.map((s) => {
      const what = s.task_title || s.project_name || s.label || 'Focus'
      return `- ${clockOf(s.started_at)} · ${what} · ${formatDuration(s.actual_sec)}${
        s.note ? ` — ${s.note}` : ''
      }`
    })
    const block = [
      `Focus — ${formatDuration(focusedSecToday)} across ${completedToday} sessions`,
      ...lines,
    ].join('\n')

    try {
      let log: DailyLog | null = null
      try {
        const res = await api.get<DailyLog>(`/logs/?date=${today}`)
        log = res.data
      } catch {
        const res = await api.post<DailyLog>('/logs/', { date: today, journal: '' })
        log = res.data
      }
      const journal = log.journal ? `${log.journal.trimEnd()}\n\n${block}` : block
      await api.patch(`/logs/${log.id}/`, { journal })
      toast.success('Added to today’s journal', 'Daily log')
    } catch (e) {
      toast.error((e as Error).message, "Couldn't write to the log")
    }
  }

  const working =
    session?.task_title || session?.project_name || session?.label || KIND_LABELS[session?.kind ?? 'focus']

  return (
    <div>
      <PageHeader
        title="Focus"
        subtitle={`${completedToday} of ${target} sessions · ${formatDuration(focusedSecToday)} focused today`}
        icon={<Timer size={20} />}
        action={
          <button className="btn" onClick={() => setSettingsOpen(true)}>
            <Settings2 size={16} /> Settings
          </button>
        }
      />

      <Segmented
        className="mb-4"
        ariaLabel="Focus view"
        value={tab}
        onChange={setTab}
        options={[
          { key: 'timer', label: 'Timer' },
          { key: 'stats', label: 'Stats' },
        ]}
      />

      {tab === 'stats' && <FocusStats />}

      <div className={cn('grid grid-cols-1 gap-4 lg:grid-cols-12', tab !== 'timer' && 'hidden')}>
        {/* The timer is the primary object on this page — the one lifted card. */}
        <section className="card-lift flex flex-col items-center gap-5 p-6 lg:col-span-7">
          <TimerRing
            progress={progress}
            remaining={session ? remaining : (settings?.focus_min ?? 25) * 60}
            caption={session ? working : 'Ready'}
            tone={session ? (isBreak ? 'break' : 'focus') : 'idle'}
            paused={paused}
          />

          {/* Session dots — the day's progress at a glance. */}
          <div className="flex flex-wrap items-center justify-center gap-1.5" aria-label="Sessions completed today">
            {Array.from({ length: Math.max(target, completedToday) }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-2.5 w-2.5 rounded-full transition-colors',
                  i < completedToday ? 'bg-accent2' : 'bg-surface2 ring-1 ring-inset ring-border'
                )}
              />
            ))}
          </div>

          {session ? (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button className="btn-accent" onClick={paused ? resume : pause}>
                {paused ? <Play size={16} /> : <Pause size={16} />}
                {paused ? 'Resume' : 'Pause'}
              </button>
              <button className="btn" onClick={() => void skip()}>
                <SkipForward size={16} /> Skip
              </button>
              <button className="btn-danger" onClick={() => void end(false)}>
                <Square size={16} /> Stop
              </button>
            </div>
          ) : (
            <div className="flex w-full max-w-md flex-col gap-3">
              <div className="flex justify-center gap-0.5 rounded-lg border border-border bg-surface p-0.5">
                {PHASES.map((p) => (
                  <button
                    key={p.kind}
                    onClick={() => setPhase(p.kind)}
                    aria-pressed={phase === p.kind}
                    className={cn(
                      'flex-1 rounded-md px-2.5 py-1 text-base font-medium transition-colors',
                      phase === p.kind
                        ? 'bg-accent1/10 text-accent1'
                        : 'text-muted hover:bg-surface2 hover:text-text'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {phase === 'focus' && (
                <>
                  <div>
                    <label className="field-label" htmlFor="focus-task">
                      What are you working on
                    </label>
                    <select
                      id="focus-task"
                      className="select"
                      value={taskId}
                      onChange={(e) => {
                        setTaskId(e.target.value)
                        if (e.target.value) setLabel('')
                      }}
                    >
                      <option value="">No task</option>
                      {openTasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                          {t.project_name ? ` — ${t.project_name}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!taskId && (
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <select
                        className="select sm:w-1/2"
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        aria-label="Project"
                      >
                        <option value="">No project</option>
                        {projects?.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <input
                        className="input sm:w-1/2"
                        placeholder="Or just name it"
                        aria-label="Session label"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}

              {prayerClash && (
                <div className="rounded-lg bg-accent1/10 px-3 py-2 text-sm text-accent1 ring-1 ring-inset ring-accent1/25">
                  {prayerClash.label} is in {formatCountdown(prayerClash.minutesUntil)} — a full{' '}
                  {focusMin}-minute session would run through the adzan.
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  className="btn-accent flex-1 justify-center"
                  onClick={() => void begin()}
                >
                  <Play size={16} /> Start {KIND_LABELS[phase].toLowerCase()}
                </button>
                {prayerClash && (
                  <button
                    className="btn shrink-0 justify-center"
                    onClick={() => void begin(prayerClash.minutesUntil ?? undefined)}
                  >
                    Fit to {prayerClash.label} ({prayerClash.minutesUntil}m)
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-4 lg:col-span-5">
          <WidgetCard
            title="Today"
            icon={<Timer size={16} />}
            bodyClassName="flex flex-col gap-0.5"
            action={
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted tnum">{formatDuration(focusedSecToday)}</span>
                {focusedSecToday > 0 && (
                  <button
                    onClick={() => void addToLog()}
                    className="icon-btn h-7 w-7"
                    aria-label="Add today’s sessions to the daily log"
                    title="Add to the daily log"
                  >
                    <NotebookPen size={14} />
                  </button>
                )}
              </div>
            }
          >
            {todaySessions.length === 0 ? (
              <EmptyState
                compact
                icon={<Timer size={18} />}
                title="Nothing tracked yet"
                hint="Start a session and it lands here."
              />
            ) : (
              todaySessions.map((s) => {
                const project = projects?.find((p) => p.id === s.project)
                const what = s.task_title || s.project_name || s.label || KIND_LABELS[s.kind]
                return (
                  <div key={s.id} className="row -mx-1 px-2 py-2">
                    <span
                      className={cn(
                        'h-2 w-2 shrink-0 rounded-full',
                        s.kind !== 'focus'
                          ? 'bg-highlight'
                          : s.completed
                            ? 'bg-accent2'
                            : 'bg-muted'
                      )}
                      title={s.completed ? 'Completed' : s.ended_at ? 'Cut short' : 'Running'}
                    />
                    <span className="shrink-0 font-mono text-sm text-muted tnum">
                      {clockOf(s.started_at)}
                    </span>
                    <span
                      className={cn(
                        'min-w-0 flex-1 truncate text-base',
                        s.kind !== 'focus' && 'text-muted'
                      )}
                    >
                      {what}
                    </span>
                    {project && (
                      <span className={cn('chip shrink-0', CATEGORY_STYLES[project.category].chip)}>
                        {project.name}
                      </span>
                    )}
                    <span className="shrink-0 font-mono text-sm text-muted tnum">
                      {formatDuration(s.actual_sec)}
                    </span>
                  </div>
                )
              })
            )}
          </WidgetCard>
        </div>
      </div>

      <FocusSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <Modal
        open={Boolean(stopped)}
        onClose={() => setStopped(null)}
        title="What pulled you away?"
        subtitle="Optional — but the pattern is the useful part."
        footer={
          <>
            <button className="btn" onClick={() => setStopped(null)}>
              Skip
            </button>
            <button className="btn-accent" onClick={() => void saveNote()}>
              Save note
            </button>
          </>
        }
      >
        <textarea
          className="textarea"
          rows={3}
          autoFocus
          placeholder="Slack, a call, ran out of steam…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Modal>
    </div>
  )
}
