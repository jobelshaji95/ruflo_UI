'use client'

import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useRufloStore } from '@/store/rufloStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export function useRufloSocket() {
  const setSwarms = useRufloStore((s) => s.setSwarms)
  const setAgents = useRufloStore((s) => s.setAgents)
  const setDbStatus = useRufloStore((s) => s.setDbStatus)
  const setLastDbUpdate = useRufloStore((s) => s.setLastDbUpdate)

  useEffect(() => {
    async function refetch() {
      try {
        const [swarms, agents] = await Promise.all([
          fetch(`${API_URL}/swarms`).then((r) => r.json()),
          fetch(`${API_URL}/agents`).then((r) => r.json()),
        ])
        setSwarms(swarms)
        setAgents(agents)
        setDbStatus('connected')
        setLastDbUpdate(new Date().toISOString())
      } catch {
        setDbStatus('disconnected')
      }
    }

    const socket = io(API_URL, { transports: ['websocket', 'polling'] })

    socket.on('connect', () => {
      setDbStatus('connected')
      refetch()
    })

    socket.on('db:change', () => {
      refetch()
    })

    socket.on('db:stale', () => {
      setDbStatus('stale')
    })

    socket.on('disconnect', () => {
      setDbStatus('disconnected')
    })

    // Initial fetch even before socket connects
    refetch()

    return () => {
      socket.disconnect()
    }
  }, [setSwarms, setAgents, setDbStatus, setLastDbUpdate])
}
