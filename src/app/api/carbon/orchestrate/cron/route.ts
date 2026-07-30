import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { headers } from 'next/headers'

/**
 * GET /api/carbon/orchestrate/cron
 *   Daily cron job that runs the carbon orchestrator for ALL active tenants.
 *
 *   For each tenant with DREAM-complete cultivations, issues carbon credits
 *   via the same logic as POST /api/carbon/orchestrate.
 *
 *   Auth:
 *     - Vercel Cron: `Authorization: Bearer <CRON_SECRET>` header
 *     - Or `?key=<CRON_SECRET>` query param
 *     - Or SUPER_ADMIN fallback (for manual triggering)
 *
 *   Configured in vercel.json: `0 8 * * *` (daily 08:00 UTC)
 *
 *   This endpoint is read-only for non-authenticated callers (returns 401).
 *   When authenticated, it loops through all tenants, finds a SUPER_ADMIN
 *   user to attribute the orchestration to, and runs the orchestrator.
 */

export async function GET(request: NextRequest) {
  try {
    // Auth: check CRON_SECRET
    const authHeader = request.headers.get('authorization')
    const queryKey = new URL(request.url).searchParams.get('key')
    const cronSecret = process.env.CRON_SECRET

    const isCronAuthed =
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (cronSecret && queryKey === cronSecret)

    if (!isCronAuthed) {
      // Allow SUPER_ADMIN manual trigger as fallback
      const { getTenantContext } = await import('@/lib/tenant')
      const ctx = await getTenantContext(request)
      if (!ctx.isSuperAdmin) {
        return NextResponse.json(
          { error: 'Authentication required (CRON_SECRET or SUPER_ADMIN)' },
          { status: 401 },
        )
      }
    }

    const startedAt = Date.now()
    const results: Array<{
      tenantId: string
      tenantName: string
      dreamCompleteCultivations: number
      creditsIssued: number
      error?: string
    }> = []

    // Find all active tenants that have at least one DREAM-complete cultivation
    const tenantsWithDream = await db.tenant.findMany({
      where: {
        isActive: true,
        type: { not: 'SUPER_ADMIN' },
        cropStageEvents: {
          some: {
            dreamData: true,
            dreamRemote: true,
            dreamEvent: true,
            dreamAnalytics: true,
            dreamMonitor: true,
          },
        },
      },
      select: { id: true, name: true },
    })

    if (tenantsWithDream.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          tenantsProcessed: 0,
          totalCreditsIssued: 0,
          duration: Date.now() - startedAt,
          message: 'No tenants with DREAM-complete cultivations found.',
        },
      })
    }

    // Find a SUPER_ADMIN user to attribute the orchestration to
    const superAdmin = await db.user.findFirst({
      where: { role: 'SUPER_ADMIN', isActive: true },
      select: { id: true },
    })

    if (!superAdmin) {
      return NextResponse.json(
        { error: 'No active SUPER_ADMIN user found to attribute orchestration' },
        { status: 500 },
      )
    }

    // Import the orchestrator logic (re-use the POST handler's internal logic
    // by calling the same functions). For simplicity, we'll call the POST
    // /api/carbon/orchestrate endpoint internally for each tenant.
    let totalCreditsIssued = 0

    for (const tenant of tenantsWithDream) {
      try {
        // Call the orchestrator for this tenant
        const orchestratorUrl = new URL('/api/carbon/orchestrate', request.url)
        orchestratorUrl.searchParams.set('tenantId', tenant.id)

        const { CarbonCreditsEngine } = await import('@/lib/carbon/credits/engine')
        const { getDreamPipelineStatus } = await import('@/lib/farm5x/dream-engine')

        // Find DREAM-complete cultivations for this tenant
        const dreamCompleteEvents = await db.cropStageEvent.findMany({
          where: {
            tenantId: tenant.id,
            dreamData: true,
            dreamRemote: true,
            dreamEvent: true,
            dreamAnalytics: true,
            dreamMonitor: true,
          },
          select: { cultivationId: true },
          distinct: ['cultivationId'],
        })

        let tenantCreditsIssued = 0

        // Find or create the CarbonProject
        let project = await db.carbonProject.findFirst({
          where: { tenantId: tenant.id, status: 'ACTIVE', methodologyCode: 'VM0042' },
        })
        if (!project) {
          project = await db.carbonProject.create({
            data: {
              tenantId: tenant.id,
              createdById: superAdmin.id,
              name: 'Farm5x DREAM Agriculture Project',
              description: 'Auto-created carbon project for DREAM-complete cultivations (VM0042).',
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
        }

        for (const event of dreamCompleteEvents) {
          try {
            const cultivation = await db.cultivation.findUnique({
              where: { id: event.cultivationId },
              select: {
                id: true, cropName: true, cultivationAreaHa: true, status: true,
                farm: { select: { farmerId: true, farmer: { select: { firstName: true, lastName: true } } } },
              },
            })
            if (!cultivation) continue

            // Check if credits already issued
            const existing = await db.carbonCredit.findFirst({
              where: { tenantId: tenant.id, notes: { contains: `cultivation=${cultivation.id}` } },
            })
            if (existing) continue

            const pipelineStatus = await getDreamPipelineStatus(cultivation.id)
            if (!pipelineStatus?.farm5xEligibleForCredits) continue

            const baselineEmissionPerHa = 2.5
            const emissionReductionTco2e = Math.round(
              (cultivation.cultivationAreaHa || 0) * (pipelineStatus.totalEmissionReductionPct / 100) * baselineEmissionPerHa * 100,
            ) / 100

            if (emissionReductionTco2e <= 0) continue

            await CarbonCreditsEngine.issueCredits(tenant.id, {
              projectId: project.id,
              vintageYear: new Date().getFullYear(),
              quantityTonnesCO2: emissionReductionTco2e,
              originType: 'REDUCTION',
              notes: `DREAM-cron: cultivation=${cultivation.id}, crop=${cultivation.cropName}, area=${cultivation.cultivationAreaHa || 0}ha, farmer=${cultivation.farm?.farmer ? cultivation.farm.farmer.firstName + ' ' + cultivation.farm.farmer.lastName : 'unknown'}`,
            })

            tenantCreditsIssued += emissionReductionTco2e
          } catch (err) {
            console.error(`[orchestrate/cron] cultivation ${event.cultivationId}:`, err)
          }
        }

        totalCreditsIssued += tenantCreditsIssued
        results.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          dreamCompleteCultivations: dreamCompleteEvents.length,
          creditsIssued: tenantCreditsIssued,
        })
      } catch (err) {
        results.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          dreamCompleteCultivations: 0,
          creditsIssued: 0,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    // Audit log
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined
    await db.auditLog.create({
      data: {
        userId: superAdmin.id,
        action: 'CARBON_ORCHESTRATE_CRON',
        entityType: 'Tenant',
        details: JSON.stringify({
          tenantsProcessed: tenantsWithDream.length,
          totalCreditsIssued,
          duration: Date.now() - startedAt,
          results,
        }),
        ipAddress,
      },
    }).catch(() => { /* non-blocking */ })

    return NextResponse.json({
      success: true,
      data: {
        tenantsProcessed: tenantsWithDream.length,
        totalCreditsIssued,
        duration: Date.now() - startedAt,
        results,
      },
    })
  } catch (error) {
    console.error('[carbon/orchestrate/cron]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cron orchestration failed' },
      { status: 500 },
    )
  }
}
