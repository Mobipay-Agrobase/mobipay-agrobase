/**
 * POST /api/auth/2fa/verify
 * Verifies a TOTP code and enables 2FA.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { db } from '@/lib/db'
import { verifySync } from 'otplib'
import { logAction } from '@/lib/security/audit-logger'

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!ctx.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { code } = body

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: ctx.userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    })

    if (!user || user.twoFactorEnabled) {
      return NextResponse.json({ error: 'Invalid state' }, { status: 400 })
    }

    if (!user.twoFactorSecret) {
      return NextResponse.json({ error: '2FA not set up. Call /api/auth/2fa/setup first.' }, { status: 400 })
    }

    const result = verifySync({ token: code, secret: user.twoFactorSecret })
    const isValid = 'valid' in result ? result.valid : false

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
    }

    await db.user.update({
      where: { id: ctx.userId },
      data: { twoFactorEnabled: true, twoFactorEnrolledAt: new Date() },
    })

    await logAction({
      userId: ctx.userId, tenantId: ctx.tenantId, action: '2FA_ENABLED',
      entityType: 'User', entityId: ctx.userId,
      ipAddress: request.headers.get('x-forwarded-for') || '',
    })

    return NextResponse.json({ success: true, message: '2FA enabled successfully' })
  } catch (error: any) {
    console.error('[2fa/verify] error:', error)
    return NextResponse.json({ error: 'Failed to verify 2FA' }, { status: 500 })
  }
}
