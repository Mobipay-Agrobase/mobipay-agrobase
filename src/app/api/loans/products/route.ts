import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'

/**
 * /api/loans/products — LoanProduct master-data management.
 *
 * The LoanProduct table is what both the web "Apply for Loan" form and the
 * Ekibbo mobile loan module read for their product dropdowns. Until now no
 * UI could create these rows (the MFI portal manages a separate
 * MfiLoanProduct table), so tenants without seeded products had an empty
 * dropdown and could not submit applications.
 *
 *   POST /api/loans/products            create  (requires loans:create)
 *   PUT  /api/loans/products?id=<cuid>  update  (requires loans:update)
 *
 * Both are tenant-scoped via the session context.
 */

interface ProductBody {
  name?: unknown
  interestRate?: unknown
  minAmount?: unknown
  maxAmount?: unknown
  maxDuration?: unknown
  gracePeriod?: unknown
  isActive?: unknown
}

function parseProductBody(body: ProductBody) {
  const name = String(body.name ?? '').trim()
  const interestRate = Number(body.interestRate)
  const minAmount = Number(body.minAmount)
  const maxAmount = Number(body.maxAmount)
  const maxDuration = Number(body.maxDuration)
  const gracePeriod = body.gracePeriod === undefined || body.gracePeriod === null || body.gracePeriod === ''
    ? 0
    : Number(body.gracePeriod)

  if (!name) return { error: 'Product name is required' as const }
  if (Number.isNaN(interestRate) || interestRate < 0) return { error: 'A valid interest rate is required' as const }
  if (Number.isNaN(maxAmount) || maxAmount <= 0) return { error: 'A valid maximum amount is required' as const }
  if (Number.isNaN(minAmount) || minAmount < 0) return { error: 'A valid minimum amount is required' as const }
  if (minAmount > maxAmount) return { error: 'Minimum amount cannot exceed the maximum amount' as const }
  if (Number.isNaN(maxDuration) || maxDuration <= 0) return { error: 'A valid maximum duration (months) is required' as const }
  if (Number.isNaN(gracePeriod) || gracePeriod < 0) return { error: 'A valid grace period is required' as const }

  return {
    data: {
      name,
      interestRate,
      minAmount,
      maxAmount,
      maxDuration: Math.round(maxDuration),
      gracePeriod: Math.round(gracePeriod),
      isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    },
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext(request)
    if (!ctx.tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 403 })
    if (!hasPermission(ctx.role, 'loans:create')) {
      return NextResponse.json({ error: 'Forbidden — loans:create permission required' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = parseProductBody(body as ProductBody)
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

    // Duplicate name guard within the tenant
    const dup = await db.loanProduct.findFirst({
      where: { tenantId: ctx.tenantId, name: parsed.data!.name },
    })
    if (dup) return NextResponse.json({ error: 'A loan product with this name already exists' }, { status: 409 })

    const product = await db.loanProduct.create({
      data: { tenantId: ctx.tenantId, ...parsed.data! },
    })
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('[loans/products POST]', error)
    return NextResponse.json({ error: 'Failed to create loan product' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const ctx = await getTenantContext(request)
    if (!ctx.tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 403 })
    if (!hasPermission(ctx.role, 'loans:update')) {
      return NextResponse.json({ error: 'Forbidden — loans:update permission required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id') || ''
    if (!id) return NextResponse.json({ error: 'Product id is required' }, { status: 400 })

    // Tenant-scope check
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.loanProduct.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Loan product not found' }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    // Merge over existing values so partial updates keep unspecified fields.
    const merged: ProductBody = {
      name: body.name ?? existing.name,
      interestRate: body.interestRate ?? existing.interestRate,
      minAmount: body.minAmount ?? existing.minAmount,
      maxAmount: body.maxAmount ?? existing.maxAmount,
      maxDuration: body.maxDuration ?? existing.maxDuration,
      gracePeriod: body.gracePeriod ?? existing.gracePeriod,
      isActive: body.isActive ?? existing.isActive,
    }
    const parsed = parseProductBody(merged)
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

    // Duplicate name guard (exclude self)
    const dup = await db.loanProduct.findFirst({
      where: { tenantId: ctx.tenantId, name: parsed.data!.name, NOT: { id } },
    })
    if (dup) return NextResponse.json({ error: 'A loan product with this name already exists' }, { status: 409 })

    // Deactivating a product only hides it from new-application dropdowns;
    // existing applications keep their reference.
    const product = await db.loanProduct.update({
      where: { id },
      data: parsed.data!,
    })
    return NextResponse.json(product)
  } catch (error) {
    console.error('[loans/products PUT]', error)
    return NextResponse.json({ error: 'Failed to update loan product' }, { status: 500 })
  }
}
