'use client'

import { Trash2 } from 'lucide-react'

import { CategoryBadge } from '@/components/ui/Badge'
import api from '@/lib/api'
import type { Project, Task } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TaskItemProps {
  task: Task
  projects?: Project[]
  onChange: () => void
  showDelete?: boolean
}

export default function TaskItem({ task, projects, onChange, showDelete = false }: TaskItemProps) {
  const project = projects?.find((p) => p.id === task.project)

  const toggle = async () => {
    await api.patch(`/tasks/${task.id}/`, { is_done: !task.is_done })
    onChange()
  }

  const remove = async () => {
    await api.delete(`/tasks/${task.id}/`)
    onChange()
  }

  return (
    <div className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-bg">
      <button
        type="button"
        onClick={toggle}
        aria-label={task.is_done ? 'Mark not done' : 'Mark done'}
        className={cn(
          'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors',
          task.is_done ? 'border-highlight bg-highlight text-bg' : 'border-muted hover:border-accent1'
        )}
      >
        {task.is_done && (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.5L4.8 9L9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <span className={cn('flex-1 text-sm', task.is_done && 'text-muted line-through')}>
        {task.title}
      </span>

      {task.due_date && (
        <span className="font-mono text-[11px] text-muted">{task.due_date}</span>
      )}
      {project && <CategoryBadge category={project.category} />}

      {showDelete && (
        <button
          type="button"
          onClick={remove}
          aria-label="Delete task"
          className="icon-btn h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}
