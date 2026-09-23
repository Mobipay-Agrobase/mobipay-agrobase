import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyCreditScore.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Credit score not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyCreditScore detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch credit score' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyCreditScore.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Credit score not found' }, { status: 404 })
    const body = await req.json()

    const updated = await db.dairyCreditScore.update({
      where: { id },
      data: {
        farmerId: body.farmerId !== undefined ? body.farmerId : undefined,
        farmerName: body.farmerName !== undefined ? body.farmerName : undefined,
        scoredOn: body.scoredOn !== undefined ? (body.scoredOn ? new Date(body.scoredOn) : undefined) : undefined,
        score: body.score !== undefined ? (body.score ? parseInt(body.score) : undefined) : undefined,
        band: body.band !== undefined ? body.band : undefined,
        monthsOfHistory: body.monthsOfHistory !== undefined ? (body.monthsOfHistory ? parseInt(body.monthsOfHistory) : 0) : undefined,
        avgMonthlyIncome: body.avgMonthlyIncome !== undefined ? (body.avgMonthlyIncome ? parseFloat(body.avgMonthlyIncome) : null) : undefined,
        volumeConsistency: body.volumeConsistency !== undefined ? (body.volumeConsistency ? parseFloat(body.volumeConsistency) : null) : undefined,
        qualityIndex: body.qualityIndex !== undefined ? (body.qualityIndex ? parseFloat(body.qualityIndex) : null) : undefined,
        herdHealthIndex: body.herdHealthIndex !== undefined ? (body.herdHealthIndex ? parseFloat(body.herdHealthIndex) : null) : undefined,
        modelVersion: body.modelVersion !== undefined ? body.modelVersion : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyCreditScore update error:', error)
    return NextResponse.json(
      { error: 'Failed to update credit score', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyCreditScore.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Credit score not found' }, { status: 404 })
    await db.dairyCreditScore.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyCreditScore delete error:', error)
    return NextResponse.json({ error: 'Failed to delete credit score' }, { status: 500 })
  }
}
