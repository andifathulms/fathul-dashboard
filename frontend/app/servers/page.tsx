'use client'

import { Server as ServerIcon, Plus, RefreshCw, Pencil, Trash2, Terminal } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import PageHeader from '@/components/layout/PageHeader'
import ServerForm from '@/components/servers/ServerForm'
import WidgetCard from '@/components/ui/Card'
import CopyButton from '@/components/ui/CopyButton'
import StatusDot from '@/components/ui/StatusDot'
import { useServers } from '@/hooks/useServers'
import api from '@/lib/api'
import type { Project, Server } from '@/lib/types'

export default function ServersPage() {
  const { servers, pings, isLoading, mutate, pingServer, pingAll } = useServers()
  const { data: projects } = useSWR<Project[]>('/projects/')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Server | null>(null)

  const remove = async (id: number) => {
    if (!confirm('Hapus server ini?')) return
    await api.delete(`/servers/${id}/`)
    mutate()
  }

  return (
    <div>
      <PageHeader
        title="Servers"
        subtitle="Cek koneksi SSH & status — refresh otomatis tiap 60 detik"
        icon={<ServerIcon size={20} />}
        action={
          <div className="flex gap-2">
            <button onClick={pingAll} className="btn">
              <RefreshCw size={15} /> Ping semua
            </button>
            <button
              onClick={() => {
                setEditing(null)
                setShowForm(true)
              }}
              className="btn-accent"
            >
              <Plus size={16} /> Server Baru
            </button>
          </div>
        }
      />

      {isLoading && <p className="text-sm text-muted">Memuat…</p>}
      {servers?.length === 0 && (
        <div className="card flex flex-col items-center gap-2 py-16 text-center">
          <ServerIcon size={28} className="text-muted" />
          <p className="text-sm text-muted">Belum ada server.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {servers?.map((s) => {
          const ping = pings[s.id]
          const status = ping?.checking ? 'checking' : ping?.status ?? 'checking'
          const ssh = `ssh ${s.ssh_user}@${s.ip_address} -p ${s.ssh_port}`
          return (
            <WidgetCard key={s.id} bodyClassName="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <StatusDot status={status} />
                  <div>
                    <h3 className="font-semibold leading-tight">{s.name}</h3>
                    <p className="font-mono text-[11px] text-muted">{s.ip_address}:{s.ssh_port}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => pingServer(s.id)}
                    className="icon-btn h-7 w-7"
                    aria-label="Ping"
                  >
                    <RefreshCw size={13} />
                  </button>
                  <button
                    onClick={() => {
                      setEditing(s)
                      setShowForm(true)
                    }}
                    className="icon-btn h-7 w-7"
                    aria-label="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => remove(s.id)}
                    className="icon-btn h-7 w-7 hover:text-red-400"
                    aria-label="Hapus"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <span
                  className={
                    'chip ' +
                    (status === 'up'
                      ? 'bg-highlight/15 text-highlight'
                      : status === 'down'
                        ? 'bg-red-500/15 text-red-400'
                        : 'bg-accent2/15 text-accent2')
                  }
                >
                  {status === 'up' ? 'Online' : status === 'down' ? 'Offline' : 'Mengecek…'}
                </span>
                {ping?.latency_ms != null && (
                  <span className="font-mono text-highlight">{ping.latency_ms}ms</span>
                )}
                {ping?.checkedAt && <span className="text-muted">· {ping.checkedAt}</span>}
              </div>

              {s.description && <p className="text-sm text-muted">{s.description}</p>}

              <div className="flex items-center justify-between gap-2 rounded-lg bg-bg px-3 py-2">
                <code className="flex items-center gap-2 truncate font-mono text-[12px] text-text/90">
                  <Terminal size={13} className="shrink-0 text-muted" />
                  {ssh}
                </code>
                <CopyButton value={ssh} label="Copy SSH" />
              </div>

              {s.project_names?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 border-t border-border pt-2.5">
                  {s.project_names.map((p) => (
                    <span key={p.id} className="chip border border-border bg-bg text-muted">
                      {p.name}
                    </span>
                  ))}
                </div>
              )}
            </WidgetCard>
          )
        })}
      </div>

      <ServerForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={mutate}
        projects={projects}
        initial={editing}
      />
    </div>
  )
}
