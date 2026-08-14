import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { hashPassword } from '@/lib/password'
import { hasPermission } from '@/lib/permissions'

/**
 * GET /api/field-staff — List all field staff (users with AGENT/EXTENSION_OFFICER roles)
 * POST /api/field-staff — Create a new field staff member
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext()
    const canReadUsers = hasPermission(ctx.role, 'users:read')
    const canAssignFarmers = hasPermission(ctx.role, 'farmers:create') || hasPermission(ctx.role, 'farmers:update')
    // Admin users see full records; roles that can register/edit farmers may pick an
    // officer for mapping but only get a redacted (id + name) payload.
    if (!canReadUsers && !canAssignFarmers) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {
      ...buildTenantFilter(ctx, 'tenantId'),
      role: { in: ['AGENT', 'EXTENSION_OFFICER', 'CBT'] },
    }
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get users with their assigned cooperatives via AgentAssignment
    const [staff, total] = await Promise.all([
      db.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          agentAssignments: true,
          _count: { select: { farmerProfiles: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.user.count({ where }),
    ])

    // Get cooperative names for each staff member
    const formattedStaff = await Promise.all(staff.map(async s => {
      // Get cooperative names from agent assignments
      const cooperativeNames = await Promise.all(
        s.agentAssignments.map(async a => {
          const group = await db.farmerGroup.findUnique({
            where: { id: a.groupId },
            select: { companyId: true, company: { select: { id: true, name: true } } },
          })
          return group?.company
        })
      )

      return {
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        role: s.role,
        ...(canReadUsers ? {
          email: s.email,
          phone: s.phone,
          isActive: s.isActive,
          lastLogin: s.lastLogin,
          createdAt: s.createdAt,
          farmerCount: s._count.farmerProfiles,
          cooperatives: cooperativeNames.filter(Boolean).map((c: any) => ({ id: c.id, name: c.name })),
        } : {}),
      }
    }))

    return NextResponse.json({ data: formattedStaff, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Field staff list error:', error)
    return NextResponse.json({ error: 'Failed to fetch field staff' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext()
    // Allow anyone who can create users OR create/update farmers to add field officers
    // (tenant admins, EKB_MD, EKB_OPS_MANAGER, and extension officers need this)
    const canCreateUsers = hasPermission(ctx.role, 'users:create')
    const canManageFarmers = hasPermission(ctx.role, 'farmers:create') || hasPermission(ctx.role, 'farmers:update')
    if (!canCreateUsers && !canManageFarmers) {
      return NextResponse.json({ error: 'Forbidden — insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { firstName, lastName, email, phone, password, role, cooperativeIds } = body

    if (!firstName || !lastName || !phone) {
      return NextResponse.json({ error: 'First name, last name, and phone are required' }, { status: 400 })
    }

    const passwordHash = password ? await hashPassword(password) : null

    // Create the user
    const user = await db.user.create({
      data: {
        tenantId: ctx.tenantId,
        role: role || 'EXTENSION_OFFICER',
        email: email || null,
        phone,
        passwordHash,
        firstName,
        lastName,
        isActive: true,
      },
    })

    // Assign to cooperatives if provided
    if (cooperativeIds && cooperativeIds.length > 0) {
      for (const coopId of cooperativeIds) {
        // Find or create farmer group for this cooperative
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
            agentId: user.id,
            groupId: group.id,
            groupType: 'FARMER_GROUP',
          }
        })
      }
    }

    return NextResponse.json({ data: user }, { status: 201 })
  } catch (error) {
    console.error('Field staff create error:', error)
    return NextResponse.json({ error: 'Failed to create field staff' }, { status: 500 })
  }
}
