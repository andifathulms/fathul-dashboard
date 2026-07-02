// Parse an `ssh user@host [-p port]` command into an ssh:// URL that macOS
// Terminal can open. Returns null if the command isn't a simple ssh invocation.
export function sshUrl(command: string): string | null {
  const m = command.match(/\bssh\s+(?:-\w+\s+\S+\s+)*?([\w.-]+)@([\w.-]+)/)
  if (!m) return null
  const [, user, host] = m
  const portMatch = command.match(/-p\s+(\d+)/)
  const port = portMatch ? `:${portMatch[1]}` : ''
  return `ssh://${user}@${host}${port}`
}
