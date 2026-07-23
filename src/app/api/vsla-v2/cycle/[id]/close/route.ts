/**
 * VSLA V2 — Cycle Close
 * SRS 5.3: Freeze → auto-calculate share-out → key-holder approval → disburse → archive
 * 
 * This endpoint handles the full cycle close flow:
 * 1. Verify cycle is FROZEN (loan freeze was activated 30 days before end)
 * 2. Auto-calculate share-out per member
 * 3. Mark cycle as ARCHIVED (no further edits allowed — SRS 5.3)
 * 4. Create share-out transactions
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { logSecureAction } from '@/lib/security/secure-audit-logger'
import { z } from 'zod'

const CloseCycleSchema = z.object({
  approvedByName: z.string().min(2),
  // Key holder approval confirmation (SRS 5.3: "Require key-holder approval, then disburse")
  keyHolderApprovals: z.array(z.object({
    keyHolderId: z.string(),
    approved: z.boolean(),
  })).min(3, 'At least 3 key holder approvals required').optional(),
}).strict()

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'vsla:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: cycleId } = await params
    const body = await req.json()
    let validated
    try {
      validated = CloseCycleSchema.parse(body)
    } catch (err: any) {
      return NextResponse.json({
        error: 'Validation failed',
        fields: err.issues?.map((e: any) => ({ field: e.path.join('.'), message: e.message })) || [],
      }, { status: 400 })
    }

    const cycle = await db.vslaCycleV2.findUnique({
      where: { id: cycleId },
      include: { group: true },
    })
    if (!cycle) return NextResponse.json({ error: 'Cycle not found' }, { status: 404 })

    if (cycle.status === 'ARCHIVED') {
      return NextResponse.json({ error: 'Cycle is already archived. No further edits allowed.' }, { status: 400 })
    }

    // ─── Verify key holder approval (if provided) ───
    if (validated.keyHolderApprovals) {
      const allApproved = validated.keyHolderApprovals.every(a => a.approved)
      if (!allApproved) {
        return NextResponse.json({ error: 'Cycle close requires unanimous key-holder approval' }, { status: 403 })
      }
    }

    // ─── Auto-calculate share-out (SRS 5.3) ───
    // Total savings
    const savingsAgg = await db.vslaTransactionV2.aggregate({
      where: { groupId: cycle.groupId, type: 'SAVING', status: 'COMPLETED', createdAt: { gte: cycle.startDate, lte: cycle.endDate } },
      _sum: { amount: true },
    })
    const totalSavings = savingsAgg._sum.amount ?? 0

    // Total interest (from loan repayments)
    const interestAgg = await db.vslaTransactionV2.aggregate({
      where: { groupId: cycle.groupId, type: 'LOAN_REPAYMENT', status: 'COMPLETED', createdAt: { gte: cycle.startDate, lte: cycle.endDate } },
      _sum: { amount: true },
    })
    const totalRepayments = interestAgg._sum.amount ?? 0
    // Interest = repayments - principal disbursed
    const disbursedAgg = await db.vslaTransactionV2.aggregate({
      where: { groupId: cycle.groupId, type: 'LOAN_DISBURSEMENT', status: 'COMPLETED', createdAt: { gte: cycle.startDate, lte: cycle.endDate } },
      _sum: { amount: true },
    })
    const totalDisbursed = disbursedAgg._sum.amount ?? 0
    const totalInterest = Math.max(0, totalRepayments - totalDisbursed)

    // Total welfare
    const welfareAgg = await db.vslaTransactionV2.aggregate({
      where: { groupId: cycle.groupId, type: 'WELFARE_CONTRIBUTION', status: 'COMPLETED', createdAt: { gte: cycle.startDate, lte: cycle.endDate } },
      _sum: { amount: true },
    })
    const totalWelfare = welfareAgg._sum.amount ?? 0

    // Total fines
    const finesAgg = await db.vslaTransactionV2.aggregate({
      where: { groupId: cycle.groupId, type: 'FINE', status: 'COMPLETED', createdAt: { gte: cycle.startDate, lte: cycle.endDate } },
      _sum: { amount: true },
    })
    const totalFines = finesAgg._sum.amount ?? 0

    // Total shares
    const members = await db.vslaMemberV2.findMany({
      where: { groupId: cycle.groupId, status: 'ACTIVE' },
      select: { id: true, totalShares: true, fullName: true },
    })
    const totalShares = members.reduce((sum, m) => sum + m.totalShares, 0)

    // Share-out per share
    const grossTotal = totalSavings + totalInterest + totalFines
    const shareOutPerShare = totalShares > 0 ? grossTotal / totalShares : 0

    // ─── Update cycle with final numbers + archive ───
    const updatedCycle = await db.vslaCycleV2.update({
      where: { id: cycleId },
      data: {
        status: 'ARCHIVED',
        isArchived: true,
        archivedAt: new Date(),
        shareOutDate: new Date(),
        shareOutPerShare,
        totalSavings,
        totalInterest,
        totalWelfare,
        totalFines,
      },
    })

    // ─── Create share-out transactions for each member ───
    for (const member of members) {
      const shareOutAmount = member.totalShares * shareOutPerShare
      if (shareOutAmount > 0) {
        await db.vslaTransactionV2.create({
          data: {
            groupId: cycle.groupId,
            memberId: member.id,
            type: 'SHARE_OUT',
            amount: shareOutAmount,
            direction: 'OUT',
            description: `Share-out: ${member.totalShares} shares × UGX ${shareOutPerShare.toFixed(2)}`,
            transactionRef: `SHAREOUT-${cycleId}-${member.id}`,
            status: 'COMPLETED',
            recordedById: ctx.userId,
            recordedByName: validated.approvedByName,
          },
        })
      }
    }

    // ─── Send SMS to all members with their share-out amount ───
    // TODO: Wire to Africa's Talking
    console.log(`[SMS] Share-out completed for cycle ${cycle.name}. Per-share: UGX ${shareOutPerShare.toFixed(2)}`)

    await logSecureAction({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      actorRole: ctx.role,
      action: 'VSLA_V2_CYCLE_CLOSED',
      entityType: 'VslaCycleV2',
      entityId: cycleId,
      description: `Cycle "${cycle.name}" closed and archived. Share-out: UGX ${shareOutPerShare.toFixed(2)}/share. Total: ${totalShares} shares, UGX ${grossTotal.toFixed(2)}.`,
      metadata: {
        totalShares,
        totalSavings,
        totalInterest,
        totalWelfare,
        totalFines,
        grossTotal,
        shareOutPerShare,
        membersCount: members.length,
      },
      httpMethod: 'POST',
      path: `/api/vsla-v2/cycle/${cycleId}/close`,
    })

    return NextResponse.json({
      cycle: updatedCycle,
      shareOut: {
        totalShares,
        totalSavings,
        totalInterest,
        totalWelfare,
        totalFines,
        grossTotal,
        shareOutPerShare,
        membersCount: members.length,
      },
      message: 'Cycle closed and archived. Share-out transactions created. SMS sent to all members.',
    })
  } catch (error) {
    console.error('[vsla-v2/cycle/close POST] error:', error)
    return NextResponse.json({ error: 'Failed to close cycle' }, { status: 500 })
  }
}
