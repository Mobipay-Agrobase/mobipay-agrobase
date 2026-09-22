import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyHealthCheck.findFirst({
      where: { id, ...tf },
      include: { cow: { select: { id: true, name: true, cowCode: true } } },
    })
    if (!item) return NextResponse.json({ error: 'Health check not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyHealthCheck detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch health check' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyHealthCheck.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Health check not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyHealthCheck.update({
      where: { id },
      data: {
        cowId: body.cowId !== undefined ? body.cowId : undefined,
        checkDate: body.checkDate !== undefined ? new Date(body.checkDate) : undefined,
        healthStatus: body.healthStatus !== undefined ? body.healthStatus : undefined,
        diseaseObserved: body.diseaseObserved !== undefined ? body.diseaseObserved || null : undefined,
        treatmentAdministered: body.treatmentAdministered !== undefined ? body.treatmentAdministered || null : undefined,
        nextCheckDate: body.nextCheckDate !== undefined ? (body.nextCheckDate ? new Date(body.nextCheckDate) : null) : undefined,
        veterinarian: body.veterinarian !== undefined ? body.veterinarian || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyHealthCheck update error:', error)
    return NextResponse.json(
      { error: 'Failed to update health check', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyHealthCheck.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Health check not found' }, { status: 404 })
    await db.dairyHealthCheck.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyHealthCheck delete error:', error)
    return NextResponse.json({ error: 'Failed to delete health check' }, { status: 500 })
  }
}
