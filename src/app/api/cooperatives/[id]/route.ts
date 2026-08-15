import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'

/**
 * GET /api/cooperatives/[id] — Get a single cooperative
 * PUT /api/cooperatives/[id] — Update cooperative
 * DELETE /api/cooperatives/[id] — Soft-delete cooperative
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext()
    const canReadUsers = hasPermission(ctx.role, 'users:read')
    const canManageFarmers = hasPermission(ctx.role, 'farmers:create') || hasPermission(ctx.role, 'farmers:update')
    if (!canReadUsers && !canManageFarmers) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const cooperative = await db.company.findFirst({
      where: { id, ...buildTenantFilter(ctx, 'tenantId'), type: 'Cooperative' },
      include: {
        farmerGroups: {
          include: {
            farmers: {
              select: { id: true, firstName: true, lastName: true, phone: true, farmerCode: true },
              take: 100,
            },
            _count: { select: { farmers: true } }
          }
        },
      },
    })

    if (!cooperative) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({
      data: {
        ...cooperative,
        services: (cooperative as any).services ? JSON.parse((cooperative as any).services) : [],
        totalFarmers: cooperative.farmerGroups.reduce((sum, g) => sum + g._count.farmers, 0),
      }
    })
  } catch (error) {
    console.error('Cooperative fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch cooperative' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext()
    const canUpdateUsers = hasPermission(ctx.role, 'users:update')
    const canManageFarmers = hasPermission(ctx.role, 'farmers:create') || hasPermission(ctx.role, 'farmers:update')
    if (!canUpdateUsers && !canManageFarmers) {
      return NextResponse.json({ error: 'Forbidden — insufficient permissions' }, { status: 403 })
    }

    const body = await req.json()
    const existing = await db.company.findFirst({
      where: { id, ...buildTenantFilter(ctx, 'tenantId'), type: 'Cooperative' }
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const {
      name, cooperativeCode, dateOfFormation, address,
      services, allowFarmerSell, contactPerson, phone, email, isActive
    } = body

    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (name !== undefined) updateData.name = name
    if (cooperativeCode !== undefined) updateData.cooperativeCode = cooperativeCode
    if (dateOfFormation !== undefined) updateData.dateOfFormation = dateOfFormation ? new Date(dateOfFormation) : null
    if (address !== undefined) updateData.address = address
    if (services !== undefined) updateData.services = JSON.stringify(services)
    if (allowFarmerSell !== undefined) updateData.allowFarmerSell = allowFarmerSell
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson
    if (phone !== undefined) updateData.phone = phone
    if (email !== undefined) updateData.email = email
    if (isActive !== undefined) updateData.isActive = isActive

    const updated = await db.company.update({ where: { id }, data: updateData })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Cooperative update error:', error)
    return NextResponse.json({ error: 'Failed to update cooperative' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext()
    const canDeleteUsers = hasPermission(ctx.role, 'users:delete')
    const canManageFarmers = hasPermission(ctx.role, 'farmers:create') || hasPermission(ctx.role, 'farmers:update')
    if (!canDeleteUsers && !canManageFarmers) {
      return NextResponse.json({ error: 'Forbidden — insufficient permissions' }, { status: 403 })
    }

    const existing = await db.company.findFirst({
      where: { id, ...buildTenantFilter(ctx, 'tenantId'), type: 'Cooperative' }
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Check if cooperative has active farmer groups
    const groupCount = await db.farmerGroup.count({ where: { companyId: id } })
    if (groupCount > 0) {
      return NextResponse.json({ error: 'Cannot delete cooperative with active farmer groups. Remove groups first.' }, { status: 400 })
    }

    await db.company.update({
      where: { id },
      data: { isActive: false, updatedAt: new Date() },
    })

    return NextResponse.json({ message: 'Deactivated successfully' })
  } catch (error) {
    console.error('Cooperative delete error:', error)
    return NextResponse.json({ error: 'Failed to delete cooperative' }, { status: 500 })
  }
}
