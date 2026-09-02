'use client'

import { PauseCircle, Play, Repeat, Timer, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { useFocus } from '@/components/focus/FocusProvider'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import api from '@/lib/api'
import type { Project, Task } from '@/lib/types'
import { CATEGORY_STYLES, cn, daysSince, formatDateShort, repeatLabel } from '@/lib/utils'

interface TaskItemProps {
  task: Task
  projects?: Project[]
  onChange: () => void
  showDelete?: boolean
  /** Hide the focus controls where the row is purely a reference (rare). */
  showFocus?: boolean
}

// Cycling beats a form for a number this small: tap the chip until it reads
// what you think the task will take, tap past 8 to clear it.
const ESTIMATE_CYCLE = [1, 2, 3, 4, 5, 6, 8, null]

export default function TaskItem({
  task,
  projects,
  onChange,
  showDelete = false,
  showFocus = true,
}: TaskItemProps) {
  const project = projects?.find((p) => p.id === task.project)
  const toast = useToast()
  const { start, session } = useFocus()
  const [waitingOpen, setWaitingOpen] = useState(false)
  const [waitingOn, setWaitingOn] = useState('')

  const toggle = async () => {
    try {
      await api.patch(`/tasks/${task.id}/`, { is_done: !task.is_done })
      onChange()
    } catch (e) {
      toast.error((e as Error).message, 'Failed to update task')
    }
  }

  const focusOn = async () => {
    try {
      await start({ kind: 'focus', task: task.id })
      toast.success(task.title, 'Focus started')
    } catch (e) {
      toast.error((e as Error).message, "Couldn't start the timer")
    }
  }

  const cycleEstimate = async () => {
    const i = ESTIMATE_CYCLE.indexOf(task.estimate_pomodoros)
    const next = ESTIMATE_CYCLE[(i + 1) % ESTIMATE_CYCLE.length]
    try {
      await api.patch(`/tasks/${task.id}/`, { estimate_pomodoros: next })
      onChange()
    } catch (e) {
      toast.error((e as Error).message, "Couldn't set the estimate")
    }
  }

  // Turning waiting ON asks what you are waiting for; turning it off is one
  // click, because by then you already know.
  const setWaiting = async (on: boolean, who = '') => {
    try {
      await api.patch(`/tasks/${task.id}/`, { is_waiting: on, waiting_on: on ? who : '' })
      setWaitingOpen(false)
      setWaitingOn('')
      onChange()
    } catch (e) {
      toast.error((e as Error).message, "Couldn't update the task")
    }
  }

  const remove = async () => {
    try {
      await api.delete(`/tasks/${task.id}/`)
      onChange()
    } catch (e) {
      toast.error((e as Error).message, 'Failed to delete task')
    }
  }

  return (
    <div className="row group -mx-1 px-2 py-2">
      <button
        type="button"
        onClick={toggle}
        aria-label={task.is_done ? 'Mark not done' : 'Mark done'}
        className={cn(
          'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors',
          task.is_done
            ? 'border-highlight bg-highlight text-onAccent'
            : 'border-borderStrong hover:border-accent1'
        )}
      >
        {task.is_done && (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.5L4.8 9L9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <span className={cn('flex min-w-0 flex-1 items-center gap-1.5 text-base', task.is_done && 'text-muted line-through')}>
        <span className="truncate">{task.title}</span>
        {task.repeat && (
          <Repeat
            size={12}
            className="shrink-0 text-muted"
            aria-label={repeatLabel(task.repeat, task.repeat_interval)}
          />
        )}
      </span>

      {task.is_waiting && !task.is_done && (
        <span
          className="chip shrink-0 gap-1 bg-warning/10 text-warning ring-1 ring-inset ring-warning/25"
          title={
            task.waiting_since
              ? `Waiting ${daysSince(task.waiting_since)} days`
              : 'Waiting on someone else'
          }
        >
          <PauseCircle size={11} />
          {task.waiting_on || 'Waiting'}
          {task.waiting_since && (
            <span className="tnum opacity-70">· {daysSince(task.waiting_since)}d</span>
          )}
        </span>
      )}

      {/* Pomodoro progress. Present once there is an estimate or any time
          logged — an untouched task stays as quiet as it was before. */}
      {(task.estimate_pomodoros != null || task.pomodoros_done > 0) && !task.is_done && (
        <button
          type="button"
          onClick={cycleEstimate}
          title="Pomodoro estimate — click to change"
          className={cn(
            'chip shrink-0 gap-1 tnum transition-colors',
            task.estimate_pomodoros != null && task.pomodoros_done >= task.estimate_pomodoros
              ? 'bg-highlight/10 text-highlight ring-1 ring-inset ring-highlight/25'
              : 'bg-accent2/10 text-accent2 ring-1 ring-inset ring-accent2/25'
          )}
        >
          <Timer size={11} />
          {task.pomodoros_done}
          {task.estimate_pomodoros != null && `/${task.estimate_pomodoros}`}
        </button>
      )}

      {task.due_date && (
        <span className="shrink-0 text-sm text-muted tnum">{formatDateShort(task.due_date)}</span>
      )}
      {/* Project name chip — colored by category when the project is known. */}
      {task.project_name && (
        <span
          className={cn(
            'chip shrink-0',
            project
              ? CATEGORY_STYLES[project.category].chip
              : 'bg-accent1/10 text-accent1 ring-1 ring-inset ring-accent1/25'
          )}
        >
          {task.project_name}
        </span>
      )}

      {!task.is_done && (
        <button
          type="button"
          onClick={() => (task.is_waiting ? setWaiting(false) : setWaitingOpen(true))}
          aria-label={task.is_waiting ? 'No longer waiting' : 'Mark as waiting on someone'}
          title={task.is_waiting ? 'No longer waiting' : 'Waiting on someone else'}
          className={cn(
            'icon-btn h-7 w-7 shrink-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100',
            task.is_waiting ? 'text-warning opacity-100' : 'opacity-0 hover:text-warning'
          )}
        >
          <PauseCircle size={14} />
        </button>
      )}

      {showFocus && !task.is_done && !task.is_waiting && session?.task !== task.id && (
        <button
          type="button"
          onClick={focusOn}
          aria-label={`Focus on ${task.title}`}
          title="Start a focus session on this task"
          className="icon-btn h-7 w-7 shrink-0 opacity-0 transition-opacity hover:text-accent2 focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Play size={14} />
        </button>
      )}

      {showDelete && (
        <button
          type="button"
          onClick={remove}
          aria-label="Delete task"
          title="Delete task"
          className="icon-btn h-7 w-7 shrink-0 opacity-0 transition-opacity hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Trash2 size={14} />
        </button>
      )}

      <Modal
        open={waitingOpen}
        onClose={() => setWaitingOpen(false)}
        title="Waiting on what?"
        subtitle="It drops out of your daily agenda until you unblock it."
        footer={
          <>
            <button className="btn" onClick={() => void setWaiting(true)}>
              Just mark it waiting
            </button>
            <button className="btn-accent" onClick={() => void setWaiting(true, waitingOn.trim())}>
              Save
            </button>
          </>
        }
      >
        <input
          className="input"
          autoFocus
          placeholder="Client reply, Pak Budi, invoice approval…"
          value={waitingOn}
          onChange={(e) => setWaitingOn(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setWaiting(true, waitingOn.trim())}
        />
      </Modal>
    </div>
  )
}
