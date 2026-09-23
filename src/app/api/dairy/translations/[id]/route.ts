import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyTranslation.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Translation not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyTranslation detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch translation' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyTranslation.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Translation not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyTranslation.update({
      where: { id },
      data: {
        languageCode: body.languageCode !== undefined ? body.languageCode : undefined,
        key: body.key !== undefined ? body.key : undefined,
        value: body.value !== undefined ? body.value : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyTranslation update error:', error)
    return NextResponse.json(
      { error: 'Failed to update translation', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyTranslation.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Translation not found' }, { status: 404 })
    await db.dairyTranslation.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyTranslation delete error:', error)
    return NextResponse.json({ error: 'Failed to delete translation' }, { status: 500 })
  }
}
