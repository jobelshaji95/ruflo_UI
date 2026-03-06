'use client'

import { useEffect, useState } from 'react'
import type { RufloMemoryEntry } from '@/types/ruflo'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface UseMemorySearchResult {
  results: RufloMemoryEntry[]
  loading: boolean
}

export function useMemorySearch(query: string, namespace?: string): UseMemorySearchResult {
  const [results, setResults] = useState<RufloMemoryEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query })
        if (namespace) params.set('ns', namespace)
        const data: RufloMemoryEntry[] = await fetch(
          `${API_URL}/memory/search?${params}`
        ).then((r) => r.json())
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, namespace])

  return { results, loading }
}
