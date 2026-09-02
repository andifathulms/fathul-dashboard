'use client'

import { CheckSquare, Plus } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import PageHeader from '@/components/layout/PageHeader'
import TaskItem from '@/components/tasks/TaskItem'
import WidgetCard from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import Segmented from '@/components/ui/Segmented'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import api from '@/lib/api'
import type { Project, Task, TaskRepeat } from '@/lib/types'
import { REPEAT_LABELS, todayISO } from '@/lib/utils'

type Filter = 'all' | 'open' | 'done'

/** Tasks group by when they're due, not by the order they were typed — that's
 *  the only grouping that tells you what to do next. */
type Bucket = 'overdue' | 'today' | 'upcoming' | 'waiting' | 'someday'

const BUCKET_LABELS: Record<Bucket, string> = {
  overdue: 'Overdue',
  today: 'Today',
  upcoming: 'Upcoming',
  waiting: 'Waiting on someone',
  someday: 'No due date',
}
const BUCKET_ORDER: Bucket[] = ['overdue', 'today', 'upcoming', 'waiting', 'someday']

function bucketOf(task: Task, today: string): Bucket {
  // Blocked beats due: a task you cannot act on is not overdue, it is stuck.
  if (task.is_waiting) return 'waiting'
  if (!task.due_date) return 'someday'
  if (task.due_date < today) return 'overdue'
  if (task.due_date === today) return 'today'
  return 'upcoming'
}

export default function TasksPage() {
  const [filter, setFilter] = useState<Filter>('open')
  const [title, setTitle] = useState('')
  const [project, setProject] = useState<string>('')
  const [due, setDue] = useState('')
  const [estimate, setEstimate] = useState('')
  const [repeat, setRepeat] = useState<TaskRepeat>('')

  const { data: tasks, isLoading, mutate } = useSWR<Task[]>('/tasks/')
  const { data: projects } = useSWR<Project[]>('/projects/')
  const toast = useToast()
  const today = todayISO()

  const add = async () => {
    if (!title.trim()) return
    try {
      await api.post('/tasks/', {
        title: title.trim(),
        project: project ? Number(project) : null,
        due_date: due || null,
        estimate_pomodoros: estimate ? Number(estimate) : null,
        repeat,
      })
      setTitle('')
      setProject('')
      setDue('')
      setEstimate('')
      setRepeat('')
      mutate()
    } catch (e) {
      toast.error((e as Error).message, "Couldn't add the task")
    }
  }

  const all = tasks ?? []
  const doneCount = all.filter((t) => t.is_done).length
  const openCount = all.length - doneCount

  const visible = all.filter((t) =>
    filter === 'all' ? true : filter === 'done' ? t.is_done : !t.is_done
  )

  const openBuckets = BUCKET_ORDER.map((b) => ({
    bucket: b,
    items: visible.filter((t) => !t.is_done && bucketOf(t, today) === b),
  })).filter((g) => g.items.length > 0)

  const doneItems = visible.filter((t) => t.is_done)

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle={`${openCount} open · ${doneCount} done`}
        icon={<CheckSquare size={20} />}
      />

      {/* Capture bar — the primary action on this page, so it leads. */}
      <div className="card-lift mb-5 p-3">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder="What needs doing?"
              aria-label="Task title"
              className="input flex-1"
            />
            <button onClick={add} className="btn-accent shrink-0">
              <Plus size={16} /> Add task
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <select
              className="select"
              value={project}
              onChange={(e) => setProject(e.target.value)}
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
              type="date"
              className="input"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              aria-label="Due date"
            />
            <select
              className="select"
              value={estimate}
              onChange={(e) => setEstimate(e.target.value)}
              aria-label="Pomodoro estimate"
              title="How many pomodoros this should take"
            >
              <option value="">No estimate</option>
              {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                <option key={n} value={n}>
                  {n} pomodoro{n > 1 ? 's' : ''}
                </option>
              ))}
            </select>
            <select
              className="select"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value as TaskRepeat)}
              aria-label="Repeat"
              title="Recreate this task automatically when you tick it off"
            >
              <option value="">Doesn’t repeat</option>
              {Object.entries(REPEAT_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <Segmented
        className="mb-4"
        ariaLabel="Filter tasks"
        value={filter}
        onChange={setFilter}
        options={[
          { key: 'open', label: 'Open', count: openCount },
          { key: 'done', label: 'Done', count: doneCount },
          { key: 'all', label: 'All', count: all.length },
        ]}
      />

      {isLoading && (
        <div className="card p-4">
          <SkeletonRows rows={5} />
        </div>
      )}

      <div className="flex flex-col gap-4">
        {openBuckets.map(({ bucket, items }) => (
          <WidgetCard
            key={bucket}
            title={`${BUCKET_LABELS[bucket]} (${items.length})`}
            bodyClassName="flex flex-col gap-0.5"
            className={
              bucket === 'overdue'
                ? 'border-danger/30'
                : bucket === 'waiting'
                  ? 'border-warning/30'
                  : undefined
            }
          >
            {items.map((t) => (
              <TaskItem key={t.id} task={t} projects={projects} onChange={mutate} showDelete />
            ))}
          </WidgetCard>
        ))}

        {doneItems.length > 0 && (
          <WidgetCard title={`Done (${doneItems.length})`} bodyClassName="flex flex-col gap-0.5">
            {doneItems.map((t) => (
              <TaskItem key={t.id} task={t} projects={projects} onChange={mutate} showDelete />
            ))}
          </WidgetCard>
        )}

        {!isLoading && visible.length === 0 && (
          <div className="card">
            <EmptyState
              icon={<CheckSquare size={22} />}
              title={filter === 'done' ? 'Nothing finished yet' : 'No open tasks'}
              hint={
                filter === 'all'
                  ? 'Add one above — a task without a project is perfectly fine.'
                  : 'Switch the filter to see the rest.'
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}
