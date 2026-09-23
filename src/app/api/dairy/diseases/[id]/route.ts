import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyDisease.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Disease not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyDisease detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch disease' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyDisease.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Disease not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyDisease.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        category: body.category !== undefined ? body.category || null : undefined,
        symptoms:
          body.symptoms !== undefined
            ? body.symptoms
              ? (Array.isArray(body.symptoms) ? JSON.stringify(body.symptoms) : String(body.symptoms))
              : null
            : undefined,
        isNotifiable: body.isNotifiable !== undefined ? !!body.isNotifiable : undefined,
        treatmentProtocol: body.treatmentProtocol !== undefined ? body.treatmentProtocol || null : undefined,
        preventionMeasures: body.preventionMeasures !== undefined ? body.preventionMeasures || null : undefined,
        isActive: body.isActive !== undefined ? !!body.isActive : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyDisease update error:', error)
    return NextResponse.json(
      { error: 'Failed to update disease', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyDisease.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Disease not found' }, { status: 404 })
    await db.dairyDisease.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyDisease delete error:', error)
    return NextResponse.json({ error: 'Failed to delete disease' }, { status: 500 })
  }
}
