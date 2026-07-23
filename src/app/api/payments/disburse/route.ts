import { db } from '@/lib/db'
import { NextResponse, NextRequest } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { z } from 'zod'
import { logSecureAction } from '@/lib/security/secure-audit-logger'

// ─── Zod Schemas ───
// Strict validation on all disbursement requests to prevent fraud + injection

const BulkRecipientSchema = z.object({
  phone: z.string()
    .min(10, 'Phone must be at least 10 digits')
    .max(15)
    .regex(/^\+?[0-9]+$/, 'Phone must contain only digits and optional + prefix'),
  name: z.string().min(2).max(100),
  amount: z.number().positive().max(10_000_000, 'Max per recipient: UGX 10M'),
  reference: z.string().max(100).optional(),
}).strict()

const SingleDisburseSchema = z.object({
  provider: z.enum(['MTN', 'AIRTEL', 'FLUTTERWAVE', 'BANK']).optional(),
  type: z.enum([
    'CASUAL', 'BULK_PURCHASE', 'BULK_DISBURSEMENT',
    'MARKETPLACE', 'VSLA', 'NSSF', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT'
  ]),
  amount: z.number()
    .positive('Amount must be positive')
    .max(10_000_000, 'Max disbursement: UGX 10M per transaction'),
  currency: z.string().length(3).default('UGX'),
  recipientPhone: z.string()
    .min(10, 'Recipient phone required')
    .max(15)
    .regex(/^\+?[0-9]+$/, 'Invalid phone format'),
  recipientName: z.string().min(2, 'Recipient name required').max(100),
  description: z.string().max(500).optional(),
  reference: z.string().max(100).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  // Idempotency key prevents double-disbursement on retries
  idempotencyKey: z.string().max(100).optional(),
  // Optional linkage to internal records
  refType: z.string().max(50).optional(),
  refId: z.string().max(100).optional(),
}).strict()

const BulkDisburseSchema = z.object({
  type: z.literal('BULK_DISBURSEMENT'),
  description: z.string().max(500).optional(),
  recipients: z.array(BulkRecipientSchema).min(1, 'At least one recipient required').max(500, 'Max 500 recipients per bulk'),
}).strict()

// ─── GET handler (unchanged — list disbursements with filters) ───
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()

    if (!hasPermission(ctx.role, 'payments:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const recipient = searchParams.get('recipient') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (type) where.type = type
    if (recipient) {
      where.OR = [
        { recipientPhone: { contains: recipient } },
        { recipientName: { contains: recipient } },
      ]
    }
    if (startDate || endDate) {
      where.createdAt = {} as Record<string, unknown>
      if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate)
    }
    // Tenant isolation through paymentAccount
    if (!ctx.isSuperAdmin) {
      where.paymentAccount = { tenantId: { in: ctx.tenantScope as string[] } }
    }

    const [data, total] = await Promise.all([
      db.payment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { paymentAccount: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.payment.count({ where }),
    ])

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch disbursements' }, { status: 500 })
  }
}

// ─── POST handler (Zod-validated + secure audit logged) ───
export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext()

    if (!hasPermission(ctx.role, 'payments:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse + validate body with Zod
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    // Detect bulk vs single disbursement
    const isBulk = body.type === 'BULK_DISBURSEMENT' && Array.isArray(body.recipients)

    let validatedData
    try {
      validatedData = isBulk
        ? BulkDisburseSchema.parse(body)
        : SingleDisburseSchema.parse(body)
    } catch (err: any) {
      // Zod validation error — return field-level details
      const fields = err.issues?.map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
      })) || [{ field: 'body', message: 'Validation failed' }]
      return NextResponse.json({ error: 'Validation failed', fields }, { status: 400 })
    }

    // ─── Bulk disbursement ───
    if (isBulk) {
      const data = validatedData as z.infer<typeof BulkDisburseSchema>

      // SECURITY: Check idempotency — if any payment with the same reference exists, reject
      const existingRefs = await db.payment.findMany({
        where: {
          transactionRef: { in: data.recipients.map(r => r.reference).filter(Boolean) as string[] },
        },
        select: { transactionRef: true },
      })
      if (existingRefs.length > 0) {
        return NextResponse.json({
          error: 'Idempotency conflict',
          message: 'Some references already exist. Duplicate disbursement blocked.',
          duplicates: existingRefs.map(p => p.transactionRef),
        }, { status: 409 })
      }

      // Create all payments in a transaction (atomic — all or nothing)
      const payments = await db.$transaction(
        data.recipients.map((r) =>
          db.payment.create({
            data: {
              type: 'BULK_DISBURSEMENT',
              recipientName: r.name,
              recipientPhone: r.phone,
              amount: r.amount,
              description: data.description || `Bulk disbursement to ${r.name}`,
              transactionRef: r.reference || `DISB-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              status: 'PENDING',
            },
          })
        )
      )

      // Secure audit log — one entry per recipient + one summary
      await Promise.all(data.recipients.map((r, i) =>
        logSecureAction({
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          actorName: undefined,
          actorRole: ctx.role,
          action: 'BULK_DISBURSEMENT_CREATED',
          entityType: 'Payment',
          entityId: payments[i].id,
          description: `Bulk disbursement of UGX ${r.amount} to ${r.name} (${r.phone})`,
          metadata: {
            amount: r.amount,
            recipientPhone: r.phone,
            recipientName: r.name,
            reference: r.reference,
            bulkSize: data.recipients.length,
          },
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
          httpMethod: 'POST',
          path: '/api/payments/disburse',
        })
      ))

      return NextResponse.json({ data: payments, count: payments.length }, { status: 201 })
    }

    // ─── Single disbursement ───
    const data = validatedData as z.infer<typeof SingleDisburseSchema>

    // SECURITY: Idempotency check — if reference already exists, return the existing payment
    if (data.reference) {
      const existing = await db.payment.findFirst({
        where: { transactionRef: data.reference },
      })
      if (existing) {
        return NextResponse.json({
          data: existing,
          message: 'Idempotent response — payment already exists',
        }, { status: 200 })
      }
    }

    const payment = await db.payment.create({
      data: {
        type: data.type,
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        amount: data.amount,
        description: data.description || null,
        transactionRef: data.reference || `DISB-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        status: 'PENDING',
      },
    })

    // Secure audit log
    await logSecureAction({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      actorName: undefined,
      actorRole: ctx.role,
      action: 'DISBURSEMENT_CREATED',
      entityType: 'Payment',
      entityId: payment.id,
      description: `Disbursement of UGX ${data.amount} to ${data.recipientName} (${data.recipientPhone})`,
      metadata: {
        amount: data.amount,
        currency: data.currency,
        recipientPhone: data.recipientPhone,
        recipientName: data.recipientName,
        type: data.type,
        provider: data.provider,
        reference: data.reference,
        refType: data.refType,
        refId: data.refId,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      httpMethod: 'POST',
      path: '/api/payments/disburse',
    })

    return NextResponse.json({ data: payment }, { status: 201 })
  } catch (error) {
    console.error('[payments/disburse] error:', error)
    return NextResponse.json({ error: 'Failed to initiate disbursement' }, { status: 500 })
  }
}
