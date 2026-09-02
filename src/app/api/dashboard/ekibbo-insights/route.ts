import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dashboard/ekibbo-insights
 *
 * Unified EKiBBO management dashboard data (EKIBBO dashboard feedback rework).
 * Serves the SAME dataset to MD / Operations Manager / MEC officer — the UI
 * gates financial approvals by role; the data does not differ.
 *
 * Sections (each computed independently — one failure degrades only itself):
 *   1. farmerProfile — total, gender, age (Youth 18–35 / Adults 36+), district
 *      table (with gender + youth splits), multiple-crop farmers.
 *   2. trainings    — group trainings + farmer visits per main topic
 *                      (Bamboo, Regenerative agriculture, Financial literacy)
 *                      and per funder (EKiBBO, ETG, Enabel, Doen).
 *   3. purchases    — weight/value per produce (coffee, cocoa, avocado,
 *                      jackfruit, vanilla, cassava) + full drill-down:
 *                      year → season → month and district → sub-county →
 *                      village (per commodity) + coffee-form split.
 *   4. sales        — weight/value per produce + drill-downs + per-buyer
 *                      companies (canonical buyer catalog per commodity).
 *   5. revenue      — revenue per produce sold, per year / season / month.
 *   6. loans        — farmers who accessed loans, disaggregated by year,
 *                      season, district, sub-county, gender and age category.
 *   7. inputs       — farmers accessing inputs, same disaggregation, plus
 *                      by input type (seedlings [coffee/bamboo/cocoa/shade
 *                      trees], tarpaulins, pruning saws, fertilizers).
 *   8. loyalty      — per year and per season: loyal farmers (≥1 sale) and
 *                      repeat sellers (≥2 sales); supporting detail metrics
 *                      for the "View details" dialog.
 *
 * All data is REAL — no simulations. Quantities in the schema are stored as
 * strings for purchases/sales; they are coerced with Number() and treated as
 * 0 when not finite.
 *
 * Season convention (Uganda bimodal rainfall):
 *   Season A = March–August, Season B = September–February
 *   (Jan/Feb belong to season B of the PREVIOUS year).
 * Youth = 18–35 years old at evaluation time (program reporting standard).
 */

// ─── Constants ────────────────────────────────────────────────────────────

const MAIN_TOPICS = ['BAMBOO', 'REGENERATIVE_AGRICULTURE', 'FINANCIAL_LITERACY'] as const
const TOPIC_LABELS: Record<string, string> = {
  BAMBOO: 'Bamboo',
  REGENERATIVE_AGRICULTURE: 'Regenerative agriculture',
  FINANCIAL_LITERACY: 'Financial literacy',
}
const FUNDERS = ['EKIBBO', 'ETG', 'ENABEL', 'DOEN'] as const
const FUNDER_LABELS: Record<string, string> = {
  EKIBBO: 'EKiBBO',
  ETG: 'ETG',
  ENABEL: 'Enabel',
  DOEN: 'Doen',
}

/** Canonical buyer companies per produce (EKIBBO feedback, produce sales). */
const BUYER_CATALOG: Record<string, string[]> = {
  Coffee: ['ETG', 'LDC', 'ATW', 'UGACOF'],
  Cocoa: ['ATW', 'ESCO', 'ETG', 'RUSTIC ORGANICS'],
  Avocado: ['AVOLIO', 'MUSUUBI', 'AVODO'],
  Vanilla: ['ENIMIRO', 'ESCO'],
  Cassava: ['DEHEUS'],
  Jackfruit: ['ZAHARA FOODS', 'FIBRE FOODS'],
}

const COFFEE_HINTS = [
  'coffee', 'faq', 'kiboko', 'robusta', 'arabica', 'cherry', 'parchment',
  'green bean',
]

const YOUTH_MIN = 18
const YOUTH_MAX = 35

// ─── Helpers ──────────────────────────────────────────────────────────────

interface Bucket {
  key: string
  farmers: Set<string>
  volume: number
  value: number
  txns: number
}

function newBucket(key: string): Bucket {
  return { key, farmers: new Set(), volume: 0, value: 0, txns: 0 }
}

function addTo(
  map: Map<string, Bucket>,
  key: string,
  farmerId?: string | null,
  volume = 0,
  value = 0,
): void {
  let b = map.get(key)
  if (!b) {
    b = newBucket(key)
    map.set(key, b)
  }
  b.volume += Number.isFinite(volume) ? volume : 0
  b.value += Number.isFinite(value) ? value : 0
  b.txns += 1
  if (farmerId) b.farmers.add(farmerId)
}

/** Finalize + sort buckets (default volume desc, key asc for stable output). */
function finalizeBuckets(map: Map<string, Bucket>, by: 'volume' | 'value' | 'farmers' = 'volume') {
  return Array.from(map.values())
    .map((b) => ({
      key: b.key,
      farmers: b.farmers.size,
      volume: Math.round(b.volume * 100) / 100,
      value: Math.round(b.value * 100) / 100,
      txns: b.txns,
    }))
    .sort((a, b) => {
      const av = by === 'value' ? a.value : by === 'farmers' ? a.farmers : a.volume
      const bv = by === 'value' ? b.value : by === 'farmers' ? b.farmers : b.volume
      if (bv !== av) return bv - av
      return a.key.localeCompare(b.key)
    })
}

/** Map raw commodity text → canonical produce name. Unknown → title-cased. */
function normalizeCommodity(raw: string | null | undefined): string {
  const s = (raw || '').trim().toLowerCase()
  if (!s) return 'Unknown'
  if (COFFEE_HINTS.some((h) => s.includes(h))) return 'Coffee'
  if (s.includes('cocoa') || s.includes('cacao')) return 'Cocoa'
  if (s.includes('avocado')) return 'Avocado'
  if (s.includes('jackfruit') || s === 'jf') return 'Jackfruit'
  if (s.includes('vanilla')) return 'Vanilla'
  if (s.includes('cassava')) return 'Cassava'
  if (s.includes('maize')) return 'Maize'
  if (s.includes('bean')) return 'Beans'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Coffee form (Fresh / Kiboko / FAQ) from commodity+variety text. */
function coffeeForm(raw: string | null | undefined, variety?: string | null): string {
  const s = `${raw || ''} ${variety || ''}`.toLowerCase()
  if (s.includes('faq')) return 'FAQ'
  if (s.includes('kiboko')) return 'Kiboko'
  if (s.includes('fresh') || s.includes('cherry') || s.includes('wet')) return 'Fresh'
  return 'Unspecified'
}

function titleCaseBuyer(s: string): string {
  if (['ETG', 'LDC', 'ATW', 'ESCO', 'UGACOF', 'AVOLIO'].includes(s)) return s
  return s
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Canonical buyer company for a raw buyer name within a produce. */
function canonicalBuyer(raw: string | null | undefined, commodity: string): string {
  const s = (raw || '').trim()
  if (!s) return 'Unknown buyer'
  const upper = s.toUpperCase().replace(/\s+/g, ' ')
  const catalog = BUYER_CATALOG[commodity] || []
  for (const canonical of catalog) {
    if (upper === canonical || upper.includes(canonical)) return titleCaseBuyer(canonical)
  }
  // Cross-commodity fallback so known aggregators still group sensibly.
  for (const [produce, catalog2] of Object.entries(BUYER_CATALOG)) {
    if (produce === commodity) continue
    for (const canonical of catalog2) {
      if (upper === canonical || upper.includes(canonical)) {
        return `${titleCaseBuyer(canonical)} (${commodity})`
      }
    }
  }
  return s
}

function normalizeGender(raw: string | null | undefined): 'Male' | 'Female' | 'Other' {
  const s = (raw || '').trim().toLowerCase()
  if (s.startsWith('m')) return 'Male'
  if (s.startsWith('f')) return 'Female'
  return 'Other'
}

function ageCategory(
  dob: Date | null | undefined,
  at = new Date(),
): 'Youth (18–35)' | 'Adults (36+)' | 'Unknown' {
  if (!dob) return 'Unknown'
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return 'Unknown'
  let age = at.getUTCFullYear() - d.getUTCFullYear()
  const m = at.getUTCMonth() - d.getUTCMonth()
  if (m < 0 || (m === 0 && at.getUTCDate() < d.getUTCDate())) age--
  if (age < 0) return 'Unknown'
  if (age >= YOUTH_MIN && age <= YOUTH_MAX) return 'Youth (18–35)'
  return 'Adults (36+)'
}

function yearKey(d: Date | string): string {
  return String(new Date(d).getUTCFullYear())
}

function monthKey(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 7)
}

/** Uganda season key: "2026A" (Mar–Aug) / "2025B" (Sep–Feb). */
function seasonKey(d: Date | string): string {
  const dt = new Date(d)
  const y = dt.getUTCFullYear()
  const m = dt.getUTCMonth() + 1
  if (m >= 3 && m <= 8) return `${y}A`
  if (m >= 9) return `${y}B`
  return `${y - 1}B` // Jan/Feb → season B of previous year
}

function safeNum(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

// ─── Route ────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const ctx = await getTenantContext()
    const tf = buildTenantFilter(ctx)
    const ownTenant = ctx.tenantId ? { tenantId: ctx.tenantId } : {}

    const [farmerProfile, trainings, purchases, sales, revenue, loans, inputs, loyalty] =
      await Promise.all([
        computeFarmerProfile(tf),
        computeTrainings(ownTenant),
        computePurchases(ctx, tf),
        computeSales(ctx, tf),
        computeRevenue(ctx, tf),
        computeLoans(tf),
        computeInputs(tf),
        computeLoyalty(ctx, tf),
      ])

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      definitions: {
        season: 'Season A = Mar–Aug, Season B = Sep–Feb (Uganda bimodal rainfall)',
        youth: 'Youth = 18–35 years',
        loyalFarmer: 'Farmer with ≥1 produce sale in the period',
        repeatSeller: 'Farmer with ≥2 produce sales in the period',
      },
      farmerProfile,
      trainings,
      purchases,
      sales,
      revenue,
      loans,
      inputs,
      loyalty,
    })
  } catch (error) {
    console.error('[ekibbo-insights] error:', error)
    return NextResponse.json({ error: 'Failed to compute insights' }, { status: 500 })
  }
}

// ─── 1. Farmer profiling ──────────────────────────────────────────────────

async function computeFarmerProfile(tf: Record<string, unknown>) {
  try {
    const farmers = await db.farmerProfile.findMany({
      where: { ...tf, status: 'ACTIVE' },
      select: { id: true, gender: true, dateOfBirth: true, district: true },
      take: 20000,
    })
    const crops = await db.cropProduction.findMany({
      where: { farmer: { ...tf, status: 'ACTIVE' } },
      select: { farmerId: true, cropName: true },
      take: 50000,
    })

    const gender = new Map<string, number>()
    const age = new Map<string, number>()
    const district = new Map<
      string,
      { total: number; male: number; female: number; youth: number; adult: number; unknownAge: number }
    >()

    for (const f of farmers) {
      const g = normalizeGender(f.gender)
      gender.set(g, (gender.get(g) || 0) + 1)

      const a = ageCategory(f.dateOfBirth)
      age.set(a, (age.get(a) || 0) + 1)

      const dKey = (f.district || '—').trim() || '—'
      let row = district.get(dKey)
      if (!row) {
        row = { total: 0, male: 0, female: 0, youth: 0, adult: 0, unknownAge: 0 }
        district.set(dKey, row)
      }
      row.total++
      if (g === 'Male') row.male++
      else if (g === 'Female') row.female++
      if (a === 'Youth (18–35)') row.youth++
      else if (a === 'Adults (36+)') row.adult++
      else row.unknownAge++
    }

    // Multiple-crop farmers: ≥2 distinct crops on their farm
    const cropsPerFarmer = new Map<string, Set<string>>()
    for (const c of crops) {
      const name = normalizeCommodity(c.cropName)
      if (name === 'Unknown') continue
      let set = cropsPerFarmer.get(c.farmerId)
      if (!set) {
        set = new Set()
        cropsPerFarmer.set(c.farmerId, set)
      }
      set.add(name)
    }
    let multiCropFarmers = 0
    for (const set of cropsPerFarmer.values()) if (set.size >= 2) multiCropFarmers++

    return {
      totalFarmers: farmers.length,
      byGender: Array.from(gender.entries()).map(([key, count]) => ({ key, count })),
      byAge: (['Youth (18–35)', 'Adults (36+)', 'Unknown'] as const).map((key) => ({
        key,
        count: age.get(key) || 0,
      })),
      byDistrict: Array.from(district.entries())
        .map(([districtKey, v]) => ({ district: districtKey, ...v }))
        .sort((a, b) => b.total - a.total || a.district.localeCompare(b.district)),
      cropFarmers: cropsPerFarmer.size,
      multiCropFarmers,
    }
  } catch (e) {
    console.error('[insights/farmerProfile]', e)
    return null
  }
}

// ─── 2. Trainings by topic + funder ───────────────────────────────────────

async function computeTrainings(ownTenant: Record<string, unknown>) {
  try {
    const rows = await db.training.findMany({
      where: { ...ownTenant },
      select: { type: true, mainTopic: true, funder: true, status: true },
      take: 20000,
    })

    interface TrainBucket {
      key: string
      label: string
      groupTrainings: number
      farmerVisits: number
    }
    const topicRows = new Map<string, TrainBucket>()
    const funderRows = new Map<string, TrainBucket>()

    function bucketFor(map: Map<string, TrainBucket>, key: string, label: string): TrainBucket {
      let b = map.get(key)
      if (!b) {
        b = { key, label, groupTrainings: 0, farmerVisits: 0 }
        map.set(key, b)
      }
      return b
    }

    for (const t of rows) {
      if (t.status === 'CANCELLED') continue
      const isVisit = (t.type || '').toUpperCase() === 'FARM_VISIT'

      const topicKey = (t.mainTopic || '').toUpperCase()
      const topicLabel = TOPIC_LABELS[topicKey] || 'Unspecified topic'
      const topicBucket = bucketFor(topicRows, topicKey || 'UNSPECIFIED', topicLabel)
      if (isVisit) topicBucket.farmerVisits++
      else topicBucket.groupTrainings++

      const funderKey = (t.funder || '').toUpperCase()
      const funderLabel = FUNDER_LABELS[funderKey] || (funderKey ? titleCaseBuyer(funderKey) : 'Unfunded')
      const funderBucket = bucketFor(funderRows, funderKey || 'UNSPECIFIED', funderLabel)
      if (isVisit) funderBucket.farmerVisits++
      else funderBucket.groupTrainings++
    }

    const topicOrder = new Set([...MAIN_TOPICS.map(String), 'UNSPECIFIED'])
    const funderOrder = new Set([...FUNDERS.map(String), 'UNSPECIFIED'])

    const byTopic = Array.from(topicRows.values()).sort(
      (a, b) =>
        Number(topicOrder.has(a.key)) - Number(topicOrder.has(b.key)) ||
        a.label.localeCompare(b.label),
    )
    const byFunder = Array.from(funderRows.values()).sort(
      (a, b) =>
        Number(funderOrder.has(a.key)) - Number(funderOrder.has(b.key)) ||
        a.label.localeCompare(b.label),
    )

    return {
      totalGroupTrainings: byTopic.reduce((s, r) => s + r.groupTrainings, 0),
      totalFarmerVisits: byTopic.reduce((s, r) => s + r.farmerVisits, 0),
      byTopic,
      byFunder,
    }
  } catch (e) {
    console.error('[insights/trainings]', e)
    return null
  }
}

// ─── Shared transaction-row shape + produce breakdown ─────────────────────

interface TxRow {
  date: Date
  commodity: string
  variety?: string | null
  buyer?: string | null
  farmerId?: string | null
  district?: string | null
  subCounty?: string | null
  village?: string | null
  volume: number
  value: number
}

interface GeoTree {
  district: string
  volume: number
  value: number
  txns: number
  farmers: number
  subCounties: {
    subCounty: string
    volume: number
    value: number
    txns: number
    farmers: number
    villages: { key: string; farmers: number; volume: number; value: number; txns: number }[]
  }[]
}

/** Full per-produce breakdown: time (year/season/month) + geo + buyers. */
function buildProduceBreakdown(rows: TxRow[], includeGeo: boolean, includeBuyers: boolean) {
  const commodities = new Map<string, TxRow[]>()
  for (const r of rows) {
    const c = normalizeCommodity(r.commodity)
    let list = commodities.get(c)
    if (!list) {
      list = []
      commodities.set(c, list)
    }
    list.push(r)
  }

  const out: Record<string, unknown>[] = []
  for (const [commodity, list] of commodities) {
    const byYear = new Map<string, Bucket>()
    const bySeason = new Map<string, Bucket>()
    const byMonth = new Map<string, Bucket>()
    const byForm = new Map<string, Bucket>()
    const byBuyer = new Map<string, Bucket>()

    for (const r of list) {
      addTo(byYear, yearKey(r.date), r.farmerId || undefined, r.volume, r.value)
      addTo(bySeason, seasonKey(r.date), r.farmerId || undefined, r.volume, r.value)
      addTo(byMonth, monthKey(r.date), r.farmerId || undefined, r.volume, r.value)
      if (commodity === 'Coffee') {
        addTo(byForm, coffeeForm(r.commodity, r.variety), r.farmerId || undefined, r.volume, r.value)
      }
      if (includeBuyers) {
        addTo(byBuyer, canonicalBuyer(r.buyer, commodity), r.farmerId || undefined, r.volume, r.value)
      }
    }

    out.push({
      commodity,
      txns: list.length,
      volume: Math.round(list.reduce((s, r) => s + r.volume, 0) * 100) / 100,
      value: Math.round(list.reduce((s, r) => s + r.value, 0) * 100) / 100,
      farmers: new Set(list.map((r) => r.farmerId).filter(Boolean)).size,
      byYear: finalizeBuckets(byYear, 'volume'),
      bySeason: finalizeBuckets(bySeason, 'volume'),
      byMonth: finalizeBuckets(byMonth, 'volume'),
      coffeeForms: commodity === 'Coffee' ? finalizeBuckets(byForm, 'volume') : undefined,
      byBuyer: includeBuyers ? finalizeBuckets(byBuyer, 'volume') : undefined,
      geo: includeGeo ? buildGeoTree(list) : undefined,
    })
  }

  out.sort((a, b) => (b.volume as number) - (a.volume as number))
  return out
}

/** Nested geo tree: district → sub-county → village. */
function buildGeoTree(rows: TxRow[]): GeoTree[] {
  const villagesByDistrict = new Map<string, Map<string, Map<string, Bucket>>>()
  const districtTotals = new Map<string, Bucket>()
  const subCountyTotals = new Map<string, Bucket>()

  for (const r of rows) {
    const dKey = (r.district || '—').trim() || '—'
    const sKey = (r.subCounty || '—').trim() || '—'
    const vKey = (r.village || '—').trim() || '—'

    let sub = villagesByDistrict.get(dKey)
    if (!sub) {
      sub = new Map()
      villagesByDistrict.set(dKey, sub)
    }
    let vill = sub.get(sKey)
    if (!vill) {
      vill = new Map()
      sub.set(sKey, vill)
    }
    addTo(vill, vKey, r.farmerId || undefined, r.volume, r.value)

    addTo(districtTotals, dKey, r.farmerId || undefined, r.volume, r.value)
    addTo(subCountyTotals, `${dKey}||${sKey}`, r.farmerId || undefined, r.volume, r.value)
  }

  const tree: GeoTree[] = []
  for (const [district, subMap] of villagesByDistrict) {
    const dTotal = districtTotals.get(district) || newBucket(district)
    const subCounties = Array.from(subMap.entries())
      .map(([subCounty, villMap]) => {
        const scTotal = subCountyTotals.get(`${district}||${subCounty}`) || newBucket(subCounty)
        return {
          subCounty,
          volume: scTotal.volume,
          value: scTotal.value,
          txns: scTotal.txns,
          farmers: scTotal.farmers.size,
          villages: finalizeBuckets(villMap, 'volume'),
        }
      })
      .sort((a, b) => b.volume - a.volume || a.subCounty.localeCompare(b.subCounty))

    tree.push({
      district,
      volume: dTotal.volume,
      value: dTotal.value,
      txns: dTotal.txns,
      farmers: dTotal.farmers.size,
      subCounties,
    })
  }
  tree.sort((a, b) => b.volume - a.volume || a.district.localeCompare(b.district))
  return tree
}

// ─── 3. Purchases ─────────────────────────────────────────────────────────

async function computePurchases(ctx: { tenantId?: string }, tf: Record<string, unknown>) {
  try {
    const rows = await db.purchase.findMany({
      where: {
        OR: [{ farmer: tf }, { tenantId: ctx.tenantId }],
        approvalStatus: { not: 'REJECTED' },
      },
      select: {
        createdAt: true, commodity: true, variety: true, quantity: true, totalAmount: true,
        farmerId: true,
        farmer: { select: { district: true, commune: true, villageName: true } },
      },
      take: 20000,
      orderBy: { createdAt: 'asc' },
    })

    const txRows: TxRow[] = rows.map((p) => ({
      date: new Date(p.createdAt),
      commodity: p.commodity,
      variety: p.variety,
      farmerId: p.farmerId,
      district: p.farmer?.district,
      subCounty: p.farmer?.commune,
      village: p.farmer?.villageName,
      volume: safeNum(p.quantity),
      value: safeNum(p.totalAmount),
    }))

    return { byCommodity: buildProduceBreakdown(txRows, true, false) }
  } catch (e) {
    console.error('[insights/purchases]', e)
    return null
  }
}

// ─── 4. Sales ─────────────────────────────────────────────────────────────

async function computeSales(ctx: { tenantId?: string }, tf: Record<string, unknown>) {
  try {
    const rows = await db.sale.findMany({
      where: {
        OR: [{ farmer: tf }, { tenantId: ctx.tenantId }],
        category: 'PRODUCE',
        status: { not: 'CANCELLED' },
      },
      select: {
        createdAt: true, product: true, quantity: true, totalAmount: true, customerName: true,
        farmerId: true,
        farmer: { select: { district: true, commune: true, villageName: true } },
      },
      take: 20000,
      orderBy: { createdAt: 'asc' },
    })

    const txRows: TxRow[] = rows.map((s) => ({
      date: new Date(s.createdAt),
      commodity: s.product,
      buyer: s.customerName,
      farmerId: s.farmerId,
      district: s.farmer?.district,
      subCounty: s.farmer?.commune,
      village: s.farmer?.villageName,
      volume: safeNum(s.quantity),
      value: safeNum(s.totalAmount),
    }))

    return { byCommodity: buildProduceBreakdown(txRows, true, true) }
  } catch (e) {
    console.error('[insights/sales]', e)
    return null
  }
}

// ─── 5. Revenue ───────────────────────────────────────────────────────────

async function computeRevenue(ctx: { tenantId?: string }, tf: Record<string, unknown>) {
  try {
    const rows = await db.sale.findMany({
      where: {
        OR: [{ farmer: tf }, { tenantId: ctx.tenantId }],
        category: 'PRODUCE',
        status: { not: 'CANCELLED' },
      },
      select: {
        createdAt: true, product: true, quantity: true, totalAmount: true,
        charges: true, taxAmount: true, netAmount: true, farmerId: true,
      },
      take: 20000,
      orderBy: { createdAt: 'asc' },
    })

    // Revenue = netAmount when present, else totalAmount − charges − tax
    const txRows: TxRow[] = rows.map((s) => {
      let value = safeNum(s.totalAmount)
      if (s.netAmount != null) value = safeNum(s.netAmount)
      else value = value - safeNum(s.charges) - safeNum(s.taxAmount)
      return {
        date: new Date(s.createdAt),
        commodity: s.product,
        farmerId: s.farmerId,
        volume: safeNum(s.quantity),
        value,
      }
    })

    return {
      total: Math.round(txRows.reduce((s, r) => s + r.value, 0) * 100) / 100,
      byCommodity: buildProduceBreakdown(txRows, false, false),
    }
  } catch (e) {
    console.error('[insights/revenue]', e)
    return null
  }
}

// ─── 6. Loans ─────────────────────────────────────────────────────────────

async function computeLoans(tf: Record<string, unknown>) {
  try {
    const rows = await db.vslaLoan.findMany({
      where: {
        ...tf,
        OR: [{ status: { in: ['DISBURSED', 'REPAID', 'OVERDUE'] } }, { disbursedAt: { not: null } }],
      },
      select: {
        farmerId: true, loanDate: true, disbursedAt: true, amount: true,
        farmer: { select: { gender: true, dateOfBirth: true, district: true, commune: true } },
      },
      take: 20000,
    })

    const byYear = new Map<string, Bucket>()
    const bySeason = new Map<string, Bucket>()
    const byDistrict = new Map<string, Bucket>()
    const bySubCounty = new Map<string, Bucket>()
    const byGender = new Map<string, Bucket>()
    const byAge = new Map<string, Bucket>()

    for (const l of rows) {
      const when = l.disbursedAt || l.loanDate
      const amount = safeNum(l.amount)
      const g = normalizeGender(l.farmer?.gender)
      const a = ageCategory(l.farmer?.dateOfBirth)

      addTo(byYear, yearKey(when), l.farmerId, 0, amount)
      addTo(bySeason, seasonKey(when), l.farmerId, 0, amount)
      addTo(byDistrict, (l.farmer?.district || '—').trim() || '—', l.farmerId, 0, amount)
      addTo(bySubCounty, (l.farmer?.commune || '—').trim() || '—', l.farmerId, 0, amount)
      addTo(byGender, g, l.farmerId, 0, amount)
      addTo(byAge, a, l.farmerId, 0, amount)
    }

    return {
      farmersWithLoans: new Set(rows.map((r) => r.farmerId)).size,
      totalLoans: rows.length,
      totalAmount: Math.round(rows.reduce((s, r) => s + safeNum(r.amount), 0) * 100) / 100,
      byYear: finalizeBuckets(byYear, 'farmers'),
      bySeason: finalizeBuckets(bySeason, 'farmers'),
      byDistrict: finalizeBuckets(byDistrict, 'farmers'),
      bySubCounty: finalizeBuckets(bySubCounty, 'farmers'),
      byGender: finalizeBuckets(byGender, 'farmers'),
      byAge: finalizeBuckets(byAge, 'farmers'),
    }
  } catch (e) {
    console.error('[insights/loans]', e)
    return null
  }
}

// ─── 7. Inputs access ─────────────────────────────────────────────────────

async function computeInputs(tf: Record<string, unknown>) {
  try {
    const rows = await db.inputDistribution.findMany({
      where: { ...tf },
      select: {
        farmerId: true, inputType: true, inputName: true, quantity: true,
        totalCost: true, distributionDate: true,
        farmer: { select: { gender: true, dateOfBirth: true, district: true, commune: true } },
      },
      take: 20000,
    })

    const byYear = new Map<string, Bucket>()
    const bySeason = new Map<string, Bucket>()
    const byDistrict = new Map<string, Bucket>()
    const bySubCounty = new Map<string, Bucket>()
    const byGender = new Map<string, Bucket>()
    const byAge = new Map<string, Bucket>()
    const byType = new Map<string, Bucket>()
    const seedlingByCrop = new Map<string, Bucket>()

    for (const r of rows) {
      const when = r.distributionDate
      const qty = safeNum(r.quantity)
      const cost = safeNum(r.totalCost)
      const g = normalizeGender(r.farmer?.gender)
      const a = ageCategory(r.farmer?.dateOfBirth)

      addTo(byYear, yearKey(when), r.farmerId, qty, cost)
      addTo(bySeason, seasonKey(when), r.farmerId, qty, cost)
      addTo(byDistrict, (r.farmer?.district || '—').trim() || '—', r.farmerId, qty, cost)
      addTo(bySubCounty, (r.farmer?.commune || '—').trim() || '—', r.farmerId, qty, cost)
      addTo(byGender, g, r.farmerId, qty, cost)
      addTo(byAge, a, r.farmerId, qty, cost)

      const typeRaw = `${r.inputType || ''} ${r.inputName || ''}`.toLowerCase()
      let typeKey: string
      if (typeRaw.includes('seedling') || typeRaw.includes('seed')) typeKey = 'SEEDLINGS'
      else if (
        typeRaw.includes('tarpaulin') || typeRaw.includes('taurplin') ||
        typeRaw.includes('tarpulin') || typeRaw.includes('tarp')
      ) typeKey = 'TARPAULINS'
      else if (typeRaw.includes('saw') || typeRaw.includes('pruning')) typeKey = 'PRUNING_SAWS'
      else if (typeRaw.includes('fertil') || typeRaw.includes('manure') || typeRaw.includes('compost')) typeKey = 'FERTILIZERS'
      else typeKey = 'OTHER'
      addTo(byType, typeKey, r.farmerId, qty, cost)

      if (typeKey === 'SEEDLINGS') {
        const cropRaw = `${r.inputName || ''} ${r.inputType || ''}`.toLowerCase()
        let cropKey: string
        if (cropRaw.includes('coffee')) cropKey = 'Coffee seedlings'
        else if (cropRaw.includes('bamboo')) cropKey = 'Bamboo seedlings'
        else if (cropRaw.includes('cocoa') || cropRaw.includes('cacao')) cropKey = 'Cocoa seedlings'
        else if (cropRaw.includes('shade') || cropRaw.includes('tree')) cropKey = 'Shade trees'
        else cropKey = 'Other seedlings'
        addTo(seedlingByCrop, cropKey, r.farmerId, qty, cost)
      }
    }

    const typeLabels: Record<string, string> = {
      SEEDLINGS: 'Seedlings', TARPAULINS: 'Tarpaulins', PRUNING_SAWS: 'Pruning saws',
      FERTILIZERS: 'Fertilizers', OTHER: 'Other',
    }
    const typeOrder = ['SEEDLINGS', 'TARPAULINS', 'PRUNING_SAWS', 'FERTILIZERS', 'OTHER']

    return {
      farmersWithInputs: new Set(rows.map((r) => r.farmerId)).size,
      totalDistributions: rows.length,
      byYear: finalizeBuckets(byYear, 'farmers'),
      bySeason: finalizeBuckets(bySeason, 'farmers'),
      byDistrict: finalizeBuckets(byDistrict, 'farmers'),
      bySubCounty: finalizeBuckets(bySubCounty, 'farmers'),
      byGender: finalizeBuckets(byGender, 'farmers'),
      byAge: finalizeBuckets(byAge, 'farmers'),
      byType: finalizeBuckets(byType, 'farmers')
        .sort((a, b) => typeOrder.indexOf(a.key) - typeOrder.indexOf(b.key))
        .map((b) => ({ ...b, label: typeLabels[b.key] || b.key })),
      seedlingByCrop: finalizeBuckets(seedlingByCrop, 'farmers'),
    }
  } catch (e) {
    console.error('[insights/inputs]', e)
    return null
  }
}

// ─── 8. Loyalty (per year / per season) ───────────────────────────────────

interface LoyaltyPeriod {
  year: string
  season: string
  salesByFarmer: Map<string, number>
  cropsByFarmer: Map<string, Set<string>>
  inputBuyers: Set<string>
  trainingAttendees: Set<string>
  farmVisits: Set<string>
  activeFarmers: Set<string>
}

async function computeLoyalty(ctx: { tenantId?: string }, tf: Record<string, unknown>) {
  try {
    const sales = await db.sale.findMany({
      where: {
        OR: [{ farmer: tf }, { tenantId: ctx.tenantId }],
        category: 'PRODUCE',
        status: { not: 'CANCELLED' },
      },
      select: { farmerId: true, createdAt: true, product: true },
      take: 40000,
    })
    const inputDists = await db.inputDistribution.findMany({
      where: { ...tf },
      select: { farmerId: true, distributionDate: true },
      take: 20000,
    })
    const attendance = await db.trainingAttendance.findMany({
      where: { attended: true, training: { tenantId: ctx.tenantId } },
      select: { farmerId: true, training: { select: { date: true, type: true, status: true } } },
      take: 40000,
    })

    const periods = new Map<string, LoyaltyPeriod>()

    function makePeriod(year: string, season: string): LoyaltyPeriod {
      return {
        year, season,
        salesByFarmer: new Map(), cropsByFarmer: new Map(),
        inputBuyers: new Set(), trainingAttendees: new Set(),
        farmVisits: new Set(), activeFarmers: new Set(),
      }
    }

    /** Ensure BOTH the year and the season bucket exist for a date; return them. */
    function ensurePeriods(d: Date): LoyaltyPeriod[] {
      const yearK = yearKey(d)
      const seasonK = seasonKey(d)
      const result: LoyaltyPeriod[] = []
      for (const k of [yearK, seasonK]) {
        let p = periods.get(k)
        if (!p) {
          p = makePeriod(yearK, seasonK)
          periods.set(k, p)
        }
        result.push(p)
      }
      return result
    }

    for (const s of sales) {
      if (!s.farmerId) continue
      for (const p of ensurePeriods(new Date(s.createdAt))) {
        p.salesByFarmer.set(s.farmerId, (p.salesByFarmer.get(s.farmerId) || 0) + 1)
        let set = p.cropsByFarmer.get(s.farmerId)
        if (!set) {
          set = new Set()
          p.cropsByFarmer.set(s.farmerId, set)
        }
        set.add(normalizeCommodity(s.product))
        p.activeFarmers.add(s.farmerId)
      }
    }

    for (const r of inputDists) {
      if (!r.farmerId) continue
      for (const p of ensurePeriods(new Date(r.distributionDate))) {
        p.inputBuyers.add(r.farmerId)
        p.activeFarmers.add(r.farmerId)
      }
    }

    for (const t of attendance) {
      if (!t.farmerId || !t.training || t.training.status === 'CANCELLED') continue
      for (const p of ensurePeriods(new Date(t.training.date))) {
        p.activeFarmers.add(t.farmerId)
        if ((t.training.type || '').toUpperCase() === 'FARM_VISIT') p.farmVisits.add(t.farmerId)
        else p.trainingAttendees.add(t.farmerId)
      }
    }

    const years: string[] = []
    const seasons: string[] = []
    for (const key of periods.keys()) {
      if (/^\d{4}$/.test(key)) years.push(key)
      else if (/^\d{4}[AB]$/.test(key)) seasons.push(key)
    }
    years.sort()
    seasons.sort()

    function rowsFor(keys: string[]) {
      return keys.map((key) => {
        const p = periods.get(key)!
        let loyal = 0, repeat = 0, multiCrop = 0, totalSales = 0
        const cropSet = new Set<string>()
        for (const [fid, count] of p.salesByFarmer) {
          totalSales += count
          if (count >= 1) loyal++
          if (count >= 2) repeat++
          const crops = p.cropsByFarmer.get(fid)
          if (crops && crops.size >= 2) multiCrop++
          if (crops) for (const c of crops) cropSet.add(c)
        }
        return {
          period: key,
          isSeason: key.endsWith('A') || key.endsWith('B'),
          loyalFarmers: loyal,
          repeatSellers: repeat,
          activeFarmers: p.activeFarmers.size,
          multiCropFarmers: multiCrop,
          cropsSoldCount: cropSet.size,
          totalSalesCount: totalSales,
          inputBuyersCount: p.inputBuyers.size,
          trainingAttendeesCount: p.trainingAttendees.size,
          farmVisitsCount: p.farmVisits.size,
        }
      })
    }

    return { byYear: rowsFor(years), bySeason: rowsFor(seasons) }
  } catch (e) {
    console.error('[insights/loyalty]', e)
    return null
  }
}
