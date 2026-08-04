/**
 * VSLA V2 — Member SMS OTP Login (Step 2: Verify OTP)
 * SRS 4: Members log in with SMS credentials
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

const VerifyOtpSchema = z.object({
  memberId: z.string().min(1),
  otp: z.string().length(6, 'OTP must be 6 digits'),
}).strict()

const SECRET = process.env.NEXTAUTH_SECRET || 'dev-only-ephemeral-secret-do-not-use-in-production'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    let validated
    try {
      validated = VerifyOtpSchema.parse(body)
    } catch (err: any) {
      return NextResponse.json({
        error: 'Validation failed',
        fields: err.issues?.map((e: any) => ({ field: e.path.join('.'), message: e.message })) || [],
      }, { status: 400 })
    }

    // Find member
    const member = await db.vslaMemberV2.findUnique({
      where: { memberId: validated.memberId },
      select: { id: true, fullName: true, phone: true, groupId: true, status: true },
    })

    if (!member || member.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Invalid member' }, { status: 401 })
    }

    // Find the most recent unused OTP for this member
    const otpRecord = await db.vslaSmsOtpV2.findFirst({
      where: {
        memberId: member.id,
        purpose: 'LOGIN',
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!otpRecord) {
      return NextResponse.json({ error: 'OTP expired or not found. Request a new one.' }, { status: 401 })
    }

    // Check attempts (max 3)
    if (otpRecord.attempts >= 3) {
      await db.vslaSmsOtpV2.update({
        where: { id: otpRecord.id },
        data: { isUsed: true, usedAt: new Date() },
      })
      return NextResponse.json({ error: 'Too many attempts. Request a new OTP.' }, { status: 429 })
    }

    // Verify OTP
    const otpValid = await bcrypt.compare(validated.otp, otpRecord.otpHash)
    if (!otpValid) {
      await db.vslaSmsOtpV2.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      })
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 })
    }

    // Mark OTP as used
    await db.vslaSmsOtpV2.update({
      where: { id: otpRecord.id },
      data: { isUsed: true, usedAt: new Date() },
    })

    // Generate a member session token (separate from admin NextAuth)
    const token = await new SignJWT({
      memberId: member.id,
      memberIdCode: validated.memberId,
      groupId: member.groupId,
      type: 'VSLA_MEMBER',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .setIssuedAt()
      .sign(new TextEncoder().encode(SECRET))

    return NextResponse.json({
      token,
      member: {
        id: member.id,
        memberId: validated.memberId,
        fullName: member.fullName,
        groupId: member.groupId,
      },
      message: 'Login successful',
    })
  } catch (error) {
    console.error('[vsla-v2/verify-otp POST] error:', error)
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 })
  }
}
