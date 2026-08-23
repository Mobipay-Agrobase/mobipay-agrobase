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
