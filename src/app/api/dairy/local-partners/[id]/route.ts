import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyLocalPartner.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Local partner not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyLocalPartner detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch local partner' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyLocalPartner.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Local partner not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyLocalPartner.update({
      where: { id },
      data: {
        partnerName: body.partnerName !== undefined ? body.partnerName : undefined,
        partnerType: body.partnerType !== undefined ? body.partnerType : undefined,
        countryCode: body.countryCode !== undefined ? body.countryCode : undefined,
        contactName: body.contactName !== undefined ? body.contactName || null : undefined,
        contactPhone: body.contactPhone !== undefined ? body.contactPhone || null : undefined,
        contactEmail: body.contactEmail !== undefined ? body.contactEmail || null : undefined,
        agreementUrl: body.agreementUrl !== undefined ? body.agreementUrl || null : undefined,
        status: body.status !== undefined ? body.status : undefined,
        startDate: body.startDate !== undefined ? (body.startDate ? new Date(body.startDate) : null) : undefined,
        endDate: body.endDate !== undefined ? (body.endDate ? new Date(body.endDate) : null) : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyLocalPartner update error:', error)
    return NextResponse.json(
      { error: 'Failed to update local partner', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyLocalPartner.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Local partner not found' }, { status: 404 })
    await db.dairyLocalPartner.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyLocalPartner delete error:', error)
    return NextResponse.json({ error: 'Failed to delete local partner' }, { status: 500 })
  }
}
