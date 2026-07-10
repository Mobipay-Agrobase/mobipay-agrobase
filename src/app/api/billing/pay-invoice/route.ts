/**
 * POST /api/billing/pay-invoice
 * Initiates a Flutterwave payment for a specific invoice.
 * Works for SUBSCRIPTION and HYBRID billing model tenants.
 *
 * Body: { invoiceId, redirectUrl? }
 * Returns: { paymentLink, reference }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!ctx.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { invoiceId, redirectUrl } = body

    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 })
    }

    // Fetch the invoice
    const invoice = await db.invoice.findFirst({
      where: { id: invoiceId, tenantId: ctx.tenantId },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 })
    }

    // Get tenant + user info
    const [tenant, user] = await Promise.all([
      db.tenant.findFirst({ where: { id: ctx.tenantId }, select: { name: true, country: true, defaultCurrency: true } }),
      db.user.findUnique({ where: { id: ctx.userId }, select: { email: true, phone: true, firstName: true, lastName: true } }),
    ])

    if (!user?.email) {
      return NextResponse.json({ error: 'Email required for payment' }, { status: 400 })
    }

    // Initiate Flutterwave payment
    const { chargeSubscription } = await import('@/lib/payments/flutterwave')
    const result = await chargeSubscription({
      email: user.email,
      amount: invoice.total,
      currency: invoice.currency || tenant?.defaultCurrency || 'UGX',
      tenantId: ctx.tenantId,
      plan: invoice.plan,
      billingCycle: invoice.billingCycle as 'MONTHLY' | 'ANNUAL',
      name: `${user.firstName} ${user.lastName}`,
      phone: user.phone || '',
      redirectUrl: redirectUrl || `${process.env.NEXTAUTH_URL}/billing`,
    })

    if (!result.paymentLink) {
      return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 })
    }

    // Create a payment transaction record
    await db.paymentTransaction.create({
      data: {
        tenantId: ctx.tenantId,
        provider: 'FLUTTERWAVE',
        type: 'COLLECTION',
        amount: invoice.total,
        currency: invoice.currency || 'UGX',
        recipientPhone: user.phone || '',
        recipientName: `${user.firstName} ${user.lastName}`,
        status: 'PENDING',
        initiatedBy: ctx.userId,
        providerTxnRef: result.reference || result.reference,
        metadata: JSON.stringify({ invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber }),
      },
    })

    return NextResponse.json({
      paymentLink: result.paymentLink,
      reference: result.reference || result.reference,
      invoiceId: invoice.id,
      amount: invoice.total,
      currency: invoice.currency,
    })
  } catch (error: any) {
    console.error('[pay-invoice] error:', error)
    return NextResponse.json({ error: 'Payment initiation failed', details: error?.message }, { status: 500 })
  }
}
