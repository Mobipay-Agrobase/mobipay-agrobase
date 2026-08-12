import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/reports/analytics
 *
 * Single endpoint that returns aggregated analytics for the new tabbed
 * Reports page. Buckets:
 *   - overview:    KPI totals (farmers, farms, sales, savings, loans, trainings)
 *   - demographics: gender, education, maritalStatus, ageBand, memberType
 *   - crops:       crop counts (parsed from mainCrops JSON), average farm size
 *   - geography:   district / village distribution
 *   - farmArea:    farmSize band distribution + total area
 *   - vsla:        savings totals, loan portfolio, attendance (only for VSLA tenants)
 *   - financial:   purchase / sale aggregates by commodity, payment totals
 *   - training:    attendance by topic, coverage by location
 *   - credit:      score band distribution
 *
 * Each bucket is computed independently — failures in one don't affect others.
 */
export async function GET() {
  try {
    const ctx = await getTenantContext()
    const tf = buildTenantFilter(ctx, 'tenantId')
    const farmerWhere = { ...tf, status: 'ACTIVE' as const }

    const [
      overview,
      demographics,
      crops,
      geography,
      farmArea,
      vsla,
      financial,
      training,
      credit,
    ] = await Promise.all([
      computeOverview(farmerWhere, ctx),
      computeDemographics(farmerWhere),
      computeCrops(farmerWhere),
      computeGeography(farmerWhere),
      computeFarmArea(farmerWhere),
      computeVsla(ctx),
      computeFinancial(ctx, tf),
      computeTraining(tf),
      computeCredit(ctx),
    ])

    return NextResponse.json({
      overview,
      demographics,
      crops,
      geography,
      farmArea,
      vsla,
      financial,
      training,
      credit,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 })
  }
}

async function computeOverview(farmerWhere: any, ctx: any) {
  try {
    const [farmerCount, farmLandCount, cultivationCount, savingsTotal, loansActive, trainingsCount] = await Promise.all([
      db.farmerProfile.count({ where: farmerWhere }),
      db.farmLand.count({ where: { farmer: farmerWhere } }),
      db.cultivation.count({ where: { farm: { farmer: farmerWhere } } }),
      ctx.isSuperAdmin
        ? db.vslaSaving.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED' } })
        : db.vslaSaving.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED', vslaGroup: { tenantId: { in: ctx.tenantScope } } } }),
      ctx.isSuperAdmin
        ? db.vslaLoan.count({ where: { status: { in: ['DISBURSED', 'OUTSTANDING'] } } })
        : db.vslaLoan.count({ where: { status: { in: ['DISBURSED', 'OUTSTANDING'] }, vslaGroup: { tenantId: { in: ctx.tenantScope } } } }),
      db.training.count({ where: farmerWhere }),
    ])
    return { farmerCount, farmLandCount, cultivationCount, savingsTotal: savingsTotal._sum.amount || 0, loansActive, trainingsCount }
  } catch (e) {
    console.error('Overview error:', e)
    return null
  }
}

async function computeDemographics(farmerWhere: any) {
  try {
    const farmers = await db.farmerProfile.findMany({
      where: farmerWhere,
      select: { gender: true, education: true, maritalStatus: true, dateOfBirth: true, memberType: true },
    })
    const gender: Record<string, number> = {}
    const education: Record<string, number> = {}
    const maritalStatus: Record<string, number> = {}
    const ageBand: Record<string, number> = { '18-25': 0, '26-35': 0, '36-45': 0, '46-60': 0, '60+': 0, 'Unknown': 0 }
    const memberType: Record<string, number> = {}

    for (const f of farmers) {
      const g = f.gender || 'Unknown'
      gender[g] = (gender[g] || 0) + 1
      const ed = f.education || 'Unknown'
      education[ed] = (education[ed] || 0) + 1
      const m = f.maritalStatus || 'Unknown'
      maritalStatus[m] = (maritalStatus[m] || 0) + 1
      const mt = f.memberType || 'Unknown'
      memberType[mt] = (memberType[mt] || 0) + 1

      if (f.dateOfBirth) {
        const age = Math.floor((Date.now() - new Date(f.dateOfBirth).getTime()) / (365.25 * 86400000))
        if (age < 0 || age > 120) ageBand['Unknown']++
        else if (age <= 25) ageBand['18-25']++
        else if (age <= 35) ageBand['26-35']++
        else if (age <= 45) ageBand['36-45']++
        else if (age <= 60) ageBand['46-60']++
        else ageBand['60+']++
      } else {
        ageBand['Unknown']++
      }
    }

    return {
      gender: toRows(gender),
      education: toRows(education),
      maritalStatus: toRows(maritalStatus),
      ageBand: Object.entries(ageBand).map(([label, value]) => ({ label, value })),
      memberType: toRows(memberType),
      totalFarmers: farmers.length,
    }
  } catch (e) {
    console.error('Demographics error:', e)
    return null
  }
}

async function computeCrops(farmerWhere: any) {
  try {
    const farmers = await db.farmerProfile.findMany({
      where: farmerWhere,
      select: { mainCrops: true, farmSize: true },
    })
    const cropCount: Record<string, number> = {}
    let totalFarmSize = 0
    let farmersWithSize = 0
    for (const f of farmers) {
      if (f.mainCrops) {
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
      if (f.farmSize) { totalFarmSize += f.farmSize; farmersWithSize++ }
    }
    return {
      crops: Object.entries(cropCount).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
      totalFarmSize,
      avgFarmSize: farmersWithSize > 0 ? totalFarmSize / farmersWithSize : 0,
      farmersWithSize,
    }
  } catch (e) {
    console.error('Crops error:', e)
    return null
  }
}

async function computeGeography(farmerWhere: any) {
  try {
    const farmers = await db.farmerProfile.findMany({
      where: farmerWhere,
      select: { district: true, villageName: true, commune: true },
    })
    const district: Record<string, number> = {}
    const subCounty: Record<string, number> = {}
    const village: Record<string, number> = {}
    for (const f of farmers) {
      const d = f.district || 'Unknown'
      district[d] = (district[d] || 0) + 1
      const sc = f.commune || 'Unknown'
      subCounty[sc] = (subCounty[sc] || 0) + 1
      const v = f.villageName || 'Unknown'
      village[v] = (village[v] || 0) + 1
    }
    return {
      district: Object.entries(district).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
      subCounty: Object.entries(subCounty).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
      village: Object.entries(village).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 50),
    }
  } catch (e) {
    console.error('Geography error:', e)
    return null
  }
}

async function computeFarmArea(farmerWhere: any) {
  try {
    const farmers = await db.farmerProfile.findMany({
      where: farmerWhere,
      select: { farmSize: true, farmOwnership: true },
    })
    const bands: Record<string, number> = { '<0.5 ha': 0, '0.5-1 ha': 0, '1-2 ha': 0, '2-5 ha': 0, '5+ ha': 0, 'Unknown': 0 }
    const ownership: Record<string, number> = {}
    for (const f of farmers) {
      const sz = f.farmSize
      if (sz == null) bands['Unknown']++
      else if (sz < 0.5) bands['<0.5 ha']++
      else if (sz < 1) bands['0.5-1 ha']++
      else if (sz < 2) bands['1-2 ha']++
      else if (sz < 5) bands['2-5 ha']++
      else bands['5+ ha']++
      const o = f.farmOwnership || 'Unknown'
      ownership[o] = (ownership[o] || 0) + 1
    }
    return {
      bands: Object.entries(bands).map(([label, value]) => ({ label, value })),
      ownership: Object.entries(ownership).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
    }
  } catch (e) {
    console.error('FarmArea error:', e)
    return null
  }
}

async function computeVsla(ctx: any) {
  try {
    const groupWhere = ctx.isSuperAdmin ? {} : { tenantId: { in: ctx.tenantScope } }
    const [savingsAgg, loans, groups] = await Promise.all([
      db.vslaSaving.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { vslaGroup: groupWhere, status: 'COMPLETED' },
      }),
      db.vslaLoan.groupBy({
        by: ['status'],
        _count: true,
        _sum: { amount: true },
        where: { vslaGroup: groupWhere },
      }),
      db.vslaGroup.count({ where: groupWhere }),
    ])
    return {
      totalSavings: savingsAgg._sum.amount || 0,
      savingsCount: savingsAgg._count,
      groups,
      loansByStatus: loans.map(l => ({ label: l.status, count: l._count, amount: l._sum.amount || 0 })),
    }
  } catch (e) {
    console.error('VSLA error:', e)
    return null
  }
}

async function computeFinancial(ctx: any, tf: any) {
  try {
    const [purchases, sales] = await Promise.all([
      db.purchase.findMany({
        where: { farmer: tf },
        select: { commodity: true, quantity: true, totalAmount: true },
        take: 1000,
      }),
      db.sale.findMany({
        where: { farmer: tf },
        select: { commodity: true, quantity: true, totalAmount: true },
        take: 1000,
      }),
    ])
    const purchasesByCommodity = aggregateByCommodity(purchases)
    const salesByCommodity = aggregateByCommodity(sales)
    return {
      purchasesByCommodity,
      salesByCommodity,
      totalPurchaseValue: purchasesByCommodity.reduce((s, r) => s + r.value, 0),
      totalSalesValue: salesByCommodity.reduce((s, r) => s + r.value, 0),
    }
  } catch (e) {
    console.error('Financial error:', e)
    return null
  }
}

function aggregateByCommodity(rows: any[]) {
  const m: Record<string, { volume: number; value: number; count: number }> = {}
  for (const r of rows) {
    const c = r.commodity || 'Unknown'
    if (!m[c]) m[c] = { volume: 0, value: 0, count: 0 }
    m[c].volume += Number(r.quantity) || 0
    m[c].value += Number(r.totalAmount) || 0
    m[c].count += 1
  }
  return Object.entries(m).map(([label, v]) => ({ label, value: v.value, volume: v.volume, count: v.count })).sort((a, b) => b.value - a.value)
}

async function computeTraining(tf: any) {
  try {
    const trainings = await db.training.findMany({
      where: tf,
      select: { topic: true, location: true, date: true, _count: { select: { attendance: true } } },
      take: 500,
    })
    const byTopic: Record<string, number> = {}
    const byLocation: Record<string, { count: number; attendance: number }> = {}
    let totalAttendance = 0
    for (const t of trainings) {
      const topic = t.topic || 'Unknown'
      byTopic[topic] = (byTopic[topic] || 0) + 1
      const loc = t.location || 'Unknown'
      if (!byLocation[loc]) byLocation[loc] = { count: 0, attendance: 0 }
      byLocation[loc].count += 1
      byLocation[loc].attendance += t._count?.attendance || 0
      totalAttendance += t._count?.attendance || 0
    }
    return {
      totalTrainings: trainings.length,
      totalAttendance,
      byTopic: Object.entries(byTopic).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
      byLocation: Object.entries(byLocation).map(([label, v]) => ({ label, value: v.attendance, count: v.count })).sort((a, b) => b.value - a.value),
    }
  } catch (e) {
    console.error('Training error:', e)
    return null
  }
}

async function computeCredit(ctx: any) {
  try {
    const where = ctx.isSuperAdmin ? {} : { farmer: { tenantId: { in: ctx.tenantScope } } }
    const scores = await db.creditScore.findMany({
      where,
      select: { totalScore: true },
      take: 1000,
    })
    const bands: Record<string, number> = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 }
    let totalScore = 0
    let validCount = 0
    for (const s of scores) {
      const sc = s.totalScore || 0
      totalScore += sc
      if (sc > 0) validCount++
      if (sc <= 20) bands['0-20']++
      else if (sc <= 40) bands['21-40']++
      else if (sc <= 60) bands['41-60']++
      else if (sc <= 80) bands['61-80']++
      else bands['81-100']++
    }
    return {
      totalScores: scores.length,
      avgScore: validCount > 0 ? totalScore / validCount : 0,
      bands: Object.entries(bands).map(([label, value]) => ({ label, value })),
    }
  } catch (e) {
    console.error('Credit error:', e)
    return null
  }
}

function toRows(map: Record<string, number>) {
  return Object.entries(map).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
}
