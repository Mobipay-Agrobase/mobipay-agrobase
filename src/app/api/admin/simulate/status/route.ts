import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/simulate/status
 *   Returns the current simulation state by decoding the `simulate_tenant`
 *   cookie. Used by the TopBar to render the simulation banner.
 *   SUPER_ADMIN only — non-super-admins always receive { simulating: false }
 *   even if a cookie somehow exists (defence in depth; the cookie is set
 *   only by /start which checks SUPER_ADMIN, but belt-and-braces).
 */
export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('simulate_tenant')?.value
  if (!cookie) {
    return NextResponse.json({ simulating: false })
  }

  try {
    const payload = JSON.parse(
      Buffer.from(cookie, 'base64url').toString('utf-8'),
    ) as {
      tenantId: string
      tenantName: string
      tenantType: string
      country?: string | null
      defaultCurrency?: string
      startedAt: number
      expiresAt: number
      startedBy: string
    }

    // Check expiry
    if (Date.now() > payload.expiresAt) {
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
  } catch {
    // Malformed cookie — clear it
    const response = NextResponse.json({ simulating: false })
    response.cookies.delete('simulate_tenant')
    return response
  }
}
