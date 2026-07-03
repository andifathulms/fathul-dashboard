'use client'

import { Server as ServerIcon, Terminal } from 'lucide-react'
import Link from 'next/link'

import WidgetCard from '@/components/ui/Card'
import CopyButton from '@/components/ui/CopyButton'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonRows } from '@/components/ui/Skeleton'
import StatusDot from '@/components/ui/StatusDot'
import { useServers } from '@/hooks/useServers'

export default function ServerStatusWidget() {
  const { servers, pings, isLoading } = useServers()

  return (
    <WidgetCard
      title="Status Server"
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
        <EmptyState compact icon={<ServerIcon size={18} />} title="Belum ada server" />
      )}
      {servers?.map((s) => {
        const ping = pings[s.id]
        const status = ping?.checking ? 'checking' : ping?.status ?? 'checking'
        const ssh = `ssh ${s.ssh_user}@${s.ip_address} -p ${s.ssh_port}`
        return (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-lg border border-border bg-bg px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <StatusDot status={status} />
              <div>
                <p className="text-sm font-medium">{s.name}</p>
                <p className="font-mono text-[11px] text-muted">{s.ip_address}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {ping?.latency_ms != null && (
                <span className="font-mono text-[11px] text-highlight">{ping.latency_ms}ms</span>
              )}
              <a
                href={`ssh://${s.ssh_user}@${s.ip_address}:${s.ssh_port}`}
                title="Buka di Terminal (SSH)"
                className="icon-btn"
                aria-label="Open in Terminal"
              >
                <Terminal size={15} />
              </a>
              <CopyButton value={ssh} label="Copy SSH" />
            </div>
          </div>
        )
      })}
    </WidgetCard>
  )
}
