// Shared API types, mirroring the Django serializers.

export type ProjectStatus = 'active' | 'paused' | 'done' | 'archived'
export type ProjectCategory = 'oikn' | 'freelance' | 'personal' | 'side'

export interface Repo {
  label: string
  url: string
}

export interface Project {
  id: number
  name: string
  description: string
  status: ProjectStatus
  category: ProjectCategory
  tech_stack: string[]
  repos: Repo[]
  repo_url: string
  live_url: string
  local_path: string
  notes: string
  tasks_count: number
  credentials_count: number
  created_at: string
  updated_at: string
}

export interface Task {
  id: number
  title: string
  is_done: boolean
  project: number | null
  project_name: string | null
  due_date: string | null
  created_at: string
}

export interface Credential {
  id: number
  label: string
  username: string
  password: string
  url: string
  notes: string
  category: string
  project: number | null
  project_name: string | null
  created_at: string
}

export interface EnvVar {
  id: number
  key: string
  value: string
  project: number | null
  project_name: string | null
  created_at: string
}

export type CommandCategory =
  | 'docker'
  | 'git'
  | 'pm2'
  | 'django'
  | 'nginx'
  | 'ssh'
  | 'python'
  | 'general'

export interface Command {
  id: number
  title: string
  command: string
  category: CommandCategory
  project: number | null
  project_name: string | null
  created_at: string
}

export interface Server {
  id: number
  name: string
  ip_address: string
  ssh_user: string
  ssh_port: number
  description: string
  projects: number[]
  project_names: { id: number; name: string }[]
  created_at: string
}

export interface DailyLog {
  id: number
  date: string
  journal: string
  updated_at: string
}

export interface Ayat {
  id: number
  arabic: string
  translation: string
  surah: string
  ayat: number
}

export interface PingResult {
  status: 'up' | 'down'
  latency_ms: number | null
}

export interface GithubWeek {
  total: number
  week: number // unix seconds (start of week)
  days: number[] // 7 daily commit counts, Sun..Sat
}

export interface GithubCommit {
  sha: string
  message: string
  author: string | null
  date: string | null
  html_url: string | null
}

export interface GithubInfo {
  full_name: string
  html_url: string
  description: string | null
  homepage: string | null
  default_branch: string
  created_at: string | null
  pushed_at: string | null
  updated_at: string | null
  stargazers_count: number
  watchers_count: number
  forks_count: number
  open_issues_count: number
  language: string | null
  license: string | null
  topics: string[]
  size: number
  private: boolean
}

/** Analytics for a single repo. */
export interface GithubRepo {
  label: string
  ok: boolean
  error?: string
  repo?: string
  info?: GithubInfo
  languages?: Record<string, number>
  commit_activity?: GithubWeek[]
  computing?: boolean
  recent_commits?: GithubCommit[]
}

/** Response from GET /projects/{id}/github/ — one entry per linked GitHub repo. */
export interface GithubData {
  ok: boolean
  error?: string
  repos: GithubRepo[]
  fetched_at?: string
  cached?: boolean
}

export interface IbadahLog {
  id: number
  date: string
  data: Record<string, Record<string, boolean>>
  updated_at: string
}

export interface UptimeCheck {
  id: number
  url: string
  checked_at: string
  is_up: boolean
  status_code: number | null
  response_ms: number | null
  error: string
  server: string
  content_type: string
  final_url: string
  ssl_days_left: number | null
}

export interface UptimeData {
  has_url: boolean
  url: string
  checks: UptimeCheck[]
}
