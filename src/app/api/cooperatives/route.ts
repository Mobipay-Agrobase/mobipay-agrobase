import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'

/**
 * GET /api/cooperatives — List all cooperatives
 * POST /api/cooperatives — Create a new cooperative
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'users:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {
      ...buildTenantFilter(ctx, 'tenantId'),
      type: 'Cooperative',
    }
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { cooperativeCode: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [cooperatives, total] = await Promise.all([
      db.company.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          farmerGroups: {
            include: {
              _count: { select: { farmers: true } }
            }
          },
          _count: { select: { farmerGroups: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.company.count({ where }),
    ])

    // Format response
    const formatted = cooperatives.map(c => ({
      id: c.id,
      name: c.name,
      cooperativeCode: (c as any).cooperativeCode,
      dateOfFormation: (c as any).dateOfFormation,
      address: c.address,
      services: (c as any).services ? JSON.parse((c as any).services) : [],
      allowFarmerSell: (c as any).allowFarmerSell,
      isActive: c.isActive,
      contactPerson: c.contactPerson,
      phone: c.phone,
      email: c.email,
      farmerCount: c.farmerGroups.reduce((sum, g) => sum + g._count.farmers, 0),
      groupCount: c._count.farmerGroups,
      createdAt: c.createdAt,
    }))

    return NextResponse.json({ data: formatted, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Cooperative list error:', error)
    return NextResponse.json({ error: 'Failed to fetch cooperatives' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'users:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name, cooperativeCode, dateOfFormation, address,
      services, allowFarmerSell, contactPerson, phone, email
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Cooperative name is required' }, { status: 400 })
    }

    const cooperative = await db.company.create({
      data: {
        tenantId: ctx.tenantId,
        name,
        type: 'Cooperative',
        ...(cooperativeCode && { cooperativeCode }),
        ...(dateOfFormation && { dateOfFormation: new Date(dateOfFormation) }),
        ...(address && { address }),
        ...(services && { services: JSON.stringify(services) }),
        allowFarmerSell: allowFarmerSell ?? false,
        ...(contactPerson && { contactPerson }),
        ...(phone && { phone }),
        ...(email && { email }),
        isActive: true,
      },
    })

    return NextResponse.json({ data: cooperative }, { status: 201 })
  } catch (error) {
    console.error('Cooperative create error:', error)
    return NextResponse.json({ error: 'Failed to create cooperative' }, { status: 500 })
  }
}
