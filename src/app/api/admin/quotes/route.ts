/**
 * GET  /api/admin/quotes  — list quotes (SUPER_ADMIN + MOBIPAY_FINANCE)
 * POST /api/admin/quotes  — create a quote
 */
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const ctx = await getTenantContext()
    if (!ctx.isSuperAdmin && ctx.role !== 'MOBIPAY_FINANCE') {
      return NextResponse.json({ error: 'Finance/Admin access required' }, { status: 403 })
    }

    const quotes = await db.quote.findMany({
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ quotes })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to load quotes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!ctx.isSuperAdmin && ctx.role !== 'MOBIPAY_FINANCE') {
      return NextResponse.json({ error: 'Finance/Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const quote = await db.quote.create({
      data: {
        prospectName: body.prospectName,
        prospectEmail: body.prospectEmail || null,
        prospectPhone: body.prospectPhone || null,
        prospectCountry: body.prospectCountry || null,
        billingModel: body.billingModel,
        feeType: body.feeType || null,
        feeRate: body.feeRate || null,
        subscriptionAmount: body.subscriptionAmount || null,
        upfrontInvestment: body.upfrontInvestment || null,
        recoveryPeriodMonths: body.recoveryPeriodMonths || null,
        recurringMonthlyCost: body.recurringMonthlyCost || null,
        notes: body.notes || null,
        status: 'DRAFT',
        validUntil: body.validUntil ? new Date(body.validUntil) : new Date(Date.now() + 30 * 86400000),
        createdById: ctx.userId,
      },
    })

    return NextResponse.json({ quote }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 })
  }
}
