'use client'

import { useEffect, useState } from 'react'

/**
 * Detects whether the current session is operating on the ZIWA360 dairy tenant.
 *
 * Signal: the resolved tenant name (from /api/entitlements) contains "ZIWA".
 *
 * Used by the module router (page.tsx) to redirect ZIWA360 users away from
 * modules that aren't relevant for a dairy farm (crops, VSLA, NSSF, carbon,
 * traceability, etc.), and by the sidebar to show only the dairy-relevant
 * top-level entries.
 */
export function useIsZiwaTenant(): boolean {
  const [isZiwa, setIsZiwa] = useState<boolean>(false)

  useEffect(() => {
    let mounted = true
    fetch('/api/entitlements')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!mounted || !d) return
        if (typeof d.tenantName === 'string' && /ziwa/i.test(d.tenantName)) {
          setIsZiwa(true)
        }
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  return isZiwa
}
