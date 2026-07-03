'use client'

import { Server as ServerIcon, Terminal } from 'lucide-react'
import Link from 'next/link'

import WidgetCard from '@/components/ui/Card'
import CopyButton from '@/components/ui/CopyButton'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonRows } from '@/components/ui/Skeleton'
import StatusDot from '@/components/ui/StatusDot'
import { useServers } from '@/hooks/useServers'
import { serverPingable, serverSshCommand, serverSshUrl } from '@/lib/ssh'
import { cn } from '@/lib/utils'

export default function ServerStatusWidget() {
  const { servers, pings, isLoading } = useServers()

  return (
    <WidgetCard
      title="VMs"
      icon={<ServerIcon size={15} />}
      action={
        <Link href="/servers" className="text-xs text-accent1 hover:underline">
          Semua
        </Link>
      }
      bodyClassName="space-y-2"
    >
      {isLoading && <SkeletonRows rows={3} />}
      {servers?.length === 0 && (
        <EmptyState compact icon={<ServerIcon size={18} />} title="Belum ada VM" />
      )}
      {servers?.map((s) => {
        const pingable = serverPingable(s)
        const ping = pings[s.id]
        const status = ping?.checking ? 'checking' : ping?.status ?? 'checking'
        const ssh = serverSshCommand(s)
        const url = serverSshUrl(s)
        const sub = s.ssh_alias || s.ip_address || s.provider.toUpperCase()
        return (
          <div
            key={s.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-bg px-3 py-2.5 transition-all hover:border-borderStrong hover:bg-surface2/40"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              {pingable ? (
                <StatusDot status={status} />
              ) : (
                <span
                  className={cn(
                    'h-2 w-2 shrink-0 rounded-full',
                    s.requires_vpn ? 'bg-warning' : 'bg-muted'
                  )}
                  title={s.requires_vpn ? 'Butuh VPN' : s.provider.toUpperCase()}
                />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{s.name}</p>
                <p className="truncate font-mono text-[11px] text-muted">{sub}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {pingable && ping?.latency_ms != null && (
                <span className="font-mono text-[11px] text-highlight">{ping.latency_ms}ms</span>
              )}
              {url && (
                <a href={url} title="Buka di Terminal (SSH)" className="icon-btn" aria-label="Open in Terminal">
                  <Terminal size={15} />
                </a>
              )}
              {ssh && <CopyButton value={ssh} label="Copy SSH" />}
            </div>
          </div>
        )
      })}
    </WidgetCard>
  )
}
