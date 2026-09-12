import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'

/**
 * POST /api/processing/[id]/approve
 *
 * Second review (L — Processing): the processing-batch lifecycle workflow.
 * Answers the reviewer's "Processing + Approval Hub" question with a real,
 * permission-gated state machine instead of a free-form status string:
 *
 *   PENDING ──approve──▶ APPROVED ──start──▶ IN_PROGRESS ──complete──▶ COMPLETED
 *      │                                                    (output qty + grade)
 *      └────reject────▶ REJECTED
 *
 * Body: { action: 'approve' | 'reject' | 'start' | 'complete',
 *         reason?, outputQuantity?, outputUnit?, qualityGrade?, qualityScore?, notes? }
 *
 * Permissions:
 *   approve / reject → processing:approve  (EKB_MD, TENANT_ADMIN, …)
 *   start / complete → processing:update
 * Every call is tenant-scoped and validates the transition.
 */
const TRANSITIONS: Record<string, { from: string[]; to: string; perm: string }> = {
  approve: { from: ['PENDING'], to: 'APPROVED', perm: 'processing:approve' },
  reject: { from: ['PENDING'], to: 'REJECTED', perm: 'processing:approve' },
  start: { from: ['APPROVED'], to: 'IN_PROGRESS', perm: 'processing:update' },
  complete: { from: ['IN_PROGRESS'], to: 'COMPLETED', perm: 'processing:update' },
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId') as Record<string, unknown>

    const body = await req.json().catch(() => ({}))
    const action = String(body.action || '').toLowerCase()
    const rule = TRANSITIONS[action]
    if (!rule) {
      return NextResponse.json(
        { error: 'action must be one of: approve, reject, start, complete' },
        { status: 400 }
      )
    }

    if (!hasPermission(ctx.role || '', rule.perm as any)) {
      return NextResponse.json(
        { error: `Insufficient permissions — requires ${rule.perm}` },
        { status: 403 }
      )
    }

    const batch = await db.processingBatch.findFirst({ where: { id, ...tf } })
    if (!batch) {
      return NextResponse.json({ error: 'Processing batch not found' }, { status: 404 })
    }

    // Status-transition validation — never trust the client's view of state.
    if (!rule.from.includes(batch.status)) {
      return NextResponse.json(
        {
          error: `Cannot ${action} a batch in status ${batch.status} (expected ${rule.from.join(' or ')})`,
        },
        { status: 409 }
      )
    }

    const data: Record<string, unknown> = { status: rule.to }

    if (action === 'reject' && body.reason) {
      data.notes = [batch.notes, `Rejection reason: ${String(body.reason).trim()}`]
        .filter(Boolean)
        .join(' · ')
    }

    if (action === 'start') {
      data.startDate = new Date()
    }

    if (action === 'complete') {
      const outputQuantity = Number(body.outputQuantity)
      if (!Number.isFinite(outputQuantity) || outputQuantity <= 0) {
        return NextResponse.json(
          { error: 'outputQuantity must be a positive number to complete a batch' },
          { status: 400 }
        )
      }
      data.outputQuantity = outputQuantity
      data.endDate = new Date()
      if (body.outputUnit !== undefined && body.outputUnit !== null && String(body.outputUnit).trim() !== '') {
        data.outputUnit = String(body.outputUnit).trim()
      }
      if (body.qualityGrade !== undefined && body.qualityGrade !== null && String(body.qualityGrade).trim() !== '') {
        data.qualityGrade = String(body.qualityGrade).trim()
      }
      const qualityScore = Number(body.qualityScore)
      if (Number.isFinite(qualityScore)) {
        data.qualityScore = qualityScore
      }
      if (body.notes !== undefined && body.notes !== null && String(body.notes).trim() !== '') {
        data.notes = [batch.notes, String(body.notes).trim()].filter(Boolean).join(' · ')
      }
    }

    const updated = await db.processingBatch.update({ where: { id }, data })
    return NextResponse.json({ batch: updated })
  } catch (error) {
    console.error('[POST /api/processing/[id]/approve] error:', error)
    return NextResponse.json({ error: 'Failed to update processing batch' }, { status: 500 })
  }
}
