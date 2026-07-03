import type { Project } from '@/lib/types'
import { CATEGORY_STYLES, cn } from '@/lib/utils'

/** A project's icon: its logo image if set, else a category-colored initial. */
export default function ProjectAvatar({
  project,
  size = 32,
  className,
}: {
  project: Pick<Project, 'name' | 'icon_url' | 'category'>
  size?: number
  className?: string
}) {
  if (project.icon_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={project.icon_url}
        alt=""
        style={{ width: size, height: size }}
        className={cn('shrink-0 rounded-lg object-cover ring-1 ring-inset ring-white/5', className)}
      />
    )
  }
  const s = CATEGORY_STYLES[project.category]
  return (
    <span
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      className={cn('flex shrink-0 items-center justify-center rounded-lg font-semibold uppercase', s.chip, className)}
    >
      {project.name.charAt(0)}
    </span>
  )
}
