import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId') as any

    const cultivation = await db.cultivation.findFirst({
      where: { id, farm: { farmer: { ...tf } } },
      include: {
        farm: {
          select: {
            id: true, name: true, sizeHectares: true,
            farmer: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    })

    if (!cultivation) return NextResponse.json({ error: 'Cultivation not found' }, { status: 404 })
    return NextResponse.json({ data: cultivation })
  } catch (error) {
    console.error('Cultivation GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch cultivation' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId') as any
    const body = await req.json()

    const existing = await db.cultivation.findFirst({
      where: { id, farm: { farmer: { ...tf } } },
    })
    if (!existing) return NextResponse.json({ error: 'Cultivation not found' }, { status: 404 })

    const {
      farmId, cropName, variety, season, sowingDate, estimatedYield,
      cropCategory, cultivationAreaHa, cropCalendarId, cultivationGeoJson, photoUrl,
      seedSource, isSeedTreated, seedType, seedQuantity, seedPrice,
      sowingType, sowingChargesBy, sowingCharges,
    } = body as Record<string, any>

    // Resolve effective values for auto-calc (use incoming or fall back to existing)
    const effSeedQty = seedQuantity !== undefined ? parseFloat(seedQuantity) : (existing.seedQuantity ?? 0)
    const effSeedPrice = seedPrice !== undefined ? parseFloat(seedPrice) : (existing.seedPrice ?? 0)
    const effAreaHa = cultivationAreaHa !== undefined ? parseFloat(cultivationAreaHa) : (existing.cultivationAreaHa ?? 0)
    const effCharges = sowingCharges !== undefined ? parseFloat(sowingCharges) : (existing.sowingCharges ?? 0)
    const effChargesBy = sowingChargesBy || existing.sowingChargesBy

    // Auto-calculate seedCost = seedQuantity × seedPrice
    const seedCost = (seedQuantity !== undefined || seedPrice !== undefined)
      ? effSeedQty * effSeedPrice
      : existing.seedCost

    // Auto-calculate sowingCost = cultivationAreaHa × sowingCharges (when chargesBy = 'hectare')
    let sowingCost = existing.sowingCost
    if ((cultivationAreaHa !== undefined || sowingCharges !== undefined || sowingChargesBy !== undefined) && effChargesBy === 'hectare') {
      sowingCost = effAreaHa * effCharges
    } else if (sowingChargesBy !== undefined && effChargesBy !== 'hectare') {
      sowingCost = null
    }

    const updated = await db.cultivation.update({
      where: { id },
      data: {
        ...(farmId !== undefined && { farmId }),
        ...(cropName !== undefined && { cropName }),
        ...(variety !== undefined && { variety: variety || null }),
        ...(season !== undefined && { season: season || null }),
        ...(sowingDate !== undefined && { sowingDate: sowingDate ? new Date(sowingDate) : null }),
        ...(estimatedYield !== undefined && { estimatedYield: estimatedYield !== null ? parseFloat(estimatedYield) : null }),
        ...(cropCategory !== undefined && { cropCategory: cropCategory || null }),
        ...(cultivationAreaHa !== undefined && { cultivationAreaHa: cultivationAreaHa !== null ? parseFloat(cultivationAreaHa) : null }),
        ...(cropCalendarId !== undefined && { cropCalendarId: cropCalendarId || null }),
        ...(cultivationGeoJson !== undefined && { cultivationGeoJson: cultivationGeoJson || null }),
        ...(photoUrl !== undefined && { photoUrl: photoUrl || null }),
        ...(seedSource !== undefined && { seedSource: seedSource || null }),
        ...(isSeedTreated !== undefined && { isSeedTreated: !!isSeedTreated }),
        ...(seedType !== undefined && { seedType: seedType || null }),
        ...(seedQuantity !== undefined && { seedQuantity: seedQuantity !== null ? parseFloat(seedQuantity) : null }),
        ...(seedPrice !== undefined && { seedPrice: seedPrice !== null ? parseFloat(seedPrice) : null }),
        ...(seedCost !== existing.seedCost && { seedCost }),
        ...(sowingType !== undefined && { sowingType: sowingType || null }),
        ...(sowingChargesBy !== undefined && { sowingChargesBy: sowingChargesBy || null }),
        ...(sowingCharges !== undefined && { sowingCharges: sowingCharges !== null ? parseFloat(sowingCharges) : null }),
        ...(sowingCost !== existing.sowingCost && { sowingCost }),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Cultivation PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update cultivation', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId') as any

    const existing = await db.cultivation.findFirst({
      where: { id, farm: { farmer: { ...tf } } },
    })
    if (!existing) return NextResponse.json({ error: 'Cultivation not found' }, { status: 404 })

    await db.cultivation.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cultivation DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete cultivation' }, { status: 500 })
  }
}
