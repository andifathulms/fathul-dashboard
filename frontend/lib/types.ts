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
