// Parse an ssh command into an ssh:// URL that macOS Terminal can open.
// Handles `ssh user@host`, `ssh host`, `~/.ssh/config` aliases (`ssh vm-jdih`),
// `-p port`, and `-l user`. Returns null if it isn't an ssh invocation.

// ssh flags that consume the following token as their argument.
const FLAGS_WITH_ARG = new Set([
  '-i', '-o', '-F', '-J', '-b', '-c', '-D', '-E', '-e', '-L', '-R',
  '-W', '-Q', '-m', '-O', '-w', '-S', '-B', '-I',
])

export function sshUrl(command: string): string | null {
  // Find the `ssh` token (start of line or after a separator) and take the rest.
  const m = command.match(/(?:^|\s|&&|;|\|)ssh\s+(.+)$/)
  if (!m) return null
  const args = m[1].trim().split(/\s+/)

  let host: string | null = null
  let user = ''
  let port = ''

  // Scan all args (don't stop at the host) so `-p` after the host is caught too.
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '-p') {
      port = args[i + 1] ?? ''
      i++
      continue
    }
    if (a === '-l') {
      user = args[i + 1] ?? ''
      i++
      continue
    }
    if (a.startsWith('-')) {
      if (FLAGS_WITH_ARG.has(a)) i++ // skip its argument
      continue
    }
    if (!host) host = a // first non-flag token is the destination (host or alias)
  }

  if (!host) return null
  if (host.includes('@')) {
    const [u, h] = host.split('@')
    user = u
    host = h
  }
  const auth = user ? `${user}@` : ''
  const p = port ? `:${port}` : ''
  return `ssh://${auth}${host}${p}`
}
