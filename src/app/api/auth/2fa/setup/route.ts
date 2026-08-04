/**
 * POST /api/auth/2fa/setup
 * Generates a TOTP secret + QR code for the authenticated user.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { db } from '@/lib/db'
import { generateSecret, generateURI } from 'otplib'
import qrcode from 'qrcode'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!ctx.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: ctx.userId },
      select: { email: true, phone: true, twoFactorEnabled: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json({ error: '2FA is already enabled' }, { status: 400 })
    }

    const secret = generateSecret()
    const label = user.email || user.phone || 'user'
    const otpauthUrl = generateURI({ secret, label: label, issuer: 'Agrobase V3' })
    const qrCodeUrl = await qrcode.toDataURL(otpauthUrl)

    // Generate 10 backup codes
    const backupCodes: string[] = []
    for (let i = 0; i < 10; i++) {
      backupCodes.push(Math.random().toString(36).slice(2, 10).toUpperCase())
    }

    const hashedCodes = await Promise.all(backupCodes.map(c => bcrypt.hash(c, 10)))

    await db.user.update({
      where: { id: ctx.userId },
      data: {
        twoFactorSecret: secret,
        twoFactorBackupCodes: JSON.stringify(hashedCodes),
      },
    })

    return NextResponse.json({
      secret,
      qrCodeUrl,
      backupCodes,
      message: 'Scan the QR code with Google Authenticator, then verify with a code from your app.',
    })
  } catch (error: any) {
    console.error('[2fa/setup] error:', error)
    return NextResponse.json({ error: 'Failed to setup 2FA' }, { status: 500 })
  }
}
