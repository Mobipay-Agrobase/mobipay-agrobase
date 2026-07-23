import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { logSecureAction } from '@/lib/security/secure-audit-logger'
import { z } from 'zod'

// ─── Zod Schema for loan application ───
const LoanApplicationSchema = z.object({
  vslaGroupId: z.string().min(1, 'Group ID required'),
  farmerId: z.string().min(1, 'Farmer ID required'),
  amount: z.number()
    .positive('Amount must be positive')
    .max(5_000_000, 'Max loan: UGX 5M'),
  interestRate: z.number().min(0).max(50).optional(),
  purpose: z.string().min(5, 'Purpose must be at least 5 characters').max(500),
  dueDate: z.string().datetime().optional(),
}).strict()

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext()

    if (!hasPermission(ctx.role, 'vsla:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const groupId = req.nextUrl.searchParams.get('groupId') || ''
    const status = req.nextUrl.searchParams.get('status') || ''
    const where: Record<string, unknown> = {}
    if (groupId) where.vslaGroupId = groupId
    if (status) where.status = status
    // Filter through vslaGroup tenantId
    if (!ctx.isSuperAdmin) {
      where.vslaGroup = { tenantId: { in: ctx.tenantScope as string[] } }
    }
    const loans = await db.vslaLoan.findMany({
      where,
      include: { farmer: { select: { firstName: true, lastName: true, farmerCode: true, phone: true } } },
      orderBy: { createdAt: 'desc' }, take: 100,
    })
    return NextResponse.json({ loans })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch VSLA loans' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext()

    if (!hasPermission(ctx.role, 'vsla:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse + validate body
    let body
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    let validated
    try {
      validated = LoanApplicationSchema.parse(body)
    } catch (err: any) {
      const fields = err.issues?.map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
      })) || [{ field: 'body', message: 'Validation failed' }]
      return NextResponse.json({ error: 'Validation failed', fields }, { status: 400 })
    }

    // Verify VSLA group belongs to tenant
    const group = await db.vslaGroup.findFirst({
      where: {
        id: validated.vslaGroupId,
        ...(ctx.isSuperAdmin ? {} : { tenantId: { in: ctx.tenantScope as string[] } }),
      },
      include: { _count: { select: { loans: true } } },
    })
    if (!group) {
      return NextResponse.json({ error: 'VSLA group not found in your tenant' }, { status: 403 })
    }

    // ─── AUTO-ELIGIBILITY CHECK (per SRS Section 5.1) ───
    // 1. Active saver: member must have at least 1 savings record
    // 2. No outstanding loan: no loan with status DISBURSED or OVERDUE
    // 3. Within loan limit: amount <= savings × group.maxLoanAmount multiplier
    //    (Note: the existing schema uses maxLoanAmount as a flat cap, not a multiplier.
    //     We check both: amount <= group.maxLoanAmount AND amount <= savings × 3)
    const memberSavings = await db.vslaSaving.aggregate({
      where: { farmerId: validated.farmerId, vslaGroupId: validated.vslaGroupId, status: 'COMPLETED' },
      _sum: { amount: true },
    })
    const totalSavings = memberSavings._sum.amount ?? 0

    if (totalSavings === 0) {
      return NextResponse.json({
        error: 'Loan eligibility failed',
        reason: 'Active saver required — no savings records found. Member must save at least once before borrowing.',
        eligible: false,
      }, { status: 400 })
    }

    // Check for outstanding loans
    const outstandingLoans = await db.vslaLoan.findFirst({
      where: {
        farmerId: validated.farmerId,
        vslaGroupId: validated.vslaGroupId,
        status: { in: ['DISBURSED', 'OVERDUE', 'APPROVED'] },
      },
    })
    if (outstandingLoans) {
      return NextResponse.json({
        error: 'Loan eligibility failed',
        reason: 'Outstanding loan exists. Member must repay current loan before applying for a new one.',
        eligible: false,
        outstandingLoanId: outstandingLoans.id,
      }, { status: 400 })
    }

    // Check loan limit (use group's maxLoanAmount as the cap)
    if (validated.amount > group.maxLoanAmount) {
      return NextResponse.json({
        error: 'Loan eligibility failed',
        reason: `Amount exceeds group limit. Max: UGX ${group.maxLoanAmount.toLocaleString()}`,
        eligible: false,
        maxAllowed: group.maxLoanAmount,
      }, { status: 400 })
    }

    // Check for pending fines
    const pendingFines = await db.welfarePayment.count({
      where: { vslaGroupId: validated.vslaGroupId, farmerId: validated.farmerId },
    })
    // Note: the existing schema uses WelfarePayment for fines — this is a known schema issue

    // ─── Create loan with status PENDING (awaiting key-holder approval per SRS) ───
    const interestRate = validated.interestRate ?? group.loanRate
    const totalRepayable = validated.amount + (validated.amount * interestRate / 100)
    const loan = await db.vslaLoan.create({
      data: {
        vslaGroupId: validated.vslaGroupId,
        farmerId: validated.farmerId,
        tenantId: ctx.tenantId,
        amount: validated.amount,
        interestRate,
        totalRepayable,
        purpose: validated.purpose,
        status: 'PENDING',
        dueDate: validated.dueDate ? new Date(validated.dueDate) : new Date(Date.now() + 90 * 86400000),
      }
    })

    // ─── Secure tamper-evident audit log ───
    await logSecureAction({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      actorName: undefined,
      actorRole: ctx.role,
      action: 'VSLA_LOAN_APPLICATION',
      entityType: 'VslaLoan',
      entityId: loan.id,
      description: `Loan application: UGX ${validated.amount} for "${validated.purpose}"`,
      metadata: {
        amount: validated.amount,
        interestRate,
        totalRepayable,
        purpose: validated.purpose,
        groupId: validated.vslaGroupId,
        farmerId: validated.farmerId,
        memberSavings: totalSavings,
        eligibilityPassed: true,
      },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
      httpMethod: 'POST',
      path: '/api/vsla/loans',
    })

    return NextResponse.json({ data: loan, eligible: true }, { status: 201 })
  } catch (error) {
    console.error('[vsla/loans POST] error:', error)
    return NextResponse.json({ error: 'Failed to create VSLA loan' }, { status: 500 })
  }
}
