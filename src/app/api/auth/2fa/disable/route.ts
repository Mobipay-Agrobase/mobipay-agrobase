/**
 * POST /api/auth/2fa/disable
 * Disables 2FA. Requires current TOTP code or backup code.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { db } from '@/lib/db'
import { verifySync } from 'otplib'
import bcrypt from 'bcryptjs'
import { logAction } from '@/lib/security/audit-logger'

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!ctx.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { code } = body

    const user = await db.user.findUnique({
      where: { id: ctx.userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true, twoFactorBackupCodes: true },
    })

    if (!user || !user.twoFactorEnabled) {
      return NextResponse.json({ error: '2FA is not enabled' }, { status: 400 })
    }

    let verified = false

    // Check TOTP code
    if (code && code.length === 6 && user.twoFactorSecret) {
      try { const r = verifySync({ token: code, secret: user.twoFactorSecret }); verified = 'valid' in r ? r.valid : false } catch {}
    }

    // Check backup codes
    if (!verified && code && user.twoFactorBackupCodes) {
      const hashedCodes: string[] = JSON.parse(user.twoFactorBackupCodes)
      for (const hashed of hashedCodes) {
        if (await bcrypt.compare(code.toUpperCase(), hashed)) {
          verified = true
          break
        }
      }
    }

    if (!verified) {
      return NextResponse.json({ error: 'Invalid code or backup code' }, { status: 400 })
    }

    await db.user.update({
      where: { id: ctx.userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
        twoFactorEnrolledAt: null,
      },
    })

    await logAction({
      userId: ctx.userId, tenantId: ctx.tenantId, action: '2FA_DISABLED',
      entityType: 'User', entityId: ctx.userId,
      ipAddress: request.headers.get('x-forwarded-for') || '',
    })

    return NextResponse.json({ success: true, message: '2FA disabled' })
  } catch (error: any) {
    console.error('[2fa/disable] error:', error)
    return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 })
  }
}
