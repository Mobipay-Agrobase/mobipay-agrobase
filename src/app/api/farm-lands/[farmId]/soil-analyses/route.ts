import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/farm-lands/[farmId]/soil-analyses
 *   List all soil analysis records for a farm land
 *
 * POST /api/farm-lands/[farmId]/soil-analyses
 *   Create a new soil analysis record (criteria row)
 *
 * PUT /api/farm-lands/[farmId]/soil-analyses
 *   Bulk replace all soil analysis records for a farm land
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { farmId } = await params
    const ctx = await getTenantContext()

    // Verify farm belongs to tenant
    const farm = await db.farmLand.findFirst({
      where: { id: farmId, farmer: { ...buildTenantFilter(ctx, 'tenantId') } },
      select: { id: true },
    })
    if (!farm) {
      return NextResponse.json({ error: 'Farm not found or access denied' }, { status: 404 })
    }

    const analyses = await db.soilAnalysis.findMany({
      where: { farmId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ analyses })
  } catch (error) {
    console.error('Soil analysis list error:', error)
    return NextResponse.json({ error: 'Failed to fetch soil analyses' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { farmId } = await params
    const ctx = await getTenantContext()
    const body = await request.json()
    const {
      collectionDate, labTestingDate, resultDate, reportUrl,
      samplesInfo, criteria, criteriaValue, minValue, maxValue,
    } = body as Record<string, any>

    if (!criteria) {
      return NextResponse.json({ error: 'criteria is required' }, { status: 400 })
    }

    // Verify farm belongs to tenant
    const farm = await db.farmLand.findFirst({
      where: { id: farmId, farmer: { ...buildTenantFilter(ctx, 'tenantId') } },
      select: { id: true },
    })
    if (!farm) {
      return NextResponse.json({ error: 'Farm not found or access denied' }, { status: 404 })
    }

    const analysis = await db.soilAnalysis.create({
      data: {
        farmId,
        collectionDate: collectionDate ? new Date(collectionDate) : null,
        labTestingDate: labTestingDate ? new Date(labTestingDate) : null,
        resultDate: resultDate ? new Date(resultDate) : null,
        reportUrl: reportUrl || null,
        samplesInfo: samplesInfo || null,
        criteria,
        criteriaValue: criteriaValue || null,
        minValue: minValue || null,
        maxValue: maxValue || null,
      },
    })

    return NextResponse.json({ analysis }, { status: 201 })
  } catch (error) {
    console.error('Soil analysis create error:', error)
    return NextResponse.json(
      { error: 'Failed to create soil analysis', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

/**
 * PUT - Bulk replace all soil analysis records for a farm land.
 * Body: { analyses: Array<SoilAnalysisInput> }
 * Each item in the array has: { id?, collectionDate, labTestingDate, resultDate, ... }
 * If an item has an `id`, it's an update; otherwise it's a new record.
 * Records not in the array are deleted.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { farmId } = await params
    const ctx = await getTenantContext()
    const body = await request.json()
    const { analyses } = body as { analyses: Array<Record<string, any>> }

    if (!Array.isArray(analyses)) {
      return NextResponse.json({ error: 'analyses array is required' }, { status: 400 })
    }

    // Verify farm belongs to tenant
    const farm = await db.farmLand.findFirst({
      where: { id: farmId, farmer: { ...buildTenantFilter(ctx, 'tenantId') } },
      select: { id: true },
    })
    if (!farm) {
      return NextResponse.json({ error: 'Farm not found or access denied' }, { status: 404 })
    }

    // Collect IDs to keep
    const keepIds = analyses.filter(a => a.id).map(a => a.id)

    // Delete all existing records not in the keep list
    await db.soilAnalysis.deleteMany({
      where: {
        farmId,
        ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
      },
    })

    // Upsert each analysis
    const results = await Promise.all(
      analyses.map(async (a) => {
        const data = {
          collectionDate: a.collectionDate ? new Date(a.collectionDate) : null,
          labTestingDate: a.labTestingDate ? new Date(a.labTestingDate) : null,
          resultDate: a.resultDate ? new Date(a.resultDate) : null,
          reportUrl: a.reportUrl || null,
          samplesInfo: a.samplesInfo || null,
          criteria: a.criteria,
          criteriaValue: a.criteriaValue || null,
          minValue: a.minValue || null,
          maxValue: a.maxValue || null,
        }

        if (a.id) {
          return db.soilAnalysis.update({ where: { id: a.id }, data })
        } else {
          return db.soilAnalysis.create({ data: { ...data, farmId } })
        }
      })
    )

    return NextResponse.json({ analyses: results })
  } catch (error) {
    console.error('Soil analysis bulk update error:', error)
    return NextResponse.json(
      { error: 'Failed to update soil analyses', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
