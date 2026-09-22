import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dashboard/ekibbo-analytics
 *
 * Returns aggregated analytics for the EKIBBO MD dashboard:
 *   - farmLocations: array of { lat, lng, farmerName, farmName, farmerCode }
 *   - locationHierarchy: { country, province, district, commune, villageName } → farmer count
 *   - purchaseTrends: last 6 months of purchase volume + value
 *   - commodityMix: pie chart of farmer count per main crop
 *   - farmerGrowth: cumulative farmer registrations over time
 *   - topVillages: top 10 villages by farmer count
 *   - genderByDistrict: gender split per district
 *
 * All data is REAL — no simulations.
 */
export async function GET() {
  try {
    const ctx = await getTenantContext()
    const tf = buildTenantFilter(ctx, 'tenantId')

    // Run all queries in parallel — each catches its own errors
    const [farmLocations, locationHierarchy, purchaseTrends, commodityMix, farmerGrowth, topVillages, genderByDistrict] = await Promise.all([
      computeFarmLocations(tf),
      computeLocationHierarchy(tf),
      computePurchaseTrends(ctx, tf),
      computeCommodityMix(tf),
      computeFarmerGrowth(tf),
      computeTopVillages(tf),
      computeGenderByDistrict(tf),
    ])

    return NextResponse.json({
      farmLocations,
      locationHierarchy,
      purchaseTrends,
      commodityMix,
      farmerGrowth,
      topVillages,
      genderByDistrict,
    })
  } catch (error) {
    console.error('[ekibbo-analytics] error:', error)
    return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 })
  }
}

// Farm geolocations for the map widget
async function computeFarmLocations(tf: any) {
  try {
    const farms = await db.farmLand.findMany({
      where: { farmer: tf, latitude: { not: null }, longitude: { not: null } },
      select: {
        id: true, name: true, latitude: true, longitude: true, sizeHectares: true,
        farmer: { select: { firstName: true, lastName: true, farmerCode: true } },
      },
      take: 5000,
    })
    return farms.map(f => ({
      lat: f.latitude,
      lng: f.longitude,
      farmName: f.name,
      farmerName: `${f.farmer?.firstName || ''} ${f.farmer?.lastName || ''}`.trim(),
      farmerCode: f.farmer?.farmerCode || '',
      size: f.sizeHectares,
    }))
  } catch (e) { console.error('[farmLocations]', e); return [] }
}

// 7-level location hierarchy → farmer count at each level
async function computeLocationHierarchy(tf: any) {
  try {
    const farmers = await db.farmerProfile.findMany({
      where: { ...tf, status: 'ACTIVE' },
      select: {
        country: true, province: true, district: true, commune: true,
        villageName: true, gender: true,
      },
      take: 5000,
    })

    const group = (field: string) => {
      const m: Record<string, number> = {}
      for (const f of farmers) {
        const v = (f as any)[field]
        if (v) m[v] = (m[v] || 0) + 1
      }
      return Object.entries(m)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
    }

    return {
      country: group('country'),
      province: group('province'),
      district: group('district'),
      commune: group('commune'),
      villageName: group('villageName'),
      totalFarmers: farmers.length,
    }
  } catch (e) { console.error('[locationHierarchy]', e); return null }
}

// Purchase trends — last 6 months
async function computePurchaseTrends(ctx: any, tf: any) {
  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    sixMonthsAgo.setDate(1)

    const purchases = await db.purchase.findMany({
      where: {
        OR: [
          { farmer: tf },
          { tenantId: ctx.tenantId },
        ],
        createdAt: { gte: sixMonthsAgo },
      },
      select: { createdAt: true, totalAmount: true, quantity: true, commodity: true },
      take: 2000,
    })

    const months: Record<string, { volume: number; value: number; count: number }> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleDateString('en', { month: 'short', year: '2-digit' })
      months[key] = { volume: 0, value: 0, count: 0 }
    }

    for (const p of purchases) {
      const d = new Date(p.createdAt)
      const key = d.toLocaleDateString('en', { month: 'short', year: '2-digit' })
      if (!months[key]) continue
      months[key].volume += Number(p.quantity) || 0
      months[key].value += Number(p.totalAmount) || 0
      months[key].count += 1
    }

    return Object.entries(months).map(([month, v]) => ({ month, ...v }))
  } catch (e) { console.error('[purchaseTrends]', e); return [] }
}

// Commodity mix — farmer count per main crop
async function computeCommodityMix(tf: any) {
  try {
    const farmers = await db.farmerProfile.findMany({
      where: { ...tf, status: 'ACTIVE' },
      select: { mainCrops: true },
      take: 5000,
    })

    const cropCount: Record<string, number> = {}
    for (const f of farmers) {
      if (!f.mainCrops) continue
      let crops: any = f.mainCrops
      try { crops = typeof f.mainCrops === 'string' ? JSON.parse(f.mainCrops) : f.mainCrops } catch {}
      if (Array.isArray(crops)) {
        for (const c of crops) {
          const cs = String(c)
          cropCount[cs] = (cropCount[cs] || 0) + 1
        }
      } else if (typeof crops === 'string') {
        for (const c of crops.split(/[,;]/).map(s => s.trim()).filter(Boolean)) {
          cropCount[c] = (cropCount[c] || 0) + 1
        }
      }
    }

    return Object.entries(cropCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  } catch (e) { console.error('[commodityMix]', e); return [] }
}

// Farmer growth — cumulative registrations per month
async function computeFarmerGrowth(tf: any) {
  try {
    const farmers = await db.farmerProfile.findMany({
      where: tf,
      select: { enrollmentDate: true, createdAt: true },
      take: 5000,
    })

    const months: Record<string, number> = {}
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleDateString('en', { month: 'short', year: '2-digit' })
      months[key] = 0
    }

    for (const f of farmers) {
      const d = new Date(f.enrollmentDate || f.createdAt)
      const key = d.toLocaleDateString('en', { month: 'short', year: '2-digit' })
      if (key in months) months[key]++
    }

    // Cumulative
    let cumulative = 0
    return Object.entries(months).map(([month, count]) => {
      cumulative += count
      return { month, newFarmers: count, totalFarmers: cumulative }
    })
  } catch (e) { console.error('[farmerGrowth]', e); return [] }
}

// Top villages by farmer count
async function computeTopVillages(tf: any) {
  try {
    const farmers = await db.farmerProfile.findMany({
      where: { ...tf, status: 'ACTIVE', villageName: { not: null } },
      select: { villageName: true, district: true },
      take: 5000,
    })

    const m: Record<string, { count: number; district: string }> = {}
    for (const f of farmers) {
      const v = f.villageName || 'Unknown'
      if (!m[v]) m[v] = { count: 0, district: f.district || '—' }
      m[v].count++
    }

    return Object.entries(m)
      .map(([village, v]) => ({ village, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  } catch (e) { console.error('[topVillages]', e); return [] }
}

// Gender split by district
async function computeGenderByDistrict(tf: any) {
  try {
    const farmers = await db.farmerProfile.findMany({
      where: { ...tf, status: 'ACTIVE' },
      select: { district: true, gender: true },
      take: 5000,
    })

    const m: Record<string, { male: number; female: number; other: number }> = {}
    for (const f of farmers) {
      const d = f.district || 'Unknown'
      if (!m[d]) m[d] = { male: 0, female: 0, other: 0 }
      if (f.gender === 'Male') m[d].male++
      else if (f.gender === 'Female') m[d].female++
      else m[d].other++
    }

    return Object.entries(m)
      .map(([district, v]) => ({ district, ...v }))
      .sort((a, b) => (b.male + b.female + b.other) - (a.male + a.female + a.other))
      .slice(0, 10)
  } catch (e) { console.error('[genderByDistrict]', e); return [] }
}
