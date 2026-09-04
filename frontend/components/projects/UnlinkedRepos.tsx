'use client'

import { ChevronDown, FolderPlus, Github } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import WidgetCard from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import api from '@/lib/api'
import type { ContribRepo, Project } from '@/lib/types'
import { cn } from '@/lib/utils'

interface UnlinkedResponse {
  ok: boolean
  error?: string
  repos: ContribRepo[]
  total_commits: number
}

/** Repos you commit to that no project claims. Until they are attributed, the
 *  weekly review counts the work but cannot say what it was for. */
export default function UnlinkedRepos({
  projects,
  onLinked,
}: {
  projects?: Project[]
  onLinked: () => void
}) {
  const { data, mutate } = useSWR<UnlinkedResponse>('/github/unlinked/')
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const toast = useToast()

  if (!data?.ok || data.repos.length === 0) return null

  const act = async (repo: string, body: Record<string, unknown>, message: string) => {
    setBusy(repo)
    try {
      await api.post('/github/unlinked/', { repo, ...body })
      toast.success(repo.split('/')[1], message)
      await mutate()
      onLinked()
    } catch (e) {
      toast.error((e as Error).message, "Couldn't link the repo")
    } finally {
      setBusy(null)
    }
  }

  const shown = open ? data.repos : data.repos.slice(0, 5)

  return (
    <WidgetCard
      title={`${data.repos.length} repos no project claims`}
      icon={<Github size={15} />}
      className="mb-4 border-warning/30"
      action={
        <span className="text-sm text-muted tnum">
          {data.total_commits.toLocaleString()} commits this year
        </span>
      }
      bodyClassName="flex flex-col gap-1"
    >
      <p className="pb-1 text-sm text-muted">
        Link one and the weekly review starts attributing its commits to that project.
      </p>

      {shown.map((r) => {
        const short = r.name.split('/')[1]
        return (
          <div key={r.name} className="row -mx-1 flex-wrap gap-y-1 px-2 py-2">
            <a
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 flex-1 truncate text-base hover:text-accent1"
            >
              {short}
            </a>
            <span className="shrink-0 text-sm text-muted tnum">
              {r.commits}
              {r.language && <span className="ml-1.5">· {r.language}</span>}
            </span>

            <select
              className="select h-8 w-full py-0 text-sm sm:w-44"
              defaultValue=""
              disabled={busy === r.name}
              aria-label={`Link ${short} to a project`}
              onChange={(e) => {
                if (e.target.value) void act(r.name, { project: Number(e.target.value) }, 'Linked')
              }}
            >
              <option value="">Link to…</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <button
              className="btn btn-sm shrink-0"
              disabled={busy === r.name}
              onClick={() => void act(r.name, { create: true }, 'Project created')}
              title="Create a project seeded from this repo"
            >
              <FolderPlus size={14} /> New
            </button>
          </div>
        )
      })}

      {data.repos.length > 5 && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="mt-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-sm text-muted transition-colors hover:bg-surface2 hover:text-text"
        >
          <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
          {open ? 'Show fewer' : `Show all ${data.repos.length}`}
        </button>
      )}
    </WidgetCard>
  )
}

