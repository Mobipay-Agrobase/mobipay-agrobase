import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { numericId, resolveFarmerByNumericId } from '@/lib/mobile/ekibbo-adapter'
import { isMobileStaff } from '@/lib/mobile/ekibbo-mobile-utils'

/**
 * POST /api/mobile/ekibbo-distribution
 *   Mobile Input Allocation submit. Accepts the upstream multipart/JSON
 *   payload: { distribution_date, farmer_id, products: [ { product_id,
 *   product_name, category_id, category_name, quantity, price_per_unit,
 *   available_stocks, unit, stock_id } ] }
 *
 *   Each product line becomes one InputDistribution row on the WEB
 *   PLATFORM (same table as /api/input-distribution) + a FarmerLedgerEntry
 *   debit, so web and mobile show identical data.
 *
 * GET /api/mobile/ekibbo-distribution?per_page=100
 *   Distribution history in the upstream mobile shape.
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    if (!isMobileStaff(ctx.role)) {
      return NextResponse.json({ result: false, message: 'Not authorized' }, { status: 403 })
    }
    const tf = buildTenantFilter(ctx, 'tenantId')

    // Support both multipart/form-data and JSON bodies (the mobile posts
    // FormData; the JSON path keeps curl testing simple).
    let body: Record<string, any> = {}
    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      for (const [k, v] of form.entries()) {
        if (k === 'products') {
          try { body[k] = JSON.parse(String(v)) } catch { body[k] = v }
        } else {
          body[k] = v
        }
      }
    } else {
      body = await req.json()
    }

    const farmerNumId = parseInt(String(body.farmer_id ?? ''), 10)
    const products: any[] = Array.isArray(body.products) ? body.products : []
    if (Number.isNaN(farmerNumId) || products.length === 0) {
      return NextResponse.json(
        { result: false, message: 'farmer_id and products are required' },
        { status: 400 }
      )
    }

    const farmer = await resolveFarmerByNumericId(tf, farmerNumId)
    if (!farmer) {
      return NextResponse.json({ result: false, message: 'Farmer not found' }, { status: 404 })
    }

    const dateRaw = String(body.distribution_date || '')
    const date = dateRaw ? parseDdMmYyyy(dateRaw) : new Date()

    let receiptSeq = 1
    const receiptNo = `DIST-${Date.now().toString().slice(-8)}`
    const created: any[] = []

    for (const p of products) {
      const quantity = Number(p.quantity) || 0
      const unitCost = Number(p.price_per_unit) || 0
      const totalCost = quantity * unitCost
      const inputType = String(p.category_name || 'Input')
      const inputName = String(p.product_name || '')

      const dist = await db.inputDistribution.create({
        data: {
          tenantId: ctx.tenantId,
          farmerId: farmer.id,
          inputType,
          inputName,
          quantity,
          unit: String(p.unit || 'pcs'),
          unitCost,
          totalCost,
          paymentMode: 'CREDIT',
          amountPaid: null,
          balanceRemaining: totalCost,
          status: 'DISTRIBUTED',
          distributionDate: date,
          notes: `via mobile · ${receiptNo}`,
        },
      })
      created.push(dist)

      // Ledger debit (same field shape as the web /api/input-distribution
      // route: amount is negative for a debit, plus reference metadata).
      const lastEntry = await db.farmerLedgerEntry.findFirst({
        where: { farmerId: farmer.id },
        orderBy: { date: 'desc' },
        select: { balanceAfter: true },
      })
      const runningBalance = (lastEntry?.balanceAfter || 0) - totalCost
      await db.farmerLedgerEntry.create({
        data: {
          tenantId: ctx.tenantId,
          farmerId: farmer.id,
          type: 'INPUT_DIST',
          description: `Input distribution: ${inputName || inputType} (${quantity} ${p.unit || 'pcs'})`,
          amount: -totalCost,
          balanceAfter: runningBalance,
          referenceType: 'InputDistribution',
          referenceId: dist.id,
          createdBy: ctx.userId,
          approvalStatus: 'APPROVED',
          approvedBy: ctx.userId,
        },
      })
      receiptSeq++
    }

    return NextResponse.json({
      result: true,
      message: 'Distribution created',
      data: { receipt_no: receiptNo, count: created.length },
    })
  } catch (error: any) {
    console.error('[ekibbo-distribution POST]', error)
    return NextResponse.json({ result: false, message: 'Failed to create distribution' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    if (!isMobileStaff(ctx.role)) {
      return NextResponse.json({ result: false, message: 'Not authorized' }, { status: 403 })
    }
    const tf = buildTenantFilter(ctx, 'tenantId')

    const rows = await db.inputDistribution.findMany({
      where: { ...tf },
      include: {
        farmer: { select: { id: true, firstName: true, lastName: true, farmerCode: true } },
      },
      orderBy: { distributionDate: 'desc' },
      take: 200,
    })

    // Group the web rows into mobile "receipts": each mobile submission
    // creates N InputDistribution rows sharing one receipt_no (stored in
    // notes as "via mobile · DIST-XXXXXXXX").
    const groups = new Map<string, { row: typeof rows[0]; lines: typeof rows }>()
    for (const r of rows) {
      const receiptNo = (r.notes || '').includes('· ')
        ? (r.notes || '').split('· ').pop()!
        : `DIST-${numericId(r.id)}`
      const g = groups.get(receiptNo)
      if (g) g.lines.push(r)
      else groups.set(receiptNo, { row: r, lines: [r] })
    }

    const receipts = Array.from(groups.entries()).map(([receiptNo, g]) => ({
      id: numericId(g.row.id),
      receipt_no: receiptNo,
      farmer_id: numericId(g.row.farmerId),
      province_name: '',
      commune_name: '',
      cooperative_name: '',
      farmer_name: `${g.row.farmer?.firstName ?? ''} ${g.row.farmer?.lastName ?? ''}`.trim(),
      agent_id: 0,
      total_amount: g.lines.reduce((s, l) => s + (Number(l.totalCost) || 0), 0),
      created_at: g.row.createdAt.toISOString(),
      distribution_details: g.lines.map(l => ({
        product_id: numericId(l.id),
        product_name: l.inputName ?? '',
        category_id: 0,
        category_name: l.inputType,
        quantity: Number(l.quantity),
        price_per_unit: Number(l.unitCost),
        available_stocks: 999999,
        unit: l.unit,
        stock_id: numericId(l.id),
      })),
    }))

    return NextResponse.json({
      result: true,
      data: {
        data: receipts,
        last_page: 1,
        current_page: 1,
        total: receipts.length,
      },
    })
  } catch (error) {
    console.error('[ekibbo-distribution GET]', error)
    return NextResponse.json({ result: false, message: 'Failed to load distributions' }, { status: 500 })
  }
}

/** Parse "dd/MM/yyyy" (the mobile date format) → Date. */
function parseDdMmYyyy(s: string): Date {
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return new Date()
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
}
