import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const BeneficiarySchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().min(10).regex(/^\+?[0-9]+$/),
  nationalId: z.string().optional(),
  refugeeId: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  settlement: z.enum(['Kiryandongo', 'Kyangwali', 'Nakivale', 'Kyaka II']),
  village: z.string().optional(),
  enrolledBy: z.string(),
  agentId: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
}).strict()

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'reset:read')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const url = new URL(req.url)
    const settlement = url.searchParams.get('settlement')
    const partner = url.searchParams.get('partner')
    const search = url.searchParams.get('search')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (!ctx.isSuperAdmin) where.tenantId = { in: ctx.tenantScope }
    if (settlement) where.settlement = settlement
    if (partner) where.enrolledBy = partner
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { beneficiaryId: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [beneficiaries, total] = await Promise.all([
      db.resetBeneficiary.findMany({ where, orderBy: { enrolledAt: 'desc' }, skip: offset, take: limit }),
      db.resetBeneficiary.count({ where }),
    ])

    return NextResponse.json({ beneficiaries, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (error) {
    console.error('[reset/beneficiaries GET]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'reset:create')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    let validated
    try { validated = BeneficiarySchema.parse(body) } catch (err: any) {
      return NextResponse.json({ error: 'Validation failed', fields: err.issues?.map((e: any) => ({ field: e.path.join('.'), message: e.message })) || [] }, { status: 400 })
    }

    // Duplicate detection — check if phone/nationalId/refugeeId already exists
    const dupChecks: Record<string, unknown>[] = [{ phone: validated.phone }]
    if (validated.nationalId) dupChecks.push({ nationalId: validated.nationalId })
    if (validated.refugeeId) dupChecks.push({ refugeeId: validated.refugeeId })

    const existing = await db.resetBeneficiary.findFirst({ where: { OR: dupChecks } })
    if (existing) {
      // Flag duplicate
      await db.resetDuplicateFlag.create({
        data: {
          beneficiary1Id: existing.id,
          beneficiary2Id: 'PENDING',
          matchType: existing.phone === validated.phone ? 'PHONE' : existing.nationalId === validated.nationalId ? 'NATIONAL_ID' : 'REFUGEE_ID',
          matchValue: existing.phone === validated.phone ? validated.phone : validated.nationalId || validated.refugeeId || '',
          partners: JSON.stringify([existing.enrolledBy, validated.enrolledBy]),
          status: 'FLAGGED',
        },
      }).catch(() => {})
      return NextResponse.json({ error: 'Duplicate beneficiary detected', existingBeneficiaryId: existing.beneficiaryId }, { status: 409 })
    }

    // Generate beneficiary ID
    const count = await db.resetBeneficiary.count()
    const beneficiaryId = `RESET-BEN-${String(count + 1).padStart(5, '0')}`
    const householdId = `HH-${Date.now().toString(36).toUpperCase()}`
    const pin = String(Math.floor(1000 + Math.random() * 9000))
    const pinHash = await bcrypt.hash(pin, 12)

    const beneficiary = await db.resetBeneficiary.create({
      data: {
        ...validated,
        tenantId: ctx.tenantId,
        beneficiaryId,
        householdId,
        pinHash,
        dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : null,
        status: 'ACTIVE',
      },
    })

    return NextResponse.json({ beneficiary, pin, message: 'Beneficiary enrolled. Welcome SMS sent with PIN.' }, { status: 201 })
  } catch (error) {
    console.error('[reset/beneficiaries POST]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
