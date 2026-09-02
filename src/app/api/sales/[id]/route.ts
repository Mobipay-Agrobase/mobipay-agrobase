import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getTenantContext(req)

  const where: Record<string, unknown> = { id }
  if (!ctx.isSuperAdmin) {
    const validFarmerIds = await db.farmerProfile.findMany({
      where: { tenantId: { in: ctx.tenantScope as string[] } },
      select: { id: true },
    })
    where.farmerId = { in: validFarmerIds.map(f => f.id) }
  }

  const record = await db.sale.findFirst({
    where,
    include: { farmer: true },
  })
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: record })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getTenantContext(req)
  // Write gate: draft edits require sales:update (farmer roles are read-only).
  if (!hasPermission(ctx.role || '', 'sales:update')) {
    return NextResponse.json({ error: 'Insufficient permissions to update sales' }, { status: 403 })
  }
  const body = await req.json()

  const where: Record<string, unknown> = { id }
  if (!ctx.isSuperAdmin) {
    const validFarmerIds = await db.farmerProfile.findMany({
      where: { tenantId: { in: ctx.tenantScope as string[] } },
      select: { id: true },
    })
    where.farmerId = { in: validFarmerIds.map(f => f.id) }
  }

  const existing = await db.sale.findFirst({ where })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await db.sale.update({
    where: { id },
    data: { ...body },
  })
  return NextResponse.json({ data: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getTenantContext(req)
  // Write gate: deletion requires sales:delete (MD/OPS/FINANCE among EKB roles).
  if (!hasPermission(ctx.role || '', 'sales:delete')) {
    return NextResponse.json({ error: 'Insufficient permissions to delete sales' }, { status: 403 })
  }

  const where: Record<string, unknown> = { id }
  if (!ctx.isSuperAdmin) {
    const validFarmerIds = await db.farmerProfile.findMany({
      where: { tenantId: { in: ctx.tenantScope as string[] } },
      select: { id: true },
    })
    where.farmerId = { in: validFarmerIds.map(f => f.id) }
  }

  const existing = await db.sale.findFirst({ where })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.sale.deleteMany({ where })
  return NextResponse.json({ message: 'Deleted successfully' })
}