'use client'

import { RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'

import { todayISO } from '@/lib/utils'

interface DhikrState {
  label: string
  count: number
  target: number
}

const PRESETS = ['Subhanallah', 'Alhamdulillah', 'Allahuakbar', 'Astaghfirullah']
const DEFAULT: DhikrState = { label: 'Subhanallah', count: 0, target: 33 }

export default function DhikrCounter() {
  const [state, setState] = useState<DhikrState>(DEFAULT)
  const [ready, setReady] = useState(false)

  const storageKey = `dhikr_${todayISO()}`

  // Load today's count from localStorage (resets automatically when the date changes).
  useEffect(() => {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      try {
        setState(JSON.parse(raw))
      } catch {
        setState(DEFAULT)
      }
    } else {
      setState(DEFAULT)
    }
    setReady(true)
  }, [storageKey])

  const persist = (next: DhikrState) => {
    setState(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }

  const increment = () => persist({ ...state, count: state.count + 1 })
  const reset = () => persist({ ...state, count: 0 })
  const setLabel = (label: string) => persist({ ...state, count: 0, label })

  const pct = Math.min((state.count / state.target) * 100, 100)
  const reached = state.count >= state.target

  if (!ready) return <section className="card p-5" />

  return (
    <section className="card flex flex-col items-center gap-4 p-5">
      <div className="flex w-full items-center justify-between">
        <h3 className="widget-title">Dzikir Counter</h3>
        <button onClick={reset} className="icon-btn h-7 w-7" aria-label="Reset">
          <RotateCcw size={14} />
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setLabel(p)}
            className={`chip transition-colors ${
              state.label === p ? 'bg-highlight/15 text-highlight' : 'bg-bg text-muted hover:text-text'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <button
        onClick={increment}
        className="relative flex h-32 w-32 items-center justify-center rounded-full border-2 border-border bg-bg transition-transform active:scale-95"
        style={{
          background: `conic-gradient(var(--highlight) ${pct}%, var(--bg) ${pct}%)`,
        }}
        aria-label="Increment dhikr"
      >
        <span className="flex h-[112px] w-[112px] flex-col items-center justify-center rounded-full bg-surface">
          <span className="text-3xl font-bold tabular-nums">{state.count}</span>
          <span className="text-xs text-muted">/ {state.target}</span>
        </span>
      </button>

      <p className="text-sm font-medium text-highlight">
        {reached ? `${state.label} ✓ tercapai` : state.label}
      </p>
    </section>
  )
}
