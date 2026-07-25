import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { z } from 'zod'

const MerchantSchema = z.object({
  businessName: z.string().min(2).max(100),
  ownerName: z.string().min(2).max(100),
  phone: z.string().min(10).regex(/^\+?[0-9]+$/),
  settlement: z.enum(['Kiryandongo', 'Kyangwali', 'Nakivale', 'Kyaka II']),
  location: z.string().optional(),
  businessType: z.enum(['GROCERY', 'HARDWARE', 'PHARMACY', 'AGRICULTURE', 'OTHER']),
  itemsSold: z.array(z.string()).optional(),
  momoNumber: z.string().optional(),
}).strict()

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'reset:read')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const url = new URL(req.url)
    const settlement = url.searchParams.get('settlement')
    const status = url.searchParams.get('status')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (!ctx.isSuperAdmin) where.tenantId = { in: ctx.tenantScope }
    if (settlement) where.settlement = settlement
    if (status) where.status = status

    const [merchants, total] = await Promise.all([
      db.resetMerchant.findMany({ where, orderBy: { onboardedAt: 'desc' }, skip: offset, take: limit }),
      db.resetMerchant.count({ where }),
    ])

    return NextResponse.json({ merchants, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'reset:create')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    let validated
    try { validated = MerchantSchema.parse(body) } catch (err: any) {
      return NextResponse.json({ error: 'Validation failed', fields: err.issues?.map((e: any) => ({ field: e.path.join('.'), message: e.message })) || [] }, { status: 400 })
    }

    const count = await db.resetMerchant.count()
    const merchantCode = `MER-${String(count + 1).padStart(4, '0')}`

    const merchant = await db.resetMerchant.create({
      data: {
        ...validated,
        merchantCode,
        tenantId: ctx.tenantId,
        itemsSold: validated.itemsSold ? JSON.stringify(validated.itemsSold) : null,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ merchant }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
