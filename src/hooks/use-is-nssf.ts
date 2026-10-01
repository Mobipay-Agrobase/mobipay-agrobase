'use client'

import { useEffect, useState } from 'react'

/**
 * Detects whether the current session is operating on the NSSF (Klimotrust) tenant.
 *
 * Signal: the resolved tenant name (from /api/entitlements) contains "klimo" or "nssf".
 *
 * Used by:
 *   - the sidebar (to show ONLY NSSF-relevant menus)
 *   - the module router (page.tsx — defense-in-depth redirect away from hidden modules)
 *   - the dashboard (to show NSSF-specific KPIs)
 *
 * The NSSF tenant (Klimotrust) is the NGO that operates NSSF voluntary savings
 * on behalf of NSSF Uganda. Extension officers on this tenant enroll farmers
 * via the mobile app's lightweight 5-field form, and the NSSF admin sees all
 * enrolled farmers in the web dashboard.
 */
export function useIsNssfTenant(): boolean {
  const [isNssf, setIsNssf] = useState<boolean>(false)

  useEffect(() => {
    let mounted = true
    fetch('/api/entitlements')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!mounted || !d) return
        if (typeof d.tenantName === 'string' && /klimo|nssf/i.test(d.tenantName)) {
          setIsNssf(true)
        }
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  return isNssf
}
