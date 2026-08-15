import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { hashPassword } from '@/lib/password'
import { hasPermission } from '@/lib/permissions'

/**
 * GET /api/field-staff/[id] — Get a single field staff member
 * PUT /api/field-staff/[id] — Update field staff member
 * DELETE /api/field-staff/[id] — Deactivate field staff member
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

    const user = await db.user.findFirst({
      where: { id, ...buildTenantFilter(ctx, 'tenantId') },
      include: {
        agentAssignments: true,
        farmerProfiles: {
          select: { id: true, firstName: true, lastName: true, phone: true, farmerCode: true },
          take: 50,
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { farmerProfiles: true } },
      },
    })

    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Get cooperative names from agent assignments
    const cooperatives = await Promise.all(
      user.agentAssignments.map(async a => {
        const group = await db.farmerGroup.findUnique({
          where: { id: a.groupId },
          select: { company: { select: { id: true, name: true, cooperativeCode: true } } },
        })
        return group?.company
      })
    )

    return NextResponse.json({
      data: {
        ...user,
        cooperatives: cooperatives.filter(Boolean).map((c: any) => ({
          id: c.id,
          name: c.name,
          cooperativeCode: c.cooperativeCode,
        })),
        farmerCount: user._count.farmerProfiles,
      }
    })
  } catch (error) {
    console.error('Field staff fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch field staff' }, { status: 500 })
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
    const existing = await db.user.findFirst({
      where: { id, ...buildTenantFilter(ctx, 'tenantId') }
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { firstName, lastName, email, phone, password, role, isActive, cooperativeIds } = body

    // Update user fields
    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (role !== undefined) updateData.role = role
    if (isActive !== undefined) updateData.isActive = isActive
    if (password) updateData.passwordHash = await hashPassword(password)

    const updated = await db.user.update({ where: { id }, data: updateData })

    // Update cooperative assignments if provided
    if (cooperativeIds !== undefined) {
      // Remove existing assignments
      await db.agentAssignment.deleteMany({ where: { agentId: id } })

      // Add new assignments
      if (cooperativeIds.length > 0) {
        for (const coopId of cooperativeIds) {
          let group = await db.farmerGroup.findFirst({
            where: { companyId: coopId, tenantId: ctx.tenantId }
          })
          if (!group) {
            group = await db.farmerGroup.create({
              data: {
                tenantId: ctx.tenantId,
                companyId: coopId,
                name: `Group for cooperative`,
              }
            })
          }
          await db.agentAssignment.create({
            data: {
              agentId: id,
              groupId: group.id,
              groupType: 'FARMER_GROUP',
            }
          })
        }
      }
    }

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Field staff update error:', error)
    return NextResponse.json({ error: 'Failed to update field staff' }, { status: 500 })
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

    const existing = await db.user.findFirst({
      where: { id, ...buildTenantFilter(ctx, 'tenantId') }
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.user.update({
      where: { id },
      data: { isActive: false, updatedAt: new Date() },
    })

    return NextResponse.json({ message: 'Deactivated successfully' })
  } catch (error) {
    console.error('Field staff delete error:', error)
    return NextResponse.json({ error: 'Failed to delete field staff' }, { status: 500 })
  }
}
