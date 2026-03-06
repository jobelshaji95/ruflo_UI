'use client'

import { useEffect, useState } from 'react'
import { useRufloStore } from '@/store/rufloStore'
import type { RufloAgent, RufloSwarm } from '@/types/ruflo'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface UseSwarmResult {
  swarm: RufloSwarm | undefined
  agents: RufloAgent[]
  runningAgents: number
  completionPercent: number
  runDuration: number | null // ms since startedAt, or null if not started
}

export function useSwarm(swarmId: string): UseSwarmResult {
  const swarm = useRufloStore((s) => s.swarms.find((sw) => sw.id === swarmId))
  const [agents, setAgents] = useState<RufloAgent[]>([])

  useEffect(() => {
    if (!swarmId) return
    fetch(`${API_URL}/swarms/${swarmId}/agents`)
      .then((r) => r.json())
      .then(setAgents)
      .catch(() => setAgents([]))
  }, [swarmId])

  const runningAgents = agents.filter((a) => a.status === 'running').length

  const completionPercent =
    agents.length === 0
      ? 0
      : Math.round(
          (agents.filter((a) => a.status === 'completed').length / agents.length) * 100
        )

  const runDuration =
    swarm?.startedAt ? Date.now() - new Date(swarm.startedAt).getTime() : null

  return { swarm, agents, runningAgents, completionPercent, runDuration }
}
