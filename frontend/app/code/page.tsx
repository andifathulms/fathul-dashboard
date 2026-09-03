'use client'

import { ExternalLink, GitCommitHorizontal, Github, Lock, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import ContribHeatmap from '@/components/code/ContribHeatmap'
import PageHeader from '@/components/layout/PageHeader'
import WidgetCard from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import Segmented from '@/components/ui/Segmented'
import { SkeletonRows } from '@/components/ui/Skeleton'
import api from '@/lib/api'
import type { GithubActivity, GithubDay } from '@/lib/types'
import { cn, formatDateID, formatDateShort, toISODate, todayISO } from '@/lib/utils'

type Range = '30' | '90' | '365'

const RANGE_LABELS: Record<Range, string> = {
  '30': '30 days',
  '90': '90 days',
  '365': 'Year',
}

function since(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - (days - 1))
  return toISODate(d)
}

export default function CodePage() {
  const [range, setRange] = useState<Range>('365')
  const [day, setDay] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const from = since(Number(range))
  const to = todayISO()
  const key = `/github/activity/?from=${from}&to=${to}`
  const { data, isLoading, mutate } = useSWR<GithubActivity>(key)
  const { data: dayData, isLoading: dayLoading } = useSWR<GithubDay>(
    day ? `/github/activity/?date=${day}` : null
  )

  const refresh = async () => {
    setRefreshing(true)
    try {
      await api.get(`${key}&refresh=1`)
      await mutate()
    } finally {
      setRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Code" icon={<Github size={20} />} />
        <div className="card p-4">
          <SkeletonRows rows={6} />
        </div>
      </div>
    )
  }

  if (!data?.ok) {
    return (
      <div>
        <PageHeader title="Code" icon={<Github size={20} />} />
        <div className="card">
          <EmptyState
            icon={<Github size={22} />}
            title={data?.error === 'no_token' ? 'No GitHub token set' : 'GitHub is not answering'}
            hint={
              data?.error === 'no_token'
                ? 'Set GITHUB_TOKEN in .env and restart the backend.'
                : `The API said: ${data?.error ?? 'unknown error'}`
            }
          />
        </div>
      </div>
    )
  }

  const active = data.days.filter((d) => d.count > 0)
  const busiest = [...active].sort((a, b) => b.count - a.count)[0]
  const maxRepo = Math.max(1, ...data.repos.map((r) => r.commits))
  const totalLang = data.languages.reduce((s, l) => s + l.commits, 0)

  return (
    <div>
      <PageHeader
        title="Code"
        subtitle={`@${data.login} · ${data.repos_touched} repos touched`}
        icon={<Github size={20} />}
        action={
          <button className="btn" onClick={refresh} disabled={refreshing}>
            <RefreshCw size={16} className={cn(refreshing && 'animate-spin')} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        }
      />

      <Segmented
        className="mb-4"
        ariaLabel="Range"
        value={range}
        onChange={(r) => {
          setRange(r)
          setDay(null)
        }}
        options={(Object.keys(RANGE_LABELS) as Range[]).map((k) => ({
          key: k,
          label: RANGE_LABELS[k],
        }))}
      />

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Tile label="Contributions" value={data.total.toLocaleString()} hint={RANGE_LABELS[range].toLowerCase()} />
          <Tile label="Commits" value={data.commits.toLocaleString()} hint={`across ${data.repos.length} repos`} />
          <Tile label="Days active" value={`${active.length}`} hint={`of ${data.days.length}`} />
          <Tile
            label="Busiest day"
            value={busiest ? String(busiest.count) : '—'}
            hint={busiest ? formatDateShort(busiest.date) : 'nothing yet'}
          />
        </div>

        {data.restricted > 0 && (
          <p className="rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning ring-1 ring-inset ring-warning/25">
            {data.restricted.toLocaleString()} contributions are counted but not named — private
            work this token cannot see. Totals include them; the repo list below does not.
          </p>
        )}

        <WidgetCard
          title="Contribution heatmap"
          icon={<GitCommitHorizontal size={16} />}
          action={<span className="text-sm text-muted">Click a day to see what you shipped</span>}
        >
          <ContribHeatmap days={data.days} selected={day} onSelect={(d) => setDay(d === day ? null : d)} />
        </WidgetCard>

        {day && (
          <WidgetCard
            title={formatDateID(day)}
            icon={<GitCommitHorizontal size={16} />}
            action={
              <span className="text-sm text-muted tnum">
                {dayData?.ok ? `${dayData.total} commits` : ''}
              </span>
            }
            bodyClassName="flex flex-col gap-0.5"
            lift
          >
            {dayLoading && <SkeletonRows rows={4} />}
            {!dayLoading && dayData?.ok && dayData.commits.length === 0 && (
              <EmptyState compact title="No commits that day" hint="A day off, or work that landed elsewhere." />
            )}
            {!dayLoading && !dayData?.ok && (
              <EmptyState compact title="Couldn’t load that day" hint={dayData?.error ?? 'Try again in a minute.'} />
            )}
            {dayData?.ok &&
              dayData.commits.map((c) => (
                <a
                  key={c.sha + c.repo}
                  href={c.url ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="row -mx-1 px-2 py-1.5"
                >
                  <span className="shrink-0 font-mono text-sm text-muted">{c.sha}</span>
                  <span className="min-w-0 flex-1 truncate text-base">{c.message}</span>
                  <span className="chip shrink-0 gap-1 bg-surface2 text-muted">
                    {c.is_private && <Lock size={10} />}
                    {c.repo.split('/')[1]}
                  </span>
                </a>
              ))}
            {dayData?.ok && dayData.total > dayData.commits.length && (
              <p className="pt-2 text-sm text-muted">
                Showing the first {dayData.commits.length} of {dayData.total}.
              </p>
            )}
          </WidgetCard>
        )}

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          <WidgetCard title="Where the commits went" icon={<Github size={16} />} className="lg:col-span-2">
            {data.repos.length === 0 ? (
              <EmptyState compact title="No commits in this range" />
            ) : (
              <div className="flex flex-col gap-2.5">
                {data.repos.slice(0, 12).map((r) => (
                  <div key={r.name} className="flex flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-2 text-base">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-w-0 items-center gap-1.5 truncate hover:text-accent1"
                      >
                        {r.is_private && <Lock size={11} className="shrink-0 text-muted" />}
                        <span className="truncate">{r.name.split('/')[1]}</span>
                        <ExternalLink size={11} className="shrink-0 text-muted" />
                      </a>
                      <span className="shrink-0 text-muted tnum">
                        {r.commits}
                        {r.language && <span className="ml-1.5 text-sm">· {r.language}</span>}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
                      <div
                        className="h-full rounded-full bg-highlight"
                        style={{ width: `${Math.max(2, (r.commits / maxRepo) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </WidgetCard>

          <WidgetCard title="Languages" icon={<GitCommitHorizontal size={16} />}>
            {data.languages.length === 0 ? (
              <EmptyState compact title="Nothing to measure" />
            ) : (
              <div className="flex flex-col gap-2.5">
                {data.languages.slice(0, 8).map((l) => (
                  <div key={l.name} className="flex flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-2 text-base">
                      <span className="min-w-0 truncate">{l.name}</span>
                      <span className="shrink-0 text-sm text-muted tnum">
                        {Math.round((l.commits / totalLang) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
                      <div
                        className="h-full rounded-full bg-accent1"
                        style={{ width: `${Math.max(2, (l.commits / totalLang) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </WidgetCard>
        </div>
      </div>
    </div>
  )
}

function Tile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="card flex flex-col gap-1 p-4">
      <span className="text-sm text-muted">{label}</span>
      <span className="font-display text-2xl font-semibold tabular-nums">{value}</span>
      <span className="truncate text-sm text-muted">{hint}</span>
    </div>
  )
}
