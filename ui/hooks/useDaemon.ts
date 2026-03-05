'use client'

import { useCallback, useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface UseDaemonResult {
  running: boolean
  uptime: number | null // ms since daemon start, parsed from output if available
  lastOutput: string | null
  loading: boolean
  start: () => Promise<void>
  stop: () => Promise<void>
  restart: () => Promise<void>
}

export function useDaemon(): UseDaemonResult {
  const [running, setRunning] = useState(false)
  const [uptime, setUptime] = useState<number | null>(null)
  const [lastOutput, setLastOutput] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const checkStatus = useCallback(async () => {
    try {
      const data: { output: string } = await fetch(`${API_URL}/daemon/status`).then(
        (r) => r.json()
      )
      const output = data.output ?? ''
      setLastOutput(output)
      const isRunning = /running|active|started/i.test(output)
      setRunning(isRunning)
      // Parse uptime seconds if ruflo prints it (e.g. "uptime: 42s")
      const uptimeMatch = output.match(/uptime[:\s]+(\d+)/i)
      setUptime(uptimeMatch ? Number(uptimeMatch[1]) * 1000 : null)
    } catch {
      setRunning(false)
      setUptime(null)
    }
  }, [])

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 10_000)
    return () => clearInterval(interval)
  }, [checkStatus])

  const start = useCallback(async () => {
    setLoading(true)
    try {
      const data: { output: string } = await fetch(`${API_URL}/daemon/start`, {
        method: 'POST',
      }).then((r) => r.json())
      setLastOutput(data.output ?? null)
      await checkStatus()
    } finally {
      setLoading(false)
    }
  }, [checkStatus])

  const stop = useCallback(async () => {
    setLoading(true)
    try {
      const data: { output: string } = await fetch(`${API_URL}/daemon/stop`, {
        method: 'POST',
      }).then((r) => r.json())
      setLastOutput(data.output ?? null)
      await checkStatus()
    } finally {
      setLoading(false)
    }
  }, [checkStatus])

  const restart = useCallback(async () => {
    await stop()
    await new Promise<void>((r) => setTimeout(r, 1_000))
    await start()
  }, [stop, start])

  return { running, uptime, lastOutput, loading, start, stop, restart }
}
