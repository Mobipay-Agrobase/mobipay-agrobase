import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { isEkibboTenant } from '@/lib/ekibbo'

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

    // ─── EKIBBO-ONLY feature gate ────────────────────────────────────────
    if (!(await isEkibboTenant(ctx))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

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
      if (s.includes(',') || s.includes('\n') || s.includes('"')) {
        return `"${s.replace(/"/g, '""')}"`
      }
      return s
    }

    // Compute per-farmer loyalty tier (0-4 stages → New/Engaged/Active/Loyal/Champion)
    // Matches the /api/farmers/[id]/loyalty endpoint logic exactly.
    const tierFor = (f: { salesCount: number; inputCount: number; trainingCount: number; farmVisitCount: number }) => {
      const stageTraining = f.trainingCount >= 1 || f.farmVisitCount >= 1
      const stageInput = f.inputCount >= 1
      const stageSale = f.salesCount >= 1
      const stageRepeat = f.salesCount >= 2
      const stages = [stageTraining, stageInput, stageSale, stageRepeat].filter(Boolean).length
      const tierLabels = ['New', 'Engaged', 'Active', 'Loyal', 'Champion']
      return { stages, tier: tierLabels[stages] }
    }

    // Human-readable headers (no more cryptic TRUE/FALSE)
    const header = [
      'Farmer Code',
      'First Name',
      'Last Name',
      'Village',
      'District',
      'Loyalty Tier',
      'Stages Completed',
      'Loyal (Sold Produce)',
      'Repeat Seller',
      'Multi-Crop Seller',
      'Sales Count',
      'Crops Sold',
      'Total Sales Value (UGX)',
      'Input Purchases',
      'Trainings Attended',
      'Farm Visits',
    ].join(',')

    // Build a row for a single farmer
    const buildRow = (fid: string, f: any) => {
      const p = profileMap.get(fid)
      const { stages, tier } = tierFor(f)
      const loyal = f.salesCount >= 1 ? 'Yes' : 'No'
      const repeatSeller = f.salesCount >= 2 ? 'Yes' : 'No'
      const multiCrop = f.crops.size >= 2 ? 'Yes' : 'No'
      const cropsSold = [...f.crops].sort().join('; ')
      return [
        escape(p?.farmerCode),
        escape(p?.firstName),
        escape(p?.lastName),
        escape(p?.villageName),
        escape(p?.district),
        tier,
        `${stages}/4`,
        loyal,
        repeatSeller,
        multiCrop,
        f.salesCount,
        escape(cropsSold),
        Math.round(f.totalSalesValue),
        f.inputCount,
        f.trainingCount,
        f.farmVisitCount,
      ].join(',')
    }

    // Split farmers into Loyal (sold produce) and Not Loyal (engaged but no sale)
    // — much friendlier for EKiBBO to action. They can focus on the Not Loyal
    // group to convert them into sellers.
    const allEntries = [...farmers.entries()]
    const loyalEntries = allEntries.filter(([, f]) => f.salesCount >= 1)
    const notLoyalEntries = allEntries.filter(([, f]) => f.salesCount < 1)

    // Sort loyal farmers by tier (Champion first), then by sales count desc
    const loyalRows = loyalEntries
      .sort(([, a], [, b]) => {
        const ta = tierFor(a).stages
        const tb = tierFor(b).stages
        if (tb !== ta) return tb - ta
        return b.salesCount - a.salesCount
      })
      .map(([fid, f]) => buildRow(fid, f))

    // Sort not-loyal farmers by engagement stages desc (most engaged first)
    const notLoyalRows = notLoyalEntries
      .sort(([, a], [, b]) => tierFor(b).stages - tierFor(a).stages)
      .map(([fid, f]) => buildRow(fid, f))

    const periodLabel = `${from.toISOString().split('T')[0]} to ${to.toISOString().split('T')[0]}`

    const csvParts: string[] = []
    // Title + summary header
    csvParts.push(`EKiBBO Customer Loyalty Report`)
    csvParts.push(`Period,${escape(periodLabel)}`)
    csvParts.push(`Generated,${escape(new Date().toISOString())}`)
    csvParts.push(``)
    csvParts.push(`LOYAL FARMERS (${loyalRows.length}) — sold produce to EKiBBO in the period`)
    csvParts.push(header)
    csvParts.push(...loyalRows)
    csvParts.push(``)
    csvParts.push(`NOT YET LOYAL (${notLoyalRows.length}) — engaged but have not sold produce yet`)
    csvParts.push(header)
    csvParts.push(...notLoyalRows)

    const csv = csvParts.join('\n')
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
