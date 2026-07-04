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
        title="Daily Log"
        subtitle="Daily journal & tasks — one note per day"
        icon={<NotebookPen size={20} />}
      />

      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setDate(shiftDate(date, -1))} className="icon-btn" aria-label="Previous day">
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-[230px] text-center">
            <p className="text-sm font-semibold">{formatDateID(`${date}T00:00:00`)}</p>
            {isToday && <p className="text-[11px] text-highlight">Today</p>}
          </div>
          <button
            onClick={() => setDate(shiftDate(date, 1))}
            disabled={isToday}
            className="icon-btn disabled:opacity-30"
            aria-label="Next day"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="input w-auto"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <WidgetCard title="Tasks" bodyClassName="space-y-3">
          <div className="flex gap-2">
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="Add a task…"
              className="input"
            />
            <button onClick={addTask} className="btn-accent shrink-0" aria-label="Add">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-0.5">
            {tasks?.length === 0 && (
              <p className="px-2 py-3 text-sm text-muted">No tasks for this date.</p>
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
              {saved === 'saving' && <span className="text-[11px] text-muted">saving…</span>}
              {saved === 'done' && <span className="text-[11px] text-highlight">saved ✓</span>}
              {isPast && locked && (
                <button onClick={() => setLocked(false)} className="btn text-xs">
                  <Pencil size={12} /> Edit
                </button>
              )}
            </div>
          }
        >
          {locked ? (
            <div className="space-y-2">
              {journal ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-text/90">{journal}</p>
              ) : (
                <p className="text-sm text-muted">No notes for this day.</p>
              )}
              <p className="flex items-center gap-1.5 pt-2 text-[11px] text-muted">
                <Lock size={11} /> Past notes are locked — click Edit to change.
              </p>
            </div>
          ) : (
            <textarea
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              onBlur={saveJournal}
              rows={12}
              placeholder="What did you work on today?"
              className="input resize-none leading-relaxed"
            />
          )}
        </WidgetCard>
      </div>
    </div>
  )
}
