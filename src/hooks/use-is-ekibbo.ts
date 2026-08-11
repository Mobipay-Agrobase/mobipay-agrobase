'use client'

import { useEffect, useState } from 'react'

/**
 * Detects whether the current session is operating on the Ekibbo tenant.
 *
 * Two signals are combined:
 *  - the user's role starts with `EKB_` (Ekibbo staff roles), and
 *  - the resolved tenant name (from /api/entitlements) contains "EKIBBO".
 *
 * The tenant-name signal is essential for shared/multi-tenant roles such as
 * TENANT_ADMIN, which are NOT role-prefixed by tenant — so the UI (sidebar,
 * command palette, module router) can hide non-Ekibbo modules for them too.
 */
export function useIsEkibboTenant(role?: string): boolean {
  const [isEkibbo, setIsEkibbo] = useState<boolean>(() => !!role?.startsWith('EKB_'))

  useEffect(() => {
    if (role?.startsWith('EKB_')) {
      setIsEkibbo(true)
      return
    }
    let mounted = true
    fetch('/api/entitlements')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!mounted || !d) return
        if (typeof d.tenantName === 'string' && /ekibbo/i.test(d.tenantName)) {
          setIsEkibbo(true)
        }
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [role])

  return isEkibbo
}