import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * DairyVetReview has no tenantId column; tenant scoping is enforced via the
 * parent DairyVet relation (vet.tenantId).
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyVetReview.findFirst({
      where: { id, vet: { ...tf } },
      include: { vet: { select: { id: true, fullName: true, phone: true } } },
    })
    if (!item) return NextResponse.json({ error: 'Vet review not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyVetReview detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch vet review' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyVetReview.findFirst({ where: { id, vet: { ...tf } } })
    if (!existing) return NextResponse.json({ error: 'Vet review not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyVetReview.update({
      where: { id },
      data: {
        vetId: body.vetId !== undefined ? body.vetId : undefined,
        vetRequestId: body.vetRequestId !== undefined ? body.vetRequestId || null : undefined,
        farmerName: body.farmerName !== undefined ? body.farmerName : undefined,
        rating: body.rating !== undefined ? parseInt(body.rating) : undefined,
        tags:
          body.tags !== undefined
            ? body.tags
              ? (Array.isArray(body.tags) ? JSON.stringify(body.tags) : String(body.tags))
              : null
            : undefined,
        comment: body.comment !== undefined ? body.comment || null : undefined,
        responseTimeMin:
          body.responseTimeMin !== undefined
            ? body.responseTimeMin
              ? parseInt(body.responseTimeMin)
              : null
            : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyVetReview update error:', error)
    return NextResponse.json(
      { error: 'Failed to update vet review', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyVetReview.findFirst({ where: { id, vet: { ...tf } } })
    if (!existing) return NextResponse.json({ error: 'Vet review not found' }, { status: 404 })
    await db.dairyVetReview.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyVetReview delete error:', error)
    return NextResponse.json({ error: 'Failed to delete vet review' }, { status: 500 })
  }
}
