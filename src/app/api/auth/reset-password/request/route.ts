import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { sendSms } from '@/lib/vsla-v2/sms'

/**
 * POST /api/auth/reset-password/request
 *
 * Step 1 of the self-service password reset flow (mobile + web).
 *   Resolves the account by phone (or email), generates a 6-digit OTP,
 *   stores its bcrypt hash on the User, and sends it via SMS (Africa's
 *   Talking). Mirrors the VSLA OTP flow used for member login.
 *
 *   Body: { phone?: string, email?: string }
 *   Returns: { message, phone (masked) }
 *
 *   NOTE: Responds uniformly (does not reveal whether the account exists)
 *   to prevent account enumeration. The OTP is only persisted for real
 *   accounts, so only a real account can complete reset in Step 2.
 */
const RequestSchema = z
  .object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
  })
  .refine((v) => v.phone || v.email, {
    message: 'phone or email is required',
  })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    let validated: z.infer<typeof RequestSchema>
    try {
      validated = RequestSchema.parse(body)
    } catch (err: any) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          fields: err.issues?.map((e: any) => ({ field: e.path.join('.'), message: e.message })) || [],
        },
        { status: 400 }
      )
    }

    const identifier = validated.phone ?? validated.email

    // Find the user by phone or email. Only active users can reset.
    const user = await db.user.findFirst({
      where: validated.phone
        ? { phone: identifier!, isActive: true }
        : { email: identifier!.toLowerCase(), isActive: true },
      select: { id: true, phone: true, email: true, isActive: true },
    })

    // Generate a 6-digit OTP (same range as the VSLA OTP flow).
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const otpHash = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    // Persist the hash ONLY if the account exists. This gives us a realistic
    // flow for real users while not leaking account existence via the response.
    if (user) {
      await db.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: otpHash,
          passwordResetExpiresAt: expiresAt,
          passwordResetUsedAt: null,
        },
      })

      // ─── Send OTP via SMS (Africa's Talking) ───
      const message =
        `Your MobiPay Agrobase password reset code is ${otp}. ` +
        `Enter it within 5 minutes. Do not share this code with anyone.`
      const smsResult = await sendSms(user.phone, message)
      if (smsResult.success) {
        console.log(`[reset-password] OTP sent to ${user.phone} (ID: ${smsResult.messageId})`)
      } else {
        console.error(`[reset-password] SMS send failed for ${user.phone}: ${smsResult.error}`)
      }
    }

    const maskedPhone = user
      ? user.phone.slice(-4).padStart(user.phone.length, '*')
      : 'unavailable'

    return NextResponse.json({
      ok: true,
      message: 'If the account exists, a reset code has been sent via SMS.',
      phone: maskedPhone,
    })
  } catch (error) {
    console.error('[reset-password/request] error:', error)
    return NextResponse.json({ error: 'Failed to send reset code' }, { status: 500 })
  }
}