import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'

/**
 * GET /api/catalog?category=education_level — list dropdown values for a category
 * POST /api/catalog — add a new dropdown value (TENANT_ADMIN+)
 * DELETE /api/catalog?id=xxx — remove a dropdown value
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    
    const where: Record<string, unknown> = { isActive: true }
    if (category) where.category = category
    
    const items = await db.catalogMaster.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { value: 'asc' }],
    })
    return NextResponse.json({ catalog: items })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext(request)
    const body = await request.json()
    const item = await db.catalogMaster.create({
      data: {
        category: body.category,
        value: body.value,
        label: body.label || null,
        sortOrder: body.sortOrder || 0,
        isGlobal: body.isGlobal ?? true,
        tenantId: body.isGlobal ? null : ctx.tenantId,
      },
    })
    return NextResponse.json({ catalog: item }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await db.catalogMaster.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
