'use client'

import { KeyRound, Plus, Search, Upload, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import PageHeader from '@/components/layout/PageHeader'
import CredentialForm from '@/components/vault/CredentialForm'
import EnvImportModal from '@/components/vault/EnvImportModal'
import WidgetCard from '@/components/ui/Card'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import CopyButton from '@/components/ui/CopyButton'
import EmptyState from '@/components/ui/EmptyState'
import RevealToggle from '@/components/ui/RevealToggle'
import { useToast } from '@/components/ui/Toast'
import { CategoryBadge } from '@/components/ui/Badge'
import api from '@/lib/api'
import type { Credential, EnvVar, Project } from '@/lib/types'
import { CATEGORY_STYLES, cn } from '@/lib/utils'

type Tab = 'credentials' | 'envvars'

export default function VaultPage() {
  const [tab, setTab] = useState<Tab>('credentials')
  const [q, setQ] = useState('')
  const [showCred, setShowCred] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editing, setEditing] = useState<Credential | null>(null)

  const { data: creds, mutate: mutateCreds } = useSWR<Credential[]>('/credentials/')
  const { data: envs, mutate: mutateEnvs } = useSWR<EnvVar[]>('/envvars/')
  const { data: projects } = useSWR<Project[]>('/projects/')
  const confirm = useConfirm()
  const toast = useToast()

  const filteredCreds = creds?.filter(
    (c) =>
      c.label.toLowerCase().includes(q.toLowerCase()) ||
      c.username.toLowerCase().includes(q.toLowerCase())
  )
  const filteredEnvs = envs?.filter((e) => e.key.toLowerCase().includes(q.toLowerCase()))

  const deleteCred = async (id: number, label: string) => {
    if (!(await confirm({ title: 'Hapus kredensial', message: `Hapus "${label}"?`, danger: true, confirmLabel: 'Hapus' }))) return
    await api.delete(`/credentials/${id}/`)
    toast.success('Kredensial dihapus')
    mutateCreds()
  }
  const deleteEnv = async (id: number) => {
    await api.delete(`/envvars/${id}/`)
    mutateEnvs()
  }

  return (
    <div>
      <PageHeader
        title="Vault"
        subtitle="Kredensial & environment variable — disimpan lokal, tanpa enkripsi"
        icon={<KeyRound size={20} />}
        action={
          tab === 'credentials' ? (
            <button
              onClick={() => {
                setEditing(null)
                setShowCred(true)
              }}
              className="btn-accent"
            >
              <Plus size={16} /> Kredensial
            </button>
          ) : (
            <button onClick={() => setShowImport(true)} className="btn-accent">
              <Upload size={16} /> Import .env
            </button>
          )
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg bg-surface p-1">
          {(['credentials', 'envvars'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                tab === t ? 'bg-accent1/15 text-accent1' : 'text-muted hover:text-text'
              )}
            >
              {t === 'credentials' ? 'Credentials' : 'Env Vars'}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Cari ${tab === 'credentials' ? 'kredensial' : 'env var'}…`}
            className="input pl-9"
          />
        </div>
      </div>

      {tab === 'credentials' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCreds?.length === 0 && <Empty label="Belum ada kredensial." />}
          {filteredCreds?.map((c) => {
            const project = projects?.find((p) => p.id === c.project)
            return (
              <div key={c.id} className="card card-hover group relative overflow-hidden p-4 pl-5">
                <span
                  className={cn(
                    'absolute inset-y-0 left-0 w-1',
                    project ? CATEGORY_STYLES[project.category].bar : 'bg-accent1/60'
                  )}
                />
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent1/10 text-accent1 ring-1 ring-inset ring-accent1/15">
                      <KeyRound size={15} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold leading-tight">{c.label}</h3>
                      {c.category && <p className="mt-0.5 text-[11px] text-muted">{c.category}</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => {
                        setEditing(c)
                        setShowCred(true)
                      }}
                      className="icon-btn h-7 w-7"
                      aria-label="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => deleteCred(c.id, c.label)}
                      className="icon-btn h-7 w-7 hover:text-red-400"
                      aria-label="Hapus"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-2 text-sm">
                  {c.username && (
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-bg px-3 py-1.5">
                      <span className="truncate font-mono text-[13px]">{c.username}</span>
                      <CopyButton value={c.username} label="Copy username" />
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-bg px-3 py-1.5">
                    <RevealToggle value={c.password} />
                    <CopyButton value={c.password} label="Copy password" />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  {project ? <CategoryBadge category={project.category} /> : <span />}
                  {c.url && (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-accent1 hover:underline"
                    >
                      <ExternalLink size={11} /> Buka
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'envvars' && (
        <WidgetCard bodyClassName="space-y-1.5">
          {filteredEnvs?.length === 0 && <Empty label="Belum ada env var. Import dari .env." />}
          {filteredEnvs?.map((e) => {
            const project = projects?.find((p) => p.id === e.project)
            return (
              <div
                key={e.id}
                className="group flex items-center gap-3 rounded-lg border border-border bg-bg px-3 py-2 transition-all hover:border-borderStrong hover:bg-surface2/40"
              >
                <code className="shrink-0 font-mono text-[13px] text-accent2">{e.key}</code>
                <span className="text-muted">=</span>
                <div className="min-w-0 flex-1">
                  <RevealToggle value={e.value} />
                </div>
                {project && <CategoryBadge category={project.category} />}
                <CopyButton value={e.value} />
                <button
                  onClick={() => deleteEnv(e.id)}
                  className="icon-btn h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                  aria-label="Hapus"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}
        </WidgetCard>
      )}

      <CredentialForm
        open={showCred}
        onClose={() => setShowCred(false)}
        onSaved={mutateCreds}
        projects={projects}
        initial={editing}
      />
      <EnvImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onSaved={mutateEnvs}
        projects={projects}
      />
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <div className="card col-span-full">
      <EmptyState icon={<KeyRound size={22} />} title={label} />
    </div>
  )
}
