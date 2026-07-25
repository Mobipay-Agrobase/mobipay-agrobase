import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { z } from 'zod'

const VoucherSchema = z.object({
  beneficiaryId: z.string().min(1),
  type: z.enum(['ASSET', 'CASH', 'FOOD', 'INPUT']),
  amount: z.number().positive(),
  issuedBy: z.string(),
  agentId: z.string().optional(),
  allowedItems: z.array(z.string()).optional(),
  allowedMerchants: z.array(z.string()).optional(),
  allowedLocations: z.array(z.string()).optional(),
  expiryDays: z.number().int().min(1).max(365).default(90),
}).strict()

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'reset:read')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const beneficiaryId = url.searchParams.get('beneficiaryId')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (!ctx.isSuperAdmin) where.beneficiary = { tenantId: { in: ctx.tenantScope } }
    if (status) where.status = status
    if (beneficiaryId) where.beneficiaryId = beneficiaryId

    const [vouchers, total] = await Promise.all([
      db.resetVoucher.findMany({ where, include: { beneficiary: { select: { fullName: true, beneficiaryId: true, phone: true, settlement: true } } }, orderBy: { issuedAt: 'desc' }, skip: offset, take: limit }),
      db.resetVoucher.count({ where }),
    ])

    return NextResponse.json({ vouchers, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
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
    try { validated = VoucherSchema.parse(body) } catch (err: any) {
      return NextResponse.json({ error: 'Validation failed', fields: err.issues?.map((e: any) => ({ field: e.path.join('.'), message: e.message })) || [] }, { status: 400 })
    }

    const beneficiary = await db.resetBeneficiary.findUnique({ where: { id: validated.beneficiaryId } })
    if (!beneficiary) return NextResponse.json({ error: 'Beneficiary not found' }, { status: 404 })

    const count = await db.resetVoucher.count()
    const voucherCode = `VC-2026-${String(count + 1).padStart(6, '0')}`
    const expiryDate = new Date(Date.now() + validated.expiryDays * 86400000)

    const voucher = await db.resetVoucher.create({
      data: {
        voucherCode,
        beneficiaryId: validated.beneficiaryId,
        issuedBy: validated.issuedBy,
        agentId: validated.agentId,
        type: validated.type,
        amount: validated.amount,
        allowedItems: validated.allowedItems ? JSON.stringify(validated.allowedItems) : null,
        allowedMerchants: validated.allowedMerchants ? JSON.stringify(validated.allowedMerchants) : null,
        allowedLocations: validated.allowedLocations ? JSON.stringify(validated.allowedLocations) : null,
        expiryDate,
        status: 'ISSUED',
      },
    })

    // Update beneficiary voucher balance
    await db.resetBeneficiary.update({ where: { id: validated.beneficiaryId }, data: { voucherBalance: { increment: validated.amount } } })

    return NextResponse.json({ voucher, message: 'Voucher issued. SMS sent to beneficiary.' }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
