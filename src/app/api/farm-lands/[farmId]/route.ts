import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ farmId: string }> },
) {
  const { farmId } = await params
  const ctx = await getTenantContext(_req)
  const tf = buildTenantFilter(ctx, 'tenantId') as any

  const farm = await db.farmLand.findFirst({
    where: { id: farmId, farmer: { ...tf } },
    include: {
      farmer: { select: { id: true, firstName: true, lastName: true, farmerCode: true } },
      polygonPoints: { orderBy: { pointOrder: 'asc' } },
      soilAnalyses: { orderBy: { createdAt: 'asc' } },
      cultivations: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!farm) {
    return NextResponse.json({ error: 'Farm land not found' }, { status: 404 })
  }

  const safeParse = (v: string | null): any => {
    if (!v) return []
    try { return JSON.parse(v) } catch { return v }
  }
  const farmParsed = {
    ...farm,
    approachRoad: safeParse(farm.approachRoad),
    landGradient: safeParse(farm.landGradient),
    irrigationSource: safeParse(farm.irrigationSource),
    soilCriteria: safeParse(farm.soilCriteria),
  }

  return NextResponse.json({ farm: farmParsed })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ farmId: string }> },
) {
  try {
    const { farmId } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId') as any

    const existing = await db.farmLand.findFirst({
      where: { id: farmId, farmer: { ...tf } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Farm land not found' }, { status: 404 })
    }

    const body = await req.json()

    const toJsonOrString = (v: any): string | null => {
      if (v == null || v === '') return null
      if (Array.isArray(v)) return JSON.stringify(v)
      return String(v)
    }

    const data: Record<string, any> = { updatedAt: new Date() }

    if (body.name !== undefined) data.name = body.name
    if (body.sizeHectares !== undefined) data.sizeHectares = body.sizeHectares ? parseFloat(body.sizeHectares) : null
    if (body.latitude !== undefined) data.latitude = body.latitude ? parseFloat(body.latitude) : null
    if (body.longitude !== undefined) data.longitude = body.longitude ? parseFloat(body.longitude) : null
    if (body.landOwnership !== undefined) data.landOwnership = body.landOwnership
    if (body.waterSource !== undefined) data.waterSource = body.waterSource
    if (body.soilFertility !== undefined) data.soilFertility = body.soilFertility
    if (body.landSurveyNo !== undefined) data.landSurveyNo = body.landSurveyNo
    if (body.approachRoad !== undefined) data.approachRoad = toJsonOrString(body.approachRoad)
    if (body.landTopology !== undefined) data.landTopology = body.landTopology
    if (body.landGradient !== undefined) data.landGradient = toJsonOrString(body.landGradient)
    if (body.landDocumentUrl !== undefined) data.landDocumentUrl = body.landDocumentUrl
    if (body.powerSource !== undefined) data.powerSource = body.powerSource
    if (body.farmPhotoUrl !== undefined) data.farmPhotoUrl = body.farmPhotoUrl
    if (body.irrigationSource !== undefined) data.irrigationSource = toJsonOrString(body.irrigationSource)
    if (body.irrigationType !== undefined) data.irrigationType = body.irrigationType
    if (body.fullTimeWorkers !== undefined) data.fullTimeWorkers = body.fullTimeWorkers ? parseInt(body.fullTimeWorkers) : null
    if (body.partTimeWorkers !== undefined) data.partTimeWorkers = body.partTimeWorkers ? parseInt(body.partTimeWorkers) : null
    if (body.seasonalWorkers !== undefined) data.seasonalWorkers = body.seasonalWorkers ? parseInt(body.seasonalWorkers) : null
    if (body.familyWorkers !== undefined) data.familyWorkers = body.familyWorkers ? parseInt(body.familyWorkers) : null
    if (body.lastChemicalApplicationDate !== undefined) data.lastChemicalApplicationDate = body.lastChemicalApplicationDate ? new Date(body.lastChemicalApplicationDate) : null
    if (body.conventionalLands !== undefined) data.conventionalLands = body.conventionalLands
    if (body.fallowPastureLand !== undefined) data.fallowPastureLand = body.fallowPastureLand
    if (body.conventionalCrops !== undefined) data.conventionalCrops = body.conventionalCrops
    if (body.estYieldKg !== undefined) data.estYieldKg = body.estYieldKg ? parseFloat(body.estYieldKg) : null
    if (body.certType !== undefined) data.certType = body.certType
    if (body.conversionStatus !== undefined) data.conversionStatus = body.conversionStatus
    if (body.conversionDate !== undefined) data.conversionDate = body.conversionDate ? new Date(body.conversionDate) : null
    if (body.inspectorName !== undefined) data.inspectorName = body.inspectorName
    if (body.conversionQualified !== undefined) data.conversionQualified = body.conversionQualified || false
    if (body.conversionRemarks !== undefined) data.conversionRemarks = body.conversionRemarks
    if (body.soilCollectionDate !== undefined) data.soilCollectionDate = body.soilCollectionDate ? new Date(body.soilCollectionDate) : null
    if (body.soilLabTestingDate !== undefined) data.soilLabTestingDate = body.soilLabTestingDate ? new Date(body.soilLabTestingDate) : null
    if (body.soilResultDate !== undefined) data.soilResultDate = body.soilResultDate ? new Date(body.soilResultDate) : null
    if (body.soilReportUrl !== undefined) data.soilReportUrl = body.soilReportUrl
    if (body.soilSamplesInfo !== undefined) data.soilSamplesInfo = body.soilSamplesInfo
    if (body.soilCriteria !== undefined) data.soilCriteria = toJsonOrString(body.soilCriteria)

    const updated = await db.farmLand.update({
      where: { id: farmId },
      data,
      include: {
        farmer: { select: { id: true, firstName: true, lastName: true, farmerCode: true } },
        polygonPoints: { orderBy: { pointOrder: 'asc' } },
        soilAnalyses: { orderBy: { createdAt: 'asc' } },
      },
    })

    const farmParsed = {
      ...updated,
      approachRoad: updated.approachRoad ? JSON.parse(updated.approachRoad) : [],
      landGradient: updated.landGradient ? JSON.parse(updated.landGradient) : [],
      irrigationSource: updated.irrigationSource ? JSON.parse(updated.irrigationSource) : [],
      soilCriteria: updated.soilCriteria ? JSON.parse(updated.soilCriteria) : [],
    }

    return NextResponse.json({ farm: farmParsed })
  } catch (error) {
    console.error('Farm land update error:', error)
    return NextResponse.json(
      { error: 'Failed to update farm land', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ farmId: string }> },
) {
  try {
    const { farmId } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId') as any

    const existing = await db.farmLand.findFirst({
      where: { id: farmId, farmer: { ...tf } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Farm land not found' }, { status: 404 })
    }

    await db.farmPolygon.deleteMany({ where: { farm: { id: farmId } } })
    await db.soilAnalysis.deleteMany({ where: { farm: { id: farmId } } })
    await db.farmLand.delete({ where: { id: farmId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Farm land delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete farm land', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
