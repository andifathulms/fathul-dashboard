'use client'

import { Play, Timer, Trash2 } from 'lucide-react'

import { useFocus } from '@/components/focus/FocusProvider'
import { useToast } from '@/components/ui/Toast'
import api from '@/lib/api'
import type { Project, Task } from '@/lib/types'
import { CATEGORY_STYLES, cn, formatDateShort } from '@/lib/utils'

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

      <span className={cn('min-w-0 flex-1 text-base', task.is_done && 'text-muted line-through')}>
        {task.title}
      </span>

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

      {showFocus && !task.is_done && session?.task !== task.id && (
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
    </div>
  )
}
