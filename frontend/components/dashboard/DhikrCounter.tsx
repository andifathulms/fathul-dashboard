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

  if (!ready) return <section className="card h-[268px]" />

  return (
    <section className="card flex flex-col items-center gap-4 p-4">
      <div className="flex w-full items-center justify-between">
        <h3 className="widget-title">Dhikr counter</h3>
        <button onClick={reset} className="icon-btn h-7 w-7" aria-label="Reset count" title="Reset count">
          <RotateCcw size={14} />
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setLabel(p)}
            className={`chip transition-colors ${
              state.label === p
                ? 'bg-highlight/10 text-highlight ring-1 ring-inset ring-highlight/25'
                : 'bg-surface2 text-muted hover:text-text'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <button
        onClick={increment}
        className="relative flex h-32 w-32 items-center justify-center rounded-full transition-transform active:scale-95"
        style={{
          background: `conic-gradient(rgb(var(--highlight)) ${pct}%, rgb(var(--surface-2)) ${pct}%)`,
        }}
        aria-label={`Count ${state.label}. Currently ${state.count} of ${state.target}.`}
      >
        <span className="flex h-[112px] w-[112px] flex-col items-center justify-center rounded-full bg-surface shadow-card">
          <span className="font-display text-3xl font-semibold tnum">{state.count}</span>
          <span className="text-sm text-muted tnum">/ {state.target}</span>
        </span>
      </button>

      <p className="text-base font-medium">
        {reached ? (
          <span className="text-highlight">{state.label} — target reached</span>
        ) : (
          <span className="text-text2">Tap to count {state.label}</span>
        )}
      </p>
    </section>
  )
}
