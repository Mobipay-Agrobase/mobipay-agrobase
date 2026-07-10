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
    if (!ctx.isSuperAdmin && ctx.role !== 'MOBIPAY_FINANCE') {
      return NextResponse.json({ error: 'Super Admin or Finance access required' }, { status: 403 })
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
    if (!ctx.isSuperAdmin && ctx.role !== 'MOBIPAY_FINANCE') {
      return NextResponse.json({ error: 'Super Admin or Finance access required' }, { status: 403 })
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

    // ─── Integration: Create Subscription record for SUBSCRIPTION/HYBRID models ───
    // This keeps the existing BillingView (which reads Subscription) working
    // alongside the new BillingAgreement system.
    if (body.billingModel === 'SUBSCRIPTION' || body.billingModel === 'HYBRID') {
      // Deactivate any existing active subscription for this tenant
      await db.subscription.updateMany({
        where: { tenantId: body.tenantId, status: 'ACTIVE' },
        data: { status: 'SUPERSEDED', endDate: new Date() },
      })

      const subAmount = parseFloat(body.subscriptionAmount) || 0
      const cycle = body.subscriptionCycle || 'ANNUAL'

      const subscription = await db.subscription.create({
        data: {
          tenantId: body.tenantId,
          plan: body.billingModel, // SUBSCRIPTION or HYBRID
          amount: subAmount,
          billingCycle: cycle,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: cycle === 'ANNUAL' ? new Date(Date.now() + 365 * 86400000) : new Date(Date.now() + 30 * 86400000),
        },
      })

      // Generate the first invoice
      const invoiceNumber = `INV-${Date.now()}-${body.tenantId.slice(-4)}`
      const dueDate = new Date(Date.now() + 30 * 86400000) // 30 days from now

      const items = JSON.stringify([
        { description: `${body.billingModel} plan — ${cycle.toLowerCase()} subscription`, amount: subAmount, quantity: 1, total: subAmount },
      ])

      await db.invoice.create({
        data: {
          tenantId: body.tenantId,
          invoiceNumber,
          subscriptionId: subscription.id,
          plan: body.billingModel,
          billingCycle: cycle,
          items,
          subtotal: subAmount,
          tax: 0,
          taxRate: 0,
          total: subAmount,
          currency: body.subscriptionCurrency || 'UGX',
          status: 'PENDING',
          dueDate,
        },
      })
    }

    return NextResponse.json({ agreement }, { status: 201 })
  } catch (error: any) {
    console.error('[billing/agreements POST] error:', error)
    return NextResponse.json({ error: 'Failed to create agreement', details: error?.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const ctx = await getTenantContext()
    if (!ctx.isSuperAdmin && ctx.role !== 'MOBIPAY_FINANCE') {
      return NextResponse.json({ error: 'Super Admin or Finance access required' }, { status: 403 })
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
