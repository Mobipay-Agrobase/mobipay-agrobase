import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dashboard/ops-summary
 *
 * Operations Manager dashboard summary (Ekibbo feedback):
 *   - farmerRegistry: total + active farmers, split by district
 *   - farmerGroups:   total + active farmer groups formed
 *   - purchases:      volumes of produce purchased by crop, district and season
 *   - inputs:         inputs distributed by type (qty + value)
 *   - loans:          number of farmers accessing loans by season
 *
 * Loyalty rates come from the existing /api/dashboard/ekibbo-loyalty endpoint
 * (called separately by the dashboard view — it has its own date filters).
 *
 * Auth: any authenticated user with dashboard:read. Tenant-scoped.
 */

/** Uganda season label from a date: Season A = Sep–Feb, Season B = Mar–Aug. */
function seasonOf(d: Date): string {
  const m = d.getMonth() + 1 // 1-12
  return m >= 9 || m <= 2
    ? `${m >= 9 ? d.getFullYear() : d.getFullYear() - 1} Season A`
    : `${d.getFullYear()} Season B`
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId') as any

    // ─── Farmer registry ────────────────────────────────────────────────
    const [totalFarmers, activeFarmers, farmersByDistrictRaw] = await Promise.all([
      db.farmerProfile.count({ where: { ...tf } }),
      db.farmerProfile.count({ where: { ...tf, status: 'ACTIVE' } }),
      db.farmerProfile.groupBy({
        by: ['district'],
        where: { ...tf },
        _count: { _all: true },
      }),
    ])
    const farmersByDistrict = farmersByDistrictRaw
      .filter(g => g.district)
      .map(g => ({ district: g.district as string, count: g._count._all }))
      .sort((a, b) => b.count - a.count)

    // ─── Farmer groups formed ───────────────────────────────────────────
    const [totalGroups, activeGroups] = await Promise.all([
      db.farmerGroup.count({ where: tf }),
      db.farmerGroup.count({ where: { ...tf, isActive: true } }),
    ])

    // ─── Purchases (volumes by crop / district / season) ────────────────
    const purchases = await db.purchase.findMany({
      where: { ...tf },
      select: {
        quantity: true,
        netWeight: true,
        totalAmount: true,
        commodity: true,
        createdAt: true,
        farmer: { select: { district: true } },
      },
      take: 5000,
    })

    const byCropMap = new Map<string, { volumeKg: number; value: number; count: number }>()
    const byDistrictMap = new Map<string, { volumeKg: number; value: number }>()
    const bySeasonMap = new Map<string, { volumeKg: number; value: number }>()
    for (const p of purchases) {
      const kg = Number(p.netWeight ?? p.quantity ?? 0)
      const val = Number(p.totalAmount ?? 0)
      const crop = p.commodity || 'Unknown'
      const cropAgg = byCropMap.get(crop) || { volumeKg: 0, value: 0, count: 0 }
      cropAgg.volumeKg += kg; cropAgg.value += val; cropAgg.count += 1
      byCropMap.set(crop, cropAgg)

      const district = p.farmer?.district || 'Unknown'
      const dAgg = byDistrictMap.get(district) || { volumeKg: 0, value: 0 }
      dAgg.volumeKg += kg; dAgg.value += val
      byDistrictMap.set(district, dAgg)

      const season = seasonOf(p.createdAt)
      const sAgg = bySeasonMap.get(season) || { volumeKg: 0, value: 0 }
      sAgg.volumeKg += kg; sAgg.value += val
      bySeasonMap.set(season, sAgg)
    }

    const purchasesByCrop = [...byCropMap.entries()]
      .map(([crop, v]) => ({ crop, ...v }))
      .sort((a, b) => b.volumeKg - a.volumeKg)
    const purchasesByDistrict = [...byDistrictMap.entries()]
      .map(([district, v]) => ({ district, ...v }))
      .sort((a, b) => b.volumeKg - a.volumeKg)
    const purchasesBySeason = [...bySeasonMap.entries()]
      .map(([season, v]) => ({ season, ...v }))
      .sort((a, b) => b.season.localeCompare(a.season))

    // ─── Inputs distributed by type ─────────────────────────────────────
    const inputsRaw = await db.inputDistribution.groupBy({
      by: ['inputType'],
      where: { ...tf },
      _sum: { quantity: true, totalCost: true },
      _count: { _all: true },
    })
    const inputsByType = inputsRaw
      .map(g => ({
        inputType: g.inputType,
        quantity: Number(g._sum.quantity ?? 0),
        value: Number(g._sum.totalCost ?? 0),
        distributions: g._count._all,
      }))
      .sort((a, b) => b.value - a.value)

    // ─── Farmers accessing loans by season ──────────────────────────────
    // LoanApplication has no season field — derive the season from the
    // application/disbursement date (Season A = Sep–Feb, Season B = Mar–Aug)
    // and count DISTINCT farmers per season.
    const loans = await db.loanApplication.findMany({
      where: ctx.isSuperAdmin || ctx.tenantScope.length === 0
        ? {}
        : { loanProduct: { tenantId: { in: ctx.tenantScope } } },
      select: { farmerId: true, applicantName: true, createdAt: true, disbursedAt: true, amount: true, status: true },
      take: 5000,
    }).catch(() => [] as { farmerId: string | null; applicantName: string; createdAt: Date; disbursedAt: Date | null; amount: number; status: string }[])

    const loansBySeasonMap = new Map<string, { farmers: Set<string>; applications: number; amount: number }>()
    for (const l of loans) {
      const when = l.disbursedAt || l.createdAt
      const season = seasonOf(when)
      const agg = loansBySeasonMap.get(season) || { farmers: new Set<string>(), applications: 0, amount: 0 }
      if (l.farmerId) agg.farmers.add(l.farmerId)
      else agg.farmers.add(`name:${l.applicantName}`)
      agg.applications += 1
      agg.amount += Number(l.amount ?? 0)
      loansBySeasonMap.set(season, agg)
    }
    const loansBySeason = [...loansBySeasonMap.entries()]
      .map(([season, v]) => ({ season, farmers: v.farmers.size, applications: v.applications, amount: v.amount }))
      .sort((a, b) => b.season.localeCompare(a.season))

    return NextResponse.json({
      farmerRegistry: {
        total: totalFarmers,
        active: activeFarmers,
        byDistrict: farmersByDistrict,
      },
      farmerGroups: { total: totalGroups, active: activeGroups },
      purchases: {
        byCrop: purchasesByCrop,
        byDistrict: purchasesByDistrict,
        bySeason: purchasesBySeason,
      },
      inputs: { byType: inputsByType },
      loans: { bySeason: loansBySeason },
    })
  } catch (error: any) {
    console.error('Ops summary error:', error)
    return NextResponse.json({ error: 'Failed to compute operations summary', detail: error.message }, { status: 500 })
  }
}
