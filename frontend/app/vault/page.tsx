'use client'

import { KeyRound, Plus, Upload, Pencil, Trash2, ExternalLink } from 'lucide-react'
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
import Segmented, { FilterBar, SearchField } from '@/components/ui/Segmented'
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
    if (!(await confirm({ title: 'Delete credential', message: `Delete "${label}"?`, danger: true, confirmLabel: 'Delete' }))) return
    await api.delete(`/credentials/${id}/`)
    toast.success('Credential deleted')
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
        subtitle="Credentials and environment variables. Stored on this machine, unencrypted."
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
              <Plus size={16} /> Add credential
            </button>
          ) : (
            <button onClick={() => setShowImport(true)} className="btn-accent">
              <Upload size={16} /> Import .env
            </button>
          )
        }
      />

      <FilterBar>
        <Segmented
          ariaLabel="Vault section"
          value={tab}
          onChange={setTab}
          options={[
            { key: 'credentials', label: 'Credentials', count: creds?.length },
            { key: 'envvars', label: 'Env vars', count: envs?.length },
          ]}
        />
        <SearchField
          className="ml-auto sm:w-64"
          value={q}
          onChange={setQ}
          placeholder={tab === 'credentials' ? 'Search credentials' : 'Search variables'}
        />
      </FilterBar>

      {tab === 'credentials' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCreds?.length === 0 && (
            <Empty
              label={q ? 'Nothing matches that search' : 'No credentials yet'}
              hint={q ? 'Try a shorter term.' : 'Add one and it stays on this machine.'}
            />
          )}
          {filteredCreds?.map((c) => {
            const project = projects?.find((p) => p.id === c.project)
            return (
              <div key={c.id} className="card card-hover group flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        project
                          ? CATEGORY_STYLES[project.category].chip
                          : 'bg-accent1/10 text-accent1 ring-1 ring-inset ring-accent1/20'
                      )}
                    >
                      <KeyRound size={15} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-md font-semibold leading-tight">
                        {c.label}
                      </h3>
                      {c.category && <p className="truncate text-sm text-muted">{c.category}</p>}
                    </div>
                  </div>
                  <div className="row-actions">
                    <button
                      onClick={() => {
                        setEditing(c)
                        setShowCred(true)
                      }}
                      className="icon-btn h-7 w-7"
                      aria-label="Edit credential"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => deleteCred(c.id, c.label)}
                      className="icon-btn h-7 w-7 hover:text-danger"
                      aria-label="Delete credential"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-1.5">
                  {c.username && (
                    <div className="well flex items-center justify-between gap-2 py-1">
                      <span className="truncate font-mono text-base">{c.username}</span>
                      <CopyButton value={c.username} label="Copy username" />
                    </div>
                  )}
                  <div className="well flex items-center justify-between gap-2 py-1">
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
                      className="inline-flex items-center gap-1 text-sm text-accent1 hover:underline"
                    >
                      <ExternalLink size={11} /> Open
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'envvars' && (
        <WidgetCard bodyClassName="flex flex-col gap-0.5">
          {filteredEnvs?.length === 0 && (
            <Empty label="No variables yet" hint="Import a whole .env file to fill this in." />
          )}
          {filteredEnvs?.map((e) => {
            const project = projects?.find((p) => p.id === e.project)
            return (
              <div
                key={e.id}
                className="row group -mx-1 px-2"
              >
                <code className="shrink-0 font-mono text-base font-medium text-accent2">{e.key}</code>
                <span className="text-muted">=</span>
                <div className="min-w-0 flex-1">
                  <RevealToggle value={e.value} />
                </div>
                {project && <CategoryBadge category={project.category} />}
                <CopyButton value={e.value} />
                <button
                  onClick={() => deleteEnv(e.id)}
                  className="icon-btn h-7 w-7 shrink-0 opacity-0 transition-opacity hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
                  aria-label="Delete variable"
                  title="Delete"
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

function Empty({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="card col-span-full">
      <EmptyState icon={<KeyRound size={22} />} title={label} hint={hint} />
    </div>
  )
}
