import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { hashPassword } from '@/lib/password'
import { logAction } from '@/lib/security/audit-logger'

/**
 * POST /api/auth/reset-password/confirm
 *
 * Step 2 of the self-service password reset flow (mobile + web).
 *   Verifies the 6-digit OTP previously requested and sets a new password.
 *
 *   Body: { phone?: string, email?: string, otp: string, newPassword: string }
 *   Returns: { ok: true, message }
 */
const ConfirmSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    let validated: z.infer<typeof ConfirmSchema>
    try {
      validated = ConfirmSchema.parse(body)
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

    const user = await db.user.findFirst({
      where: validated.phone
        ? { phone: identifier!, isActive: true }
        : { email: identifier!.toLowerCase(), isActive: true },
      select: {
        id: true,
        tenantId: true,
        phone: true,
        email: true,
        passwordResetToken: true,
        passwordResetExpiresAt: true,
        passwordResetUsedAt: true,
      },
    })

    // Confirmed "no such account" OR no reset pending → uniform response.
    if (!user || !user.passwordResetToken || !user.passwordResetExpiresAt) {
      return NextResponse.json(
        { error: 'Invalid or expired reset code. Please request a new one.' },
        { status: 400 }
      )
    }

    // One-time use: a code that was already consumed can never be reused.
    if (user.passwordResetUsedAt) {
      return NextResponse.json(
        { error: 'This reset code has already been used. Please request a new one.' },
        { status: 400 }
      )
    }

    // Expiry check (5-minute window set in the request step).
    if (Date.now() > new Date(user.passwordResetExpiresAt).getTime()) {
      return NextResponse.json(
        { error: 'This reset code has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Verify the OTP.
    const otpValid = await bcrypt.compare(validated.otp, user.passwordResetToken)
    if (!otpValid) {
      return NextResponse.json(
        { error: 'Incorrect reset code. Please try again.' },
        { status: 400 }
      )
    }

    // All checks pass — hash the new password and clear the reset fields.
    const newPasswordHash = await hashPassword(validated.newPassword)
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        passwordResetUsedAt: new Date(),
      },
    })

    await logAction({
      action: 'PASSWORD_RESET',
      userId: user.id,
      tenantId: user.tenantId,
      entityType: 'User',
      entityId: user.id,
      details: {
        method: validated.phone ? 'reset_by_phone' : 'reset_by_email',
        target: validated.phone ? user.phone : user.email,
      },
    })

    return NextResponse.json({
      ok: true,
      message: 'Your password has been reset successfully. You can now log in.',
    })
  } catch (error) {
    console.error('[reset-password/confirm] error:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}