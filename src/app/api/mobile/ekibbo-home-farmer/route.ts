import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { numericId } from '@/lib/mobile/ekibbo-adapter'

/**
 * GET /api/mobile/ekibbo-home-farmer
 *
 * Farmer self-service dashboard in the upstream JSON shape:
 *   { result, data: { farmer_id, total_hectares, total_plots,
 *                     est_yield_quantity, loan_ammount, repay_ammount } }
 *
 * Resolves the signed-in user's own farmer profile (tenant-scoped).
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')

    const farmer = await db.farmerProfile.findFirst({
      where: { ...tf, userId: ctx.userId },
      select: {
        id: true,
        farms: { select: { sizeHectares: true, cultivations: { select: { estimatedYield: true } } } },
      },
    })

    if (!farmer) {
      return NextResponse.json({
        result: true,
        data: {
          farmer_id: 0,
          total_hectares: 0,
          total_plots: 0,
          est_yield_quantity: 0,
          loan_ammount: 0,
          repay_ammount: 0,
        },
      })
    }

    const lands = farmer.farms
    const totalHectares = lands.reduce((s, l) => s + (Number(l.sizeHectares) || 0), 0)
    const estYield = lands.reduce(
      (s, l) => s + l.cultivations.reduce((s2, c) => s2 + (Number(c.estimatedYield) || 0), 0),
      0,
    )

    const loans = await db.loanApplication.findMany({
      where: {
        farmerId: farmer.id,
        status: { in: ['APPROVED', 'DISBURSED', 'COMPLETED', 'OVERDUE'] },
      },
      select: { amount: true },
    })
    const loanTotal = loans.reduce((s, l) => s + (Number(l.amount) || 0), 0)

    return NextResponse.json({
      result: true,
      data: {
        farmer_id: numericId(farmer.id),
        total_hectares: Math.round(totalHectares * 100) / 100,
        total_plots: lands.length,
        est_yield_quantity: estYield,
        loan_ammount: loanTotal,
        repay_ammount: 0,
      },
    })
  } catch (error) {
    console.error('[ekibbo-home-farmer]', error)
    return NextResponse.json({ result: false, message: 'Failed to load dashboard' }, { status: 500 })
  }
}
