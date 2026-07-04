'use client'

import { Activity, ExternalLink, RefreshCw, ShieldCheck, ShieldAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'

import WidgetCard from '@/components/ui/Card'
import api from '@/lib/api'
import type { UptimeCheck, UptimeData } from '@/lib/types'
import { cn } from '@/lib/utils'

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—'
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

const STALE_MS = 5 * 60 * 1000

interface UptimeWidgetProps {
  projectId: number
  hasUrl: boolean
}

export default function UptimeWidget({ projectId, hasUrl }: UptimeWidgetProps) {
  const key = hasUrl ? `/projects/${projectId}/uptime/` : null
  const { data, isLoading, mutate } = useSWR<UptimeData>(key)
  const [checking, setChecking] = useState(false)
  const autoRan = useRef(false)

  const runCheck = async () => {
    setChecking(true)
    try {
      await api.post(`/projects/${projectId}/uptime/`)
      await mutate()
    } finally {
      setChecking(false)
    }
  }

  // Auto-check once on load if there's no recent check.
  useEffect(() => {
    if (!data || autoRan.current) return
    autoRan.current = true
    const latest = data.latest
    const stale = !latest || Date.now() - new Date(latest.checked_at).getTime() > STALE_MS
    if (data.has_url && stale) runCheck()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  if (!hasUrl) return null

  const checks = data?.checks ?? []
  const latest: UptimeCheck | null | undefined = data?.latest
  const avgMs =
    checks.length > 0
      ? Math.round(checks.filter((c) => c.response_ms != null).reduce((s, c) => s + (c.response_ms ?? 0), 0) / checks.length)
      : null

  return (
    <WidgetCard
      title="Web Status"
      icon={<Activity size={15} />}
      action={
        <div className="flex items-center gap-2.5">
          {latest && <span className="text-[11px] text-muted">checked {timeAgo(latest.checked_at)}</span>}
          <button
            onClick={runCheck}
            disabled={checking}
            title="Check now"
            className="icon-btn h-6 w-6"
            aria-label="Check now"
          >
            <RefreshCw size={13} className={cn(checking && 'animate-spin')} />
          </button>
        </div>
      }
      bodyClassName="space-y-3"
    >
      {isLoading && !latest ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <>
          {/* Current status */}
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-semibold',
                !latest
                  ? 'bg-muted/20 text-muted'
                  : latest.is_up
                    ? 'bg-highlight/15 text-highlight'
                    : 'bg-red-500/15 text-red-400'
              )}
            >
              <span className={cn('h-2 w-2 rounded-full', latest?.is_up ? 'bg-highlight' : latest ? 'bg-red-500' : 'bg-muted')} />
              {checking ? 'Checking…' : !latest ? 'Not checked' : latest.is_up ? 'Online' : 'Offline'}
            </span>
            {latest?.status_code != null && (
              <span className="font-mono text-sm text-text/90">HTTP {latest.status_code}</span>
            )}
            {latest?.response_ms != null && (
              <span className="font-mono text-sm text-highlight">{latest.response_ms}ms</span>
            )}
          </div>

          {latest?.error && <p className="text-[11px] text-red-400">{latest.error}</p>}

          {/* Stat row */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {avgMs != null && <Stat label="Average" value={`${avgMs}ms`} />}
            {latest?.server && <Stat label="Server" value={latest.server} />}
            {latest?.content_type && <Stat label="Type" value={latest.content_type.split(';')[0]} />}
            {latest?.ssl_days_left != null && (
              <Stat
                label="SSL"
                value={
                  <span
                    className={cn(
                      'inline-flex items-center gap-1',
                      latest.ssl_days_left < 14 ? 'text-warning' : 'text-highlight'
                    )}
                  >
                    {latest.ssl_days_left < 14 ? <ShieldAlert size={13} /> : <ShieldCheck size={13} />}
                    {latest.ssl_days_left}d
                  </span>
                }
              />
            )}
          </div>

          {/* SLA windows */}
          {data?.sla && (
            <div className="grid grid-cols-3 gap-2">
              <SlaTile label="24 hours" sla={data.sla.h24} />
              <SlaTile label="7 days" sla={data.sla.d7} />
              <SlaTile label="30 days" sla={data.sla.d30} />
            </div>
          )}

          {/* History strip (oldest → newest) */}
          {checks.length > 1 && <History checks={checks} />}

          {/* Downtime incidents */}
          {data?.incidents && data.incidents.length > 0 && (
            <div>
              <p className="widget-title mb-1.5">Downtime Incidents</p>
              <div className="space-y-1">
                {data.incidents.map((inc, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-bg px-2.5 py-1.5 text-[12px]">
                    <span className={cn('h-2 w-2 shrink-0 rounded-full', inc.ongoing ? 'bg-red-500 animate-pulse-dot' : 'bg-muted')} />
                    <span className="text-text/90">{new Date(inc.start).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-muted">
                      {inc.ongoing ? 'down now' : `${inc.duration_min}m`}
                      {inc.status_code ? ` · HTTP ${inc.status_code}` : inc.error ? ` · ${inc.error}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data?.url && (
            <a
              href={data.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-accent1 hover:underline"
            >
              <ExternalLink size={11} /> {data.url}
            </a>
          )}
        </>
      )}
    </WidgetCard>
  )
}

function SlaTile({ label, sla }: { label: string; sla: { pct: number | null; total: number } }) {
  const pct = sla.pct
  const color = pct == null ? 'text-muted' : pct >= 99 ? 'text-highlight' : pct >= 95 ? 'text-warning' : 'text-danger'
  return (
    <div className="rounded-lg border border-border/60 bg-bg px-2 py-2.5 text-center">
      <p className={cn('font-mono text-lg font-bold tabular-nums', color)}>{pct == null ? '—' : `${pct}%`}</p>
      <p className="mt-0.5 text-[10px] font-medium text-muted">{label}</p>
      <p className="text-[9px] text-muted/60">{sla.total} checks</p>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.06em] text-muted">{label}</p>
      <p className="mt-0.5 max-w-[160px] truncate text-[15px] font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-[9px] text-muted/70">{sub}</p>}
    </div>
  )
}

function History({ checks }: { checks: UptimeCheck[] }) {
  const items = [...checks].slice(0, 40).reverse() // oldest → newest
  const maxMs = Math.max(...items.map((c) => c.response_ms ?? 0), 1)
  return (
    <div>
      <div className="flex h-10 items-end gap-[2px]">
        {items.map((c) => {
          const h = c.response_ms != null ? Math.max(10, (c.response_ms / maxMs) * 100) : 30
          return (
            <div
              key={c.id}
              className={cn('flex-1 rounded-sm', c.is_up ? 'bg-highlight/70' : 'bg-red-500/70')}
              style={{ height: `${h}%` }}
              title={`${new Date(c.checked_at).toLocaleString('en-US')} · ${
                c.is_up ? 'up' : 'down'
              }${c.status_code ? ` · HTTP ${c.status_code}` : ''}${c.response_ms != null ? ` · ${c.response_ms}ms` : ''}`}
            />
          )
        })}
      </div>
      <p className="mt-1 text-[10px] text-muted">Last {items.length} checks</p>
    </div>
  )
}
