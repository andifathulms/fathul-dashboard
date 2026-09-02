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
      title="Active projects"
      icon={<FolderKanban size={15} />}
      action={
        <Link href="/projects" className="text-sm font-medium text-accent1 hover:underline">
          All projects
        </Link>
      }
      bodyClassName="flex flex-col gap-0.5"
    >
      {isLoading && <SkeletonRows rows={3} />}
      {projects?.length === 0 && (
        <EmptyState
          compact
          icon={<FolderKanban size={18} />}
          title="No active projects"
          hint="Projects you mark active show up here."
        />
      )}
      {sorted?.map((p) => (
        <Link
          key={p.id}
          href={`/projects/${p.id}`}
          className="row group -mx-1 gap-2.5 px-2"
        >
          <PriorityToggle project={p} onChanged={mutate} compact />
          <ProjectAvatar project={p} size={28} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-medium">{p.name}</p>
            <p className="text-sm text-muted tnum">
              {p.tasks_count} tasks · {p.credentials_count} credentials
            </p>
          </div>
          <CategoryBadge category={p.category} />
          <ArrowUpRight size={14} className="shrink-0 text-muted transition-colors group-hover:text-accent1" />
        </Link>
      ))}
    </WidgetCard>
  )
}
