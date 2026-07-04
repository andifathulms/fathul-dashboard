'use client'

import { useCallback, useEffect, useState } from 'react'
import useSWR from 'swr'

import api, { fetcher } from '@/lib/api'
import { serverPingable } from '@/lib/ssh'
import type { PingResult, Server } from '@/lib/types'

type PingState = Record<number, PingResult & { checkedAt: string | null; checking: boolean }>

export function useServers() {
  const { data: servers, error, isLoading, mutate } = useSWR<Server[]>('/servers/', fetcher)
  const [pings, setPings] = useState<PingState>({})

  const pingServer = useCallback(async (id: number) => {
    setPings((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { status: 'down', latency_ms: null, checkedAt: null }), checking: true },
    }))
    try {
      const { data } = await api.get<PingResult>(`/servers/${id}/ping/`)
      setPings((prev) => ({
        ...prev,
        [id]: { ...data, checkedAt: new Date().toLocaleTimeString('en-US'), checking: false },
      }))
    } catch {
      setPings((prev) => ({
        ...prev,
        [id]: { status: 'down', latency_ms: null, checkedAt: new Date().toLocaleTimeString('en-US'), checking: false },
      }))
    }
  }, [])

  const pingAll = useCallback(() => {
    servers?.filter(serverPingable).forEach((s) => pingServer(s.id))
  }, [servers, pingServer])

  // Auto-ping on load and every 60s.
  useEffect(() => {
    if (!servers?.length) return
    pingAll()
    const id = setInterval(pingAll, 60 * 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servers])

  return { servers, pings, error, isLoading, mutate, pingServer, pingAll }
}
