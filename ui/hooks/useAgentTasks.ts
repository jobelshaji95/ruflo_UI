'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRufloStore } from '@/store/rufloStore'
import type { RufloTask } from '@/types/ruflo'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export function useAgentTasks(agentId: string): { tasks: RufloTask[] } {
  const [tasks, setTasks] = useState<RufloTask[]>([])
  const agent = useRufloStore((s) => s.agents.find((a) => a.id === agentId))
  const isRunning = agent?.status === 'running'

  const fetchTasks = useCallback(() => {
    fetch(`${API_URL}/agents/${agentId}/tasks`)
      .then((r) => r.json())
      .then(setTasks)
      .catch(() => setTasks([]))
  }, [agentId])

  useEffect(() => {
    fetchTasks()
    if (!isRunning) return
    const interval = setInterval(fetchTasks, 2_000)
    return () => clearInterval(interval)
  }, [fetchTasks, isRunning])

  return { tasks }
}
