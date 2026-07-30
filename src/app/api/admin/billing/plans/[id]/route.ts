import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { headers } from 'next/headers'

/**
 * GET /api/admin/billing/plans/[id]
 *   Get a single billing plan by ID. SUPER_ADMIN only.
 *
 * PATCH /api/admin/billing/plans/[id]
 *   Update a billing plan. SUPER_ADMIN only.
 *   Body: any subset of { name, description, modules[], priceMonthly, priceAnnual,
 *           currency, maxUsers, maxFarmers, features, isActive, sortOrder }
 *
 * DELETE /api/admin/billing/plans/[id]
 *   Deactivate a billing plan (soft delete — sets isActive=false).
 *   SUPER_ADMIN only. Refuses to delete if any subscription references the plan's code.
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getTenantContext(request)
    if (!ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const plan = await db.billingPlan.findUnique({
      where: { id },
      include: {
        tenantOverrides: {
          include: { tenant: { select: { name: true, type: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json({
      plan: {
        id: plan.id,
        code: plan.code,
        name: plan.name,
        description: plan.description,
        modules: JSON.parse(plan.modules),
        priceMonthly: Number(plan.priceMonthly),
        priceAnnual: Number(plan.priceAnnual),
        currency: plan.currency,
        maxUsers: plan.maxUsers,
        maxFarmers: plan.maxFarmers,
        features: JSON.parse(plan.features),
        isActive: plan.isActive,
        isCustom: plan.isCustom,
        sortOrder: plan.sortOrder,
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
        overrides: plan.tenantOverrides.map(o => ({
          id: o.id,
          tenantId: o.tenantId,
          tenantName: o.tenant.name,
          tenantType: o.tenant.type,
          priceMonthly: o.priceMonthly ? Number(o.priceMonthly) : null,
          priceAnnual: o.priceAnnual ? Number(o.priceAnnual) : null,
          maxUsers: o.maxUsers,
          maxFarmers: o.maxFarmers,
          reason: o.reason,
          expiresAt: o.expiresAt?.toISOString() || null,
        })),
      },
    })
  } catch (error) {
    console.error('[billing/plans/[id] GET]', error)
    return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getTenantContext(request)
    if (!ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const existing = await db.billingPlan.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.modules !== undefined) updateData.modules = JSON.stringify(body.modules)
    if (body.priceMonthly !== undefined) updateData.priceMonthly = body.priceMonthly
    if (body.priceAnnual !== undefined) updateData.priceAnnual = body.priceAnnual
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.maxUsers !== undefined) updateData.maxUsers = body.maxUsers
    if (body.maxFarmers !== undefined) updateData.maxFarmers = body.maxFarmers
    if (body.features !== undefined) updateData.features = JSON.stringify(body.features)
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder

    // Don't allow changing the code (it's the unique business key)
    if (body.code !== undefined && body.code !== existing.code) {
      return NextResponse.json(
        { error: 'Plan code cannot be changed after creation' },
        { status: 400 },
      )
    }

    const updated = await db.billingPlan.update({
      where: { id },
      data: updateData,
    })

    // Track changes for audit
    const changes: Record<string, { from: unknown; to: unknown }> = {}
    for (const key of Object.keys(updateData)) {
      const oldVal = (existing as Record<string, unknown>)[key]
      const newVal = updateData[key]
      if (key === 'modules' || key === 'features') {
        changes[key] = { from: JSON.parse(oldVal as string), to: JSON.parse(newVal as string) }
      } else if (Number(oldVal) !== Number(newVal)) {
        changes[key] = { from: oldVal, to: newVal }
      }
    }

    await writeAudit({
      userId: ctx.userId,
      action: 'BILLING_PLAN_UPDATE',
      entityType: 'BillingPlan',
      entityId: id,
      details: { code: existing.code, changes },
    })

    return NextResponse.json({
      plan: {
        id: updated.id,
        code: updated.code,
        name: updated.name,
        priceMonthly: Number(updated.priceMonthly),
        priceAnnual: Number(updated.priceAnnual),
        isActive: updated.isActive,
      },
    })
  } catch (error) {
    console.error('[billing/plans/[id] PATCH]', error)
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getTenantContext(request)
    if (!ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const plan = await db.billingPlan.findUnique({ where: { id } })
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Check if any subscription uses this plan's code
    const subscriptionCount = await db.subscription.count({
      where: { plan: plan.code, status: { in: ['ACTIVE', 'TRIAL'] } },
    })
    if (subscriptionCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete plan '${plan.code}' — ${subscriptionCount} active subscription(s) reference it. Deactivate via PATCH instead.`,
          subscriptionCount,
        },
        { status: 409 },
      )
    }

    // Soft delete
    const deactivated = await db.billingPlan.update({
      where: { id },
      data: { isActive: false },
    })

    await writeAudit({
      userId: ctx.userId,
      action: 'BILLING_PLAN_DEACTIVATE',
      entityType: 'BillingPlan',
      entityId: id,
      details: { code: plan.code, name: plan.name },
    })

    return NextResponse.json({
      success: true,
      message: `Plan '${plan.code}' deactivated`,
    })
  } catch (error) {
    console.error('[billing/plans/[id] DELETE]', error)
    return NextResponse.json({ error: 'Failed to deactivate plan' }, { status: 500 })
  }
}
