import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext()
    const tf = buildTenantFilter(ctx, 'tenantId')

    const existing = await db.farmerGroup.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const data: Record<string, unknown> = { updatedAt: new Date() }
    if (body.name !== undefined) data.name = body.name
    if (body.contactPerson !== undefined) data.contactPerson = body.contactPerson || null
    if (body.location !== undefined) data.location = body.location || null
    if (body.companyId !== undefined) data.companyId = body.companyId || null
    if (body.isVsla !== undefined) data.isVsla = body.isVsla
    if (body.isActive !== undefined) data.isActive = body.isActive

    const updated = await db.farmerGroup.update({
      where: { id },
      data,
      include: { _count: { select: { farmers: true } }, company: { select: { id: true, name: true } } },
    })
    return NextResponse.json({ data: updated })
  } catch (error: any) {
    console.error('Farmer group update error:', error)
    return NextResponse.json({ error: 'Failed to update', detail: error?.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext()
    const tf = buildTenantFilter(ctx, 'tenantId')

    const existing = await db.farmerGroup.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const farmerCount = await db.farmerProfile.count({ where: { groupId: id } })
    if (farmerCount > 0) {
      return NextResponse.json({ error: `Cannot delete — ${farmerCount} farmers are assigned to this group` }, { status: 400 })
    }

    await db.farmerGroup.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Farmer group delete error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
