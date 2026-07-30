import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { headers } from 'next/headers'

/**
 * GET /api/admin/billing/plans
 *   List all billing plans. SUPER_ADMIN only.
 *   Query: ?active=true to filter active plans only.
 *
 * POST /api/admin/billing/plans
 *   Create a new billing plan. SUPER_ADMIN only.
 *   Body: { code, name, description?, modules[], priceMonthly, priceAnnual,
 *           currency?, maxUsers?, maxFarmers?, features?, isCustom?, sortOrder? }
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

export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext(request)
    if (!ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    const plans = await db.billingPlan.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: { select: { tenantOverrides: true } },
      },
    })

    return NextResponse.json({
      plans: plans.map(p => ({
        id: p.id,
        code: p.code,
        name: p.name,
        description: p.description,
        modules: JSON.parse(p.modules),
        priceMonthly: Number(p.priceMonthly),
        priceAnnual: Number(p.priceAnnual),
        currency: p.currency,
        maxUsers: p.maxUsers,
        maxFarmers: p.maxFarmers,
        features: JSON.parse(p.features),
        isActive: p.isActive,
        isCustom: p.isCustom,
        sortOrder: p.sortOrder,
        overrideCount: p._count.tenantOverrides,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      total: plans.length,
    })
  } catch (error) {
    console.error('[billing/plans GET]', error)
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext(request)
    if (!ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { code, name, description, modules, priceMonthly, priceAnnual,
            currency, maxUsers, maxFarmers, features, isCustom, sortOrder } = body as {
      code?: string; name?: string; description?: string; modules?: string[]
      priceMonthly?: number; priceAnnual?: number; currency?: string
      maxUsers?: number; maxFarmers?: number; features?: Record<string, boolean>
      isCustom?: boolean; sortOrder?: number
    }

    if (!code || !name || priceMonthly === undefined || priceAnnual === undefined) {
      return NextResponse.json(
        { error: 'code, name, priceMonthly, and priceAnnual are required' },
        { status: 400 },
      )
    }

    // Check for duplicate code
    const existing = await db.billingPlan.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json(
        { error: `Plan with code '${code}' already exists` },
        { status: 409 },
      )
    }

    const plan = await db.billingPlan.create({
      data: {
        code,
        name,
        description: description || null,
        modules: JSON.stringify(modules || []),
        priceMonthly,
        priceAnnual,
        currency: currency || 'USD',
        maxUsers: maxUsers ?? 10,
        maxFarmers: maxFarmers ?? 500,
        features: JSON.stringify(features || {}),
        isActive: true,
        isCustom: isCustom ?? false,
        sortOrder: sortOrder ?? 99,
      },
    })

    await writeAudit({
      userId: ctx.userId,
      action: 'BILLING_PLAN_CREATE',
      entityType: 'BillingPlan',
      entityId: plan.id,
      details: { code, name, priceMonthly, priceAnnual, currency: currency || 'USD' },
    })

    return NextResponse.json({
      plan: {
        id: plan.id,
        code: plan.code,
        name: plan.name,
        priceMonthly: Number(plan.priceMonthly),
        priceAnnual: Number(plan.priceAnnual),
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[billing/plans POST]', error)
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}
