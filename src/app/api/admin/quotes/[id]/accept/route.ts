import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { headers } from 'next/headers'

/**
 * POST /api/admin/quotes/[id]/accept
 *   Accept a Quote and convert it to a BillingAgreement (+ Subscription + first Invoice).
 *   SUPER_ADMIN + MOBIPAY_FINANCE only.
 *
 *   Body (optional):
 *     - tenantId: string — if the prospect already has a tenant, specify it.
 *                          If omitted, a new tenant is created from the quote's prospect fields.
 *
 *   Flow:
 *     1. Validate the quote exists and is in DRAFT or SENT status.
 *     2. Resolve or create the tenant.
 *     3. Deactivate any existing ACTIVE BillingAgreement for the tenant.
 *     4. Create a new BillingAgreement from the quote's terms.
 *     5. For SUBSCRIPTION/HYBRID billing models: create a Subscription + first PENDING Invoice.
 *     6. Update the Quote: status = ACCEPTED, convertedAgreementId = new agreement ID.
 *     7. Write AuditLog entry.
 *
 *   Returns: { agreement, subscription?, invoice?, tenant }
 */

async function writeAudit(args: {
  userId: string
  action: string
  entityType?: string
  entityId?: string
  details?: Record<string, unknown>
}) {
  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') || undefined
  await db.auditLog.create({
    data: {
      userId: args.userId,
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId,
      details: args.details ? JSON.stringify(args.details) : undefined,
      ipAddress,
    },
  }).catch(err => { console.error('[AuditLog]', err) })
}

function generateInvoiceNumber(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `INV-${yyyy}${mm}-${random}`
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getTenantContext(request)
    if (!ctx.isSuperAdmin && ctx.role !== 'MOBIPAY_FINANCE') {
      return NextResponse.json(
        { error: 'Finance/Admin access required' },
        { status: 403 },
      )
    }

    const { id } = await params
    const body = await request.json().catch(() => ({})) as { tenantId?: string }

    // 1. Validate quote
    const quote = await db.quote.findUnique({ where: { id } })
    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }
    if (quote.status !== 'DRAFT' && quote.status !== 'SENT') {
      return NextResponse.json(
        { error: `Quote is in status '${quote.status}' — only DRAFT or SENT quotes can be accepted` },
        { status: 400 },
      )
    }
    if (quote.validUntil && new Date() > quote.validUntil) {
      return NextResponse.json(
        { error: 'Quote has expired' },
        { status: 400 },
      )
    }

    // 2. Resolve or create tenant
    let tenant = body.tenantId
      ? await db.tenant.findUnique({ where: { id: body.tenantId } })
      : await db.tenant.findFirst({ where: { name: quote.prospectName, isActive: true } })

    if (!tenant) {
      tenant = await db.tenant.create({
        data: {
          name: quote.prospectName,
          type: 'COOPERATIVE', // default; can be changed later
          country: quote.prospectCountry || 'Uganda',
          defaultCurrency: 'UGX',
          isActive: true,
        },
      })
    }

    // 3. Deactivate existing ACTIVE agreement for this tenant
    await db.billingAgreement.updateMany({
      where: { tenantId: tenant.id, status: 'ACTIVE' },
      data: { status: 'SUPERSEDED', endDate: new Date() },
    })

    // 4. Create new BillingAgreement from quote terms
    const agreement = await db.billingAgreement.create({
      data: {
        tenantId: tenant.id,
        billingModel: quote.billingModel,
        costTrackingMode: 'FIXED',
        subscriptionAmount: quote.subscriptionAmount,
        subscriptionCurrency: 'USD',
        subscriptionCycle: 'MONTHLY',
        feeType: quote.feeType,
        feeRate: quote.feeRate,
        feeAppliesTo: 'PURCHASES',
        upfrontInvestment: quote.upfrontInvestment,
        recoveryPeriodMonths: quote.recoveryPeriodMonths,
        recurringMonthlyCost: quote.recurringMonthlyCost,
        status: 'ACTIVE',
        startDate: new Date(),
      },
    })

    let subscription: { id: string; plan: string; amount: number; status: string } | null = null
    let invoice: { id: string; invoiceNumber: string; total: number; status: string; dueDate: Date } | null = null

    // 5. For SUBSCRIPTION/HYBRID: create Subscription + first Invoice
    if (quote.billingModel === 'SUBSCRIPTION' || quote.billingModel === 'HYBRID') {
      const planCode = 'BASIC' // default; could be derived from subscriptionAmount
      const amount = Number(quote.subscriptionAmount) || 0

      // Deactivate existing ACTIVE subscriptions
      await db.subscription.updateMany({
        where: { tenantId: tenant.id, status: 'ACTIVE' },
        data: { status: 'CANCELLED', endDate: new Date() },
      })

      subscription = await db.subscription.create({
        data: {
          tenantId: tenant.id,
          plan: planCode,
          amount,
          billingCycle: 'MONTHLY',
          status: 'ACTIVE',
          startDate: new Date(),
        },
      })

      // Create first PENDING invoice
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 7) // due in 7 days

      invoice = await db.invoice.create({
        data: {
          tenantId: tenant.id,
          subscriptionId: subscription.id,
          invoiceNumber: generateInvoiceNumber(),
          plan: planCode,
          billingCycle: 'MONTHLY',
          items: JSON.stringify([{
            description: `${planCode} plan — Monthly billing cycle`,
            amount,
            quantity: 1,
            total: amount,
          }]),
          subtotal: amount,
          tax: 0,
          taxRate: 0,
          total: amount,
          currency: 'USD',
          status: 'PENDING',
          dueDate,
        },
      })
    }

    // 6. Update quote
    await db.quote.update({
      where: { id: quote.id },
      data: {
        status: 'ACCEPTED',
        convertedAgreementId: agreement.id,
      },
    })

    // 7. Audit log
    await writeAudit({
      userId: ctx.userId,
      action: 'QUOTE_ACCEPT',
      entityType: 'Quote',
      entityId: quote.id,
      details: {
        quoteId: quote.id,
        prospectName: quote.prospectName,
        tenantId: tenant.id,
        tenantName: tenant.name,
        agreementId: agreement.id,
        billingModel: quote.billingModel,
        subscriptionId: subscription?.id,
        invoiceId: invoice?.id,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        agreement: {
          id: agreement.id,
          billingModel: agreement.billingModel,
          status: agreement.status,
        },
        subscription: subscription ? {
          id: subscription.id,
          plan: subscription.plan,
          amount: subscription.amount,
          status: subscription.status,
        } : null,
        invoice: invoice ? {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          total: invoice.total,
          status: invoice.status,
          dueDate: invoice.dueDate.toISOString(),
        } : null,
        tenant: {
          id: tenant.id,
          name: tenant.name,
        },
      },
    })
  } catch (error) {
    console.error('[quotes/[id]/accept POST]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to accept quote' },
      { status: 500 },
    )
  }
}
