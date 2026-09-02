import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext(request)
    const tf = buildTenantFilter(ctx, 'tenantId') as any
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || ''
    const dealerId = searchParams.get('dealerId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = { isActive: true }
    if (category) where.category = category
    if (dealerId) where.dealerId = dealerId

    const [data, total] = await Promise.all([
      db.inputProduct.findMany({
        where: { ...tf, ...where },
        skip: (page - 1) * limit,
        take: limit,
        include: { dealer: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.inputProduct.count({ where: { ...tf, ...where } }),
    ])

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext(request)
    const tf = buildTenantFilter(ctx, 'tenantId') as any
    const body = await request.json()
    // Validate required fields up-front (dealerId is a required relation —
    // without this check a missing dealer produced an opaque 500).
    if (!body.name || !body.dealerId) {
      return NextResponse.json(
        { error: 'name and dealerId are required' },
        { status: 400 },
      )
    }
    // Verify the dealer belongs to the caller's tenant (no cross-tenant ids).
    const dealer = await db.inputDealer.findFirst({
      where: { id: body.dealerId, ...tf },
      select: { id: true },
    })
    if (!dealer) {
      return NextResponse.json(
        { error: 'Input dealer not found in your tenant' },
        { status: 403 },
      )
    }
    const product = await db.inputProduct.create({
      data: {
        tenantId: ctx.tenantId,
        dealerId: body.dealerId,
        name: body.name,
        category: body.category || null,
        variety: body.variety || null,
        unit: body.unit || null,
        unitPrice: body.unitPrice ?? null,
        isActive: body.isActive ?? true,
      },
      include: { dealer: true },
    })
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}