/**
 * POST /api/auth/2fa/login-check
 * 
 * Step 1 of the 2FA login flow.
 * Verifies email + password, then checks if 2FA is enabled.
 * If 2FA is enabled, returns a challenge token (5-min expiry).
 * If 2FA is not enabled, tells the frontend to proceed with normal NextAuth signin.
 * 
 * SECURITY: This route does NOT establish a session. It only verifies credentials
 * and returns either "proceed with signin" or "2FA challenge required".
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { SignJWT } from 'jose'
import { logAction } from '@/lib/security/audit-logger'

const SECRET = process.env.NEXTAUTH_SECRET || 'dev-only-ephemeral-secret-do-not-use-in-production'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Find user by email or phone
    const user = await db.user.findFirst({
      where: {
        OR: [{ email }, { phone: email }],
        isActive: true,
      },
      select: {
        id: true,
        passwordHash: true,
        twoFactorEnabled: true,
        firstName: true,
        lastName: true,
        role: true,
        tenantId: true,
      },
    })

    // SECURITY: Always return the same response shape whether user exists or not
    // to prevent user enumeration via timing differences
    if (!user || !user.passwordHash) {
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500)) // constant-time-ish
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      // Log failed login attempt (for brute-force detection)
      await logAction({
        userId: user.id,
        tenantId: user.tenantId || '',
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: user.id,
        details: { reason: 'invalid_password' },
        ipAddress: request.headers.get('x-forwarded-for') || '',
      }).catch(() => {})
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // If 2FA is NOT enabled, tell frontend to proceed with NextAuth signin
    if (!user.twoFactorEnabled) {
      return NextResponse.json({
        twoFactorRequired: false,
        message: 'Proceed with NextAuth credentials signin',
      })
    }

    // 2FA IS enabled — issue a challenge token (5-min expiry)
    const challengeToken = await new SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('5m')
      .setIssuedAt()
      .sign(new TextEncoder().encode(SECRET))

    return NextResponse.json({
      twoFactorRequired: true,
      challengeToken,
      message: '2FA code required. Submit to /api/auth/2fa/challenge',
    })
  } catch (error: any) {
    console.error('[2fa/login-check] error:', error)
    return NextResponse.json({ error: 'Login check failed' }, { status: 500 })
  }
}
