// Shared API types, mirroring the Django serializers.

export type ProjectStatus = 'active' | 'paused' | 'done' | 'archived'
export type ProjectCategory = 'oikn' | 'freelance' | 'personal' | 'side'
export type ProjectPriority = 'high' | 'medium' | 'low'

export interface Repo {
  label: string
  url: string
}

export interface Project {
  id: number
  name: string
  description: string
  icon_url: string
  lockup_horizontal_url: string
  lockup_vertical_url: string
  status: ProjectStatus
  category: ProjectCategory
  priority: ProjectPriority
  tech_stack: string[]
  repos: Repo[]
  repo_url: string
  live_url: string
  local_path: string
  notes: string
  tasks_count: number
  credentials_count: number
  /** Commits in the last year, or null when GitHub has nothing to say. */
  commits_year: number | null
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
  estimate_pomodoros: number | null
  pomodoros_done: number
  is_waiting: boolean
  waiting_on: string
  waiting_since: string | null
  today_on: string | null
  repeat: TaskRepeat
  repeat_interval: number
  repeat_parent: number | null
  completed_at: string | null
  created_at: string
}

export type TaskRepeat = '' | 'daily' | 'weekdays' | 'weekly' | 'monthly'

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
  projects: number[]
  project_names: { id: number; name: string }[]
  created_at: string
}

export type ServerProvider = 'gcp' | 'pdns' | 'other'

export interface Server {
  id: number
  name: string
  provider: ServerProvider
  ssh_alias: string
  ip_address: string | null
  ssh_user: string
  ssh_port: number
  requires_vpn: boolean
  gcp_project: string
  gcp_zone: string
  gcp_instance: string
  credential: number | null
  credential_detail: { id: number; label: string; username: string; password: string } | null
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

export interface GithubWorkflowRun {
  name: string | null
  status: string | null
  conclusion: string | null
  branch: string | null
  event: string | null
  html_url: string | null
  created_at: string | null
}

export interface GithubPull {
  number: number
  title: string
  user: string | null
  draft: boolean
  created_at: string | null
  html_url: string | null
}

export interface GithubIssue {
  number: number
  title: string
  user: string | null
  comments: number
  created_at: string | null
  html_url: string | null
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
  workflow_runs?: GithubWorkflowRun[]
  pull_requests?: GithubPull[]
  open_issues?: GithubIssue[]
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

export interface UptimeSla {
  up: number
  total: number
  pct: number | null
}

export interface UptimeIncident {
  start: string
  end: string | null
  duration_min: number
  status_code: number | null
  error: string
  ongoing: boolean
}

export interface UptimeData {
  has_url: boolean
  url: string
  latest: UptimeCheck | null
  checks: UptimeCheck[]
  sla: { h24: UptimeSla; d7: UptimeSla; d30: UptimeSla }
  incidents: UptimeIncident[]
}

export type FocusKind = 'focus' | 'short_break' | 'long_break'

export interface FocusSession {
  id: number
  kind: FocusKind
  task: number | null
  task_title: string | null
  project: number | null
  project_name: string | null
  label: string
  started_at: string
  ended_at: string | null
  planned_min: number
  actual_sec: number
  completed: boolean
  interrupted_by: string
  note: string
}

export interface FocusSettings {
  focus_min: number
  short_break_min: number
  long_break_min: number
  long_break_every: number
  auto_start_breaks: boolean
  sound_enabled: boolean
  daily_target_sessions: number
  pause_for_prayer: boolean
  updated_at: string
}

export interface FocusProjectStat {
  project: number | null
  name: string
  category: ProjectCategory | null
  sec: number
  sessions: number
}

export interface FocusDayStat {
  date: string
  sec: number
  sessions: number
}

export interface FocusStats {
  range: string
  total_sec: number
  sessions: number
  by_project: FocusProjectStat[]
  by_day: FocusDayStat[]
  by_hour: number[]
  streak: number
  today_sec: number
  today_sessions: number
  target: number
}

export interface WeeklyReview {
  id: number
  week_start: string
  reflection: string
  updated_at: string
}

export interface ReviewDay {
  date: string
  sec: number
  sessions: number
  tasks_done: number
  commits: number
}

export interface ReviewProjectStat extends FocusProjectStat {
  tasks_done: number
  /** Present only when the project claims a repo you committed to. */
  commits?: number
}

export interface ReviewRepo {
  repo: string
  url: string
  is_private: boolean
  language: string | null
  commits: number
  /** Project id the repo belongs to, or null when nothing claims it. */
  project: number | null
}

export interface ReviewCode {
  ok: boolean
  error?: string
  total: number
  restricted: number
  repos: ReviewRepo[]
  cached?: boolean
  stale?: boolean
}

export interface ReviewSummary {
  start: string
  end: string
  is_current_week: boolean
  /** Days of this week that have actually happened — computed server-side,
   *  where the timezone is right. */
  days_elapsed: number
  tasks: {
    completed: Task[]
    completed_count: number
    created_count: number
    carried_over: Task[]
    waiting: Task[]
    stale: Task[]
  }
  focus: {
    total_sec: number
    sessions: number
    by_project: ReviewProjectStat[]
  }
  by_day: ReviewDay[]
  logs: DailyLog[]
  code: ReviewCode
}

export interface ContribDay {
  date: string
  count: number
  weekday: number
}

export interface ContribRepo {
  name: string
  url: string
  is_private: boolean
  language: string | null
  commits: number
}

export interface GithubActivity {
  ok: boolean
  error?: string
  login: string
  from: string
  to: string
  total: number
  commits: number
  pull_requests: number
  reviews: number
  issues: number
  repos_touched: number
  /** Contributions GitHub counted but would not name. */
  restricted: number
  days: ContribDay[]
  repos: ContribRepo[]
  languages: { name: string; commits: number }[]
  cached?: boolean
  stale?: boolean
}

export interface DayCommit {
  sha: string
  message: string
  url: string | null
  repo: string
  repo_url: string | null
  is_private: boolean
  at: string | null
}

export interface GithubDay {
  ok: boolean
  error?: string
  date: string
  total: number
  commits: DayCommit[]
  cached?: boolean
}
