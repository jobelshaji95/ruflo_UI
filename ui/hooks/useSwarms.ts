'use client'

import { useCallback } from 'react'
import { useRufloStore } from '@/store/rufloStore'
import type { RufloSwarm } from '@/types/ruflo'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export function useSwarms(): { swarms: RufloSwarm[]; refetch: () => Promise<void> } {
  const swarms = useRufloStore((s) => s.swarms)
  const setSwarms = useRufloStore((s) => s.setSwarms)

  const refetch = useCallback(async () => {
    try {
      const data: RufloSwarm[] = await fetch(`${API_URL}/swarms`).then((r) => r.json())
      setSwarms(data)
    } catch {
      // API not yet reachable — store stays as-is
    }
  }, [setSwarms])

  return { swarms, refetch }
}
