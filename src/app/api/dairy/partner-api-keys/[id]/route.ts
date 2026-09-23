import crypto from 'crypto'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex')
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyPartnerApiKey.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Partner API key not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyPartnerApiKey detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch partner API key' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyPartnerApiKey.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Partner API key not found' }, { status: 404 })
    const body = await req.json()

    // If a new plaintext apiKey is provided on update, hash it before storing.
    const apiKeyUpdate =
      body.apiKey !== undefined
        ? typeof body.apiKey === 'string' && body.apiKey.length > 0
          ? hashApiKey(body.apiKey)
          : undefined
        : undefined

    const updated = await db.dairyPartnerApiKey.update({
      where: { id },
      data: {
        partnerName: body.partnerName !== undefined ? body.partnerName : undefined,
        partnerType: body.partnerType !== undefined ? body.partnerType : undefined,
        apiKey: apiKeyUpdate,
        scopes: body.scopes !== undefined ? body.scopes || null : undefined,
        rateLimitPerMin:
          body.rateLimitPerMin !== undefined
            ? body.rateLimitPerMin !== null && body.rateLimitPerMin !== ''
              ? parseInt(body.rateLimitPerMin)
              : 60
            : undefined,
        rateLimitPerDay:
          body.rateLimitPerDay !== undefined
            ? body.rateLimitPerDay !== null && body.rateLimitPerDay !== ''
              ? parseInt(body.rateLimitPerDay)
              : 1000
            : undefined,
        lastUsedAt:
          body.lastUsedAt !== undefined ? (body.lastUsedAt ? new Date(body.lastUsedAt) : null) : undefined,
        expiresAt: body.expiresAt !== undefined ? (body.expiresAt ? new Date(body.expiresAt) : null) : undefined,
        isActive: body.isActive !== undefined ? !!body.isActive : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyPartnerApiKey update error:', error)
    return NextResponse.json(
      { error: 'Failed to update partner API key', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyPartnerApiKey.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Partner API key not found' }, { status: 404 })
    await db.dairyPartnerApiKey.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyPartnerApiKey delete error:', error)
    return NextResponse.json({ error: 'Failed to delete partner API key' }, { status: 500 })
  }
}
