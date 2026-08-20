import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'

/**
 * POST /api/auth/mobile-login
 *   Custom login endpoint for the Flutter mobile app.
 *   Returns a JWT-like token + user info as JSON (not cookie-based).
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

    // Find user by email or phone
    const user = await db.user.findFirst({
      where: {
        OR: [{ email }, { phone: email }],
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

    // Generate a token containing user info (base64-encoded).
    // Format: base64(userId:role:tenantId:timestamp)
    // The middleware decodes this WITHOUT a DB call (Edge Runtime can't use Prisma).
    const token = Buffer.from(`${user.id}:${user.role}:${user.tenantId}:${Date.now()}`).toString('base64')

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
