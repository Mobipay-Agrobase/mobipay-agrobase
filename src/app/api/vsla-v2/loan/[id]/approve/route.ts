/**
 * VSLA V2 — Key Holder Loan Approval (Individual Vote)
 * SRS 5.1: Unanimous approval required from all 3-6 key holders
 * Each key holder votes independently. When all approve, loan moves to KEYHOLDER_APPROVED.
 * If any rejects, loan moves to REJECTED.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { logSecureAction } from '@/lib/security/secure-audit-logger'
import { z } from 'zod'

const ApproveSchema = z.object({
  keyHolderId: z.string().min(1),
  decision: z.enum(['APPROVED', 'REJECTED']),
  comments: z.string().max(500).optional(),
}).strict()

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'vsla:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: loanId } = await params
    const body = await req.json()
    let validated
    try {
      validated = ApproveSchema.parse(body)
    } catch (err: any) {
      return NextResponse.json({
        error: 'Validation failed',
        fields: err.issues?.map((e: any) => ({ field: e.path.join('.'), message: e.message })) || [],
      }, { status: 400 })
    }

    // Get loan + key holders
    const loan = await db.vslaLoanV2.findUnique({
      where: { id: loanId },
      include: {
        group: { include: { keyHolders: { where: { status: 'ACTIVE' } } } },
      },
    })
    if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 })

    if (loan.status !== 'SYSTEM_APPROVED') {
      return NextResponse.json({
        error: 'Loan is not pending key-holder approval',
        currentStatus: loan.status,
      }, { status: 400 })
    }

    // Verify the key holder belongs to this group
    const keyHolder = loan.group.keyHolders.find(kh => kh.id === validated.keyHolderId)
    if (!keyHolder) {
      return NextResponse.json({ error: 'Key holder not found in this group' }, { status: 403 })
    }

    // Check if this key holder already voted
    const existingVote = await db.vslaLoanApprovalV2.findUnique({
      where: { loanId_keyHolderId: { loanId, keyHolderId: validated.keyHolderId } },
    })
    if (existingVote) {
      return NextResponse.json({ error: 'You have already voted on this loan' }, { status: 400 })
    }

    // Record the vote
    const approval = await db.vslaLoanApprovalV2.create({
      data: {
        loanId,
        keyHolderId: validated.keyHolderId,
        decision: validated.decision,
        comments: validated.comments,
        ipAddress: req.headers.get('x-forwarded-for') || null,
        userAgent: req.headers.get('user-agent') || null,
      },
    })

    // ─── Check if all key holders have voted ───
    const allVotes = await db.vslaLoanApprovalV2.findMany({
      where: { loanId },
    })
    const totalKeyHolders = loan.group.keyHolders.length
    const allVoted = allVotes.length >= totalKeyHolders

    let newStatus = loan.status

    if (validated.decision === 'REJECTED') {
      // Any rejection → loan rejected
      newStatus = 'REJECTED'
      await db.vslaLoanV2.update({
        where: { id: loanId },
        data: { status: newStatus, closedAt: new Date() },
      })
    } else if (allVoted) {
      // All voted — check if unanimous
      const allApproved = allVotes.every(v => v.decision === 'APPROVED')
      if (allApproved) {
        // ─── UNANIMOUS APPROVAL ───
        newStatus = 'KEYHOLDER_APPROVED'
        await db.vslaLoanV2.update({
          where: { id: loanId },
          data: { status: newStatus },
        })
        // TODO: Send SMS to member + all key holders: "Loan approved, ready for disbursement"
      } else {
        // Some rejected
        newStatus = 'REJECTED'
        await db.vslaLoanV2.update({
          where: { id: loanId },
          data: { status: newStatus, closedAt: new Date() },
        })
      }
    }

    await logSecureAction({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      actorRole: ctx.role,
      action: validated.decision === 'APPROVED' ? 'VSLA_V2_LOAN_KEYHOLDER_APPROVED' : 'VSLA_V2_LOAN_KEYHOLDER_REJECTED',
      entityType: 'VslaLoanV2',
      entityId: loanId,
      description: `Key holder ${keyHolder.fullName} (${keyHolder.role}) voted ${validated.decision} on loan ${loan.transactionRef}`,
      metadata: {
        keyHolderId: validated.keyHolderId,
        keyHolderName: keyHolder.fullName,
        keyHolderRole: keyHolder.role,
        decision: validated.decision,
        votesSoFar: allVotes.length,
        totalKeyHolders,
        allVoted,
        newStatus,
      },
      httpMethod: 'POST',
      path: `/api/vsla-v2/loan/${loanId}/approve`,
    })

    return NextResponse.json({
      approval,
      loanStatus: newStatus,
      votesSoFar: allVotes.length,
      totalKeyHolders,
      allVoted,
      message: allVoted
        ? (newStatus === 'KEYHOLDER_APPROVED'
          ? 'UNANIMOUS APPROVAL — loan ready for disbursement'
          : 'Loan rejected — not all key holders approved')
        : `Vote recorded. ${totalKeyHolders - allVotes.length} key holder(s) still pending.`,
    })
  } catch (error) {
    console.error('[vsla-v2/loan/approve POST] error:', error)
    return NextResponse.json({ error: 'Failed to record approval' }, { status: 500 })
  }
}
