import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { createMobileToken } from '@/lib/mobile/mobile-token'

/**
 * POST /api/auth/mobile-login
 *   Custom login endpoint for the Flutter mobile app.
 *   Returns a signed token + user info as JSON (not cookie-based).
 *
 *   Body: { email: string, password: string }
 *   Returns: { token, user: { id, email, name, role, tenantId } }
 *
 *   This bypasses NextAuth's CSRF/cookie flow which doesn't work
 *   with a Flutter HTTP client.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email or phone (case-insensitive email — "Sophie@ekibbo.com" == "sophie@ekibbo.com")
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: 'insensitive' } },
          { phone: email },
        ],
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        passwordHash: true,
        role: true,
        tenantId: true,
        firstName: true,
        lastName: true,
        twoFactorEnabled: true,
      },
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const { valid: isValid, needsRehash } = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // If the password hash is legacy bcrypt, silently re-hash with Argon2id
    if (needsRehash) {
      const { hashPassword } = await import('@/lib/password')
      const newHash = await hashPassword(password)
      await db.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      })
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    // Issue a SIGNED token containing user info.
    // Format: base64url(payload JSON).base64url(HMAC-SHA256(payload))
    // The middleware verifies the signature + expiry WITHOUT a DB call
    // (Edge Runtime can't use Prisma). Old unsigned tokens are rejected.
    // Signing key: MOBILE_TOKEN_SECRET, falling back to NEXTAUTH_SECRET.
    const token = await createMobileToken(user.id, user.role, user.tenantId)

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        tenantId: user.tenantId,
      },
    })
  } catch (error) {
    console.error('[mobile-login]', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
