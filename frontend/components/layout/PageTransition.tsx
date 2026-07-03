'use client'

import { usePathname } from 'next/navigation'

/**
 * Re-mounts on route change (keyed by pathname) so page content animates in.
 * Purely presentational — a subtle fade + rise for a more polished feel.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="animate-fade-in">
      {children}
    </div>
  )
}
