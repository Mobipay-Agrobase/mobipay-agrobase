import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { mapFarmer, farmerSelect, resolveFarmerByNumericId, numericId } from '@/lib/mobile/ekibbo-adapter'

/**
 * GET /api/mobile/ekibbo-farmer-detail/[id]  (id = numeric | 'me')
 *
 * Complete farmer profile for the mobile detail page — the SAME datapoints
 * the web Farmer Detail page shows, plus mobile extras:
 *   data         — base profile (upstream FarmerModel shape + web fields)
 *   loyalty      — { points, tier, salesCount, totalSalesValue } (Ekibbo loyalty)
 *   creditScore  — climate resilience score (4 factors)
 *   qrData       — farmer ID-card QR payload
 *   farmLands    — registered farm lands with cultivations
 */
async function computeLoyalty(farmerId: string) {
  try {
    const sales = await db.sale.findMany({
      where: { farmerId },
      select: { totalAmount: true, netAmount: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    const totalSalesValue = sales.reduce((s, x) => s + (Number(x.netAmount ?? x.totalAmount) || 0), 0)
    // Ekibbo loyalty: 10 points per UGX 100,000 net sales; tiers mirror web
    const points = Math.floor(totalSalesValue / 100000) * 10
    const tier = points >= 500 ? 'GOLD' : points >= 200 ? 'SILVER' : points > 0 ? 'BRONZE' : 'NONE'
    return {
      points,
      tier,
      salesCount: sales.length,
      totalSalesValue: Math.round(totalSalesValue),
      lastSaleAt: sales[0]?.createdAt?.toISOString() ?? null,
    }
  } catch (e) {
    console.error('[ekibbo-farmer-detail] loyalty', e)
    return { points: 0, tier: 'NONE', salesCount: 0, totalSalesValue: 0, lastSaleAt: null }
  }
}

async function computeCreditScore(farmerId: string) {
  try {
    const { calculateClimateScore, gatherClimateScoreInputs } = await import('@/lib/impact/climate-score')
    const inputs = await gatherClimateScoreInputs(farmerId)
    return await calculateClimateScore(inputs)
  } catch (e) {
    console.error('[ekibbo-farmer-detail] creditScore', e)
    return null
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const { id } = await params

    let farmerId: string | null = null
    if (id === 'me') {
      const own = await db.farmerProfile.findFirst({
        where: { ...tf, userId: ctx.userId },
        select: { id: true },
      })
      farmerId = own?.id ?? null
    } else {
      const numId = parseInt(id, 10)
      if (!Number.isNaN(numId)) {
        const own = await resolveFarmerByNumericId(tf, numId)
        farmerId = own?.id ?? null
      }
    }

    if (!farmerId) {
      return NextResponse.json({ result: false, message: 'Farmer not found' }, { status: 404 })
    }

    const [farmer, group, lands, loyalty, creditScore] = await Promise.all([
      db.farmerProfile.findFirst({
        where: { id: farmerId },
        select: {
          ...farmerSelect,
          education: true, maritalStatus: true, email: true, spouseName: true,
          familyMembers: true, childrenUnder18: true, schoolGoingChildren: true,
          housingOwnership: true, houseType: true, consumerElectronics: true,
          vehicle: true, bankAccounts: true, bankName: true,
          loanTakenLastYear: true, loanTakenFrom: true, loanAmount: true,
          memberType: true, isCertified: true,
          certificationType: true, icsYear: true, farmerRegistrationUnder: true,
          extensionOfficer: true, nationalIdNo: true, dateOfBirth: true,
        },
      }),
      db.farmerGroup.findFirst({
        where: { farmers: { some: { id: farmerId } } },
        select: { name: true },
      }).catch(() => null),
      db.farmLand.findMany({
        where: { farmerId },
        select: {
          id: true, name: true, sizeHectares: true, landOwnership: true,
          cultivations: { select: { id: true, cropName: true, variety: true, season: true, status: true, estimatedYield: true } },
        },
        take: 50,
      }),
      computeLoyalty(farmerId),
      computeCreditScore(farmerId),
    ])

    if (!farmer) {
      return NextResponse.json({ result: false, message: 'Farmer not found' }, { status: 404 })
    }

    const base = mapFarmer(farmer as any)
    const farmerCode = farmer.farmerCode || ''

    // Web-aligned extension fields (what the web farmer detail shows)
    const web: Record<string, unknown> = {
      education: farmer.education,
      marital_status: farmer.maritalStatus,
      email: farmer.email,
      spouse_name: farmer.spouseName,
      family_members: farmer.familyMembers,
      children_under_18: farmer.childrenUnder18,
      school_going_children: farmer.schoolGoingChildren,
      housing_ownership: farmer.housingOwnership,
      house_type: farmer.houseType,
      consumer_electronics: safeJsonArray(farmer.consumerElectronics),
      vehicles: safeJsonArray(farmer.vehicle),
      bank_accounts: safeJsonArray(farmer.bankAccounts),
      loan_taken_last_year: farmer.loanTakenLastYear,
      loan_taken_from: farmer.loanTakenFrom,
      loan_amount: farmer.loanAmount,
      member_type: farmer.memberType,
      group_name: group?.name ?? null,
      is_certified: farmer.isCertified,
      certification_type: farmer.certificationType,
      ics_year: farmer.icsYear,
      farmer_registration_under: farmer.farmerRegistrationUnder,
      extension_officer: farmer.extensionOfficer,
    }

    const farmLands = lands.map(l => ({
      id: numericId(l.id),
      farm_name: l.name,
      total_land_holding: Number(l.sizeHectares) || 0,
      land_ownership: l.landOwnership,
      tag: '',
      listLatLng: '',
      cultivations: l.cultivations.map(c => ({
        id: numericId(c.id),
        crop_name: c.cropName,
        variety: c.variety,
        season: c.season,
        status: c.status,
        estimated_yield: c.estimatedYield,
      })),
    }))

    return NextResponse.json({
      result: true,
      data: { ...base, ...web, farm_lands: farmLands },
      loyalty,
      creditScore,
      qrData: JSON.stringify({
        t: 'AGROBASE_FARMER',
        code: farmerCode,
        id: farmer.id,
        n: `${farmer.firstName} ${farmer.lastName}`.trim(),
      }),
    })
  } catch (error: any) {
    console.error('[ekibbo-farmer-detail]', error)
    return NextResponse.json({ result: false, message: 'Failed to load farmer', detail: error.message }, { status: 500 })
  }
}

function safeJsonArray(raw: string | null): unknown[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
