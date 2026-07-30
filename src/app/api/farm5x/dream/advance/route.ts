import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { updateDreamPhase, getDreamPipelineStatus, type DreamPhase } from '@/lib/farm5x/dream-engine'
import { headers } from 'next/headers'

/**
 * POST /api/farm5x/dream/advance
 *   Manually advance a DREAM pipeline phase for a stage event.
 *
 *   The D phase (Data) is auto-set when a stage event is created (in /api/crop-stages POST).
 *   This endpoint advances the other phases:
 *     R = Remote sensing verified (satellite confirms the event)
 *     E = Event detected (practice adoption confirmed)
 *     A = Analytics computed (IPCC emissions calculated)
 *     M = Monitoring tracked (season-long KPI)
 *
 *   Body: {
 *     stageEventId: string,
 *     phase: 'R' | 'E' | 'A' | 'M',
 *     verified: boolean,
 *     notes?: string  // optional verification notes
 *   }
 *
 *   SUPER_ADMIN, TENANT_ADMIN, EXTENSION_OFFICER, AGENT can advance phases.
 *   Audit-logged.
 *
 *   Returns: { success, phase, verified, pipelineStatus }
 */

async function writeAudit(args: {
  userId: string
  action: string
  entityType?: string
  entityId?: string
  details?: Record<string, unknown>
}) {
  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') || undefined
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

const VALID_PHASES: DreamPhase[] = ['R', 'E', 'A', 'M']

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext(request)

    // Permission check: SUPER_ADMIN, TENANT_ADMIN, EXTENSION_OFFICER, AGENT can advance
    const allowedRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'EXTENSION_OFFICER', 'AGENT', 'COUNTRY_ADMIN']
    if (!ctx.isSuperAdmin && !allowedRoles.includes(ctx.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to advance DREAM pipeline' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { stageEventId, phase, verified, notes } = body as {
      stageEventId?: string
      phase?: string
      verified?: boolean
      notes?: string
    }

    // Validate inputs
    if (!stageEventId || !phase) {
      return NextResponse.json(
        { error: 'stageEventId and phase are required' },
        { status: 400 },
      )
    }

    const phaseUpper = phase.toUpperCase() as DreamPhase
    if (!VALID_PHASES.includes(phaseUpper)) {
      return NextResponse.json(
        { error: `phase must be one of: ${VALID_PHASES.join(', ')} (D is auto-set on event creation)` },
        { status: 400 },
      )
    }

    if (typeof verified !== 'boolean') {
      return NextResponse.json(
        { error: 'verified must be a boolean' },
        { status: 400 },
      )
    }

    // Fetch the stage event and verify tenant access
    const event = await db.cropStageEvent.findFirst({
      where: {
        id: stageEventId,
        ...buildTenantFilter(ctx, 'tenantId'),
      },
      select: {
        id: true,
        cultivationId: true,
        stageName: true,
        eventType: true,
        dreamData: true,
        dreamRemote: true,
        dreamEvent: true,
        dreamAnalytics: true,
        dreamMonitor: true,
      },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Stage event not found or access denied' },
        { status: 404 },
      )
    }

    // D phase must be complete before advancing others
    if (!event.dreamData) {
      return NextResponse.json(
        { error: 'Cannot advance phase ' + phaseUpper + ' — D phase (Data) is not yet complete. Create the stage event first to auto-set D.' },
        { status: 400 },
      )
    }

    // Update the phase
    await updateDreamPhase(stageEventId, phaseUpper, verified)

    // Fetch the updated pipeline status
    const pipelineStatus = await getDreamPipelineStatus(event.cultivationId)

    // Audit log
    await writeAudit({
      userId: ctx.userId,
      action: 'DREAM_PHASE_ADVANCE',
      entityType: 'CropStageEvent',
      entityId: stageEventId,
      details: {
        cultivationId: event.cultivationId,
        stageName: event.stageName,
        phase: phaseUpper,
        verified,
        notes: notes || null,
        isDreamComplete: pipelineStatus?.isDreamComplete || false,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        stageEventId,
        phase: phaseUpper,
        verified,
        pipelineStatus: pipelineStatus ? {
          cultivationId: pipelineStatus.cultivationId,
          overallProgress: pipelineStatus.overallProgress,
          isDreamComplete: pipelineStatus.isDreamComplete,
          farm5xEligibleForCredits: pipelineStatus.farm5xEligibleForCredits,
          phases: pipelineStatus.phases,
        } : null,
      },
    })
  } catch (error) {
    console.error('[farm5x/dream/advance POST]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to advance DREAM phase' },
      { status: 500 },
    )
  }
}
