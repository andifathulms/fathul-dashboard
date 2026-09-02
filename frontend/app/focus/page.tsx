'use client'

import { Pause, Play, Settings2, SkipForward, Square, Timer } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import FocusSettingsModal from '@/components/focus/FocusSettingsModal'
import { useFocus } from '@/components/focus/FocusProvider'
import TimerRing from '@/components/focus/TimerRing'
import PageHeader from '@/components/layout/PageHeader'
import WidgetCard from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { KIND_LABELS, formatDuration } from '@/lib/focus'
import type { FocusKind, Project, Task } from '@/lib/types'
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
  const toast = useToast()

  const openTasks = (tasks ?? []).filter((t) => !t.is_done)
  const target = settings?.daily_target_sessions ?? 8
  const total = session ? session.planned_min * 60 : 0
  const progress = total > 0 ? elapsed / total : 0
  const isBreak = session ? session.kind !== 'focus' : false

  const begin = async () => {
    try {
      await start({
        kind: phase,
        task: taskId ? Number(taskId) : null,
        project: projectId ? Number(projectId) : null,
        label: label.trim(),
      })
    } catch (e) {
      toast.error((e as Error).message, "Couldn't start the timer")
    }
  }

  const end = async (completed: boolean) => {
    try {
      await stop({ completed, interruptedBy: completed ? '' : 'manual' })
    } catch (e) {
      toast.error((e as Error).message, "Couldn't stop the timer")
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
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

              <button className="btn-accent w-full justify-center" onClick={() => void begin()}>
                <Play size={16} /> Start {KIND_LABELS[phase].toLowerCase()}
              </button>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-4 lg:col-span-5">
          <WidgetCard
            title="Today"
            icon={<Timer size={16} />}
            bodyClassName="flex flex-col gap-0.5"
            action={
              <span className="text-sm text-muted tnum">
                {formatDuration(focusedSecToday)}
              </span>
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
    </div>
  )
}
