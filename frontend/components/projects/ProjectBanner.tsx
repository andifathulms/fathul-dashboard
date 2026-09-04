import { ArrowUpRight } from 'lucide-react'

import ProjectAvatar from '@/components/projects/ProjectAvatar'
import type { Project } from '@/lib/types'
import { CATEGORY_LABELS, CATEGORY_STYLES, cn } from '@/lib/utils'

/** The band across the top of a project card.
 *
 *  A project with a lockup shows it. One without gets a banner built from what
 *  it does have — icon, name, category — rather than nothing, so every card is
 *  the same shape and a missing brand asset never reads as a broken image. */
export default function ProjectBanner({ project }: { project: Project }) {
  const arrow = (
    <ArrowUpRight
      size={16}
      className="absolute right-3 top-3 rounded bg-surface/80 p-px text-muted backdrop-blur transition-colors group-hover:text-accent1"
    />
  )

  if (project.lockup_horizontal_url) {
    return (
      <div className="relative -mx-4 -mt-4 mb-3 h-24 overflow-hidden border-b border-border bg-surface2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.lockup_horizontal_url}
          alt={project.name}
          className="h-full w-full object-cover"
        />
        {arrow}
      </div>
    )
  }

  // Mirrors the rhythm of the real lockups — name, then a small caption — so
  // the two kinds of card sit in the same grid without one looking unfinished.
  return (
    <div
      className={cn(
        'relative -mx-4 -mt-4 mb-3 flex h-24 items-center gap-3 overflow-hidden border-b border-border px-4',
        CATEGORY_STYLES[project.category].banner
      )}
    >
      <ProjectAvatar project={project} size={44} className="rounded-xl" />
      <div className="min-w-0">
        <p className="truncate font-display text-md font-semibold leading-tight">{project.name}</p>
        <p className="truncate text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          {CATEGORY_LABELS[project.category]}
        </p>
      </div>
      {arrow}
    </div>
  )
}
