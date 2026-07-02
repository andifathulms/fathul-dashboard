'use client'

import { NotebookPen, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'

import WidgetCard from '@/components/ui/Card'
import TaskItem from '@/components/tasks/TaskItem'
import api from '@/lib/api'
import type { DailyLog, Project, Task } from '@/lib/types'
import { formatDateID, todayISO } from '@/lib/utils'

export default function DailyLogWidget() {
  const today = todayISO()
  const { data: tasks, mutate: mutateTasks } = useSWR<Task[]>(`/tasks/?date=${today}`)
  const { data: projects } = useSWR<Project[]>('/projects/')

  const [newTask, setNewTask] = useState('')
  const [journal, setJournal] = useState('')
  const [logId, setLogId] = useState<number | null>(null)
  const [saved, setSaved] = useState<'idle' | 'saving' | 'done'>('idle')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load (or create) today's log once.
  useEffect(() => {
    let active = true
    api
      .get<DailyLog>(`/logs/?date=${today}`)
      .then((res) => {
        if (!active) return
        setJournal(res.data.journal)
        setLogId(res.data.id)
      })
      .catch(async () => {
        const res = await api.post<DailyLog>('/logs/', { date: today, journal: '' })
        if (!active) return
        setLogId(res.data.id)
      })
    return () => {
      active = false
    }
  }, [today])

  const addTask = async () => {
    const title = newTask.trim()
    if (!title) return
    try {
      await api.post('/tasks/', { title, due_date: today })
      setNewTask('')
      mutateTasks()
    } catch (e) {
      alert('Gagal menambah tugas: ' + (e as Error).message)
    }
  }

  const saveJournal = () => {
    if (!logId) return
    setSaved('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await api.put(`/logs/${logId}/`, { date: today, journal })
      setSaved('done')
      setTimeout(() => setSaved('idle'), 1500)
    }, 500)
  }

  return (
    <WidgetCard
      title="Daily Log"
      icon={<NotebookPen size={15} />}
      action={<span className="text-[11px] text-muted">{formatDateID(new Date())}</span>}
      bodyClassName="space-y-4"
      className="h-full"
    >
      {/* Add task */}
      <div className="flex gap-2">
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          placeholder="Tambah tugas hari ini…"
          className="input"
        />
        <button onClick={addTask} className="btn-accent shrink-0" aria-label="Add task">
          <Plus size={16} />
        </button>
      </div>

      {/* Tasks checklist */}
      <div className="space-y-0.5">
        {tasks?.length === 0 && (
          <p className="px-2 py-3 text-sm text-muted">Tidak ada tugas untuk hari ini. ✨</p>
        )}
        {tasks?.map((t) => (
          <TaskItem key={t.id} task={t} projects={projects} onChange={mutateTasks} showDelete />
        ))}
      </div>

      {/* Journal */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="widget-title">Catatan Hari Ini</label>
          {saved === 'saving' && <span className="text-[11px] text-muted">menyimpan…</span>}
          {saved === 'done' && <span className="text-[11px] text-highlight">tersimpan ✓</span>}
        </div>
        <textarea
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
          onBlur={saveJournal}
          rows={6}
          placeholder="Apa yang kamu kerjakan hari ini?"
          className="input resize-none leading-relaxed"
        />
      </div>
    </WidgetCard>
  )
}
