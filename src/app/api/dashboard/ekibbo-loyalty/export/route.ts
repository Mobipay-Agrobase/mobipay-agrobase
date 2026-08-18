import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dashboard/ekibbo-loyalty/export?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Returns a CSV with one row per farmer who had ANY engagement in the
 * selected period, showing their loyalty signals:
 *
 *   farmerCode, firstName, lastName, village, district,
 *   salesCount, repeatSeller (TRUE if salesCount>=2),
 *   cropsSold (semicolon-separated list),
 *   multiCrop (TRUE if >=2 distinct crops),
 *   inputPurchases (count),
 *   trainingsAttended (count),
 *   farmVisits (count),
 *   loyal (TRUE if salesCount>=1)
 *
 * Used by the EKIBBO MD dashboard's "Export" button on the loyalty card.
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId') as any

    const { searchParams } = new URL(req.url)
    const now = new Date()
    const fromStr = searchParams.get('from')
    const toStr = searchParams.get('to')
    const from = fromStr ? new Date(fromStr + 'T00:00:00Z') : new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
    let to = toStr ? new Date(toStr + 'T23:59:59Z') : new Date()
    if (to > now) to = now
    if (from > to) {
      return NextResponse.json({ error: 'Invalid date range: from > to' }, { status: 400 })
    }

    // Fetch all engagements in the period, then build per-farmer rows in JS.
    const [sales, inputs, attendances, visits] = await Promise.all([
      db.sale.findMany({
        where: { ...tf, category: 'PRODUCE', status: 'COMPLETED', createdAt: { gte: from, lte: to } },
        select: { farmerId: true, product: true, totalAmount: true },
      }),
      db.inputDistribution.findMany({
        where: { ...tf, distributionDate: { gte: from, lte: to } },
        select: { farmerId: true, totalCost: true },
      }),
      db.trainingAttendance.findMany({
        where: { training: { ...tf, date: { gte: from, lte: to } }, attended: true },
        select: { farmerId: true },
      }),
      db.farmVisit.findMany({
        where: { farmer: { ...tf }, visitDate: { gte: from, lte: to } },
        select: { farmerId: true },
      }),
    ])

    // Build a map of farmerId → engagement signals
    const farmers = new Map<string, {
      salesCount: number
      crops: Set<string>
      totalSalesValue: number
      inputCount: number
      trainingCount: number
      farmVisitCount: number
    }>()

    const ensure = (fid: string) => {
      if (!farmers.has(fid)) {
        farmers.set(fid, { salesCount: 0, crops: new Set(), totalSalesValue: 0, inputCount: 0, trainingCount: 0, farmVisitCount: 0 })
      }
      return farmers.get(fid)!
    }

    for (const s of sales) {
      if (!s.farmerId) continue
      const f = ensure(s.farmerId)
      f.salesCount++
      if (s.product) f.crops.add(s.product)
      f.totalSalesValue += s.totalAmount || 0
    }
    for (const i of inputs) {
      const f = ensure(i.farmerId)
      f.inputCount++
    }
    for (const a of attendances) {
      const f = ensure(a.farmerId)
      f.trainingCount++
    }
    for (const v of visits) {
      if (!v.farmerId) continue
      const f = ensure(v.farmerId)
      f.farmVisitCount++
    }

    // Fetch farmer names + village + district for all farmers with engagement
    const farmerIds = [...farmers.keys()]
    const farmerProfiles = farmerIds.length > 0
      ? await db.farmerProfile.findMany({
          where: { id: { in: farmerIds } },
          select: {
            id: true, farmerCode: true, firstName: true, lastName: true,
            villageName: true, district: true,
          },
        })
      : []
    const profileMap = new Map(farmerProfiles.map(p => [p.id, p]))

    // Build CSV
    const escape = (v: string | null | undefined) => {
      const s = v == null ? '' : String(v)
      // Escape double-quotes by doubling them; wrap in double-quotes if contains comma/newline/quote
      if (s.includes(',') || s.includes('\n') || s.includes('"')) {
        return `"${s.replace(/"/g, '""')}"`
      }
      return s
    }

    const header = [
      'farmerCode', 'firstName', 'lastName', 'village', 'district',
      'salesCount', 'repeatSeller', 'cropsSold', 'multiCrop',
      'totalSalesValueUGX', 'inputPurchases', 'trainingsAttended',
      'farmVisits', 'loyal',
    ].join(',')

    const rows = [...farmers.entries()].map(([fid, f]) => {
      const p = profileMap.get(fid)
      const repeatSeller = f.salesCount >= 2 ? 'TRUE' : 'FALSE'
      const multiCrop = f.crops.size >= 2 ? 'TRUE' : 'FALSE'
      const loyal = f.salesCount >= 1 ? 'TRUE' : 'FALSE'
      const cropsSold = [...f.crops].sort().join(';')
      return [
        escape(p?.farmerCode),
        escape(p?.firstName),
        escape(p?.lastName),
        escape(p?.villageName),
        escape(p?.district),
        f.salesCount,
        repeatSeller,
        escape(cropsSold),
        multiCrop,
        Math.round(f.totalSalesValue),
        f.inputCount,
        f.trainingCount,
        f.farmVisitCount,
        loyal,
      ].join(',')
    })

    const csv = [header, ...rows].join('\n')
    const filename = `ekibbo-loyalty-${from.toISOString().split('T')[0]}-to-${to.toISOString().split('T')[0]}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('EKIBBO loyalty export error:', error)
    return NextResponse.json({ error: 'Failed to export loyalty data' }, { status: 500 })
  }
}
