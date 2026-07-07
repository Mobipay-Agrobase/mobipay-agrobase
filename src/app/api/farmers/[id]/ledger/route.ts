import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/farmers/[id]/ledger
 *   Returns the complete farmer ledger (all financial + non-financial entries).
 *   Shows: purchases, sales, loans, inputs, trainings, insurance, payments —
 *   all in one chronological view with running balance.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: farmerId } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId') as any

    // Verify farmer belongs to tenant
    const farmer = await db.farmerProfile.findFirst({
      where: { id: farmerId, ...tf },
      select: { id: true, firstName: true, lastName: true, farmerCode: true, phone: true },
    })
    if (!farmer) {
      return NextResponse.json({ error: 'Farmer not found' }, { status: 404 })
    }

    // Get all ledger entries ordered by date
    const entries = await db.farmerLedgerEntry.findMany({
      where: { farmerId, tenantId: ctx.tenantId },
      orderBy: { date: 'desc' },
      take: 500,
    })

    // Calculate summary
    const totalEarned = entries
      .filter(e => e.amount > 0 && (e.type === 'PURCHASE' || e.type === 'SALE'))
      .reduce((sum, e) => sum + e.amount, 0)

    const totalDeducted = entries
      .filter(e => e.amount < 0 && e.type !== 'PAYMENT')
      .reduce((sum, e) => sum + Math.abs(e.amount), 0)

    const totalPaid = entries
      .filter(e => e.type === 'PAYMENT')
      .reduce((sum, e) => sum + Math.abs(e.amount), 0)

    const currentBalance = entries[0]?.balanceAfter || 0

    // Get outstanding balances
    const outstandingLoans = await db.vslaLoan.aggregate({
      _sum: { amount: true },
      where: {
        farmerId,
        status: { in: ['DISBURSED', 'APPROVED'] },
        vslaGroup: { tenantId: ctx.tenantId },
      },
    })

    const outstandingInputs = await db.inputDistribution.aggregate({
      _sum: { balanceRemaining: true },
      where: {
        farmerId,
        tenantId: ctx.tenantId,
        status: { in: ['DISTRIBUTED', 'PARTIALLY_REPAID'] },
      },
    })

    return NextResponse.json({
      farmer,
      entries,
      summary: {
        totalEarned,
        totalDeducted,
        totalPaid,
        currentBalance,
        outstandingLoans: outstandingLoans._sum.amount || 0,
        outstandingInputs: outstandingInputs._sum.balanceRemaining || 0,
      },
    })
  } catch (error: any) {
    console.error('Farmer ledger error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ledger', detail: error.message },
      { status: 500 }
    )
  }
}
