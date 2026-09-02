'use client'

import { CheckSquare, FolderKanban, Server } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'

import { useServers } from '@/hooks/useServers'
import { usePrayer } from '@/hooks/usePrayer'
import { PRAYER_SEQUENCE, formatCountdown } from '@/lib/prayer'
import type { Project, Task } from '@/lib/types'
import { cn, formatDateID, todayISO } from '@/lib/utils'

function greeting(hour: number) {
  if (hour < 4) return 'Still up'
  if (hour < 11) return 'Good morning'
  if (hour < 15) return 'Good afternoon'
  if (hour < 19) return 'Good evening'
  return 'Good night'
}

/** The dashboard's hero: where today stands, in one glance. */
export default function TodayBand() {
  const { now, next, timings } = usePrayer()
  const today = todayISO()
  const { data: tasks } = useSWR<Task[]>(`/tasks/?agenda=${today}`)
  const { data: projects } = useSWR<Project[]>('/projects/?status=active')
  const { servers, pings } = useServers()

  const done = tasks?.filter((t) => t.is_done).length ?? 0
  const total = tasks?.length ?? 0
  const pct = total ? Math.round((done / total) * 100) : 0
  const up = servers?.filter((s) => pings[s.id]?.status === 'up').length ?? 0

  return (
    <section className="card-lift rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold">
            {greeting(now?.getHours() ?? 9)}, Fathul.
          </h1>
          <p className="mt-1 text-base text-muted">
            {now
              ? now.toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : ' '}
            {next && (
              <>
                {' · '}
                <span className="text-accent1">
                  {next.label} in {formatCountdown(next.minutesUntil)}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-stretch gap-2">
          <Stat
            href="/tasks"
            icon={<CheckSquare size={14} />}
            label="Tasks"
            value={total ? `${done}/${total}` : '—'}
            foot={total ? `${pct}% done` : 'nothing due today'}
            bar={total ? pct : null}
          />
          <Stat
            href="/projects"
            icon={<FolderKanban size={14} />}
            label="Projects"
            value={projects ? String(projects.length) : '—'}
            foot="active"
          />
          <Stat
            href="/servers"
            icon={<Server size={14} />}
            label="VMs"
            value={servers ? `${up}/${servers.length}` : '—'}
            foot={servers && up === servers.length ? 'all reachable' : 'check status'}
          />
        </div>
      </div>

      {/* Prayer strip — the six times, with the next one carried in cobalt. */}
      <div className="mt-5 grid grid-cols-3 gap-1.5 border-t border-border pt-4 sm:grid-cols-6">
        {PRAYER_SEQUENCE.map((p) => {
          const isNext = next?.key === p.key
          return (
            <div
              key={p.key}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 transition-colors',
                isNext ? 'bg-accent1/10 ring-1 ring-inset ring-accent1/25' : 'bg-surface2/60'
              )}
            >
              <span
                className={cn(
                  'text-xs font-semibold uppercase tracking-[0.08em]',
                  isNext ? 'text-accent1' : 'text-muted'
                )}
              >
                {p.label}
              </span>
              <span
                className={cn(
                  'font-mono text-md font-medium tnum',
                  isNext ? 'text-accent1' : 'text-text'
                )}
              >
                {timings ? timings[p.key] : '––:––'}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

interface StatProps {
  href: string
  icon: React.ReactNode
  label: string
  value: string
  foot: string
  bar?: number | null
}

function Stat({ href, icon, label, value, foot, bar }: StatProps) {
  return (
    <Link
      href={href}
      className="min-w-[126px] flex-1 rounded-xl border border-border bg-surface2/60 px-3 py-2.5 transition-colors hover:border-borderStrong hover:bg-surface2"
    >
      <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.06em] text-muted">
        {icon}
        {label}
      </span>
      <p className="mt-1 font-display text-xl font-semibold tnum">{value}</p>
      {bar != null ? (
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-highlight transition-[width] duration-500"
            style={{ width: `${bar}%` }}
          />
        </div>
      ) : (
        <p className="mt-0.5 text-sm text-muted">{foot}</p>
      )}
    </Link>
  )
}
