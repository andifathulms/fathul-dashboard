'use client'

import { FolderKanban, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'

import WidgetCard from '@/components/ui/Card'
import { CategoryBadge } from '@/components/ui/Badge'
import type { Project } from '@/lib/types'

export default function ProjectsWidget() {
  const { data: projects, isLoading } = useSWR<Project[]>('/projects/?status=active')

  return (
    <WidgetCard
      title="Projects Aktif"
      icon={<FolderKanban size={15} />}
      action={
        <Link href="/projects" className="text-xs text-accent1 hover:underline">
          Semua
        </Link>
      }
      bodyClassName="space-y-2"
    >
      {isLoading && <p className="text-sm text-muted">Memuat…</p>}
      {projects?.length === 0 && (
        <p className="text-sm text-muted">Belum ada project aktif.</p>
      )}
      {projects?.slice(0, 5).map((p) => (
        <Link
          key={p.id}
          href={`/projects/${p.id}`}
          className="group flex items-center justify-between rounded-lg border border-border bg-bg px-3 py-2.5 transition-colors hover:border-accent1/40"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{p.name}</p>
            <p className="mt-0.5 text-[11px] text-muted">
              {p.tasks_count} tugas · {p.credentials_count} kredensial
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CategoryBadge category={p.category} />
            <ArrowUpRight size={14} className="text-muted group-hover:text-accent1" />
          </div>
        </Link>
      ))}
    </WidgetCard>
  )
}
