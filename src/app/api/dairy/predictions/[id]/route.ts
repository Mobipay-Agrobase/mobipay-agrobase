import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyPrediction.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Prediction not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyPrediction detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch prediction' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyPrediction.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Prediction not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyPrediction.update({
      where: { id },
      data: {
        predictionType: body.predictionType !== undefined ? body.predictionType : undefined,
        targetType: body.targetType !== undefined ? body.targetType : undefined,
        targetId: body.targetId !== undefined ? body.targetId || null : undefined,
        predictionDate:
          body.predictionDate !== undefined
            ? body.predictionDate
              ? new Date(body.predictionDate)
              : new Date()
            : undefined,
        targetDate:
          body.targetDate !== undefined
            ? body.targetDate
              ? new Date(body.targetDate)
              : new Date()
            : undefined,
        predictedValue:
          body.predictedValue !== undefined
            ? body.predictedValue !== null && body.predictedValue !== ''
              ? parseFloat(body.predictedValue)
              : null
            : undefined,
        unit: body.unit !== undefined ? body.unit || null : undefined,
        confidence:
          body.confidence !== undefined
            ? body.confidence !== null && body.confidence !== ''
              ? parseFloat(body.confidence)
              : null
            : undefined,
        modelVersion: body.modelVersion !== undefined ? body.modelVersion : undefined,
        features: body.features !== undefined ? body.features || null : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyPrediction update error:', error)
    return NextResponse.json(
      { error: 'Failed to update prediction', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyPrediction.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Prediction not found' }, { status: 404 })
    await db.dairyPrediction.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyPrediction delete error:', error)
    return NextResponse.json({ error: 'Failed to delete prediction' }, { status: 500 })
  }
}
