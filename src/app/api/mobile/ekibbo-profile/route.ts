import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { numericId } from '@/lib/mobile/ekibbo-adapter'

/**
 * GET /api/mobile/ekibbo-profile
 *
 * Signed-in officer/farmer profile in the upstream envelope:
 *   { result, data: { staff_data: { id, user_id, user_type, first_name,
 *     last_name, gender, email, phone_number, lat, lng, status, ... } } }
 *
 * Derived from the Bearer-token context.
 *
 * PUT /api/mobile/ekibbo-profile
 *
 * Self-service profile update from the mobile app (Profile → Edit).
 * Accepts first_name, last_name, phone_number, email. Phone is unique
 * across users — duplicates are rejected with a friendly message.
 * Role/tenant/active-status are never editable from the app.
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    const user = await db.user.findFirst({
      where: { id: ctx.userId },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        role: true, isActive: true, createdAt: true, updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ result: false, message: 'User not found' }, { status: 404 })
    }

    const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
    return NextResponse.json({
      result: true,
      data: {
        staff_data: {
          id: numericId(user.id),
          user_id: numericId(user.id),
          user_type: user.role,
          first_name: user.firstName,
          last_name: user.lastName,
          name,
          gender: '',
          email: user.email,
          phone_number: user.phone,
          lat: 0,
          lng: 0,
          status: user.isActive ? 'active' : 'inactive',
          created_at: user.createdAt?.toISOString(),
          updated_at: user.updatedAt?.toISOString(),
        },
      },
    })
  } catch (error) {
    console.error('[ekibbo-profile]', error)
    return NextResponse.json({ result: false, message: 'Failed to load profile' }, { status: 500 })
  }
}

// ── PUT (self-service update) ─────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    const user = await db.user.findFirst({
      where: { id: ctx.userId },
      select: { id: true, phone: true, email: true },
    })
    if (!user) {
      return NextResponse.json({ result: false, message: 'User not found' }, { status: 404 })
    }

    const body = await req.json().catch(() => ({})) as Record<string, unknown>

    const firstName = body.first_name !== undefined ? String(body.first_name ?? '').trim() : undefined
    const lastName = body.last_name !== undefined ? String(body.last_name ?? '').trim() : undefined
    const phone = body.phone_number !== undefined ? String(body.phone_number ?? '').trim() : undefined
    const email = body.email !== undefined ? String(body.email ?? '').trim() : undefined

    if (firstName === '' || lastName === '') {
      return NextResponse.json({ result: false, message: 'First name and last name cannot be empty' }, { status: 400 })
    }
    if (phone === '') {
      return NextResponse.json({ result: false, message: 'Phone number cannot be empty' }, { status: 400 })
    }
    // Basic phone sanity: digits, +, spaces, dashes — at least 7 digits.
    if (phone && (phone.replace(/\D/g, '').length < 7 || /[^\d+\-\s()]/.test(phone))) {
      return NextResponse.json({ result: false, message: 'Please enter a valid phone number' }, { status: 400 })
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ result: false, message: 'Please enter a valid email address' }, { status: 400 })
    }

    // Phone is globally unique — reject duplicates owned by OTHER users.
    if (phone && phone !== user.phone) {
      const dup = await db.user.findFirst({ where: { phone, NOT: { id: user.id } }, select: { id: true } })
      if (dup) {
        return NextResponse.json(
          { result: false, message: 'This phone number is already used by another account' },
          { status: 409 },
        )
      }
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email: email === '' ? null : email }),
      },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        role: true, isActive: true, createdAt: true, updatedAt: true,
      },
    })

    return NextResponse.json({
      result: true,
      message: 'Profile updated',
      data: {
        staff_data: {
          id: numericId(updated.id),
          user_id: numericId(updated.id),
          user_type: updated.role,
          first_name: updated.firstName,
          last_name: updated.lastName,
          name: `${updated.firstName ?? ''} ${updated.lastName ?? ''}`.trim(),
          gender: '',
          email: updated.email,
          phone_number: updated.phone,
          lat: 0,
          lng: 0,
          status: updated.isActive ? 'active' : 'inactive',
          created_at: updated.createdAt?.toISOString(),
          updated_at: updated.updatedAt?.toISOString(),
        },
      },
    })
  } catch (error) {
    console.error('[ekibbo-profile PUT]', error)
    return NextResponse.json({ result: false, message: 'Failed to update profile' }, { status: 500 })
  }
}
