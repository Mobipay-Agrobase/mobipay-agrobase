import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/farmer-groups — List farmer groups for the tenant
 * POST /api/farmer-groups — Create a new farmer group
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext()
    const tf = buildTenantFilter(ctx, 'tenantId')
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = { ...tf }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }

    const groups = await db.farmerGroup.findMany({
      where,
      include: {
        _count: { select: { farmers: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ data: groups })
  } catch (error) {
    console.error('Farmer groups list error:', error)
    return NextResponse.json({ error: 'Failed to fetch farmer groups' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    const group = await db.farmerGroup.create({
      data: {
        tenantId: ctx.tenantId,
        name: body.name.trim(),
        contactPerson: body.contactPerson || null,
        location: body.location || null,
        companyId: body.companyId || null,
        isVsla: body.isVsla || false,
        // ─── EKIBBO extension: group code (groups of 25-35 farmers) ───
        groupCode: body.groupCode?.trim() || null,
      },
      include: {
        _count: { select: { farmers: true } },
        company: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ data: group }, { status: 201 })
  } catch (error: any) {
    console.error('Farmer group create error:', error)
    const msg = error?.code === 'P2002' ? 'A group with that name already exists' : 'Failed to create farmer group'
    return NextResponse.json({ error: msg, detail: error?.message }, { status: 500 })
  }
}
