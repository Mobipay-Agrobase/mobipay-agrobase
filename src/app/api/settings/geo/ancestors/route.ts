import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/settings/geo/ancestors?villageId=xxx
// Returns the full admin-unit chain (region → sub-region → district → county → sub-county → parish → village)
// so the LocationPicker can prefill selections without downloading the whole hierarchy.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const villageId = searchParams.get('villageId')
    if (!villageId) return NextResponse.json({ data: null })

    const village = await db.village.findUnique({
      where: { id: villageId },
      include: {
        parish: {
          include: {
            subCounty: {
              include: {
                county: { include: { district: { include: { subRegion: { include: { region: true } } } } } },
              },
            },
          },
        },
      },
    })
    if (!village) return NextResponse.json({ data: null })

    const chain = village.parish?.subCounty?.county?.district?.subRegion?.region
    return NextResponse.json({
      data: {
        country: chain?.country || 'Uganda',
        regionId: chain?.id,
        region: chain?.name,
        subRegionId: village.parish?.subCounty?.county?.district?.subRegion?.id,
        subRegion: village.parish?.subCounty?.county?.district?.subRegion?.name,
        districtId: village.parish?.subCounty?.county?.district?.id,
        district: village.parish?.subCounty?.county?.district?.name,
        countyId: village.parish?.subCounty?.county?.id,
        county: village.parish?.subCounty?.county?.name,
        subCountyId: village.parish?.subCounty?.id,
        subCounty: village.parish?.subCounty?.name,
        parishId: village.parishId,
        parish: village.parish?.name,
        villageId: village.id,
        village: village.name,
      },
    })
  } catch (error) {
    console.error('Ancestors error:', error)
    return NextResponse.json({ error: 'Failed to fetch ancestors' }, { status: 500 })
  }
}