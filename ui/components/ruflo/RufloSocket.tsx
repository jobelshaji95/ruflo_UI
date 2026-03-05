'use client'

import { useRufloSocket } from '@/hooks/useRufloSocket'
import { useRufloStore } from '@/store/rufloStore'
import { DbStatusBanner } from './DbStatusBanner'

export function RufloSocket() {
  useRufloSocket()
  const dbStatus = useRufloStore((s) => s.dbStatus)
  return <DbStatusBanner status={dbStatus} />
}
