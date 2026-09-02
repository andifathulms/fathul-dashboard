'use client'

import { SWRConfig } from 'swr'

import FocusProvider from '@/components/focus/FocusProvider'
import { ConfirmProvider } from '@/components/ui/ConfirmDialog'
import { ToastProvider } from '@/components/ui/Toast'
import { fetcher } from '@/lib/api'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ fetcher, revalidateOnFocus: false }}>
      <ToastProvider>
        <ConfirmProvider>
          <FocusProvider>{children}</FocusProvider>
        </ConfirmProvider>
      </ToastProvider>
    </SWRConfig>
  )
}
