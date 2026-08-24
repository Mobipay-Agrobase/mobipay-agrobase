import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { numericId } from '@/lib/mobile/ekibbo-adapter'
import { isMobileStaff } from '@/lib/mobile/ekibbo-mobile-utils'

/**
 * GET /api/mobile/ekibbo-purchases
 *
 * Mobile Purchases list, served from the WEB PLATFORM's Purchase table
 * (the same rows the web purchase workflow creates — Ekibbo-enhanced
 * fields included), shaped for the mobile procurement list screen:
 *
 * { result, data: {
 *     data: [ { id, transaction_date, procurement_code, total_amount,
 *               warehouse: {...}, booking: { vehicle: {...} },
 *               details: [ { farmer_id, actual_qty, actual_sub_total } ],
 *               other_costs: [] } ],
 *     total, current_page, last_page } }
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    if (!isMobileStaff(ctx.role)) {
      return NextResponse.json({ result: false, message: 'Not authorized' }, { status: 403 })
    }

    // EKIBBO purchases carry tenantId; keep the tenant scope while allowing
    // older rows (null tenantId) created before the Ekibbo workflow landed.
    const where = {
      OR: [{ tenantId: ctx.tenantId }, { tenantId: null }],
    }

    const rows = await db.purchase.findMany({
      where,
      include: {
        farmer: { select: { id: true, firstName: true, lastName: true, farmerCode: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const data = rows.map(p => ({
      id: numericId(p.id),
      transaction_date: p.createdAt.toISOString().split('T')[0],
      procurement_code: `PUR-${numericId(p.id).toString().slice(-8)}`,
      booking_id: 0,
      warehouse_id: 0,
      total_amount: Math.round(Number(p.totalAmount ?? p.netPayment ?? 0)),
      staff_id: 0,
      lat: 0.0,
      lng: 0.0,
      warehouse: {
        id: 0, staff_id: 0, name: 'Field Purchase', code: '', capacity: 0,
        type: '', lat: 0.0, lng: 0.0, address: '', status: '',
        created_at: '', updated_at: '',
      },
      booking: {
        id: 0, booking_code: '', booking_date: '',
        vehicle: {
          id: 0, type_id: 0, license_number: '', driver_name: '',
          driver_phone_number: '', capacity: 0, status: '',
          driver_photo: null, driver_id_photo: null, document: null,
          created_at: null, updated_at: '',
        },
      },
      details: [
        {
          id: numericId(p.id),
          procurement_id: numericId(p.id),
          farmer_id: p.farmerId ? numericId(p.farmerId) : 0,
          crop_harvest_detail_id: 0,
          actual_qty: Math.round(Number(p.quantity) || 0),
          actual_sub_total: Math.round(Number(p.totalAmount) || 0),
          created_at: p.createdAt.toISOString(),
          updated_at: p.updatedAt.toISOString(),
        },
      ],
      other_costs: [],
      // Extra Ekibbo context the web rows carry (mobile renders what it
      // knows; these fields are informational).
      commodity: p.commodity,
      variety: p.variety ?? '',
      status: p.status,
      farmer_name: p.farmer
        ? `${p.farmer.firstName ?? ''} ${p.farmer.lastName ?? ''}`.trim()
        : (p.initiatedBy ?? ''),
      farmer_code: p.farmer?.farmerCode ?? '',
    }))

    return NextResponse.json({
      result: true,
      data: {
        data,
        total: data.length,
        current_page: 1,
        last_page: 1,
      },
    })
  } catch (error) {
    console.error('[ekibbo-purchases]', error)
    return NextResponse.json({ result: false, message: 'Failed to load purchases' }, { status: 500 })
  }
}
