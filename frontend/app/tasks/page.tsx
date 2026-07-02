'use client'

import { CheckSquare, Plus } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import PageHeader from '@/components/layout/PageHeader'
import TaskItem from '@/components/tasks/TaskItem'
import WidgetCard from '@/components/ui/Card'
import api from '@/lib/api'
import type { Project, Task } from '@/lib/types'
import { cn, todayISO } from '@/lib/utils'

type Filter = 'all' | 'open' | 'done'
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'open', label: 'Belum selesai' },
  { key: 'done', label: 'Selesai' },
]

export default function TasksPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [title, setTitle] = useState('')
  const [project, setProject] = useState<string>('')
  const [due, setDue] = useState('')

  const { data: tasks, mutate } = useSWR<Task[]>('/tasks/')
  const { data: projects } = useSWR<Project[]>('/projects/')

  const add = async () => {
    if (!title.trim()) return
    try {
      await api.post('/tasks/', {
        title: title.trim(),
        project: project ? Number(project) : null,
        due_date: due || null,
      })
      setTitle('')
      setProject('')
      setDue('')
      mutate()
    } catch (e) {
      alert('Gagal menambah tugas: ' + (e as Error).message)
    }
  }

  const visible = tasks?.filter((t) =>
    filter === 'all' ? true : filter === 'done' ? t.is_done : !t.is_done
  )
  const open = visible?.filter((t) => !t.is_done) ?? []
  const done = visible?.filter((t) => t.is_done) ?? []
  const doneCount = tasks?.filter((t) => t.is_done).length ?? 0

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle={`${(tasks?.length ?? 0) - doneCount} terbuka · ${doneCount} selesai`}
        icon={<CheckSquare size={20} />}
      />

      <WidgetCard className="mb-5" bodyClassName="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Tugas baru… (mis. ingat bayar utang nasi goreng)"
            className="input flex-1"
          />
          <select className="input sm:w-44" value={project} onChange={(e) => setProject(e.target.value)}>
            <option value="">Tanpa project</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="input sm:w-40"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            min={undefined}
            placeholder={todayISO()}
          />
          <button onClick={add} className="btn-accent shrink-0">
            <Plus size={16} /> Tambah
          </button>
        </div>
      </WidgetCard>

      <div className="mb-4 flex gap-1 rounded-lg bg-surface p-1 w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              filter === f.key ? 'bg-accent1/15 text-accent1' : 'text-muted hover:text-text'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {open.length > 0 && (
          <WidgetCard title={`Belum selesai (${open.length})`} bodyClassName="space-y-0.5">
            {open.map((t) => (
              <TaskItem key={t.id} task={t} projects={projects} onChange={mutate} showDelete />
            ))}
          </WidgetCard>
        )}

        {done.length > 0 && (
          <WidgetCard title={`Selesai (${done.length})`} bodyClassName="space-y-0.5">
            {done.map((t) => (
              <TaskItem key={t.id} task={t} projects={projects} onChange={mutate} showDelete />
            ))}
          </WidgetCard>
        )}

        {visible?.length === 0 && (
          <div className="card flex flex-col items-center gap-2 py-16 text-center">
            <CheckSquare size={28} className="text-muted" />
            <p className="text-sm text-muted">Tidak ada tugas di filter ini.</p>
          </div>
        )}
      </div>
    </div>
  )
}
