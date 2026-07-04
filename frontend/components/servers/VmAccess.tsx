'use client'

import { Cloud, Terminal } from 'lucide-react'

import CopyButton from '@/components/ui/CopyButton'
import RevealToggle from '@/components/ui/RevealToggle'
import { gcpSshUrl, serverSshCommand, serverSshUrl } from '@/lib/ssh'
import type { Server } from '@/lib/types'

/** The access block for a VM — SSH line + Terminal/GCP buttons + linked password. */
export default function VmAccess({ server }: { server: Server }) {
  const ssh = serverSshCommand(server)
  const sshUrl = serverSshUrl(server)
  const gcp = gcpSshUrl(server)
  const cred = server.credential_detail

  return (
    <div className="space-y-2">
      {ssh && (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-bg px-3 py-2">
          <code className="flex min-w-0 items-center gap-2 truncate font-mono text-[12px] text-text/90">
            <Terminal size={13} className="shrink-0 text-muted" />
            {ssh}
          </code>
          <div className="flex shrink-0 items-center gap-1">
            {sshUrl && (
              <a href={sshUrl} title="Open in Terminal (SSH)" className="icon-btn" aria-label="Open in Terminal">
                <Terminal size={15} />
              </a>
            )}
            <CopyButton value={ssh} label="Copy SSH" />
          </div>
        </div>
      )}

      {gcp && (
        <a href={gcp} target="_blank" rel="noreferrer" className="btn btn-sm w-full justify-center">
          <Cloud size={13} /> Open GCP Console SSH
        </a>
      )}

      {cred && (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-bg px-3 py-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-muted">Password · {cred.label}</p>
            <RevealToggle value={cred.password} />
          </div>
          <CopyButton value={cred.password} label="Copy password" />
        </div>
      )}
    </div>
  )
}
