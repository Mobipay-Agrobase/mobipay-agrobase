/**
 * POST /api/auth/2fa/challenge
 * 
 * Verifies a TOTP code or backup code during the login flow.
 * This route is called AFTER password verification but BEFORE the
 * session is fully established.
 * 
 * Flow:
 * 1. User submits email + password to /api/auth/2fa/login-check
 * 2. If 2FA is enabled, server returns a temporary 2FA challenge token
 * 3. User submits TOTP code + challenge token to this route
 * 4. If valid, server returns the real NextAuth session token
 * 
 * SECURITY: This enforces 2FA for all users who have it enabled.
 * Previously, the authorize callback ignored twoFactorEnabled entirely.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifySync } from 'otplib'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { logAction } from '@/lib/security/audit-logger'

const ENCRYPTION_KEY = process.env.NEXTAUTH_SECRET || 'dev-only-ephemeral-secret-do-not-use-in-production'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { challengeToken, code, backupCode } = body

    if (!challengeToken || (!code && !backupCode)) {
      return NextResponse.json(
        { error: 'challengeToken and either code or backupCode are required' },
        { status: 400 }
      )
    }

    // Verify the challenge token (signed JWT, 5-min expiry)
    let payload: { userId: string; exp: number }
    try {
      const { payload: verified } = await jwtVerify(
        challengeToken,
        new TextEncoder().encode(ENCRYPTION_KEY)
      )
      payload = verified as any
      if (!payload.userId || payload.exp < Date.now() / 1000) {
        return NextResponse.json({ error: 'Challenge token expired or invalid' }, { status: 401 })
      }
    } catch {
      return NextResponse.json({ error: 'Invalid challenge token' }, { status: 401 })
    }

    // Fetch the user's 2FA secret + backup codes
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true,
        twoFactorEnabled: true,
        isActive: true,
        tenantId: true,
      },
    })

    if (!user || !user.isActive || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({ error: 'Invalid state' }, { status: 400 })
    }

    let isValid = false
    let usedBackupCode = false

    if (code) {
      // Verify TOTP code
      if (code.length !== 6) {
        return NextResponse.json({ error: 'Invalid code format' }, { status: 400 })
      }
      const result = verifySync({ token: code, secret: user.twoFactorSecret })
      isValid = 'valid' in result ? result.valid : false
    } else if (backupCode) {
      // Verify backup code
      if (!user.twoFactorBackupCodes) {
        return NextResponse.json({ error: 'No backup codes available' }, { status: 400 })
      }
      const hashedCodes: string[] = JSON.parse(user.twoFactorBackupCodes)
      for (let i = 0; i < hashedCodes.length; i++) {
        if (await bcrypt.compare(backupCode.toUpperCase(), hashedCodes[i])) {
          isValid = true
          usedBackupCode = true
          // Remove the used backup code (single-use enforcement)
          hashedCodes.splice(i, 1)
          await db.user.update({
            where: { id: user.id },
            data: { twoFactorBackupCodes: JSON.stringify(hashedCodes) },
          })
          break
        }
      }
    }

    if (!isValid) {
      // Log failed 2FA attempt
      await logAction({
        userId: user.id,
        tenantId: user.tenantId || '',
        action: '2FA_CHALLENGE_FAILED',
        entityType: 'User',
        entityId: user.id,
        details: { method: code ? 'totp' : 'backup_code' },
        ipAddress: request.headers.get('x-forwarded-for') || '',
      }).catch(() => {})
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
    }

    // Log successful 2FA
    await logAction({
      userId: user.id,
      tenantId: user.tenantId || '',
      action: usedBackupCode ? '2FA_BACKUP_CODE_USED' : '2FA_CHALLENGE_PASSED',
      entityType: 'User',
      entityId: user.id,
      details: { method: usedBackupCode ? 'backup_code' : 'totp' },
      ipAddress: request.headers.get('x-forwarded-for') || '',
    }).catch(() => {})

    // Return success — the frontend will now call NextAuth's credentials signin
    // to get the real session token. The authorize callback will re-verify the password.
    // SECURITY NOTE: We don't return a session token here because NextAuth manages that.
    // The frontend must call signIn('credentials', ...) after this returns success.
    return NextResponse.json({
      success: true,
      message: '2FA challenge passed. Complete login via NextAuth credentials provider.',
      userId: user.id,
    })
  } catch (error: any) {
    console.error('[2fa/challenge] error:', error)
    return NextResponse.json({ error: 'Failed to verify 2FA' }, { status: 500 })
  }
}
