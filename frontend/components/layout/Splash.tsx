'use client'

import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

/** Brief branded splash (vertical lockup) on a fresh page load — once per tab
 *  session so it doesn't nag on client navigations or repeated reloads. */
export default function Splash() {
  const [state, setState] = useState<'show' | 'fading' | 'done'>('show')

  useEffect(() => {
    if (sessionStorage.getItem('fd_splash')) {
      setState('done')
      return
    }
    sessionStorage.setItem('fd_splash', '1')
    const t1 = setTimeout(() => setState('fading'), 700)
    const t2 = setTimeout(() => setState('done'), 1150)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  if (state === 'done') return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-[120] flex items-center justify-center bg-bg transition-opacity duration-400',
        state === 'fading' ? 'opacity-0' : 'opacity-100'
      )}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(50% 40% at 50% 45%, rgba(56,189,248,0.10), transparent 70%)' }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-lockup-vertical.png" alt="fathul-dashboard" className="w-48 animate-scale-in sm:w-52" />
    </div>
  )
}
