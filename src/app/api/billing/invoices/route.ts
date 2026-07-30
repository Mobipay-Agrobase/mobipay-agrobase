import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'

export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()

    if (!hasPermission(ctx.role, 'settings:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {
      ...buildTenantFilter(ctx, 'tenantId'),
    }
    if (status) where.status = status
    if (startDate || endDate) {
      where.createdAt = {} as Record<string, unknown>
      if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate)
    }

    const [data, total] = await Promise.all([
      db.invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.invoice.count({ where }),
    ])

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()

    if (!hasPermission(ctx.role, 'settings:admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { plan, billingCycle } = body as {
      plan?: string
      billingCycle?: string
    }

    // Look up the tenant's active subscription to determine plan + cycle
    const activeSub = await db.subscription.findFirst({
      where: { tenantId: ctx.tenantId, status: 'ACTIVE' },
    })

    const effectivePlan = plan || activeSub?.plan || 'BASIC'
    const effectiveCycle = billingCycle || activeSub?.billingCycle || 'MONTHLY'

    // P4: Try to get the price from the dynamic BillingPlan table first.
    // Fall back to the hardcoded map for backward compatibility (plans not yet seeded).
    let amount = 0
    const billingPlan = await db.billingPlan.findUnique({
      where: { code: effectivePlan },
      select: { priceMonthly: true, priceAnnual: true },
    })
    if (billingPlan) {
      amount = Number(effectiveCycle === 'ANNUAL' ? billingPlan.priceAnnual : billingPlan.priceMonthly)
    } else {
      // Legacy fallback — matches the old PLAN_AMOUNTS in subscription/route.ts:6
      const LEGACY_PRICES: Record<string, number> = { BASIC: 50, STANDARD: 150, ENTERPRISE: 500 }
      amount = LEGACY_PRICES[effectivePlan] || 50
    }

    // Generate a standardized invoice number: INV-YYYYMM-XXXX
    // where XXXX is a zero-padded sequence within the month.
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const prefix = `INV-${yyyy}${mm}-`

    // Count existing invoices with this prefix to determine the sequence
    const existingCount = await db.invoice.count({
      where: { invoiceNumber: { startsWith: prefix } },
    })
    const seq = String(existingCount + 1).padStart(4, '0')
    const invoiceNumber = `${prefix}${seq}`

    // Due date: 7 days from now
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 7)

    // Create an actual Invoice row (NOT a Subscription — that was the bug)
    const invoice = await db.invoice.create({
      data: {
        tenantId: ctx.tenantId,
        subscriptionId: activeSub?.id || null,
        invoiceNumber,
        plan: effectivePlan,
        billingCycle: effectiveCycle,
        items: JSON.stringify([{
          description: `${effectivePlan} plan — ${effectiveCycle.toLowerCase()} billing cycle`,
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

    return NextResponse.json({ data: invoice }, { status: 201 })
  } catch (error) {
    console.error('[billing/invoices POST]', error)
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 })
  }
}