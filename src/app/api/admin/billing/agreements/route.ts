/**
 * GET    /api/admin/billing/agreements          — list all agreements
 * POST   /api/admin/billing/agreements          — create a new agreement
 * PUT    /api/admin/billing/agreements/[id]     — update agreement (with audit log)
 *
 * SUPER_ADMIN only.
 */
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { updateUpfrontInvestment, updateFeeRate } from '@/lib/vendor-financing/engine'

export async function GET() {
  try {
    const ctx = await getTenantContext()
    if (!ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const agreements = await db.billingAgreement.findMany({
      include: {
        tenant: { select: { id: true, name: true, country: true } },
        investmentChanges: { orderBy: { changedAt: 'desc' }, take: 10, include: { } },
        feeRateChanges: { orderBy: { changedAt: 'desc' }, take: 10 },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ agreements })
  } catch (error: any) {
    console.error('[billing/agreements GET] error:', error)
    return NextResponse.json({ error: 'Failed to load agreements' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    if (!ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.tenantId || !body.billingModel) {
      return NextResponse.json({ error: 'tenantId and billingModel are required' }, { status: 400 })
    }

    // Deactivate any existing ACTIVE agreement for this tenant
    await db.billingAgreement.updateMany({
      where: { tenantId: body.tenantId, status: 'ACTIVE' },
      data: { status: 'SUPERSEDED', endDate: new Date() },
    })

    // Create the new agreement
    const agreement = await db.billingAgreement.create({
      data: {
        tenantId: body.tenantId,
        billingModel: body.billingModel,
        costTrackingMode: body.costTrackingMode || 'FIXED',
        subscriptionAmount: body.subscriptionAmount || null,
        subscriptionCurrency: body.subscriptionCurrency || null,
        subscriptionCycle: body.subscriptionCycle || null,
        feeType: body.feeType || null,
        feeRate: body.feeRate || null,
        feeAppliesTo: body.feeAppliesTo || null,
        feeMinPerTxn: body.feeMinPerTxn || 0,
        feeMaxPerMonth: body.feeMaxPerMonth || null,
        upfrontInvestment: body.upfrontInvestment || null,
        recoveryPeriodMonths: body.recoveryPeriodMonths || null,
        recurringMonthlyCost: body.recurringMonthlyCost || null,
        status: 'ACTIVE',
        startDate: new Date(),
      },
    })

    return NextResponse.json({ agreement }, { status: 201 })
  } catch (error: any) {
    console.error('[billing/agreements POST] error:', error)
    return NextResponse.json({ error: 'Failed to create agreement', details: error?.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const ctx = await getTenantContext()
    if (!ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { agreementId, action } = body

    if (!agreementId || !action) {
      return NextResponse.json({ error: 'agreementId and action are required' }, { status: 400 })
    }

    switch (action) {
      case 'updateInvestment':
        await updateUpfrontInvestment({
          agreementId,
          newAmount: parseFloat(body.newAmount),
          changedByUserId: ctx.userId,
          reason: body.reason || 'No reason provided',
        })
        return NextResponse.json({ ok: true, message: 'Investment amount updated' })

      case 'updateFeeRate':
        await updateFeeRate({
          agreementId,
          newRate: parseFloat(body.newRate),
          changedByUserId: ctx.userId,
          reason: body.reason || 'No reason provided',
        })
        return NextResponse.json({ ok: true, message: 'Fee rate updated' })

      case 'terminate':
        await db.billingAgreement.update({
          where: { id: agreementId },
          data: { status: 'TERMINATED', endDate: new Date() },
        })
        return NextResponse.json({ ok: true, message: 'Agreement terminated' })

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[billing/agreements PUT] error:', error)
    return NextResponse.json({ error: 'Failed to update agreement', details: error?.message }, { status: 500 })
  }
}
