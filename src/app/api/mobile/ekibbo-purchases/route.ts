import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { numericId, resolveFarmerByNumericId } from '@/lib/mobile/ekibbo-adapter'
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

// ─── POST (create) — Ekibbo feedback (Sheet 2, Purchase Module) ────────────
// "Under new purchase, forms of coffee only include the following
//  (Fresh, Kiboko, FAQ)."
// Commodity→form catalog mirrors the web PurchaseFormPage COMMODITY_FORMS.
const COMMODITY_FORMS: Record<string, string[]> = {
  coffee: ['Fresh', 'Kiboko', 'FAQ'],
  cocoa: ['Wet Beans', 'Dry Beans', 'Pods'],
  vanilla: ['Green Vanilla', 'Cured Vanilla'],
  cassava: ['Fresh Tubers', 'Dry Chips', 'Flour'],
  avocado: ['Fresh Fruit'],
  jackfruit: ['Fresh Fruit', 'Slices'],
}
const VALID_COMMODITIES = Object.keys(COMMODITY_FORMS)

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    if (!isMobileStaff(ctx.role)) {
      return NextResponse.json({ result: false, message: 'Not authorized' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const commodity = String(body.commodity ?? '').toLowerCase().trim()
    const form = String(body.form ?? '').trim()

    if (!VALID_COMMODITIES.includes(commodity)) {
      return NextResponse.json(
        { result: false, message: `Commodity must be one of: ${VALID_COMMODITIES.join(', ')}` },
        { status: 400 },
      )
    }
    // Sheet-2 rule: coffee purchases only in Fresh / Kiboko / FAQ (same for
    // other commodities with their fixed form lists).
    const allowedForms = COMMODITY_FORMS[commodity]
    if (!allowedForms.includes(form)) {
      return NextResponse.json(
        { result: false, message: `${commodity} form must be one of: ${allowedForms.join(', ')}` },
        { status: 400 },
      )
    }

    const farmerIdNum = Number(body.farmerId)
    if (!Number.isFinite(farmerIdNum) || farmerIdNum <= 0) {
      return NextResponse.json({ result: false, message: 'Farmer is required' }, { status: 400 })
    }
    const farmer = await resolveFarmerByNumericId(
      buildTenantFilter(ctx) as Record<string, unknown>,
      farmerIdNum,
    )
    if (!farmer) {
      return NextResponse.json({ result: false, message: 'Farmer not found in your tenant' }, { status: 404 })
    }

    const totalWeight = parseFloat(body.totalWeight) || 0
    const dailyPrice = parseFloat(body.dailyPrice) || 0
    if (totalWeight <= 0) {
      return NextResponse.json({ result: false, message: 'Total weight must be greater than zero' }, { status: 400 })
    }
    if (dailyPrice <= 0) {
      return NextResponse.json({ result: false, message: 'Daily price must be greater than zero' }, { status: 400 })
    }

    // Ekibbo moisture logic (web PurchaseFormPage parity):
    //   moisture deduction = excess% × (weight/100), capped at total weight
    //   net weight         = total − quality deduction − moisture deduction
    //   total               = net weight × daily price
    //   net payment         = total − loan − input − MoMo charges − MoMo tax
    const moisture = parseFloat(body.moistureReading) || 0
    const threshold = parseFloat(body.moistureThreshold) || 13
    const qualityDeduction = parseFloat(body.qualityDeduction) || 0
    const loanDeduction = parseFloat(body.loanDeduction) || 0
    const inputDeduction = parseFloat(body.inputDeduction) || 0
    const momoCharges = parseFloat(body.momoCharges) || 0
    const momoTax = parseFloat(body.momoTax) || 0
    const defectCount = parseInt(body.defectCount) || null

    const moistureExcess = Math.max(0, moisture - threshold)
    const moistureDeduction = Math.min(totalWeight, moistureExcess * (totalWeight / 100))
    const netWeight = Math.max(0, totalWeight - qualityDeduction - moistureDeduction)
    const totalAmount = netWeight * dailyPrice
    const netPayment = totalAmount - loanDeduction - inputDeduction - momoCharges - momoTax

    const purchase = await db.purchase.create({
      data: {
        farmerId: farmer.id,
        commodity,
        variety: form,
        quantity: String(body.totalWeight),
        unitPrice: dailyPrice,
        totalAmount,
        status: 'PENDING',
        initiatedBy: ctx.userId,
        tenantId: ctx.tenantId,
        moistureReading: body.moistureReading ? moisture : null,
        moistureThreshold: body.moistureThreshold ? threshold : null,
        moistureDeduction,
        defectCount,
        qualityDeduction: body.qualityDeduction ? qualityDeduction : null,
        netWeight,
        dailyPrice,
        loanDeduction: body.loanDeduction ? loanDeduction : null,
        inputDeduction: body.inputDeduction ? inputDeduction : null,
        momoCharges: body.momoCharges ? momoCharges : null,
        momoTax: body.momoTax ? momoTax : null,
        netPayment,
        approvalStatus: 'SUBMITTED',
      },
    })

    // Vendor-financing fee hook (same as the web POST — non-critical).
    try {
      const { recordTransactionFee } = await import('@/lib/vendor-financing/engine')
      await recordTransactionFee({
        tenantId: ctx.tenantId,
        transactionType: 'PURCHASE',
        transactionId: purchase.id,
        transactionAmount: Number(totalAmount || 0),
        transactionQuantity: totalWeight,
        momoGatewayFee: momoCharges + momoTax,
      })
    } catch (feeError) {
      console.error('[ekibbo-purchases POST] fee hook error:', feeError)
    }

    return NextResponse.json({
      result: true,
      data: {
        id: numericId(purchase.id),
        net_weight: netWeight,
        total_amount: totalAmount,
        net_payment: netPayment,
        moisture_deduction: moistureDeduction,
      },
    })
  } catch (error) {
    console.error('[ekibbo-purchases POST]', error)
    return NextResponse.json({ result: false, message: 'Failed to create purchase' }, { status: 500 })
  }
}
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
