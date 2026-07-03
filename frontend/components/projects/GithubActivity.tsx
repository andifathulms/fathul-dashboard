'use client'

import { Github, GitCommitHorizontal, Lock, RefreshCw, Star, CircleDot, GitFork } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import WidgetCard from '@/components/ui/Card'
import api from '@/lib/api'
import type { GithubData, GithubRepo, GithubWeek } from '@/lib/types'
import { cn } from '@/lib/utils'

// Sequential single-hue ramp (empty → bright green), monotonic in lightness on
// the dark surface — GitHub's own contribution scale.
const LEVELS = ['#1b2129', '#0e4429', '#006d32', '#26a641', '#39d353']

// Small fixed categorical palette for the language bar (distinct hues, labeled).
const LANG_COLORS = ['#0EA5E9', '#D97706', '#10B981', '#a371f7', '#f778ba', '#8B949E']

function bucket(count: number): number {
  if (count <= 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  if (count <= 9) return 3
  return 4
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—'
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'baru saja'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  const d = Math.floor(h / 24)
  if (d === 1) return 'kemarin'
  if (d < 30) return `${d} hari lalu`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo} bulan lalu`
  return `${Math.floor(mo / 12)} tahun lalu`
}

function cellDate(weekTs: number, dayIdx: number): string {
  const d = new Date((weekTs + dayIdx * 86400) * 1000)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const ERR: Record<string, string> = {
  no_github_repo: 'Repo bukan GitHub.',
  not_a_github_repo: 'Repo bukan GitHub.',
  not_found: 'Repo privat/tidak ada — set GITHUB_TOKEN untuk repo privat.',
  rate_limited: 'Rate limit GitHub tercapai — set GITHUB_TOKEN.',
  unavailable: 'Data GitHub tidak tersedia saat ini.',
}

interface GithubActivityProps {
  projectId: number
  hasRepo: boolean
}

/** Renders one card per linked GitHub repo — placed directly in the page grid. */
export default function GithubActivity({ projectId, hasRepo }: GithubActivityProps) {
  const { data, isLoading, mutate } = useSWR<GithubData>(
    hasRepo ? `/projects/${projectId}/github/` : null,
    {
      refreshInterval: (d) => (d?.repos?.some((r) => r.computing) ? 3000 : 0),
    }
  )
  const [refreshing, setRefreshing] = useState(false)

  const refresh = async () => {
    setRefreshing(true)
    try {
      const res = await api.get<GithubData>(`/projects/${projectId}/github/?refresh=true`)
      mutate(res.data, { revalidate: false })
    } finally {
      setRefreshing(false)
    }
  }

  if (!hasRepo) return null

  if (isLoading) {
    return (
      <WidgetCard title="GitHub Activity" icon={<Github size={15} />}>
        <p className="text-sm text-muted">Memuat data GitHub…</p>
      </WidgetCard>
    )
  }

  if (!data?.ok || !data.repos?.length) {
    return (
      <WidgetCard title="GitHub Activity" icon={<Github size={15} />}>
        <p className="text-sm text-muted">{ERR[data?.error ?? 'unavailable'] ?? 'Data GitHub tidak tersedia.'}</p>
      </WidgetCard>
    )
  }

  const meta = { fetchedAt: data.fetched_at, onRefresh: refresh, refreshing }
  const okRepos = data.repos.filter((r) => r.ok)

  // A single card: combined view when there's more than one working repo.
  if (okRepos.length > 1) return <CombinedCard repos={okRepos} meta={meta} />
  if (okRepos.length === 1) return <RepoCard repo={okRepos[0]} meta={meta} />
  return <RepoCard repo={data.repos[0]} meta={meta} />
}

interface RepoCardMeta {
  fetchedAt?: string
  onRefresh: () => void
  refreshing: boolean
}

function MetaControl({ meta }: { meta?: RepoCardMeta }) {
  if (!meta) return null
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-muted">
      {meta.fetchedAt && (
        <span title={new Date(meta.fetchedAt).toLocaleString('id-ID')}>diperbarui {timeAgo(meta.fetchedAt)}</span>
      )}
      <button
        onClick={meta.onRefresh}
        disabled={meta.refreshing}
        title="Ambil data terbaru dari GitHub"
        className="icon-btn h-6 w-6"
        aria-label="Refresh"
      >
        <RefreshCw size={13} className={cn(meta.refreshing && 'animate-spin')} />
      </button>
    </span>
  )
}

// Aggregate several repos into a single card: summed heatmap + stats, merged
// languages, and one commit list sorted across repos.
function CombinedCard({ repos, meta }: { repos: GithubRepo[]; meta?: RepoCardMeta }) {
  const weekMap = new Map<number, { total: number; days: number[] }>()
  for (const r of repos)
    for (const w of r.commit_activity ?? []) {
      const e = weekMap.get(w.week) ?? { total: 0, days: [0, 0, 0, 0, 0, 0, 0] }
      e.total += w.total ?? 0
      ;(w.days ?? []).forEach((d, j) => (e.days[j] += d))
      weekMap.set(w.week, e)
    }
  const weeks: GithubWeek[] = [...weekMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([week, e]) => ({ week, total: e.total, days: e.days }))
  const yearTotal = weeks.reduce((s, w) => s + w.total, 0)

  const langs: Record<string, number> = {}
  for (const r of repos)
    for (const [k, v] of Object.entries(r.languages ?? {})) langs[k] = (langs[k] ?? 0) + v

  const commits = repos
    .flatMap((r) => (r.recent_commits ?? []).map((c) => ({ ...c, repoLabel: r.label })))
    .filter((c) => c.date)
    .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
    .slice(0, 8)

  const pushes = repos.map((r) => r.info?.pushed_at).filter(Boolean) as string[]
  const lastPush = pushes.sort().slice(-1)[0]
  const active = lastPush ? Date.now() - new Date(lastPush).getTime() < 30 * 86400 * 1000 : false
  const stars = repos.reduce((s, r) => s + (r.info?.stargazers_count ?? 0), 0)
  const forks = repos.reduce((s, r) => s + (r.info?.forks_count ?? 0), 0)
  const issues = repos.reduce((s, r) => s + (r.info?.open_issues_count ?? 0), 0)
  const computing = repos.some((r) => r.computing)

  return (
    <WidgetCard title="GitHub" icon={<Github size={15} />} action={<MetaControl meta={meta} />} bodyClassName="space-y-3">
      {/* Repo chips */}
      <div className="flex flex-wrap gap-1.5">
        {repos.map(
          (r) =>
            r.info && (
              <a
                key={r.info.full_name}
                href={r.info.html_url}
                target="_blank"
                rel="noreferrer"
                className="chip inline-flex items-center gap-1 border border-border bg-bg text-accent1 hover:underline"
              >
                {r.info.private && <Lock size={10} />}
                {r.label} · {r.info.full_name.split('/')[1]}
              </a>
            )
        )}
      </div>

      {/* Aggregated stats */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <Stat
          label="Status"
          value={
            <span className={cn('inline-flex items-center gap-1', active ? 'text-highlight' : 'text-muted')}>
              <CircleDot size={12} /> {active ? 'Aktif' : 'Idle'}
            </span>
          }
        />
        <Stat label="Terakhir" value={timeAgo(lastPush)} />
        <Stat label="Commit/thn" value={`${yearTotal}`} icon={<GitCommitHorizontal size={12} />} />
        <Stat label="Repo" value={`${repos.length}`} />
        {stars > 0 && <Stat label="Stars" value={`${stars}`} icon={<Star size={12} />} />}
        {forks > 0 && <Stat label="Forks" value={`${forks}`} icon={<GitFork size={12} />} />}
        {issues > 0 && <Stat label="Issues" value={`${issues}`} />}
      </div>

      {Object.keys(langs).length > 0 && <Languages langs={langs} />}

      {computing && weeks.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg bg-bg px-3 py-3 text-sm text-muted">
          <RefreshCw size={14} className="animate-spin" /> GitHub sedang menghitung statistik…
        </div>
      ) : weeks.length > 0 ? (
        <Heatmap weeks={weeks} />
      ) : (
        <p className="text-sm text-muted">Belum ada commit setahun terakhir.</p>
      )}

      {commits.length > 0 && (
        <div>
          <p className="widget-title mb-1.5">Commit Terbaru (gabungan)</p>
          <div className="space-y-0.5">
            {commits.map((c) => (
              <a
                key={`${c.repoLabel}-${c.sha}`}
                href={c.html_url ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-bg"
              >
                <span className="chip shrink-0 bg-border/40 text-[10px] text-muted">{c.repoLabel}</span>
                <code className="shrink-0 font-mono text-[11px] text-accent2">{c.sha}</code>
                <span className="min-w-0 flex-1 truncate text-[13px] text-text/90">{c.message}</span>
                <span className="shrink-0 text-[11px] text-muted">{timeAgo(c.date)}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </WidgetCard>
  )
}

function RepoCard({ repo, meta }: { repo: GithubRepo; meta?: RepoCardMeta }) {
  if (!repo.ok) {
    return (
      <WidgetCard
        title={`GitHub · ${repo.label}`}
        icon={<Github size={15} />}
      >
        <p className="text-sm text-muted">{ERR[repo.error ?? 'unavailable'] ?? 'Data GitHub tidak tersedia.'}</p>
      </WidgetCard>
    )
  }

  const info = repo.info
  const weeks = repo.commit_activity ?? []
  const yearTotal = weeks.reduce((sum, w) => sum + (w.total ?? 0), 0)
  const active = info?.pushed_at ? Date.now() - new Date(info.pushed_at).getTime() < 30 * 86400 * 1000 : false

  return (
    <WidgetCard
      title={`GitHub · ${repo.label}`}
      icon={<Github size={15} />}
      action={
        <div className="flex items-center gap-2.5">
          <MetaControl meta={meta} />
          {info && (
            <a
              href={info.html_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-accent1 hover:underline"
            >
              {info.private && <Lock size={11} />}
              <span className="max-w-[160px] truncate">{info.full_name}</span>
            </a>
          )}
        </div>
      }
      bodyClassName="space-y-3"
    >
      {/* Stat row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <Stat
          label="Status"
          value={
            <span className={cn('inline-flex items-center gap-1', active ? 'text-highlight' : 'text-muted')}>
              <CircleDot size={12} /> {active ? 'Aktif' : 'Idle'}
            </span>
          }
        />
        <Stat label="Terakhir" value={timeAgo(info?.pushed_at)} />
        <Stat label="Commit/thn" value={`${yearTotal}`} icon={<GitCommitHorizontal size={12} />} />
        <Stat label="Branch" value={info?.default_branch ?? '—'} />
        {(info?.stargazers_count ?? 0) > 0 && (
          <Stat label="Stars" value={`${info?.stargazers_count}`} icon={<Star size={12} />} />
        )}
        {(info?.forks_count ?? 0) > 0 && (
          <Stat label="Forks" value={`${info?.forks_count}`} icon={<GitFork size={12} />} />
        )}
        {(info?.open_issues_count ?? 0) > 0 && (
          <Stat label="Issues" value={`${info?.open_issues_count}`} />
        )}
      </div>

      {repo.languages && Object.keys(repo.languages).length > 0 && <Languages langs={repo.languages} />}

      {repo.computing ? (
        <div className="flex items-center gap-2 rounded-lg bg-bg px-3 py-3 text-sm text-muted">
          <RefreshCw size={14} className="animate-spin" /> GitHub sedang menghitung statistik…
        </div>
      ) : weeks.length > 0 ? (
        <Heatmap weeks={weeks} />
      ) : (
        <p className="text-sm text-muted">Belum ada commit setahun terakhir.</p>
      )}

      {repo.recent_commits && repo.recent_commits.length > 0 && (
        <div>
          <p className="widget-title mb-1.5">Commit Terbaru</p>
          <div className="space-y-0.5">
            {repo.recent_commits.slice(0, 5).map((c) => (
              <a
                key={c.sha}
                href={c.html_url ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-lg px-2 py-1 transition-colors hover:bg-bg"
              >
                <code className="shrink-0 font-mono text-[11px] text-accent2">{c.sha}</code>
                <span className="min-w-0 flex-1 truncate text-[13px] text-text/90">{c.message}</span>
                <span className="shrink-0 text-[11px] text-muted">{timeAgo(c.date)}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </WidgetCard>
  )
}

function Stat({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 flex items-center gap-1 text-[13px] font-medium">
        {icon && <span className="text-muted">{icon}</span>}
        {value}
      </p>
    </div>
  )
}

function Languages({ langs }: { langs: Record<string, number> }) {
  const total = Object.values(langs).reduce((a, b) => a + b, 0)
  if (!total) return null
  const top = Object.entries(langs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  return (
    <div className="space-y-1.5">
      <div className="flex h-2 overflow-hidden rounded-full bg-bg">
        {top.map(([name, bytes], i) => (
          <div
            key={name}
            style={{ width: `${(bytes / total) * 100}%`, backgroundColor: LANG_COLORS[i] }}
            title={`${name} ${((bytes / total) * 100).toFixed(1)}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
        {top.map(([name, bytes], i) => (
          <span key={name} className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: LANG_COLORS[i] }} />
            {name} {((bytes / total) * 100).toFixed(0)}%
          </span>
        ))}
      </div>
    </div>
  )
}

function Heatmap({ weeks }: { weeks: GithubWeek[] }) {
  let lastMonth = -1
  const monthLabels = weeks.map((w) => {
    const m = new Date(w.week * 1000).getMonth()
    if (m !== lastMonth) {
      lastMonth = m
      return MONTHS[m]
    }
    return ''
  })

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1">
        <div className="flex gap-[2px] pl-0.5 text-[9px] text-muted">
          {monthLabels.map((label, i) => (
            <div key={i} className="w-[9px] shrink-0">
              {label}
            </div>
          ))}
        </div>
        <div className="flex gap-[2px] pl-0.5">
          {weeks.map((w, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {Array.from({ length: 7 }, (_, di) => {
                const count = w.days?.[di] ?? 0
                return (
                  <div
                    key={di}
                    className="h-[9px] w-[9px] rounded-[2px]"
                    style={{ backgroundColor: LEVELS[bucket(count)] }}
                    title={`${count} commit · ${cellDate(w.week, di)}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-1 pt-0.5 text-[9px] text-muted">
          <span>Sedikit</span>
          {LEVELS.map((c, i) => (
            <div key={i} className="h-[9px] w-[9px] rounded-[2px]" style={{ backgroundColor: c }} />
          ))}
          <span>Banyak</span>
        </div>
      </div>
    </div>
  )
}
