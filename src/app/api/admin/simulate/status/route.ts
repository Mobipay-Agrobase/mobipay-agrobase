import { NextRequest, NextResponse } from 'next/server'

import { verifySimulateCookie } from '@/lib/security/simulate-cookie'

/**
 * GET /api/admin/simulate/status
 *   Returns the current simulation state by verifying the `simulate_tenant`
 *   cookie (HMAC signature + expiry — forged or tampered values are treated
 *   as "not simulating" and the cookie is cleared).
 *   Used by the TopBar to render the simulation banner.
 *   SUPER_ADMIN only — non-super-admins always receive { simulating: false }
 *   even if a cookie somehow exists (defence in depth; the cookie is set
 *   only by /start which checks SUPER_ADMIN, but belt-and-braces).
 */
export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('simulate_tenant')?.value
  if (!cookie) {
    return NextResponse.json({ simulating: false })
  }

  const payload = await verifySimulateCookie(cookie)
  if (!payload) {
    // Unsigned (legacy), tampered, or expired cookie — clear it.
    const response = NextResponse.json({ simulating: false })
    response.cookies.delete('simulate_tenant')
    return response
  }

  return NextResponse.json({
    simulating: true,
    tenantId: payload.tenantId,
    tenantName: payload.tenantName,
    tenantType: payload.tenantType,
    country: payload.country ?? null,
    defaultCurrency: payload.defaultCurrency ?? null,
    startedAt: payload.startedAt,
    expiresAt: payload.expiresAt,
    startedBy: payload.startedBy,
    remainingSeconds: Math.max(0, Math.floor((payload.expiresAt - Date.now()) / 1000)),
  })
}
