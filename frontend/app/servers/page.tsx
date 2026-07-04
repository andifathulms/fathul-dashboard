'use client'

import { Server as ServerIcon, Plus, RefreshCw, Pencil, Trash2, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import PageHeader from '@/components/layout/PageHeader'
import ServerForm from '@/components/servers/ServerForm'
import VmAccess from '@/components/servers/VmAccess'
import WidgetCard from '@/components/ui/Card'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonRows } from '@/components/ui/Skeleton'
import StatusDot from '@/components/ui/StatusDot'
import { useToast } from '@/components/ui/Toast'
import { useServers } from '@/hooks/useServers'
import api from '@/lib/api'
import { serverPingable } from '@/lib/ssh'
import type { Credential, Project, Server, ServerProvider } from '@/lib/types'
import { cn } from '@/lib/utils'

const PROVIDER_BADGE: Record<ServerProvider, string> = {
  gcp: 'bg-accent1/15 text-accent1 ring-1 ring-inset ring-accent1/25',
  pdns: 'bg-accent2/15 text-accent2 ring-1 ring-inset ring-accent2/25',
  other: 'bg-muted/20 text-muted ring-1 ring-inset ring-muted/25',
}
const PROVIDER_LABEL: Record<ServerProvider, string> = { gcp: 'GCP', pdns: 'PDNS', other: 'Other' }

export default function ServersPage() {
  const { servers, pings, isLoading, mutate, pingServer, pingAll } = useServers()
  const { data: projects } = useSWR<Project[]>('/projects/')
  const { data: credentials } = useSWR<Credential[]>('/credentials/')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Server | null>(null)
  const confirm = useConfirm()
  const toast = useToast()

  const remove = async (id: number, name: string) => {
    if (!(await confirm({ title: 'Delete VM', message: `Delete "${name}"?`, danger: true, confirmLabel: 'Delete' }))) return
    await api.delete(`/servers/${id}/`)
    toast.success(`VM "${name}" deleted`)
    mutate()
  }

  return (
    <div>
      <PageHeader
        title="VMs"
        subtitle="Your hosts & VMs — SSH access, passwords, and the apps running on them"
        icon={<ServerIcon size={20} />}
        action={
          <div className="flex gap-2">
            <button onClick={pingAll} className="btn">
              <RefreshCw size={15} /> Ping
            </button>
            <button
              onClick={() => {
                setEditing(null)
                setShowForm(true)
              }}
              className="btn-accent"
            >
              <Plus size={16} /> New VM
            </button>
          </div>
        }
      />

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRows key={i} rows={1} className="[&>div]:h-44" />
          ))}
        </div>
      )}
      {servers?.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<ServerIcon size={22} />}
            title="No VMs yet"
            hint="Register your VMs/hosts for quick SSH + password access and to see the apps running on them."
            action={
              <button onClick={() => setShowForm(true)} className="btn-accent">
                <Plus size={16} /> New VM
              </button>
            }
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {servers?.map((s) => {
          const pingable = serverPingable(s)
          const ping = pings[s.id]
          const status = ping?.checking ? 'checking' : ping?.status ?? 'checking'
          return (
            <WidgetCard key={s.id} bodyClassName="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  {pingable && <StatusDot status={status} />}
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold leading-tight">{s.name}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className={cn('chip', PROVIDER_BADGE[s.provider])}>{PROVIDER_LABEL[s.provider]}</span>
                      {s.requires_vpn && (
                        <span className="chip inline-flex items-center gap-1 bg-warning/15 text-warning ring-1 ring-inset ring-warning/25">
                          <ShieldAlert size={10} /> VPN
                        </span>
                      )}
                      {pingable && ping?.latency_ms != null && (
                        <span className="font-mono text-[11px] text-highlight">{ping.latency_ms}ms</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {pingable && (
                    <button onClick={() => pingServer(s.id)} className="icon-btn h-7 w-7" aria-label="Ping">
                      <RefreshCw size={13} />
                    </button>
                  )}
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
                  <button onClick={() => remove(s.id, s.name)} className="icon-btn h-7 w-7 hover:text-danger" aria-label="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {s.description && <p className="text-sm text-muted">{s.description}</p>}

              <VmAccess server={s} />

              {s.project_names?.length > 0 && (
                <div className="border-t border-border pt-2.5">
                  <p className="mb-1.5 text-[10px] uppercase tracking-wide text-muted">Apps on this VM</p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.project_names.map((p) => (
                      <span key={p.id} className="chip border border-border bg-bg text-muted">
                        {p.name}
                      </span>
                    ))}
                  </div>
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
        credentials={credentials}
        initial={editing}
      />
    </div>
  )
}
