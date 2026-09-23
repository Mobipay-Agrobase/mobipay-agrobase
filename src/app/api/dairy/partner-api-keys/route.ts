import crypto from 'crypto'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * Hash a raw API key string with SHA-256 (hex digest).
 * Used to store partner API keys safely — never store the raw plaintext.
 */
function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex')
}

/**
 * GET /api/dairy/partner-api-keys — list partner API keys (paginated + search)
 * POST /api/dairy/partner-api-keys — create a new partner API key.
 *   On POST, the `apiKey` field is hashed (SHA-256) before being stored.
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const partnerType = searchParams.get('partnerType')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (partnerType) where.partnerType = partnerType
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false
    if (search) {
      where.OR = [
        { partnerName: { contains: search, mode: 'insensitive' } },
        { partnerType: { contains: search, mode: 'insensitive' } },
        { apiKey: { contains: search, mode: 'insensitive' } },
        { scopes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyPartnerApiKey.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyPartnerApiKey.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyPartnerApiKey list error:', error)
    return NextResponse.json({ error: 'Failed to fetch partner API keys' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!body.apiKey || typeof body.apiKey !== 'string' || body.apiKey.length === 0) {
      return NextResponse.json({ error: 'apiKey is required (will be hashed before storage)' }, { status: 400 })
    }

    // Hash the plaintext apiKey with SHA-256 before storing it.
    const hashedKey = hashApiKey(body.apiKey)

    const created = await db.dairyPartnerApiKey.create({
      data: {
        tenantId: ctx.tenantId,
        partnerName: body.partnerName,
        partnerType: body.partnerType || 'processor',
        apiKey: hashedKey,
        scopes: body.scopes || null,
        rateLimitPerMin: body.rateLimitPerMin !== undefined ? parseInt(body.rateLimitPerMin) : 60,
        rateLimitPerDay: body.rateLimitPerDay !== undefined ? parseInt(body.rateLimitPerDay) : 1000,
        lastUsedAt: body.lastUsedAt ? new Date(body.lastUsedAt) : null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    // Strip the hashed key from the response — never expose it to clients.
    // Clients only see the plaintext key once (the one they sent in).
    const { apiKey: _stripped, ...safe } = created
    return NextResponse.json(
      {
        data: safe,
        // Echo the plaintext key back exactly once for the caller to save.
        // After this response, the plaintext cannot be recovered.
        apiKey: body.apiKey,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('DairyPartnerApiKey create error:', error)
    return NextResponse.json(
      { error: 'Failed to create partner API key', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
