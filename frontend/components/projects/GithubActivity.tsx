'use client'

import { Github, GitCommitHorizontal, Lock, RefreshCw, Star, CircleDot } from 'lucide-react'
import useSWR from 'swr'

import WidgetCard from '@/components/ui/Card'
import type { GithubData } from '@/lib/types'
import { cn } from '@/lib/utils'

// Sequential single-hue ramp (empty → bright green), monotonic in lightness on
// the dark surface — GitHub's own contribution scale.
const LEVELS = ['#1b2129', '#0e4429', '#006d32', '#26a641', '#39d353']

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

interface GithubActivityProps {
  projectId: number
  hasRepo: boolean
}

export default function GithubActivity({ projectId, hasRepo }: GithubActivityProps) {
  const { data, isLoading } = useSWR<GithubData>(
    hasRepo ? `/projects/${projectId}/github/` : null,
    // While GitHub is still computing stats (202), poll until they're ready.
    { refreshInterval: (d) => (d?.computing ? 3000 : 0) }
  )

  if (!hasRepo) return null

  if (isLoading) {
    return (
      <WidgetCard title="GitHub Activity" icon={<Github size={15} />}>
        <p className="text-sm text-muted">Memuat data GitHub…</p>
      </WidgetCard>
    )
  }

  if (!data?.ok) {
    const msg: Record<string, string> = {
      no_github_repo: 'Repo bukan GitHub.',
      not_a_github_repo: 'Repo bukan GitHub.',
      not_found: 'Repo tidak ditemukan atau privat — set GITHUB_TOKEN untuk repo privat.',
      rate_limited: 'Rate limit GitHub tercapai — set GITHUB_TOKEN untuk menaikkan limit.',
      unavailable: 'Data GitHub tidak tersedia saat ini.',
    }
    return (
      <WidgetCard title="GitHub Activity" icon={<Github size={15} />}>
        <p className="text-sm text-muted">{msg[data?.error ?? 'unavailable'] ?? 'Data GitHub tidak tersedia.'}</p>
      </WidgetCard>
    )
  }

  const info = data.info
  const weeks = data.commit_activity ?? []
  const yearTotal = weeks.reduce((sum, w) => sum + (w.total ?? 0), 0)
  const active = info?.pushed_at
    ? Date.now() - new Date(info.pushed_at).getTime() < 30 * 86400 * 1000
    : false

  return (
    <WidgetCard
      title="GitHub Activity"
      icon={<Github size={15} />}
      action={
        info && (
          <a
            href={info.html_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-accent1 hover:underline"
          >
            {info.private && <Lock size={11} />}
            {info.full_name}
          </a>
        )
      }
      bodyClassName="space-y-4"
    >
      {/* Stat row */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <Stat
          label="Status"
          value={
            <span className={cn('inline-flex items-center gap-1.5', active ? 'text-highlight' : 'text-muted')}>
              <CircleDot size={13} /> {active ? 'Aktif' : 'Idle'}
            </span>
          }
        />
        <Stat label="Commit terakhir" value={timeAgo(info?.pushed_at)} />
        <Stat label="Commit 1 tahun" value={`${yearTotal}`} icon={<GitCommitHorizontal size={13} />} />
        <Stat label="Branch" value={info?.default_branch ?? '—'} />
        {info?.language && <Stat label="Bahasa" value={info.language} />}
        {(info?.stargazers_count ?? 0) > 0 && (
          <Stat label="Stars" value={`${info?.stargazers_count}`} icon={<Star size={13} />} />
        )}
      </div>

      {/* Contribution heatmap */}
      {data.computing ? (
        <div className="flex items-center gap-2 rounded-lg bg-bg px-3 py-4 text-sm text-muted">
          <RefreshCw size={14} className="animate-spin" /> GitHub sedang menghitung statistik… sebentar ya.
        </div>
      ) : weeks.length > 0 ? (
        <Heatmap weeks={weeks} />
      ) : (
        <p className="text-sm text-muted">Belum ada aktivitas commit dalam setahun terakhir.</p>
      )}

      {/* Recent commits */}
      {data.recent_commits && data.recent_commits.length > 0 && (
        <div>
          <p className="widget-title mb-2">Commit Terbaru</p>
          <div className="space-y-1">
            {data.recent_commits.map((c) => (
              <a
                key={c.sha}
                href={c.html_url ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-bg"
              >
                <code className="shrink-0 font-mono text-[11px] text-accent2">{c.sha}</code>
                <span className="min-w-0 flex-1 truncate text-sm text-text/90">{c.message}</span>
                <span className="shrink-0 text-[11px] text-muted">{timeAgo(c.date)}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </WidgetCard>
  )
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 flex items-center gap-1 font-medium">
        {icon && <span className="text-muted">{icon}</span>}
        {value}
      </p>
    </div>
  )
}

function Heatmap({ weeks }: { weeks: { total: number; week: number; days: number[] }[] }) {
  // Month labels: mark the first column whose first day falls in a new month.
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
        {/* Month labels */}
        <div className="flex gap-[3px] pl-1 text-[10px] text-muted">
          {monthLabels.map((label, i) => (
            <div key={i} className="w-[11px] shrink-0">
              {label}
            </div>
          ))}
        </div>

        {/* Weeks × days grid */}
        <div className="flex gap-[3px] pl-1">
          {weeks.map((w, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }, (_, di) => {
                const count = w.days?.[di] ?? 0
                return (
                  <div
                    key={di}
                    className="h-[11px] w-[11px] rounded-[2px]"
                    style={{ backgroundColor: LEVELS[bucket(count)] }}
                    title={`${count} commit · ${cellDate(w.week, di)}`}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 pt-0.5 text-[10px] text-muted">
          <span>Sedikit</span>
          {LEVELS.map((c, i) => (
            <div key={i} className="h-[11px] w-[11px] rounded-[2px]" style={{ backgroundColor: c }} />
          ))}
          <span>Banyak</span>
        </div>
      </div>
    </div>
  )
}
