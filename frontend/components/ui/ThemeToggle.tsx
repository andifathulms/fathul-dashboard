'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

/** Light is the default; the choice persists in localStorage and is applied
 *  before first paint by the bootstrap script in app/layout.tsx. */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('fd_theme', next ? 'dark' : 'light')
    } catch {
      /* private mode — the choice just won't persist */
    }
  }

  return (
    <button
      onClick={toggle}
      className="icon-btn"
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Light theme' : 'Dark theme'}
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}
