'use client'

import { FolderKanban, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'

import PriorityToggle from '@/components/projects/PriorityToggle'
import ProjectAvatar from '@/components/projects/ProjectAvatar'
import WidgetCard from '@/components/ui/Card'
import { CategoryBadge } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonRows } from '@/components/ui/Skeleton'
import type { Project } from '@/lib/types'
import { PRIORITY_STYLES, STATUS_RANK, cn } from '@/lib/utils'

export default function ProjectsWidget() {
  const { data: projects, isLoading, mutate } = useSWR<Project[]>('/projects/?status=active')

  // Priority first, then status — same order as the Projects page default.
  const sorted = projects
    ?.slice()
    .sort(
      (a, b) =>
        PRIORITY_STYLES[a.priority].rank - PRIORITY_STYLES[b.priority].rank ||
        STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
        a.name.localeCompare(b.name)
    )
    .slice(0, 6)

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
      {isLoading && <SkeletonRows rows={3} />}
      {projects?.length === 0 && (
        <EmptyState compact icon={<FolderKanban size={18} />} title="Belum ada project aktif" />
      )}
      {sorted?.map((p) => (
        <Link
          key={p.id}
          href={`/projects/${p.id}`}
          className="group relative flex items-center gap-2 overflow-hidden rounded-lg border border-border bg-bg py-2.5 pl-4 pr-3 transition-all hover:border-accent1/40 hover:bg-surface2/50"
        >
          <span className={cn('absolute inset-y-0 left-0 w-[3px]', PRIORITY_STYLES[p.priority].dot)} />
          <PriorityToggle project={p} onChanged={mutate} compact />
          <ProjectAvatar project={p} size={30} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{p.name}</p>
            <p className="mt-0.5 text-[11px] text-muted">
              {p.tasks_count} tugas · {p.credentials_count} kredensial
            </p>
          </div>
          <CategoryBadge category={p.category} />
          <ArrowUpRight size={14} className="shrink-0 text-muted transition-colors group-hover:text-accent1" />
        </Link>
      ))}
    </WidgetCard>
  )
}
