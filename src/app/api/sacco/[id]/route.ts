import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { headers } from 'next/headers'

/**
 * GET /api/sacco/[id]
 *   Get SACCO detail with members, loans, share purchases, meetings.
 *
 * PATCH /api/sacco/[id]
 *   Update SACCO settings (shareValue, interestRate, etc.)
 *
 * DELETE /api/sacco/[id]
 *   Deactivate a SACCO (soft delete — sets isActive=false).
 */

async function writeAudit(args: { userId: string; action: string; entityType?: string; entityId?: string; details?: Record<string, unknown> }) {
  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || headersList.get('x-real-ip') || undefined
  await db.auditLog.create({
    data: {
      userId: args.userId,
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId,
      details: args.details ? JSON.stringify(args.details) : undefined,
      ipAddress,
    },
  }).catch(err => { console.error('[AuditLog]', err) })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getTenantContext(request)
    if (!hasPermission(ctx.role, 'sacco:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const sacco = await db.sacco.findFirst({
      where: { id, ...buildTenantFilter(ctx, 'tenantId') },
      include: {
        members: {
          orderBy: { joinedAt: 'desc' },
          take: 50,
          select: { id: true, memberNumber: true, fullName: true, phone: true, gender: true, occupation: true, sharesOwned: true, totalSavings: true, totalBorrowed: true, totalRepaid: true, status: true, joinedAt: true },
        },
        loans: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: { id: true, loanNumber: true, principal: true, interestRate: true, interestAmount: true, totalRepayable: true, amountRepaid: true, purpose: true, status: true, disbursedAt: true, dueDate: true, createdAt: true },
        },
        _count: { select: { members: true, loans: true, sharePurchases: true, meetings: true, dividends: true } },
      },
    })

    if (!sacco) {
      return NextResponse.json({ error: 'SACCO not found' }, { status: 404 })
    }

    return NextResponse.json({ sacco })
  } catch (error) {
    console.error('[sacco/[id] GET]', error)
    return NextResponse.json({ error: 'Failed to fetch SACCO' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getTenantContext(request)
    if (!hasPermission(ctx.role, 'sacco:update')) {
      return NextResponse.json({ error: 'Forbidden — sacco:update permission required' }, { status: 403 })
    }

    const { id } = await params
    const existing = await db.sacco.findFirst({
      where: { id, ...buildTenantFilter(ctx, 'tenantId') },
    })
    if (!existing) {
      return NextResponse.json({ error: 'SACCO not found' }, { status: 404 })
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = {}
    const allowedFields = ['name', 'registrationNo', 'district', 'county', 'subCounty', 'parish', 'village',
      'meetingFrequency', 'shareValue', 'minShares', 'interestRate', 'maxLoanMultiplier', 'isActive', 'establishedAt']
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = field === 'establishedAt' && body[field] ? new Date(body[field]) : body[field]
      }
    }

    const updated = await db.sacco.update({ where: { id }, data: updateData })

    await writeAudit({
      userId: ctx.userId,
      action: 'SACCO_UPDATE',
      entityType: 'Sacco',
      entityId: id,
      details: { name: existing.name, changes: Object.keys(updateData) },
    })

    return NextResponse.json({ sacco: updated })
  } catch (error) {
    console.error('[sacco/[id] PATCH]', error)
    return NextResponse.json({ error: 'Failed to update SACCO' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getTenantContext(request)
    if (!hasPermission(ctx.role, 'sacco:delete')) {
      return NextResponse.json({ error: 'Forbidden — sacco:delete permission required' }, { status: 403 })
    }

    const { id } = await params
    const sacco = await db.sacco.findFirst({
      where: { id, ...buildTenantFilter(ctx, 'tenantId') },
    })
    if (!sacco) {
      return NextResponse.json({ error: 'SACCO not found' }, { status: 404 })
    }

    // Soft delete
    const deactivated = await db.sacco.update({
      where: { id },
      data: { isActive: false },
    })

    await writeAudit({
      userId: ctx.userId,
      action: 'SACCO_DEACTIVATE',
      entityType: 'Sacco',
      entityId: id,
      details: { name: sacco.name },
    })

    return NextResponse.json({ success: true, message: `SACCO '${sacco.name}' deactivated` })
  } catch (error) {
    console.error('[sacco/[id] DELETE]', error)
    return NextResponse.json({ error: 'Failed to deactivate SACCO' }, { status: 500 })
  }
}
