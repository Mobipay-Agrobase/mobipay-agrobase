import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getTenantContext(req)
  const tf = buildTenantFilter(ctx, 'tenantId') as any

  const record = await db.inputProduct.findFirst({
    where: { id, ...tf },
    include: { dealer: true },
  })
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: record })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getTenantContext(req)
  const tf = buildTenantFilter(ctx, 'tenantId') as any
  const body = await req.json()

  const existing = await db.inputProduct.findFirst({ where: { id, ...tf } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Explicit field whitelist (never spread the raw body — it could carry
  // id/tenantId/dealerId overrides). stockQuantity is the second-review (K)
  // on-hand stock field, maintained by staff from the product form.
  const data: Record<string, unknown> = { updatedAt: new Date() }
  if (body.name !== undefined) data.name = String(body.name)
  if (body.category !== undefined) data.category = body.category === null ? null : String(body.category)
  if (body.variety !== undefined) data.variety = body.variety === null ? null : String(body.variety)
  if (body.unit !== undefined) data.unit = body.unit === null ? null : String(body.unit)
  if (body.unitPrice !== undefined) data.unitPrice = body.unitPrice === null ? null : Number(body.unitPrice)
  if (body.stockQuantity !== undefined) {
    const qty = Number(body.stockQuantity)
    data.stockQuantity = Number.isFinite(qty) && qty >= 0 ? qty : 0
  }
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive)

  const updated = await db.inputProduct.update({ where: { id }, data })
  return NextResponse.json({ data: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getTenantContext(req)
  const tf = buildTenantFilter(ctx, 'tenantId') as any

  const existing = await db.inputProduct.findFirst({ where: { id, ...tf } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.inputProduct.update({
    where: { id },
    data: { isActive: false, updatedAt: new Date() },
  })
  return NextResponse.json({ message: 'Deleted successfully' })
}