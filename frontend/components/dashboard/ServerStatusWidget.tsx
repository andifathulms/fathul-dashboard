'use client'

import { Server as ServerIcon } from 'lucide-react'
import Link from 'next/link'

import WidgetCard from '@/components/ui/Card'
import CopyButton from '@/components/ui/CopyButton'
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
      {isLoading && <p className="text-sm text-muted">Memuat…</p>}
      {servers?.length === 0 && <p className="text-sm text-muted">Belum ada server.</p>}
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
            <div className="flex items-center gap-2">
              {ping?.latency_ms != null && (
                <span className="font-mono text-[11px] text-highlight">{ping.latency_ms}ms</span>
              )}
              <CopyButton value={ssh} label="Copy SSH" />
            </div>
          </div>
        )
      })}
    </WidgetCard>
  )
}
