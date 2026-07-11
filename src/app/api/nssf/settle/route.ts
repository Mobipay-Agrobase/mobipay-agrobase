/**
 * POST /api/nssf/settle
 * Create a fund settlement batch (unsettled contributions → Klimotrust).
 * MOBIPAY_FINANCE + SUPER_ADMIN only.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { db } from '@/lib/db'
import { logPaymentAction } from '@/lib/security/audit-logger'
import { z } from 'zod'

const settleSchema = z.object({
  tenantId: z.string().min(1),
  destinationAccount: z.string().min(1, 'Destination account is required'),
  destinationName: z.string().min(1, 'Destination name is required'),
  destinationProvider: z.enum(['BANK', 'MTN', 'AIRTEL']),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!ctx.isSuperAdmin && ctx.role !== 'MOBIPAY_FINANCE') {
      return NextResponse.json({ error: 'Finance access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId') || ''

    const where: any = {}
    if (tenantId) where.tenantId = tenantId

    const settlements = await db.fundSettlement.findMany({
      where,
      include: { tenant: { select: { name: true } }, _count: { select: { contributions: true } } },
      orderBy: { settlementDate: 'desc' },
      take: 50,
    })

    return NextResponse.json({ data: settlements })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to load settlements' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!ctx.isSuperAdmin && ctx.role !== 'MOBIPAY_FINANCE') {
      return NextResponse.json({ error: 'Finance access required' }, { status: 403 })
    }

    const body = await request.json()
    const validated = settleSchema.parse(body)

    // Find all unsettled COMPLETED contributions for this tenant
    const unsettled = await db.nssfContribution.findMany({
      where: { tenantId: validated.tenantId, status: 'COMPLETED', settlementStatus: 'UNSETTLED' },
      orderBy: { contributionDate: 'asc' },
    })

    if (unsettled.length === 0) {
      return NextResponse.json({ error: 'No unsettled contributions to settle' }, { status: 400 })
    }

    const totalAmount = unsettled.reduce((sum, c) => sum + Number(c.amount), 0)
    const commissionAmount = totalAmount * 0.30
    const mobipayShare = commissionAmount * 0.50  // placeholder — Eric to confirm split
    const klimotrustShare = commissionAmount * 0.50

    const periodStart = unsettled[0].contributionDate
    const periodEnd = unsettled[unsettled.length - 1].contributionDate

    // Create settlement
    const settlement = await db.fundSettlement.create({
      data: {
        tenantId: validated.tenantId,
        settlementNumber: `STL-${Date.now()}`,
        periodStart,
        periodEnd,
        totalAmount,
        contributionCount: unsettled.length,
        currency: 'UGX',
        status: 'PENDING',
        destinationAccount: validated.destinationAccount,
        destinationName: validated.destinationName,
        destinationProvider: validated.destinationProvider,
        commissionAmount,
        mobipayShare,
        klimotrustShare,
        createdById: ctx.userId,
        notes: validated.notes || null,
      },
    })

    // Mark all contributions as settled
    await db.nssfContribution.updateMany({
      where: { id: { in: unsettled.map(c => c.id) } },
      data: { settlementStatus: 'SETTLED', settlementId: settlement.id },
    })

    // Audit log
    await logPaymentAction({
      userId: ctx.userId,
      tenantId: validated.tenantId,
      action: 'NSSF_SETTLEMENT_CREATED',
      entityType: 'FundSettlement',
      entityId: settlement.id,
      after: { totalAmount, contributionCount: unsettled.length, commissionAmount },
      ipAddress: request.headers.get('x-forwarded-for') || '',
    })

    return NextResponse.json({ data: settlement }, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', fields: error.issues }, { status: 400 })
    }
    console.error('[nssf/settle POST] error:', error)
    return NextResponse.json({ error: 'Failed to create settlement' }, { status: 500 })
  }
}
