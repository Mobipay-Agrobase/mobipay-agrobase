/**
 * VSLA V2 — Member SMS OTP Login (Step 1: Send OTP)
 * SRS 4: Members log in with SMS credentials (PIN + OTP)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const LoginOtpSchema = z.object({
  memberId: z.string().min(1),
  pin: z.string().length(4, 'PIN must be 4 digits'),
}).strict()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    let validated
    try {
      validated = LoginOtpSchema.parse(body)
    } catch (err: any) {
      return NextResponse.json({
        error: 'Validation failed',
        fields: err.issues?.map((e: any) => ({ field: e.path.join('.'), message: e.message })) || [],
      }, { status: 400 })
    }

    // Find member by memberId
    const member = await db.vslaMemberV2.findUnique({
      where: { memberId: validated.memberId },
      select: { id: true, phone: true, pinHash: true, status: true, fullName: true, groupId: true },
    })

    if (!member || member.status !== 'ACTIVE') {
      // Constant-time response to prevent enumeration
      await new Promise(resolve => setTimeout(resolve, 500))
      return NextResponse.json({ error: 'Invalid member ID or PIN' }, { status: 401 })
    }

    // Verify PIN
    if (!member.pinHash) {
      return NextResponse.json({ error: 'PIN not set. Contact your group admin.' }, { status: 400 })
    }
    const pinValid = await bcrypt.compare(validated.pin, member.pinHash)
    if (!pinValid) {
      return NextResponse.json({ error: 'Invalid member ID or PIN' }, { status: 401 })
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const otpHash = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5-minute expiry

    // Save OTP
    await db.vslaSmsOtpV2.create({
      data: {
        memberId: member.id,
        phone: member.phone,
        otpHash,
        otpCode: otp, // TODO: Remove in production — for dev only
        purpose: 'LOGIN',
        expiresAt,
      },
    })

    // ─── Send OTP via SMS (SRS 4) ───
    // TODO: Wire to Africa's Talking
    const otpMessage = `Your MobiPay VSLA login code is ${otp}. It expires in 5 minutes. Do not share this code.`
    console.log(`[SMS] OTP to ${member.phone}: ${otpMessage}`)

    return NextResponse.json({
      message: 'OTP sent to your registered phone number',
      phone: member.phone.slice(-4).padStart(member.phone.length, '*'), // mask phone
    })
  } catch (error) {
    console.error('[vsla-v2/login-otp POST] error:', error)
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}
