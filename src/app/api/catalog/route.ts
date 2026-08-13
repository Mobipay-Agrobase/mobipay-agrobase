import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'

/**
 * GET /api/catalog?category=education_level — list dropdown values for a category
 * POST /api/catalog — add a new dropdown value (TENANT_ADMIN+)
 * PATCH /api/catalog?id=xxx — update a dropdown value's label / sortOrder / value
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
    const role = ctx.role
    const canWrite =
      role === 'SUPER_ADMIN' || role === 'COUNTRY_ADMIN' || role === 'TENANT_ADMIN' ||
      role === 'EKB_MD' || role === 'SACCO_ADMIN' || role === 'VSLA_PROVIDER_ADMIN' ||
      (typeof role === 'string' && role.startsWith('EKB_'))
    if (!canWrite) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
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

export async function PATCH(request: NextRequest) {
  try {
    const ctx = await getTenantContext(request)
    const role = ctx.role
    const canWrite =
      role === 'SUPER_ADMIN' || role === 'COUNTRY_ADMIN' || role === 'TENANT_ADMIN' ||
      role === 'EKB_MD' || role === 'SACCO_ADMIN' || role === 'VSLA_PROVIDER_ADMIN' ||
      (typeof role === 'string' && role.startsWith('EKB_'))
    if (!canWrite) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const existing = await db.catalogMaster.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json()
    const data: {
      value?: string
      label?: string | null
      sortOrder?: number
      isActive?: boolean
    } = {}
    if (body.value !== undefined) data.value = String(body.value).trim()
    if (body.label !== undefined) data.label = body.label ? String(body.label) : null
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) || 0
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive)

    // Prevent renaming a value into one that already exists in the same category/tenant
    if (data.value) {
      const clash = await db.catalogMaster.findFirst({
        where: {
          category: existing.category,
          value: data.value,
          tenantId: existing.tenantId,
          id: { not: id },
        },
      })
      if (clash) {
        return NextResponse.json({ error: 'A value with that name already exists' }, { status: 409 })
      }
    }

    const updated = await db.catalogMaster.update({ where: { id }, data })
    return NextResponse.json({ catalog: updated })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ctx = await getTenantContext(request)
    const role = ctx.role
    const canWrite =
      role === 'SUPER_ADMIN' || role === 'COUNTRY_ADMIN' || role === 'TENANT_ADMIN' ||
      role === 'EKB_MD' || role === 'SACCO_ADMIN' || role === 'VSLA_PROVIDER_ADMIN' ||
      (typeof role === 'string' && role.startsWith('EKB_'))
    if (!canWrite) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await db.catalogMaster.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
