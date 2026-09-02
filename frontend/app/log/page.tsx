'use client'

import { NotebookPen, ChevronLeft, ChevronRight, Plus, Lock, Pencil } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'

import PageHeader from '@/components/layout/PageHeader'
import TaskItem from '@/components/tasks/TaskItem'
import WidgetCard from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import api from '@/lib/api'
import type { DailyLog, Project, Task } from '@/lib/types'
import { formatDateID, todayISO, toISODate } from '@/lib/utils'

function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export default function LogPage() {
  const today = todayISO()
  const [date, setDate] = useState(today)
  const isToday = date === today
  const isPast = date < today

  const [journal, setJournal] = useState('')
  const [logId, setLogId] = useState<number | null>(null)
  const [locked, setLocked] = useState(false)
  const [saved, setSaved] = useState<'idle' | 'saving' | 'done'>('idle')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: tasks, mutate: mutateTasks } = useSWR<Task[]>(`/tasks/?agenda=${date}`)
  const { data: projects } = useSWR<Project[]>('/projects/')
  const [newTask, setNewTask] = useState('')
  const toast = useToast()

  // Load the log for the selected date (auto-create only for today).
  useEffect(() => {
    let active = true
    setSaved('idle')
    api
      .get<DailyLog>(`/logs/?date=${date}`)
      .then((res) => {
        if (!active) return
        setJournal(res.data.journal)
        setLogId(res.data.id)
        setLocked(date < today)
      })
      .catch(async () => {
        if (!active) return
        setJournal('')
        setLogId(null)
        if (date === today) {
          const res = await api.post<DailyLog>('/logs/', { date, journal: '' })
          if (active) setLogId(res.data.id)
          setLocked(false)
        } else {
          setLocked(date < today)
        }
      })
    return () => {
      active = false
    }
  }, [date, today])

  const saveJournal = () => {
    if (locked) return
    setSaved('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      let id = logId
      if (!id) {
        const res = await api.post<DailyLog>('/logs/', { date, journal })
        id = res.data.id
        setLogId(id)
      } else {
        await api.put(`/logs/${id}/`, { date, journal })
      }
      setSaved('done')
      setTimeout(() => setSaved('idle'), 1500)
    }, 500)
  }

  const addTask = async () => {
    if (!newTask.trim()) return
    try {
      await api.post('/tasks/', { title: newTask.trim(), due_date: date })
      setNewTask('')
      mutateTasks()
    } catch (e) {
      toast.error((e as Error).message, 'Failed to add task')
    }
  }

  return (
    <div>
      <PageHeader
        title="Daily log"
        subtitle="One note and one task list per day"
        icon={<NotebookPen size={20} />}
        action={
          !isToday && (
            <button onClick={() => setDate(today)} className="btn">
              Back to today
            </button>
          )
        }
      />

      {/* Date shuttle — the page's only navigation, so it reads as one object. */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-2 shadow-card">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDate(shiftDate(date, -1))}
            className="icon-btn"
            aria-label="Previous day"
            title="Previous day"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-[240px] px-2 text-center">
            <p className="font-display text-md font-semibold">
              {formatDateID(`${date}T00:00:00`)}
            </p>
          </div>
          <button
            onClick={() => setDate(shiftDate(date, 1))}
            disabled={isToday}
            className="icon-btn disabled:opacity-30"
            aria-label="Next day"
            title="Next day"
          >
            <ChevronRight size={18} />
          </button>
          {isToday && (
            <span className="chip ml-1 bg-highlight/10 text-highlight ring-1 ring-inset ring-highlight/25">
              Today
            </span>
          )}
        </div>
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="input w-auto"
          aria-label="Jump to date"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <WidgetCard title="Tasks" bodyClassName="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="Add a task…"
              aria-label="New task"
              className="input"
            />
            <button onClick={addTask} className="btn-accent shrink-0" aria-label="Add task" title="Add task">
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-col gap-0.5">
            {tasks?.length === 0 && (
              <p className="rounded-lg border border-dashed border-border px-3 py-5 text-center text-base text-muted">
                Nothing logged for this day.
              </p>
            )}
            {tasks?.map((t) => (
              <TaskItem key={t.id} task={t} projects={projects} onChange={mutateTasks} showDelete />
            ))}
          </div>
        </WidgetCard>

        <WidgetCard
          title="Notes"
          icon={<NotebookPen size={15} />}
          action={
            <div className="flex items-center gap-2">
              {saved === 'saving' && <span className="text-sm text-muted">Saving…</span>}
              {saved === 'done' && <span className="text-sm text-highlight">Saved</span>}
              {isPast && locked && (
                <button onClick={() => setLocked(false)} className="btn btn-sm">
                  <Pencil size={12} /> Edit
                </button>
              )}
            </div>
          }
        >
          {locked ? (
            <div className="flex flex-col gap-3">
              {journal ? (
                <p className="max-w-[68ch] whitespace-pre-wrap text-base leading-[1.7] text-text2">
                  {journal}
                </p>
              ) : (
                <p className="text-base text-muted">Nothing was written this day.</p>
              )}
              <p className="flex items-center gap-1.5 border-t border-border pt-2.5 text-sm text-muted">
                <Lock size={11} /> Past notes are read-only. Choose Edit to change one.
              </p>
            </div>
          ) : (
            <textarea
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              onBlur={saveJournal}
              rows={14}
              placeholder="What did you work on today?"
              aria-label="Notes"
              className="textarea resize-none bg-surface2/40 text-base leading-[1.7]"
            />
          )}
        </WidgetCard>
      </div>
    </div>
  )
}
