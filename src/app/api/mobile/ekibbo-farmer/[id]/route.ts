import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { mapFarmer, resolveFarmerByNumericId, farmerSelect } from '@/lib/mobile/ekibbo-adapter'

/**
 * GET /api/mobile/ekibbo-farmer/[id]
 *   id = numeric upstream id | 'me' (signed-in farmer)
 *
 * Farmer detail in the upstream envelope:
 *   { result, data: { farmer_data: {...} } }
 *
 * Tenant-scoped — numeric ids from another tenant never resolve.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const { id } = await params

    let farmer: Record<string, unknown> | null = null

    if (id === 'me') {
      const own = await db.farmerProfile.findFirst({
        where: { ...tf, userId: ctx.userId },
        select: farmerSelect,
      })
      farmer = own ? mapFarmer(own as any) : null
    } else {
      const numId = parseInt(id, 10)
      if (Number.isNaN(numId)) {
        return NextResponse.json({ result: false, message: 'Invalid farmer id' }, { status: 400 })
      }
      const own = await resolveFarmerByNumericId(tf, numId)
      farmer = own ? mapFarmer(own) : null
    }

    if (!farmer) {
      return NextResponse.json({ result: false, message: 'Farmer not found' }, { status: 404 })
    }

    return NextResponse.json({ result: true, data: { farmer_data: farmer } })
  } catch (error) {
    console.error('[ekibbo-farmer/[id]]', error)
    return NextResponse.json({ result: false, message: 'Failed to fetch farmer' }, { status: 500 })
  }
}
