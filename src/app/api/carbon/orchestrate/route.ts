import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { getDreamPipelineStatus } from '@/lib/farm5x/dream-engine'
import { CarbonCreditsEngine } from '@/lib/carbon/credits/engine'
import { headers } from 'next/headers'

/**
 * POST /api/carbon/orchestrate
 *   The Carbon Orchestrator — connects DREAM-complete cultivations to carbon
 *   credit issuance. This is the P5 "carbon orchestration" layer.
 *
 *   Flow:
 *     1. Find all cultivations where the DREAM pipeline is complete (all 5 phases VERIFIED)
 *        AND that haven't already been issued credits.
 *     2. For each DREAM-complete cultivation:
 *        a. Find or create a CarbonProject for the tenant (methodology: VM0042 for agriculture)
 *        b. Compute the emission reduction (from Farm5x practices adopted)
 *        c. Issue carbon credits via CarbonCreditsEngine.issueCredits()
 *        d. Mark the cultivation as "credits_issued" (via Cultivation.status or a flag)
 *     3. Return a summary of what was orchestrated.
 *
 *   Query params:
 *     - dryRun: if true, returns what would be orchestrated without issuing credits
 *     - tenantId: SUPER_ADMIN can orchestrate for a specific tenant (otherwise uses caller's tenant)
 *
 *   SUPER_ADMIN, TENANT_ADMIN can call this.
 *   Audit-logged.
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

/**
 * Find cultivations that are DREAM-complete but haven't had credits issued.
 * We check: cultivations with status 'ACTIVE' or 'HARVESTED' that have
 * at least one CropStageEvent with all 5 DREAM phases = true.
 */
async function findDreamCompleteCultivations(tenantId: string) {
  // Find all stage events with all 5 DREAM phases verified
  const dreamCompleteEvents = await db.cropStageEvent.findMany({
    where: {
      tenantId,
      dreamData: true,
      dreamRemote: true,
      dreamEvent: true,
      dreamAnalytics: true,
      dreamMonitor: true,
    },
    select: {
      cultivationId: true,
      cultivation: {
        select: {
          id: true,
          cropName: true,
          cultivationAreaHa: true,
          status: true,
          farm: {
            select: {
              farmerId: true,
              farmer: { select: { firstName: true, lastName: true, tenantId: true } },
            },
          },
        },
      },
    },
    distinct: ['cultivationId'],
  })

  // Filter out cultivations that already have credits issued.
  // We check: cultivations with status 'ACTIVE' or 'HARVESTED' that have
  // at least one CropStageEvent with all 5 DREAM phases = true.
  type DreamCultivation = {
    cultivationId: string
    cropName: string
    areaHa: number
    farmerId: string | null
    farmerName: string | null
    status: string
  }
  const result: DreamCultivation[] = []
  for (const event of dreamCompleteEvents) {
    const cult = event.cultivation
    if (!cult) continue

    // Check if credits already issued for this cultivation.
    // The CarbonCredit.notes field contains "cultivation=<id>" when issued by the orchestrator.
    const existingCredit = await db.carbonCredit.findFirst({
      where: {
        tenantId,
        notes: { contains: `cultivation=${cult.id}` },
      },
      select: { id: true, serialNumber: true },
    })

    if (!existingCredit) {
      result.push({
        cultivationId: cult.id,
        cropName: cult.cropName,
        areaHa: cult.cultivationAreaHa || 0,
        farmerId: cult.farm?.farmerId || null,
        farmerName: cult.farm?.farmer ? `${cult.farm.farmer.firstName} ${cult.farm.farmer.lastName}` : null,
        status: cult.status,
      })
    }
  }

  return result
}

/**
 * Find or create a CarbonProject for the tenant.
 * Uses methodology VM0042 (Agriculture, Forestry and Other Land Use).
 */
async function findOrCreateCarbonProject(tenantId: string, userId: string) {
  // Look for an existing ACTIVE project
  const existing = await db.carbonProject.findFirst({
    where: { tenantId, status: 'ACTIVE', methodologyCode: 'VM0042' },
  })
  if (existing) return existing

  // Create a new project
  const project = await db.carbonProject.create({
    data: {
      tenantId,
      createdById: userId,
      name: 'Farm5x DREAM Agriculture Project',
      description: 'Auto-created carbon project for DREAM-complete cultivations under the Farm5x methodology (VM0042).',
      standard: 'VERRA_VCS',
      methodologyCode: 'VM0042',
      methodologyVersion: '2.1',
      projectType: 'AGRICULTURE',
      status: 'ACTIVE',
      projectStartDate: new Date(),
      creditingPeriodYears: 10,
      creditingPeriodStart: new Date(),
      creditingPeriodEnd: new Date(Date.now() + 10 * 365 * 86400000),
    },
  })

  return project
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext(request)

    // Permission check
    const allowedRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'COUNTRY_ADMIN']
    if (!ctx.isSuperAdmin && !allowedRoles.includes(ctx.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to run carbon orchestration' },
        { status: 403 },
      )
    }

    const { searchParams } = new URL(request.url)
    const dryRun = searchParams.get('dryRun') === 'true'
    const targetTenantId = ctx.isSuperAdmin
      ? (searchParams.get('tenantId') || ctx.tenantId)
      : ctx.tenantId

    if (!targetTenantId) {
      return NextResponse.json(
        { error: 'tenantId is required (SUPER_ADMIN can specify via ?tenantId=)' },
        { status: 400 },
      )
    }

    // 1. Find DREAM-complete cultivations without credits
    const cultivations = await findDreamCompleteCultivations(targetTenantId)

    if (cultivations.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          tenantId: targetTenantId,
          dryRun,
          dreamCompleteCultivations: 0,
          creditsIssued: 0,
          message: 'No DREAM-complete cultivations found that need credit issuance.',
        },
      })
    }

    // Dry-run: return what would be orchestrated
    if (dryRun) {
      // Compute projected emission reductions for each cultivation
      type Projection = {
        cultivationId: string
        cropName: string
        areaHa: number
        farmerName: string | null
        emissionReductionPct: number
        eligibleForCredits: boolean
        adoptedPractices: string[]
      }
      const projections: Projection[] = []
      for (const c of cultivations) {
        const pipelineStatus = await getDreamPipelineStatus(c.cultivationId)
        projections.push({
          cultivationId: c.cultivationId,
          cropName: c.cropName,
          areaHa: c.areaHa,
          farmerName: c.farmerName,
          emissionReductionPct: pipelineStatus?.totalEmissionReductionPct || 0,
          eligibleForCredits: pipelineStatus?.farm5xEligibleForCredits || false,
          adoptedPractices: pipelineStatus?.adoptedPractices || [],
        })
      }
      return NextResponse.json({
        success: true,
        data: {
          tenantId: targetTenantId,
          dryRun: true,
          dreamCompleteCultivations: cultivations.length,
          projections,
        },
      })
    }

    // 2. Find or create the CarbonProject
    const project = await findOrCreateCarbonProject(targetTenantId, ctx.userId)

    // 3. Issue credits for each eligible cultivation
    type OrchestrationResult = {
      cultivationId: string
      cropName: string
      farmerName?: string | null
      status: 'ISSUED' | 'SKIPPED' | 'FAILED'
      creditId?: string
      serialNumber?: string
      quantityTco2e?: number
      reason?: string
      error?: string
    }
    const results: OrchestrationResult[] = []
    let totalCreditsIssued = 0

    for (const c of cultivations) {
      try {
        const pipelineStatus = await getDreamPipelineStatus(c.cultivationId)
        if (!pipelineStatus || !pipelineStatus.farm5xEligibleForCredits) {
          results.push({
            cultivationId: c.cultivationId,
            cropName: c.cropName,
            status: 'SKIPPED',
            reason: 'Not eligible for credits (insufficient Farm5x practices adopted)',
          })
          continue
        }

        // Compute emission reduction in tCO2e.
        // Simplified: areaHa × emissionReductionPct × baselineEmissionPerHa (2.5 tCO2e/ha default)
        const baselineEmissionPerHa = 2.5
        const emissionReductionTco2e = Math.round(
          c.areaHa * (pipelineStatus.totalEmissionReductionPct / 100) * baselineEmissionPerHa * 100,
        ) / 100

        if (emissionReductionTco2e <= 0) {
          results.push({
            cultivationId: c.cultivationId,
            cropName: c.cropName,
            status: 'SKIPPED',
            reason: `Computed emission reduction is 0 or negative (${emissionReductionTco2e} tCO2e)`,
          })
          continue
        }

        // Issue credits via the CarbonCreditsEngine
        const issuance = await CarbonCreditsEngine.issueCredits(targetTenantId, {
          projectId: project.id,
          vintageYear: new Date().getFullYear(),
          quantityTonnesCO2: emissionReductionTco2e,
          originType: 'REDUCTION',
          notes: `DREAM-orchestrated: cultivation=${c.cultivationId}, crop=${c.cropName}, area=${c.areaHa}ha, farmer=${c.farmerName || 'unknown'}, practices=${pipelineStatus.adoptedPractices.join(',')}`,
        })

        totalCreditsIssued += emissionReductionTco2e
        results.push({
          cultivationId: c.cultivationId,
          cropName: c.cropName,
          farmerName: c.farmerName,
          status: 'ISSUED',
          creditId: issuance.creditId,
          serialNumber: issuance.serialNumber,
          quantityTco2e: emissionReductionTco2e,
        })
      } catch (err) {
        results.push({
          cultivationId: c.cultivationId,
          cropName: c.cropName,
          status: 'FAILED',
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    // 4. Audit log
    await writeAudit({
      userId: ctx.userId,
      action: 'CARBON_ORCHESTRATE',
      entityType: 'CarbonProject',
      entityId: project.id,
      details: {
        tenantId: targetTenantId,
        projectId: project.id,
        dreamCompleteCultivations: cultivations.length,
        creditsIssued: totalCreditsIssued,
        results: results.map(r => ({
          cultivationId: r.cultivationId,
          status: r.status,
          quantityTco2e: (r as { quantityTco2e?: number }).quantityTco2e,
        })),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        tenantId: targetTenantId,
        projectId: project.id,
        projectName: project.name,
        dreamCompleteCultivations: cultivations.length,
        creditsIssued: totalCreditsIssued,
        results,
      },
    })
  } catch (error) {
    console.error('[carbon/orchestrate POST]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Carbon orchestration failed' },
      { status: 500 },
    )
  }
}

/**
 * GET /api/carbon/orchestrate
 *   Dry-run preview — returns DREAM-complete cultivations without issuing credits.
 *   Equivalent to POST with ?dryRun=true but accessible via GET for easy UI integration.
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext(request)

    const allowedRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'COUNTRY_ADMIN']
    if (!ctx.isSuperAdmin && !allowedRoles.includes(ctx.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 },
      )
    }

    const { searchParams } = new URL(request.url)
    const targetTenantId = ctx.isSuperAdmin
      ? (searchParams.get('tenantId') || ctx.tenantId)
      : ctx.tenantId

    if (!targetTenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
    }

    const cultivations = await findDreamCompleteCultivations(targetTenantId)

    type Projection = {
      cultivationId: string
      cropName: string
      areaHa: number
      farmerName: string | null
      emissionReductionPct: number
      eligibleForCredits: boolean
      adoptedPractices: string[]
    }
    const projections: Projection[] = []
    for (const c of cultivations) {
      const pipelineStatus = await getDreamPipelineStatus(c.cultivationId)
      projections.push({
        cultivationId: c.cultivationId,
        cropName: c.cropName,
        areaHa: c.areaHa,
        farmerName: c.farmerName,
        emissionReductionPct: pipelineStatus?.totalEmissionReductionPct || 0,
        eligibleForCredits: pipelineStatus?.farm5xEligibleForCredits || false,
        adoptedPractices: pipelineStatus?.adoptedPractices || [],
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        tenantId: targetTenantId,
        dreamCompleteCultivations: cultivations.length,
        projections,
      },
    })
  } catch (error) {
    console.error('[carbon/orchestrate GET]', error)
    return NextResponse.json(
      { error: 'Failed to fetch orchestration preview' },
      { status: 500 },
    )
  }
}
