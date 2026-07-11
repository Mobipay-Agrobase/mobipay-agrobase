/**
 * GET /api/nssf/cron/settle?key=<CRON_SECRET>
 * Weekly cron: auto-create settlement batches for all tenants with unsettled NSSF contributions.
 * Schedule: 0 2 * * 1 (every Monday at 2 AM UTC)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    const cronSecret = process.env.IMPACT_CRON_SECRET || process.env.CRON_SECRET

    if (!cronSecret || key !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find all tenants with unsettled NSSF contributions
    const tenantsWithUnsettled = await db.nssfContribution.groupBy({
      by: ['tenantId'],
      where: { status: 'COMPLETED', settlementStatus: 'UNSETTLED' },
      _count: true,
      _sum: { amount: true },
    })

    const results: any[] = []

    for (const { tenantId, _count, _sum } of tenantsWithUnsettled) {
      try {
        const unsettled = await db.nssfContribution.findMany({
          where: { tenantId, status: 'COMPLETED', settlementStatus: 'UNSETTLED' },
          orderBy: { contributionDate: 'asc' },
        })

        if (unsettled.length === 0) continue

        const totalAmount = Number(_sum.amount || 0)
        const commissionAmount = totalAmount * 0.30
        const mobipayShare = commissionAmount * 0.50
        const klimotrustShare = commissionAmount * 0.50

        const periodStart = unsettled[0].contributionDate
        const periodEnd = unsettled[unsettled.length - 1].contributionDate

        const settlement = await db.fundSettlement.create({
          data: {
            tenantId,
            settlementNumber: `STL-${Date.now()}-${tenantId.slice(-4)}`,
            periodStart,
            periodEnd,
            totalAmount: new Prisma.Decimal(totalAmount),
            contributionCount: unsettled.length,
            currency: 'UGX',
            status: 'PENDING',
            commissionAmount: new Prisma.Decimal(commissionAmount),
            mobipayShare: new Prisma.Decimal(mobipayShare),
            klimotrustShare: new Prisma.Decimal(klimotrustShare),
            createdById: 'cron',
            notes: 'Auto-generated weekly settlement',
          },
        })

        await db.nssfContribution.updateMany({
          where: { id: { in: unsettled.map(c => c.id) } },
          data: { settlementStatus: 'SETTLED', settlementId: settlement.id },
        })

        results.push({ tenantId, status: 'success', count: unsettled.length, totalAmount })
      } catch (e: any) {
        results.push({ tenantId, status: 'error', error: e.message })
      }
    }

    return NextResponse.json({ totalTenants: tenantsWithUnsettled.length, results })
  } catch (error: any) {
    console.error('[nssf/cron/settle] error:', error)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
