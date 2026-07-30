'use client'

import { useState, useEffect, useCallback } from 'react'

export interface SimulationStatus {
  simulating: boolean
  tenantId?: string
  tenantName?: string
  tenantType?: string
  country?: string | null
  defaultCurrency?: string | null
  startedAt?: number
  expiresAt?: number
  startedBy?: string
  remainingSeconds?: number
}

/**
 * Polls /api/admin/simulate/status every 30s to track the active simulation.
 * Returns the latest status + a `refresh` callback for manual refreshes
 * (e.g. after the user clicks "Start" or "Exit").
 */
export function useSimulationStatus(pollIntervalMs: number = 30000) {
  const [status, setStatus] = useState<SimulationStatus>({ simulating: false })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/simulate/status', { credentials: 'same-origin' })
      if (res.ok) {
        const data: SimulationStatus = await res.json()
        setStatus(data)
      } else {
        setStatus({ simulating: false })
      }
    } catch {
      // Network error — keep current state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, pollIntervalMs)
    return () => clearInterval(id)
  }, [refresh, pollIntervalMs])

  return { status, loading, refresh }
}
