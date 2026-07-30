import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { headers } from 'next/headers'

/**
 * GET /api/sacco/loans?saccoId=xxx&status=xxx
 *   List loans for a SACCO.
 *
 * POST /api/sacco/loans
 *   Apply for a new SACCO loan. Auto-computes interest + total repayable.
 *   Body: { saccoId, memberId, principal, purpose?, dueDate? }
 *
 * POST /api/sacco/loans/[id]/repay
 *   Record a loan repayment.
 */

async function writeAudit(args: { userId: string; action: string; entityType?: string; entityId?: string; details?: Record<string, unknown> }) {
  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || headersList.get('x-real-ip') || undefined
  await db.auditLog.create({
    data: {
      userId: args.userId,
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId,
      details: args.details ? JSON.stringify(args.details) : undefined,
      ipAddress,
    },
  }).catch(err => { console.error('[AuditLog]', err) })
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext(request)
    if (!hasPermission(ctx.role, 'sacco:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const saccoId = searchParams.get('saccoId')
    const status = searchParams.get('status')

    if (!saccoId) {
      return NextResponse.json({ error: 'saccoId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = {
      saccoId,
      ...buildTenantFilter(ctx, 'tenantId'),
    }
    if (status) where.status = status

    const loans = await db.saccoLoan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        member: { select: { memberNumber: true, fullName: true, phone: true } },
        _count: { select: { repayments: true } },
      },
    })

    return NextResponse.json({
      loans: loans.map(l => ({
        ...l,
        repaymentCount: l._count.repayments,
      })),
      total: loans.length,
    })
  } catch (error) {
    console.error('[sacco/loans GET]', error)
    return NextResponse.json({ error: 'Failed to fetch loans' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext(request)
    if (!hasPermission(ctx.role, 'sacco:create')) {
      return NextResponse.json({ error: 'Forbidden — sacco:create permission required' }, { status: 403 })
    }

    const body = await request.json()
    const { saccoId, memberId, principal, purpose, dueDate } = body as {
      saccoId?: string; memberId?: string; principal?: number; purpose?: string; dueDate?: string
    }

    if (!saccoId || !memberId || !principal) {
      return NextResponse.json({ error: 'saccoId, memberId, and principal are required' }, { status: 400 })
    }

    // Verify SACCO + member
    const sacco = await db.sacco.findFirst({
      where: { id: saccoId, ...buildTenantFilter(ctx, 'tenantId') },
      select: { id: true, interestRate: true, maxLoanMultiplier: true, shareValue: true },
    })
    if (!sacco) {
      return NextResponse.json({ error: 'SACCO not found' }, { status: 404 })
    }

    const member = await db.saccoMember.findFirst({
      where: { id: memberId, saccoId },
      select: { id: true, sharesOwned: true, fullName: true },
    })
    if (!member) {
      return NextResponse.json({ error: 'Member not found in this SACCO' }, { status: 404 })
    }

    // Check loan limit: max = shares × shareValue × maxLoanMultiplier
    // (simplified: use sharesOwned × 10000 as the base)
    const maxLoan = member.sharesOwned * sacco.shareValue * sacco.maxLoanMultiplier
    if (principal > maxLoan) {
      return NextResponse.json({
        error: `Loan amount ${principal} exceeds maximum allowed (${maxLoan}) for member with ${member.sharesOwned} shares`,
      }, { status: 400 })
    }

    // Compute interest (simple interest for the loan term)
    const interestRate = sacco.interestRate
    const interestAmount = Math.round(principal * (interestRate / 100) * 100) / 100
    const totalRepayable = principal + interestAmount

    // Generate loan number
    const existingCount = await db.saccoLoan.count({ where: { saccoId } })
    const loanNumber = `SACCO-LOAN-${String(existingCount + 1).padStart(5, '0')}`

    const loan = await db.saccoLoan.create({
      data: {
        tenantId: ctx.tenantId,
        saccoId,
        memberId,
        loanNumber,
        principal,
        interestRate,
        interestAmount,
        totalRepayable,
        purpose: purpose || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'PENDING',
      },
    })

    await writeAudit({
      userId: ctx.userId,
      action: 'SACCO_LOAN_APPLY',
      entityType: 'SaccoLoan',
      entityId: loan.id,
      details: { loanNumber, saccoId, memberId, principal, interestRate, totalRepayable, memberName: member.fullName },
    })

    return NextResponse.json({ loan }, { status: 201 })
  } catch (error) {
    console.error('[sacco/loans POST]', error)
    return NextResponse.json({ error: 'Failed to create loan' }, { status: 500 })
  }
}
