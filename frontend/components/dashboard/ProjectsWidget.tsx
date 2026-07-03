'use client'

import { FolderKanban, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'

import WidgetCard from '@/components/ui/Card'
import { CategoryBadge } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonRows } from '@/components/ui/Skeleton'
import type { Project } from '@/lib/types'
import { CATEGORY_STYLES, cn } from '@/lib/utils'

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
      {isLoading && <SkeletonRows rows={3} />}
      {projects?.length === 0 && (
        <EmptyState compact icon={<FolderKanban size={18} />} title="Belum ada project aktif" />
      )}
      {projects?.slice(0, 5).map((p) => (
        <Link
          key={p.id}
          href={`/projects/${p.id}`}
          className="group relative flex items-center justify-between overflow-hidden rounded-lg border border-border bg-bg px-3 py-2.5 pl-4 transition-all hover:border-accent1/40 hover:bg-surface2/50"
        >
          <span className={cn('absolute inset-y-0 left-0 w-[3px]', CATEGORY_STYLES[p.category].bar)} />
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
