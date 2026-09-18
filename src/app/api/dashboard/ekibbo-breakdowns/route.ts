import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { Prisma } from '@prisma/client'

/**
 * GET /api/dashboard/ekibbo-breakdowns
 *
 * Returns all disaggregated analytics for the EKiBBO MD dashboard:
 *   - farmerCategorization: { byYouth, byGender, byDistrict, byAgeBand }
 *   - trainingsByFunder: [{ funder, count, attendees }]
 *   - purchaseBreakdown: { byYear, byMonth, bySeason, byDistrict, byCommodity }
 *   - salesBreakdown:    { byYear, byMonth, bySeason, byDistrict, byCommodity }
 *   - salesByBuyer:      [{ buyerName, count, volume, value }]
 *   - revenueByProduce:  [{ produce, volume, value, avgPrice }]
 *   - loansDisaggregation: { byGender, byAgeBand, byDistrict, byType }
 *   - inputsDisaggregation: { byGender, byAgeBand, byDistrict, byType }
 *   - farmLandKpis: { totalPlots, totalAcreageHa, totalPlants, plantBreakdown: [{cropName, plantCount}] }
 *   - inputDistributionByCategory: { Tools, Fertilizers, Seedlings, Other }
 *
 * All data is REAL — computed from the database. Each section has try/catch so
 * one failing query does not break the entire response.
 */

// Helper to convert BigInt to number (raw query results)
function n(v: unknown): number {
  if (v == null) return 0
  if (typeof v === 'bigint') return Number(v)
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const parsed = parseFloat(v)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

// Age band boundaries
const AGE_BANDS = [
  { label: '<18', min: 0, max: 17 },
  { label: '18-24', min: 18, max: 24 },
  { label: '25-34', min: 25, max: 34 },
  { label: '35-44', min: 35, max: 44 },
  { label: '45-59', min: 45, max: 59 },
  { label: '60+', min: 60, max: 999 },
]

// Youth cutoff (per Uganda National Youth Policy: 18-30)
const YOUTH_MIN = 18
const YOUTH_MAX = 30

// Season mapping (Uganda has 2 main seasons for annual crops)
// Season A: March-May (planting), Sept-Dec (harvest)
// Season B: Sept-Nov (planting), March-June (harvest)
// We label by harvest quarter for simplicity:
//   Q1 (Jan-Mar) → "Season B (harvest)"
//   Q2 (Apr-Jun) → "Season B (harvest)"
//   Q3 (Jul-Sep) → "Season A (planting/prep)"
//   Q4 (Oct-Dec) → "Season A (harvest)"
function seasonLabel(month: number): string {
  if (month >= 1 && month <= 3) return 'Season B (Q1)'
  if (month >= 4 && month <= 6) return 'Season B (Q2)'
  if (month >= 7 && month <= 9) return 'Season A (Q3)'
  return 'Season A (Q4)'
}

// Input type → category mapping
function inputCategory(inputType: string): 'Tools' | 'Fertilizers' | 'Seedlings' | 'Other' {
  const t = (inputType || '').toLowerCase().trim()
  if (['pruning_saw', 'saw', 'secateur', 'shear', 'sprayer', 'tarpaulin', 'tool', 'hoe', 'machete', 'knife'].some(x => t.includes(x))) return 'Tools'
  if (['fertilizer', 'urea', 'npk', 'compost', 'manure', 'lime', 'dap', 'can'].some(x => t.includes(x))) return 'Fertilizers'
  if (['seedling', 'seed', 'plantlet', 'cutting', 'clone'].some(x => t.includes(x))) return 'Seedlings'
  return 'Other'
}

export async function GET() {
  try {
    const ctx = await getTenantContext()
    const tf = buildTenantFilter(ctx, 'tenantId') as any

    // For raw SQL queries — tenant scope
    const tenantIds = !ctx.isSuperAdmin && ctx.tenantScope.length > 0
      ? ctx.tenantScope
      : null
    const tenantFilterSql = tenantIds
      ? Prisma.sql` AND "tenantId" = ANY(${tenantIds}::text[])`
      : Prisma.empty

    const [
      farmerCategorization,
      trainingsByFunder,
      purchaseBreakdown,
      salesBreakdown,
      salesByBuyer,
      revenueByProduce,
      loansDisaggregation,
      inputsDisaggregation,
      farmLandKpis,
      inputDistributionByCategory,
    ] = await Promise.all([
      computeFarmerCategorization(tf, tenantFilterSql),
      computeTrainingsByFunder(tf),
      computePurchaseBreakdown(ctx, tf, tenantFilterSql),
      computeSalesBreakdown(ctx, tf, tenantFilterSql),
      computeSalesByBuyer(ctx, tf),
      computeRevenueByProduce(ctx, tf),
      computeLoansDisaggregation(tf),
      computeInputsDisaggregation(tf),
      computeFarmLandKpis(tf),
      computeInputDistributionByCategory(tf),
    ])

    return NextResponse.json({
      farmerCategorization,
      trainingsByFunder,
      purchaseBreakdown,
      salesBreakdown,
      salesByBuyer,
      revenueByProduce,
      loansDisaggregation,
      inputsDisaggregation,
      farmLandKpis,
      inputDistributionByCategory,
    })
  } catch (error) {
    console.error('[ekibbo-breakdowns] error:', error)
    return NextResponse.json({ error: 'Failed to compute breakdowns' }, { status: 500 })
  }
}

// ─── Farmer categorization (Youth, Gender, District, AgeBand) ─────────────
async function computeFarmerCategorization(tf: any, tenantFilterSql: Prisma.Sql) {
  try {
    const farmers = await db.farmerProfile.findMany({
      where: { ...tf, status: 'ACTIVE' },
      select: { gender: true, dateOfBirth: true, district: true },
      take: 10000,
    })

    const now = new Date()
    const byGender: Record<string, number> = { Male: 0, Female: 0, Other: 0 }
    const byDistrict: Record<string, number> = {}
    const byAgeBand: Record<string, number> = { '<18': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45-59': 0, '60+': 0 }
    let youthCount = 0
    let totalWithDob = 0

    for (const f of farmers) {
      // Gender
      const g = f.gender || 'Other'
      byGender[g] = (byGender[g] || 0) + 1

      // District
      const d = f.district || 'Unknown'
      byDistrict[d] = (byDistrict[d] || 0) + 1

      // Age band (from dateOfBirth)
      if (f.dateOfBirth) {
        const dob = new Date(f.dateOfBirth)
        const ageMs = now.getTime() - dob.getTime()
        const age = Math.floor(ageMs / (365.25 * 86400000))
        if (age >= 0 && age < 200) {
          totalWithDob++
          // Youth check (18-30 per Uganda policy)
          if (age >= YOUTH_MIN && age <= YOUTH_MAX) youthCount++
          // Age band
          const band = AGE_BANDS.find(b => age >= b.min && age <= b.max)
          if (band) byAgeBand[band.label] = (byAgeBand[band.label] || 0) + 1
        }
      }
    }

    const totalFarmers = farmers.length
    return {
      totalFarmers,
      byYouth: {
        youth: youthCount,
        nonYouth: Math.max(0, totalWithDob - youthCount),
        youthRate: totalWithDob > 0 ? Math.round((youthCount / totalWithDob) * 1000) / 10 : 0,
        // Uganda National Youth Policy defines youth as 18-30
        ageRange: `${YOUTH_MIN}-${YOUTH_MAX}`,
      },
      byGender: Object.entries(byGender)
        .map(([label, count]) => ({ label, count, pct: totalFarmers > 0 ? Math.round((count / totalFarmers) * 1000) / 10 : 0 }))
        .sort((a, b) => b.count - a.count),
      byDistrict: Object.entries(byDistrict)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15),
      byAgeBand: Object.entries(byAgeBand)
        .map(([label, count]) => ({ label, count })),
    }
  } catch (e) {
    console.error('[farmerCategorization]', e)
    return null
  }
}

// ─── Training dashboard grouped by funder ──────────────────────────────────
async function computeTrainingsByFunder(tf: any) {
  try {
    const trainings = await db.training.findMany({
      where: tf,
      select: {
        id: true,
        funder: true,
        date: true,
        mainTopic: true,
        type: true,
        _count: { select: { attendance: true } },
      },
      take: 5000,
    })

    const byFunder: Record<string, { count: number; attendees: number; topics: Set<string> }> = {}
    for (const t of trainings) {
      const funder = t.funder || 'Unfunded'
      if (!byFunder[funder]) byFunder[funder] = { count: 0, attendees: 0, topics: new Set() }
      byFunder[funder].count++
      byFunder[funder].attendees += t._count.attendance
      if (t.mainTopic) byFunder[funder].topics.add(t.mainTopic)
    }

    return Object.entries(byFunder)
      .map(([funder, v]) => ({
        funder,
        count: v.count,
        attendees: v.attendees,
        avgAttendeesPerTraining: v.count > 0 ? Math.round((v.attendees / v.count) * 10) / 10 : 0,
        topics: Array.from(v.topics),
      }))
      .sort((a, b) => b.count - a.count)
  } catch (e) {
    console.error('[trainingsByFunder]', e)
    return []
  }
}

// ─── Purchase breakdowns (year, month, season, district, commodity) ───────
async function computePurchaseBreakdown(ctx: any, tf: any, tenantFilterSql: Prisma.Sql) {
  try {
    // Purchases link to tenant via farmer.tenantId OR direct tenantId (EKIBBO)
    // We filter through the OR of both
    const purchases = await db.purchase.findMany({
      where: {
        OR: [
          { farmer: tf },
          { tenantId: ctx.tenantId },
        ],
      },
      select: {
        createdAt: true,
        commodity: true,
        quantity: true,
        totalAmount: true,
        farmer: { select: { district: true } },
      },
      take: 5000,
    })

    const byYear: Record<string, { volume: number; value: number; count: number }> = {}
    const byMonth: Record<string, { volume: number; value: number; count: number }> = {}
    const bySeason: Record<string, { volume: number; value: number; count: number }> = {}
    const byDistrict: Record<string, { volume: number; value: number; count: number }> = {}
    const byCommodity: Record<string, { volume: number; value: number; count: number }> = {}

    for (const p of purchases) {
      const d = new Date(p.createdAt)
      const year = String(d.getFullYear())
      const month = d.toLocaleDateString('en', { month: 'short', year: '2-digit' })
      const season = seasonLabel(d.getMonth() + 1)
      const district = p.farmer?.district || 'Unknown'
      const commodity = (p.commodity || 'Unknown').charAt(0).toUpperCase() + (p.commodity || 'Unknown').slice(1).toLowerCase()
      const qty = parseFloat(String(p.quantity || '0')) || 0
      const value = Number(p.totalAmount) || 0

      for (const [bucket, key] of [[byYear, year], [byMonth, month], [bySeason, season], [byDistrict, district], [byCommodity, commodity]] as [any, string][]) {
        if (!bucket[key]) bucket[key] = { volume: 0, value: 0, count: 0 }
        bucket[key].volume += qty
        bucket[key].value += value
        bucket[key].count++
      }
    }

    return {
      totalPurchases: purchases.length,
      byYear: Object.entries(byYear).map(([k, v]) => ({ label: k, ...v })).sort((a, b) => a.label.localeCompare(b.label)),
      byMonth: Object.entries(byMonth).map(([k, v]) => ({ label: k, ...v })).sort((a, b) => a.label.localeCompare(b.label)).slice(-12),
      bySeason: Object.entries(bySeason).map(([k, v]) => ({ label: k, ...v })),
      byDistrict: Object.entries(byDistrict).map(([k, v]) => ({ label: k, ...v })).sort((a, b) => b.value - a.value).slice(0, 15),
      byCommodity: Object.entries(byCommodity).map(([k, v]) => ({ label: k, ...v })).sort((a, b) => b.value - a.value),
    }
  } catch (e) {
    console.error('[purchaseBreakdown]', e)
    return null
  }
}

// ─── Sales breakdowns (year, month, season, district, commodity) ───────────
async function computeSalesBreakdown(ctx: any, tf: any, tenantFilterSql: Prisma.Sql) {
  try {
    const sales = await db.sale.findMany({
      where: {
        OR: [
          { farmer: tf },
          { tenantId: ctx.tenantId },
        ],
      },
      select: {
        createdAt: true,
        product: true,
        quantity: true,
        totalAmount: true,
        netAmount: true,
        farmer: { select: { district: true } },
      },
      take: 5000,
    })

    const byYear: Record<string, { volume: number; value: number; count: number }> = {}
    const byMonth: Record<string, { volume: number; value: number; count: number }> = {}
    const bySeason: Record<string, { volume: number; value: number; count: number }> = {}
    const byDistrict: Record<string, { volume: number; value: number; count: number }> = {}
    const byCommodity: Record<string, { volume: number; value: number; count: number }> = {}

    for (const s of sales) {
      const d = new Date(s.createdAt)
      const year = String(d.getFullYear())
      const month = d.toLocaleDateString('en', { month: 'short', year: '2-digit' })
      const season = seasonLabel(d.getMonth() + 1)
      const district = s.farmer?.district || 'Unknown'
      const commodity = (s.product || 'Unknown').charAt(0).toUpperCase() + (s.product || 'Unknown').slice(1).toLowerCase()
      const qty = parseFloat(String(s.quantity || '0')) || 0
      const value = Number(s.totalAmount) || 0

      for (const [bucket, key] of [[byYear, year], [byMonth, month], [bySeason, season], [byDistrict, district], [byCommodity, commodity]] as [any, string][]) {
        if (!bucket[key]) bucket[key] = { volume: 0, value: 0, count: 0 }
        bucket[key].volume += qty
        bucket[key].value += value
        bucket[key].count++
      }
    }

    return {
      totalSales: sales.length,
      byYear: Object.entries(byYear).map(([k, v]) => ({ label: k, ...v })).sort((a, b) => a.label.localeCompare(b.label)),
      byMonth: Object.entries(byMonth).map(([k, v]) => ({ label: k, ...v })).sort((a, b) => a.label.localeCompare(b.label)).slice(-12),
      bySeason: Object.entries(bySeason).map(([k, v]) => ({ label: k, ...v })),
      byDistrict: Object.entries(byDistrict).map(([k, v]) => ({ label: k, ...v })).sort((a, b) => b.value - a.value).slice(0, 15),
      byCommodity: Object.entries(byCommodity).map(([k, v]) => ({ label: k, ...v })).sort((a, b) => b.value - a.value),
    }
  } catch (e) {
    console.error('[salesBreakdown]', e)
    return null
  }
}

// ─── Sales breakdown per buyer company ─────────────────────────────────────
async function computeSalesByBuyer(ctx: any, tf: any) {
  try {
    const sales = await db.sale.findMany({
      where: {
        OR: [
          { farmer: tf },
          { tenantId: ctx.tenantId },
        ],
      },
      select: { customerName: true, customerId: true, quantity: true, totalAmount: true, product: true, createdAt: true },
      take: 5000,
    })

    const byBuyer: Record<string, { buyerName: string; count: number; volume: number; value: number; lastSale: Date | null }> = {}
    for (const s of sales) {
      const buyer = s.customerName || s.customerId || 'Unknown Buyer'
      if (!byBuyer[buyer]) byBuyer[buyer] = { buyerName: buyer, count: 0, volume: 0, value: 0, lastSale: null }
      byBuyer[buyer].count++
      byBuyer[buyer].volume += parseFloat(String(s.quantity || '0')) || 0
      byBuyer[buyer].value += Number(s.totalAmount) || 0
      const d = new Date(s.createdAt)
      if (!byBuyer[buyer].lastSale || d > byBuyer[buyer].lastSale) byBuyer[buyer].lastSale = d
    }

    return Object.entries(byBuyer)
      .map(([k, v]) => ({ buyerName: v.buyerName, count: v.count, volume: Math.round(v.volume * 100) / 100, value: Math.round(v.value), lastSale: v.lastSale?.toISOString().split('T')[0] || null }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20)
  } catch (e) {
    console.error('[salesByBuyer]', e)
    return []
  }
}

// ─── Revenue per produce (which crop generates the most revenue) ────────────
async function computeRevenueByProduce(ctx: any, tf: any) {
  try {
    // Sales grouped by product (produce)
    const sales = await db.sale.findMany({
      where: {
        OR: [
          { farmer: tf },
          { tenantId: ctx.tenantId },
        ],
      },
      select: { product: true, quantity: true, totalAmount: true, unitPrice: true },
      take: 5000,
    })

    const byProduce: Record<string, { volume: number; value: number; count: number }> = {}
    for (const s of sales) {
      const produce = (s.product || 'Unknown').charAt(0).toUpperCase() + (s.product || 'Unknown').slice(1).toLowerCase()
      if (!byProduce[produce]) byProduce[produce] = { volume: 0, value: 0, count: 0 }
      byProduce[produce].volume += parseFloat(String(s.quantity || '0')) || 0
      byProduce[produce].value += Number(s.totalAmount) || 0
      byProduce[produce].count++
    }

    return Object.entries(byProduce)
      .map(([produce, v]) => ({
        produce,
        volume: Math.round(v.volume * 100) / 100,
        value: Math.round(v.value),
        count: v.count,
        avgPricePerUnit: v.volume > 0 ? Math.round((v.value / v.volume) * 100) / 100 : null,
      }))
      .sort((a, b) => b.value - a.value)
  } catch (e) {
    console.error('[revenueByProduce]', e)
    return []
  }
}

// ─── Loans disaggregation by gender, age, district, type ──────────────────
async function computeLoansDisaggregation(tf: any) {
  try {
    // VSLA Loans — link via farmer for demographics
    const loans = await db.vslaLoan.findMany({
      where: { farmer: tf },
      select: {
        amount: true,
        status: true,
        createdAt: true,
        farmer: {
          select: {
            gender: true, dateOfBirth: true, district: true,
          },
        },
        vslaGroup: { select: { name: true } },
      },
      take: 5000,
    })

    const now = new Date()
    const byGender: Record<string, { count: number; amount: number }> = {}
    const byAgeBand: Record<string, { count: number; amount: number }> = { '<18': { count: 0, amount: 0 }, '18-24': { count: 0, amount: 0 }, '25-34': { count: 0, amount: 0 }, '35-44': { count: 0, amount: 0 }, '45-59': { count: 0, amount: 0 }, '60+': { count: 0, amount: 0 } }
    const byDistrict: Record<string, { count: number; amount: number }> = {}
    const byType: Record<string, { count: number; amount: number }> = {}

    for (const l of loans) {
      const amount = Number(l.amount) || 0
      const gender = l.farmer?.gender || 'Other'
      const district = l.farmer?.district || 'Unknown'
      const loanType = l.vslaGroup?.name?.includes('Input') ? 'Input Loan' : (l.vslaGroup?.name?.includes('Crop') ? 'Crop Loan' : 'General Loan')

      if (!byGender[gender]) byGender[gender] = { count: 0, amount: 0 }
      byGender[gender].count++
      byGender[gender].amount += amount

      if (!byDistrict[district]) byDistrict[district] = { count: 0, amount: 0 }
      byDistrict[district].count++
      byDistrict[district].amount += amount

      if (!byType[loanType]) byType[loanType] = { count: 0, amount: 0 }
      byType[loanType].count++
      byType[loanType].amount += amount

      // Age band
      if (l.farmer?.dateOfBirth) {
        const age = Math.floor((now.getTime() - new Date(l.farmer.dateOfBirth).getTime()) / (365.25 * 86400000))
        if (age >= 0 && age < 200) {
          const band = AGE_BANDS.find(b => age >= b.min && age <= b.max)
          if (band && byAgeBand[band.label]) {
            byAgeBand[band.label].count++
            byAgeBand[band.label].amount += amount
          }
        }
      }
    }

    return {
      totalLoans: loans.length,
      totalAmount: Object.values(byGender).reduce((s, v) => s + v.amount, 0),
      byGender: Object.entries(byGender).map(([label, v]) => ({ label, count: v.count, amount: Math.round(v.amount) })),
      byAgeBand: Object.entries(byAgeBand).map(([label, v]) => ({ label, count: v.count, amount: Math.round(v.amount) })),
      byDistrict: Object.entries(byDistrict).map(([label, v]) => ({ label, count: v.count, amount: Math.round(v.amount) })).sort((a, b) => b.amount - a.amount).slice(0, 15),
      byType: Object.entries(byType).map(([label, v]) => ({ label, count: v.count, amount: Math.round(v.amount) })).sort((a, b) => b.amount - a.amount),
    }
  } catch (e) {
    console.error('[loansDisaggregation]', e)
    return null
  }
}

// ─── Inputs distribution disaggregation by gender, age, district, type ────
async function computeInputsDisaggregation(tf: any) {
  try {
    const inputs = await db.inputDistribution.findMany({
      where: tf,
      select: {
        inputType: true, inputName: true, totalCost: true, quantity: true,
        farmer: { select: { gender: true, dateOfBirth: true, district: true } },
      },
      take: 5000,
    })

    const now = new Date()
    const byGender: Record<string, { count: number; amount: number }> = {}
    const byAgeBand: Record<string, { count: number; amount: number }> = { '<18': { count: 0, amount: 0 }, '18-24': { count: 0, amount: 0 }, '25-34': { count: 0, amount: 0 }, '35-44': { count: 0, amount: 0 }, '45-59': { count: 0, amount: 0 }, '60+': { count: 0, amount: 0 } }
    const byDistrict: Record<string, { count: number; amount: number }> = {}
    const byType: Record<string, { count: number; amount: number }> = {}

    for (const i of inputs) {
      const amount = Number(i.totalCost) || 0
      const gender = i.farmer?.gender || 'Other'
      const district = i.farmer?.district || 'Unknown'
      const inputType = i.inputType || 'Other'

      if (!byGender[gender]) byGender[gender] = { count: 0, amount: 0 }
      byGender[gender].count++
      byGender[gender].amount += amount

      if (!byDistrict[district]) byDistrict[district] = { count: 0, amount: 0 }
      byDistrict[district].count++
      byDistrict[district].amount += amount

      if (!byType[inputType]) byType[inputType] = { count: 0, amount: 0 }
      byType[inputType].count++
      byType[inputType].amount += amount

      if (i.farmer?.dateOfBirth) {
        const age = Math.floor((now.getTime() - new Date(i.farmer.dateOfBirth).getTime()) / (365.25 * 86400000))
        if (age >= 0 && age < 200) {
          const band = AGE_BANDS.find(b => age >= b.min && age <= b.max)
          if (band && byAgeBand[band.label]) {
            byAgeBand[band.label].count++
            byAgeBand[band.label].amount += amount
          }
        }
      }
    }

    return {
      totalDistributions: inputs.length,
      totalAmount: Object.values(byGender).reduce((s, v) => s + v.amount, 0),
      byGender: Object.entries(byGender).map(([label, v]) => ({ label, count: v.count, amount: Math.round(v.amount) })),
      byAgeBand: Object.entries(byAgeBand).map(([label, v]) => ({ label, count: v.count, amount: Math.round(v.amount) })),
      byDistrict: Object.entries(byDistrict).map(([label, v]) => ({ label, count: v.count, amount: Math.round(v.amount) })).sort((a, b) => b.amount - a.amount).slice(0, 15),
      byType: Object.entries(byType).map(([label, v]) => ({ label, count: v.count, amount: Math.round(v.amount) })).sort((a, b) => b.amount - a.amount),
    }
  } catch (e) {
    console.error('[inputsDisaggregation]', e)
    return null
  }
}

// ─── Farm Land KPI cards + plant breakdown ─────────────────────────────────
async function computeFarmLandKpis(tf: any) {
  try {
    const [farms, cultivations] = await Promise.all([
      db.farmLand.findMany({
        where: { farmer: tf },
        select: { id: true, sizeHectares: true, name: true },
        take: 10000,
      }),
      db.cultivation.findMany({
        where: { farm: { farmer: tf } },
        select: { cropName: true, seedlingCount: true, cultivationAreaHa: true },
        take: 10000,
      }),
    ])

    const totalPlots = farms.length
    const totalAcreageHa = farms.reduce((s, f) => s + (Number(f.sizeHectares) || 0), 0)
    const totalPlants = cultivations.reduce((s, c) => s + (Number(c.seedlingCount) || 0), 0)

    // Plant breakdown by crop
    const byCrop: Record<string, { plantCount: number; areaHa: number; plotCount: number }> = {}
    for (const c of cultivations) {
      const crop = (c.cropName || 'Unknown').charAt(0).toUpperCase() + (c.cropName || 'Unknown').slice(1).toLowerCase()
      if (!byCrop[crop]) byCrop[crop] = { plantCount: 0, areaHa: 0, plotCount: 0 }
      byCrop[crop].plantCount += Number(c.seedlingCount) || 0
      byCrop[crop].areaHa += Number(c.cultivationAreaHa) || 0
      byCrop[crop].plotCount++
    }

    return {
      totalPlots,
      totalAcreageHa: Math.round(totalAcreageHa * 100) / 100,
      totalPlants,
      avgAcreagePerPlot: totalPlots > 0 ? Math.round((totalAcreageHa / totalPlots) * 100) / 100 : 0,
      plantBreakdown: Object.entries(byCrop)
        .map(([cropName, v]) => ({
          cropName,
          plantCount: v.plantCount,
          areaHa: Math.round(v.areaHa * 100) / 100,
          plotCount: v.plotCount,
        }))
        .sort((a, b) => b.plantCount - a.plantCount)
        .slice(0, 15),
    }
  } catch (e) {
    console.error('[farmLandKpis]', e)
    return null
  }
}

// ─── Input distribution categorization (Tools/Fertilizers/Seedlings/Other) ─
async function computeInputDistributionByCategory(tf: any) {
  try {
    const inputs = await db.inputDistribution.findMany({
      where: tf,
      select: { inputType: true, inputName: true, quantity: true, totalCost: true },
      take: 5000,
    })

    const byCategory: Record<string, { count: number; quantity: number; amount: number; types: Set<string> }> = {
      Tools: { count: 0, quantity: 0, amount: 0, types: new Set() },
      Fertilizers: { count: 0, quantity: 0, amount: 0, types: new Set() },
      Seedlings: { count: 0, quantity: 0, amount: 0, types: new Set() },
      Other: { count: 0, quantity: 0, amount: 0, types: new Set() },
    }

    for (const i of inputs) {
      const cat = inputCategory(i.inputType)
      byCategory[cat].count++
      byCategory[cat].quantity += Number(i.quantity) || 0
      byCategory[cat].amount += Number(i.totalCost) || 0
      if (i.inputType) byCategory[cat].types.add(i.inputType)
    }

    const total = Object.values(byCategory).reduce((s, v) => s + v.count, 0)
    return {
      totalDistributions: total,
      categories: Object.entries(byCategory).map(([category, v]) => ({
        category,
        count: v.count,
        quantity: Math.round(v.quantity * 100) / 100,
        amount: Math.round(v.amount),
        pct: total > 0 ? Math.round((v.count / total) * 1000) / 10 : 0,
        types: Array.from(v.types),
      })),
    }
  } catch (e) {
    console.error('[inputDistributionByCategory]', e)
    return null
  }
}
