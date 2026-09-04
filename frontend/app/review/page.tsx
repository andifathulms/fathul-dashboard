'use client'

import {
  CalendarRange,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Github,
  NotebookPen,
  PauseCircle,
  Timer,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'

import PageHeader from '@/components/layout/PageHeader'
import WidgetCard from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import api from '@/lib/api'
import { formatDuration } from '@/lib/focus'
import type { ReviewSummary, Task, WeeklyReview } from '@/lib/types'
import {
  CATEGORY_STYLES,
  cn,
  daysSince,
  formatDateShort,
  toISODate,
  todayISO,
} from '@/lib/utils'

const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function shiftWeeks(iso: string, weeks: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + weeks * 7)
  return toISODate(d)
}

/** "1 – 7 Sep" — the week in the fewest characters that still read. */
function rangeLabel(start: string, end: string): string {
  return `${formatDateShort(start).replace(/^\w+, /, '')} – ${formatDateShort(end).replace(/^\w+, /, '')}`
}

function TaskLine({ task, meta }: { task: Task; meta?: React.ReactNode }) {
  return (
    <div className="row -mx-1 px-2 py-1.5">
      <span className="min-w-0 flex-1 truncate text-base">{task.title}</span>
      {task.project_name && <span className="chip shrink-0 bg-surface2 text-muted">{task.project_name}</span>}
      {meta}
    </div>
  )
}

export default function ReviewPage() {
  // The anchor is any date inside the week; the backend snaps it to Monday.
  const [anchor, setAnchor] = useState(todayISO())
  const { data, isLoading } = useSWR<ReviewSummary>(`/reviews/summary/?week=${anchor}`)
  const { data: review, mutate: mutateReview } = useSWR<WeeklyReview>(`/reviews/?week=${anchor}`)

  const [reflection, setReflection] = useState('')
  const dirty = useRef(false)
  const toast = useToast()

  useEffect(() => {
    setReflection(review?.reflection ?? '')
    dirty.current = false
  }, [review?.id, review?.reflection])

  const saveReflection = async () => {
    if (!review || !dirty.current) return
    try {
      await api.patch(`/reviews/${review.id}/`, { reflection })
      dirty.current = false
      void mutateReview()
      toast.success('Reflection saved', 'Weekly review')
    } catch (e) {
      toast.error((e as Error).message, "Couldn't save your reflection")
    }
  }

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="Weekly review" icon={<CalendarRange size={20} />} />
        <div className="card p-4">
          <SkeletonRows rows={6} />
        </div>
      </div>
    )
  }

  const maxSec = Math.max(1, ...data.by_day.map((d) => d.sec))
  const maxCommits = Math.max(1, ...data.by_day.map((d) => d.commits))
  // A week can be spent entirely in git. When no focus was tracked, the bars
  // would all be stubs, so they measure commits instead — and the card says so.
  const barsShowCommits = data.focus.total_sec === 0 && data.code?.ok && data.code.total > 0
  const unlinkedRepos = data.code?.ok ? data.code.repos.filter((r) => r.project === null) : []
  const unlinkedCommits = unlinkedRepos.reduce((sum, r) => sum + r.commits, 0)
  const maxWork = Math.max(
    1,
    unlinkedCommits,
    ...data.focus.by_project.map((x) => (barsShowCommits ? (x.commits ?? 0) : x.sec))
  )
  const daysWorked = data.by_day.filter(
    (d) => d.sec > 0 || d.tasks_done > 0 || d.commits > 0
  ).length
  const elapsed = data.days_elapsed
  // Commits count as a week having happened. Without this a week of 251
  // commits and no ticked tasks still reported "nothing recorded".
  const quiet =
    data.tasks.completed_count === 0 &&
    data.focus.total_sec === 0 &&
    data.logs.length === 0 &&
    !(data.code?.ok && data.code.total > 0)

  return (
    <div>
      <PageHeader
        title="Weekly review"
        subtitle={`${rangeLabel(data.start, data.end)}${data.is_current_week ? ' · this week, so far' : ''}`}
        icon={<CalendarRange size={20} />}
        action={
          <div className="flex items-center gap-1">
            <button
              className="icon-btn"
              onClick={() => setAnchor(shiftWeeks(anchor, -1))}
              aria-label="Previous week"
              title="Previous week"
            >
              <ChevronLeft size={16} />
            </button>
            {!data.is_current_week && (
              <button className="btn btn-sm" onClick={() => setAnchor(todayISO())}>
                This week
              </button>
            )}
            <button
              className="icon-btn"
              onClick={() => setAnchor(shiftWeeks(anchor, 1))}
              aria-label="Next week"
              title="Next week"
              disabled={data.is_current_week}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        }
      />

      {quiet ? (
        <div className="card">
          <EmptyState
            icon={<CalendarRange size={22} />}
            title="Nothing recorded this week"
            hint="Finish a task, run the timer, or write in the daily log and it shows up here."
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Tile
              icon={<CheckSquare size={14} />}
              label="Finished"
              value={String(data.tasks.completed_count)}
              hint={`${data.tasks.created_count} added`}
            />
            <Tile
              icon={<Timer size={14} />}
              label="Focused"
              value={formatDuration(data.focus.total_sec)}
              hint={`${data.focus.sessions} sessions`}
            />
            <Tile
              icon={<CalendarRange size={14} />}
              label="Days worked"
              value={`${daysWorked}/${elapsed}`}
              hint={
                daysWorked >= elapsed
                  ? 'every day so far'
                  : `${elapsed - daysWorked} quiet ${elapsed - daysWorked > 1 ? 'days' : 'day'}`
              }
            />
            <Tile
              icon={<Github size={14} />}
              label="Commits"
              value={data.code?.ok ? data.code.total.toLocaleString() : '—'}
              hint={
                data.code?.ok
                  ? `${data.code.repos.length} repos`
                  : (data.code?.error ?? 'GitHub unavailable')
              }
            />
          </div>

          {/* One axis: bars are focus time, the number underneath is tasks. */}
          <WidgetCard
            title="The week, day by day"
            icon={<CalendarRange size={16} />}
            action={
              <span className="text-sm text-muted">
                bars are {barsShowCommits ? 'commits' : 'focus time'}
              </span>
            }
          >
            <div className="flex h-36 items-stretch gap-2">
              {data.by_day.map((d) => {
                const date = new Date(`${d.date}T00:00:00`)
                return (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
                    <div
                      className="flex w-full flex-1 items-end justify-center"
                      title={`${formatDateShort(d.date)} — ${formatDuration(d.sec)}, ${d.tasks_done} tasks, ${d.commits} commits`}
                    >
                      <div
                        className={cn(
                          'w-full max-w-[40px] rounded-t-[4px]',
                          (barsShowCommits ? d.commits : d.sec) > 0 ? 'bg-accent2' : 'bg-surface2'
                        )}
                        style={{
                          height: `${Math.max(
                            (barsShowCommits ? d.commits : d.sec) > 0 ? 4 : 2,
                            barsShowCommits
                              ? (d.commits / maxCommits) * 100
                              : (d.sec / maxSec) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted">
                      {WEEKDAY_INITIALS[date.getDay()]}
                    </span>
                    <span className="flex items-baseline gap-1.5 text-xs tnum">
                      <span className={d.tasks_done ? 'text-highlight' : 'text-muted/40'}>
                        {d.tasks_done ? `${d.tasks_done}✓` : '–'}
                      </span>
                      {d.commits > 0 && <span className="text-accent1">{d.commits}c</span>}
                    </span>
                  </div>
                )
              })}
            </div>
          </WidgetCard>

          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            <WidgetCard
              title={`Finished (${data.tasks.completed_count})`}
              icon={<CheckSquare size={16} />}
              bodyClassName="flex flex-col gap-0.5"
            >
              {data.tasks.completed.length === 0 ? (
                <EmptyState compact title="Nothing ticked off" hint="A quiet week, or a week of one big thing." />
              ) : (
                data.tasks.completed.map((t) => (
                  <TaskLine
                    key={t.id}
                    task={t}
                    meta={
                      t.completed_at && (
                        <span className="shrink-0 text-sm text-muted tnum">
                          {WEEKDAY_INITIALS[new Date(t.completed_at).getDay()]}
                        </span>
                      )
                    }
                  />
                ))
              )}
            </WidgetCard>

            <WidgetCard
              title={barsShowCommits ? 'Where the work went' : 'Where the time went'}
              icon={<Timer size={16} />}
            >
              {data.focus.by_project.length === 0 && unlinkedCommits === 0 ? (
                <EmptyState compact title="No focus tracked" hint="Run the timer and this fills in." />
              ) : (
                <div className="flex flex-col gap-3">
                  {data.focus.by_project.map((p) => (
                    <div key={p.project ?? 'none'} className="flex flex-col gap-1">
                      <div className="flex items-baseline justify-between gap-2 text-base">
                        <span className="min-w-0 truncate">{p.name}</span>
                        <span className="shrink-0 text-muted tnum">
                          {p.sec > 0 && formatDuration(p.sec)}
                          {p.tasks_done > 0 && (
                            <span className="ml-1.5 text-sm text-highlight">· {p.tasks_done}✓</span>
                          )}
                          {(p.commits ?? 0) > 0 && (
                            <span className="ml-1.5 text-sm text-accent1">
                              · {p.commits} commit{p.commits === 1 ? '' : 's'}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            p.category ? CATEGORY_STYLES[p.category].bar : 'bg-muted'
                          )}
                          style={{
                            width: `${Math.max(
                              2,
                              ((barsShowCommits ? (p.commits ?? 0) : p.sec) / maxWork) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  {unlinkedCommits > 0 && (
                    <div className="flex flex-col gap-1 border-t border-border pt-3">
                      <div className="flex items-baseline justify-between gap-2 text-base">
                        <Link
                          href="/projects"
                          className="min-w-0 truncate text-muted hover:text-accent1"
                          title="Link them to a project"
                        >
                          {unlinkedRepos.length} repo{unlinkedRepos.length === 1 ? '' : 's'} no
                          project claims
                        </Link>
                        <span className="shrink-0 text-muted tnum">
                          {unlinkedCommits} commit{unlinkedCommits === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
                        <div
                          className="h-full rounded-full bg-muted"
                          style={{ width: `${Math.max(2, (unlinkedCommits / maxWork) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </WidgetCard>
          </div>

          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
            <WidgetCard
              title={`Didn’t happen (${data.tasks.carried_over.length})`}
              icon={<Clock size={16} />}
              bodyClassName="flex flex-col gap-0.5"
              className={data.tasks.carried_over.length > 0 ? 'border-danger/25' : undefined}
            >
              {data.tasks.carried_over.length === 0 ? (
                <EmptyState compact title="Nothing slipped" hint="Everything due got done." />
              ) : (
                data.tasks.carried_over.map((t) => (
                  <TaskLine
                    key={t.id}
                    task={t}
                    meta={
                      t.due_date && (
                        <span className="shrink-0 text-sm text-danger tnum">
                          {formatDateShort(t.due_date)}
                        </span>
                      )
                    }
                  />
                ))
              )}
            </WidgetCard>

            <WidgetCard
              title={`Waiting (${data.tasks.waiting.length})`}
              icon={<PauseCircle size={16} />}
              bodyClassName="flex flex-col gap-0.5"
            >
              {data.tasks.waiting.length === 0 ? (
                <EmptyState compact title="Nothing blocked" hint="Nobody owes you anything." />
              ) : (
                data.tasks.waiting.map((t) => (
                  <TaskLine
                    key={t.id}
                    task={t}
                    meta={
                      <span className="shrink-0 text-sm text-warning tnum">
                        {t.waiting_on || 'blocked'}
                        {t.waiting_since && ` · ${daysSince(t.waiting_since)}d`}
                      </span>
                    }
                  />
                ))
              )}
            </WidgetCard>

            <WidgetCard
              title={`Sitting a while (${data.tasks.stale.length})`}
              icon={<Clock size={16} />}
              bodyClassName="flex flex-col gap-0.5"
            >
              {data.tasks.stale.length === 0 ? (
                <EmptyState compact title="No stale tasks" hint="Nothing has been open for three weeks." />
              ) : (
                data.tasks.stale.map((t) => (
                  <TaskLine
                    key={t.id}
                    task={t}
                    meta={
                      <span className="shrink-0 text-sm text-muted tnum">
                        {daysSince(t.created_at.slice(0, 10))}d
                      </span>
                    }
                  />
                ))
              )}
            </WidgetCard>
          </div>

          {data.code?.ok && data.code.repos.length > 0 && (
            <WidgetCard
              title={`What you shipped (${data.code.total.toLocaleString()} commits)`}
              icon={<Github size={16} />}
              action={
                <Link href="/code" className="text-sm text-accent1 hover:underline">
                  All activity
                </Link>
              }
            >
              <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                {data.code.repos.slice(0, 12).map((r) => (
                  <div key={r.repo} className="flex items-baseline justify-between gap-2 text-base">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 truncate hover:text-accent1"
                    >
                      {r.repo.split('/')[1]}
                    </a>
                    <span className="flex shrink-0 items-baseline gap-1.5 text-muted tnum">
                      {r.project === null && (
                        <span className="text-xs text-muted/70">unlinked</span>
                      )}
                      {r.commits}
                    </span>
                  </div>
                ))}
              </div>
              {data.code.repos.length > 12 && (
                <p className="mt-2 text-sm text-muted">
                  and {data.code.repos.length - 12} more repos.
                </p>
              )}
            </WidgetCard>
          )}

          {data.logs.length > 0 && (
            <WidgetCard title="Your week in words" icon={<NotebookPen size={16} />}>
              <div className="flex flex-col gap-4">
                {data.logs.map((log) => (
                  <div key={log.id} className="flex flex-col gap-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                      {formatDateShort(log.date)}
                    </p>
                    <p className="whitespace-pre-wrap text-base text-text2">{log.journal}</p>
                  </div>
                ))}
              </div>
            </WidgetCard>
          )}

          <WidgetCard title="What do you make of it?" icon={<NotebookPen size={16} />}>
            <textarea
              className="textarea"
              rows={5}
              placeholder="What worked, what didn't, what you're changing next week…"
              value={reflection}
              onChange={(e) => {
                setReflection(e.target.value)
                dirty.current = true
              }}
              onBlur={saveReflection}
            />
            <p className="mt-2 text-sm text-muted">Saves when you click away.</p>
          </WidgetCard>
        </div>
      )}
    </div>
  )
}

function Tile({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="card flex flex-col gap-1 p-4">
      <span className="flex items-center gap-1.5 text-sm text-muted">
        {icon}
        {label}
      </span>
      <span className="font-display text-2xl font-semibold tabular-nums">{value}</span>
      <span className="text-sm text-muted">{hint}</span>
    </div>
  )
}
