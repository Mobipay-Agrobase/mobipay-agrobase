'use client'

/**
 * EkibboInsightsDashboard — the ONE unified EKiBBO management dashboard.
 *
 * Per EKiBBO dashboard feedback (item NB): Managing Director, Operations
 * Manager and Monitoring & Communications Officer see the SAME dashboard;
 * only the right to approve finances (farmer payments) differs by role —
 * `canApprove` gates the Approvals section.
 *
 * Sections (feedback order):
 *   1. Farmer Profiling — total profiled, categorization (youth / gender /
 *      district), multiple crops. Removed per feedback: purchase summary
 *      table, sales summary table, customer, active loans.
 *   2. Trainings — group trainings + farmer visits by main topic and by
 *      funder. Removed per feedback: crops sold, total sales, active
 *      farmers, input buyers, training attendees, farm visits KPIs.
 *   3. Produce Purchase — weight per produce + maintained summary chart;
 *      View Details drills year → season → month, then district →
 *      sub-county → village.
 *   4. Produce Sales — weight per produce; View Details drills time +
 *      per-company buyers (canonical buyer catalog).
 *   5. Revenue — revenue per produce, per year / season / month.
 *   6. Loans — farmers who accessed loans; per year, season, district,
 *      sub-county; by gender and age category.
 *   7. Inputs Access — farmers accessing inputs; same disaggregation +
 *      by input type (seedlings incl. crop detail, tarpaulins, pruning
 *      saws, fertilizers).
 *   8. Loyalty — per year and per season: loyal farmers + repeat sellers;
 *      full details (multi-crop, crops sold, total sales, input buyers,
 *      active farmers, training attendees, farm visits) live in the
 *      View Details dialog. Removed per feedback: loyalty rate hero.
 *
 * Data source: GET /api/dashboard/ekibbo-insights (single call).
 * All render paths are null-safe — missing sections show empty states.
 */

import React, { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Users, GraduationCap, ShoppingCart, Receipt, DollarSign, CreditCard,
  Package, Heart, Sprout, MapPin, RefreshCw, ClipboardCheck, ChevronRight,
  Shield, BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts'
import { useAppStore, type ModuleKey } from '@/lib/store'
import {
  DashSkeleton, DashError, StatCard, EkbDashboardSection, EkbMiniStat,
  EkbPageHeader, EmptyState, fmtUGX, fmtNum, formatMonth, COLORS,
} from '@/components/dashboard/EkbiboDashboards'

// ─── Types (mirror the API response) ──────────────────────────────────────

interface AggRow {
  key: string
  farmers: number
  volume: number
  value: number
  txns: number
}
interface GeoSub {
  subCounty: string
  volume: number
  value: number
  txns: number
  farmers: number
  villages: AggRow[]
}
interface GeoDistrict {
  district: string
  volume: number
  value: number
  txns: number
  farmers: number
  subCounties: GeoSub[]
}
interface ProduceBreakdown {
  commodity: string
  txns: number
  volume: number
  value: number
  farmers: number
  byYear: AggRow[]
  bySeason: AggRow[]
  byMonth: AggRow[]
  coffeeForms?: AggRow[]
  byBuyer?: AggRow[]
  geo?: GeoDistrict[]
}
interface TrainBucket {
  key: string
  label: string
  groupTrainings: number
  farmerVisits: number
}
interface LoyaltyRow {
  period: string
  isSeason: boolean
  loyalFarmers: number
  repeatSellers: number
  activeFarmers: number
  multiCropFarmers: number
  cropsSoldCount: number
  totalSalesCount: number
  inputBuyersCount: number
  trainingAttendeesCount: number
  farmVisitsCount: number
}
interface Insights {
  generatedAt: string
  farmerProfile: {
    totalFarmers: number
    byGender: { key: string; count: number }[]
    byAge: { key: string; count: number }[]
    byDistrict: {
      district: string; total: number; male: number; female: number;
      youth: number; adult: number; unknownAge: number
    }[]
    cropFarmers: number
    multiCropFarmers: number
  } | null
  trainings: {
    totalGroupTrainings: number
    totalFarmerVisits: number
    byTopic: TrainBucket[]
    byFunder: TrainBucket[]
  } | null
  purchases: { byCommodity: ProduceBreakdown[] } | null
  sales: { byCommodity: ProduceBreakdown[] } | null
  revenue: { total: number; byCommodity: ProduceBreakdown[] } | null
  loans: {
    farmersWithLoans: number
    totalLoans: number
    totalAmount: number
    byYear: AggRow[]; bySeason: AggRow[]; byDistrict: AggRow[]
    bySubCounty: AggRow[]; byGender: AggRow[]; byAge: AggRow[]
  } | null
  inputs: {
    farmersWithInputs: number
    totalDistributions: number
    byYear: AggRow[]; bySeason: AggRow[]; byDistrict: AggRow[]
    bySubCounty: AggRow[]; byGender: AggRow[]; byAge: AggRow[]
    byType: (AggRow & { label: string })[]
    seedlingByCrop: AggRow[]
  } | null
  loyalty: { byYear: LoyaltyRow[]; bySeason: LoyaltyRow[] } | null
}

// ─── Hooks ────────────────────────────────────────────────────────────────

async function fetchJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function useEkibboInsights() {
  const [data, setData] = useState<Insights | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updated, setUpdated] = useState<Date | null>(null)

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (opts?.silent) setRefreshing(true)
    const json = await fetchJson('/api/dashboard/ekibbo-insights')
    setData(json || null)
    setUpdated(new Date())
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, refreshing, updated, refresh: () => load({ silent: true }) }
}

// ─── Small local primitives ───────────────────────────────────────────────

function seasonLabel(key: string): string {
  const m = /^(\d{4})([AB])$/.exec(key)
  if (!m) return key
  return `${m[1]} Season ${m[2]}`
}

function seasonShort(key: string): string {
  const m = /^(\d{4})([AB])$/.exec(key)
  if (!m) return key
  return `${m[1]}${m[2]}`
}

/** Compact table used for year / season / month / gender / age rows. */
function AggTable({
  rows,
  labelKey,
  farmerLabel,
  showValue = true,
}: {
  rows: AggRow[]
  labelKey?: (row: AggRow) => string
  farmerLabel?: string
  showValue?: boolean
}) {
  if (!rows.length) return <EmptyState message="No data yet" />
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Period</TableHead>
          <TableHead className="text-right">Farmers</TableHead>
          {showValue && <TableHead className="text-right">Value (UGX)</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.key}>
            <TableCell className="text-sm font-medium">
              {labelKey ? labelKey(r) : r.key}
            </TableCell>
            <TableCell className="text-right text-sm">{fmtNum(r.farmers)}</TableCell>
            {showValue && (
              <TableCell className="text-right text-sm">{fmtUGX(r.value)}</TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// ─── Drill-down dialog (produce time + geo + buyers) ──────────────────────

type DrillTab = 'time' | 'location'

function ProduceDrillDialog({
  open,
  onClose,
  breakdown,
  titlePrefix,
  includeBuyers,
}: {
  open: boolean
  onClose: () => void
  breakdown: ProduceBreakdown | null
  titlePrefix: string
  includeBuyers: boolean
}) {
  const [tab, setTab] = useState<DrillTab>('time')
  const [level, setLevel] = useState<'year' | 'season' | 'month'>('year')
  const [geoDistrict, setGeoDistrict] = useState<string | null>(null)
  const [geoSub, setGeoSub] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setTab('time')
      setLevel('year')
      setGeoDistrict(null)
      setGeoSub(null)
    }
  }, [open, breakdown])

  if (!breakdown) return null
  const b = breakdown

  const timeRows =
    level === 'year' ? b.byYear : level === 'season' ? b.bySeason : b.byMonth

  const chartData = timeRows.map((r) => ({
    name: level === 'month' ? formatMonth(r.key) : level === 'season' ? seasonShort(r.key) : r.key,
    volume: Math.round(r.volume),
  }))

  const chartConfig: ChartConfig = {
    volume: { label: 'Volume (kg)', color: 'var(--chart-1)' },
  }

  const district = b.geo?.find((d) => d.district === geoDistrict)
  const sub = district?.subCounties.find((s) => s.subCounty === geoSub)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {titlePrefix} — {b.commodity}
          </DialogTitle>
          <DialogDescription>
            {fmtNum(b.txns)} transactions · {fmtNum(b.volume)} kg · {fmtUGX(b.value)} ·{' '}
            {fmtNum(b.farmers)} farmers
            {b.coffeeForms && b.coffeeForms.length > 0 && (
              <> · Forms: {b.coffeeForms.map((f) => `${f.key} ${fmtNum(f.volume)}kg`).join(', ')}</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
            {([['time', 'Per year / season / month'], ['location', 'Per district / sub-county / village']] as const).map(
              ([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key as DrillTab)}
                  className={cn(
                    'px-3 py-1 rounded text-xs font-medium transition-colors',
                    tab === key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {label}
                </button>
              ),
            )}
          </div>
        </div>

        {tab === 'time' && (
          <div className="space-y-4">
            <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5 w-fit">
              {([['year', 'Year'], ['season', 'Season'], ['month', 'Month']] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLevel(key as 'year' | 'season' | 'month')}
                  className={cn(
                    'px-3 py-1 rounded text-xs font-medium transition-colors',
                    level === key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {timeRows.length === 0 ? (
              <EmptyState message="No data recorded" />
            ) : (
              <>
                <ChartContainer config={chartConfig} className="h-[220px] w-full">
                  <BarChart data={chartData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="volume" fill="var(--chart-1)" radius={[6, 6, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{level === 'year' ? 'Year' : level === 'season' ? 'Season' : 'Month'}</TableHead>
                        <TableHead className="text-right">Transactions</TableHead>
                        <TableHead className="text-right">Farmers</TableHead>
                        <TableHead className="text-right">Volume (kg)</TableHead>
                        <TableHead className="text-right">Value (UGX)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timeRows.map((r) => (
                        <TableRow key={r.key}>
                          <TableCell className="text-sm font-medium">
                            {level === 'season' ? seasonLabel(r.key) : level === 'month' ? formatMonth(r.key) : r.key}
                          </TableCell>
                          <TableCell className="text-right text-sm">{fmtNum(r.txns)}</TableCell>
                          <TableCell className="text-right text-sm">{fmtNum(r.farmers)}</TableCell>
                          <TableCell className="text-right text-sm font-medium">{fmtNum(r.volume)}</TableCell>
                          <TableCell className="text-right text-sm">{fmtUGX(r.value)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'location' && (
          <div className="space-y-3">
            {!b.geo || b.geo.length === 0 ? (
              <EmptyState message="No farmer location data linked to these records" />
            ) : !geoDistrict ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>District</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Farmers</TableHead>
                      <TableHead className="text-right">Volume (kg)</TableHead>
                      <TableHead className="text-right">Value (UGX)</TableHead>
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {b.geo.map((d) => (
                      <TableRow key={d.district} className="cursor-pointer" onClick={() => setGeoDistrict(d.district)}>
                        <TableCell className="text-sm font-medium">{d.district}</TableCell>
                        <TableCell className="text-right text-sm">{fmtNum(d.txns)}</TableCell>
                        <TableCell className="text-right text-sm">{fmtNum(d.farmers)}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{fmtNum(d.volume)}</TableCell>
                        <TableCell className="text-right text-sm">{fmtUGX(d.value)}</TableCell>
                        <TableCell><ChevronRight className="w-4 h-4 text-muted-foreground" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : !geoSub ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setGeoDistrict(null)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  ← All districts
                </button>
                <p className="text-sm font-medium">{geoDistrict}</p>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sub-county</TableHead>
                        <TableHead className="text-right">Transactions</TableHead>
                        <TableHead className="text-right">Farmers</TableHead>
                        <TableHead className="text-right">Volume (kg)</TableHead>
                        <TableHead className="text-right">Value (UGX)</TableHead>
                        <TableHead className="w-8" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(district?.subCounties || []).map((s) => (
                        <TableRow key={s.subCounty} className="cursor-pointer" onClick={() => setGeoSub(s.subCounty)}>
                          <TableCell className="text-sm font-medium">{s.subCounty}</TableCell>
                          <TableCell className="text-right text-sm">{fmtNum(s.txns)}</TableCell>
                          <TableCell className="text-right text-sm">{fmtNum(s.farmers)}</TableCell>
                          <TableCell className="text-right text-sm font-medium">{fmtNum(s.volume)}</TableCell>
                          <TableCell className="text-right text-sm">{fmtUGX(s.value)}</TableCell>
                          <TableCell><ChevronRight className="w-4 h-4 text-muted-foreground" /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setGeoSub(null)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  ← {geoDistrict} sub-counties
                </button>
                <p className="text-sm font-medium">{geoDistrict} → {geoSub}</p>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Village</TableHead>
                        <TableHead className="text-right">Transactions</TableHead>
                        <TableHead className="text-right">Farmers</TableHead>
                        <TableHead className="text-right">Volume (kg)</TableHead>
                        <TableHead className="text-right">Value (UGX)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(sub?.villages || []).map((v) => (
                        <TableRow key={v.key}>
                          <TableCell className="text-sm font-medium">{v.key}</TableCell>
                          <TableCell className="text-right text-sm">{fmtNum(v.txns)}</TableCell>
                          <TableCell className="text-right text-sm">{fmtNum(v.farmers)}</TableCell>
                          <TableCell className="text-right text-sm font-medium">{fmtNum(v.volume)}</TableCell>
                          <TableCell className="text-right text-sm">{fmtUGX(v.value)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}

        {includeBuyers && b.byBuyer && b.byBuyer.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-semibold mb-2">Companies sold to</p>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                    <TableHead className="text-right">Volume (kg)</TableHead>
                    <TableHead className="text-right">Value (UGX)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {b.byBuyer.map((r) => (
                    <TableRow key={r.key}>
                      <TableCell className="text-sm font-medium">{r.key}</TableCell>
                      <TableCell className="text-right text-sm">{fmtNum(r.txns)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{fmtNum(r.volume)}</TableCell>
                      <TableCell className="text-right text-sm">{fmtUGX(r.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Loyalty details dialog ───────────────────────────────────────────────

function LoyaltyDetailsDialog({
  open,
  onClose,
  row,
}: {
  open: boolean
  onClose: () => void
  row: LoyaltyRow | null
}) {
  if (!row) return null
  const isSeason = row.isSeason
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Loyalty details — {isSeason ? seasonLabel(row.period) : row.period}</DialogTitle>
          <DialogDescription>
            Loyal farmer = ≥1 produce sale · Repeat seller = ≥2 produce sales
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <EkbMiniStat label="Loyal farmers" value={fmtNum(row.loyalFarmers)} icon={Heart} color="text-rose-600" hint="≥1 sale" />
          <EkbMiniStat label="Repeat sellers" value={fmtNum(row.repeatSellers)} icon={RefreshCw} color="text-amber-600" hint="≥2 sales" />
          <EkbMiniStat label="Multi-crop sellers" value={fmtNum(row.multiCropFarmers)} icon={Sprout} color="text-emerald-600" hint="≥2 crops" />
          <EkbMiniStat label="Crops sold" value={fmtNum(row.cropsSoldCount)} icon={BarChart3} color="text-indigo-600" hint="distinct" />
          <EkbMiniStat label="Total sales" value={fmtNum(row.totalSalesCount)} icon={Receipt} color="text-blue-600" hint="transactions" />
          <EkbMiniStat label="Input buyers" value={fmtNum(row.inputBuyersCount)} icon={Package} color="text-purple-600" hint="took inputs" />
          <EkbMiniStat label="Active farmers" value={fmtNum(row.activeFarmers)} icon={Users} color="text-teal-600" hint="any engagement" />
          <EkbMiniStat label="Training attendees" value={fmtNum(row.trainingAttendeesCount)} icon={GraduationCap} color="text-cyan-600" hint="attended ≥1" />
          <EkbMiniStat label="Farm visits" value={fmtNum(row.farmVisitsCount)} icon={MapPin} color="text-lime-600" hint="≥1 visit" />
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Section: produce (purchases / sales / revenue) ───────────────────────

function ProduceSection({
  icon,
  title,
  description,
  accent,
  breakdowns,
  viewAllModule,
  viewAllLabel,
  badge,
  drillTitlePrefix,
  includeBuyers,
  showValue = true,
}: {
  icon: any
  title: string
  description: string
  accent: string
  breakdowns: ProduceBreakdown[]
  viewAllModule?: ModuleKey
  viewAllLabel?: string
  badge?: React.ReactNode
  drillTitlePrefix: string
  includeBuyers: boolean
  showValue?: boolean
}) {
  const setActiveModule = useAppStore((s) => s.setActiveModule)
  const [drill, setDrill] = useState<ProduceBreakdown | null>(null)

  const chartData = breakdowns.map((b) => ({ name: b.commodity, volume: Math.round(b.volume) }))
  const volumeConfig: ChartConfig = { volume: { label: 'Volume (kg)', color: 'var(--chart-1)' } }

  const totalVolume = breakdowns.reduce((s, b) => s + b.volume, 0)
  const totalValue = breakdowns.reduce((s, b) => s + b.value, 0)

  return (
    <EkbDashboardSection
      icon={icon}
      title={title}
      description={description}
      accent={accent}
      collapsible
      onViewAll={viewAllModule ? () => setActiveModule(viewAllModule) : undefined}
      viewAllLabel={viewAllLabel}
      right={badge}
    >
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">{title} Summary by Produce</CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground/60" />
          </CardHeader>
          <CardContent>
            {breakdowns.length === 0 ? (
              <EmptyState message="No data recorded yet" />
            ) : (
              <>
                <div className="flex gap-4 mb-3 text-sm text-muted-foreground">
                  <span>Total volume: <strong className="text-foreground">{fmtNum(totalVolume)} kg</strong></span>
                  {showValue && (
                    <span>Total value: <strong className="text-foreground">{fmtUGX(totalValue)}</strong></span>
                  )}
                </div>
                <ChartContainer config={volumeConfig} className="h-[240px] w-full">
                  <BarChart data={chartData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="volume" fill="var(--chart-1)" radius={[6, 6, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Weight per Produce — View Details to drill down</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {breakdowns.length === 0 ? (
              <EmptyState message="No data recorded yet" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produce</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                    <TableHead className="text-right">Farmers</TableHead>
                    <TableHead className="text-right">Weight (kg)</TableHead>
                    {showValue && <TableHead className="text-right">Value (UGX)</TableHead>}
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breakdowns.map((b) => (
                    <TableRow key={b.commodity}>
                      <TableCell className="text-sm font-medium">{b.commodity}</TableCell>
                      <TableCell className="text-right text-sm">{fmtNum(b.txns)}</TableCell>
                      <TableCell className="text-right text-sm">{fmtNum(b.farmers)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{fmtNum(b.volume)}</TableCell>
                      {showValue && <TableCell className="text-right text-sm">{fmtUGX(b.value)}</TableCell>}
                      <TableCell className="text-right">
                        <button
                          type="button"
                          onClick={() => setDrill(b)}
                          className="inline-flex items-center gap-0.5 text-[11px] font-medium px-2 py-1 rounded-md border bg-background hover:bg-accent transition-colors"
                        >
                          View details <ChevronRight className="w-3 h-3" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <ProduceDrillDialog
        open={!!drill}
        onClose={() => setDrill(null)}
        breakdown={drill}
        titlePrefix={drillTitlePrefix}
        includeBuyers={includeBuyers}
      />
    </EkbDashboardSection>
  )
}

// ─── Main unified dashboard ───────────────────────────────────────────────

export function EkibboInsightsDashboard({ canApprove }: { canApprove: boolean }) {
  const { data, loading, refreshing, updated, refresh } = useEkibboInsights()
  const [pendingApprovals, setPendingApprovals] = useState(0)
  const [loyaltyRow, setLoyaltyRow] = useState<LoyaltyRow | null>(null)
  const setActiveModule = useAppStore((s) => s.setActiveModule)

  useEffect(() => {
    if (!canApprove) return
    let alive = true
    fetchJson('/api/approvals').then((a) => {
      if (!alive || !a) return
      const list = Array.isArray(a?.data) ? a.data : []
      const pending = list.filter((x: any) => x.status === 'PENDING' || x.status === 'SUBMITTED').length
      setPendingApprovals(pending)
    })
    return () => {
      alive = false
    }
  }, [canApprove])

  if (loading) return <DashSkeleton />
  if (!data) return <DashError />

  const fp = data.farmerProfile
  const femaleCount = fp?.byGender.find((g) => g.key === 'Female')?.count || 0
  const youthCount = fp?.byAge.find((a) => a.key === 'Youth (18–35)')?.count || 0

  const trainings = data.trainings
  const loyalty = data.loyalty

  return (
    <div className="space-y-8">
      <EkbPageHeader
        title="EKiBBO Management Dashboard"
        subtitle={
          canApprove
            ? 'Unified overview for MD, Operations Manager and M&E — you can approve farmer payments'
            : 'Unified overview for MD, Operations Manager and M&E — payment approvals are restricted'
        }
        lastUpdated={updated}
        refreshing={refreshing}
        onRefresh={refresh}
      />

      {/* ─── 0 · Financial approvals (role-gated) ─── */}
      {canApprove && (
        <EkbDashboardSection
          icon={ClipboardCheck}
          title="Financial Approvals"
          description="Farmer payments awaiting approval"
          accent="bg-amber-50 dark:bg-amber-950/40 text-amber-600"
          collapsible
          defaultCollapsed
          onViewAll={() => setActiveModule('approvals')}
          viewAllLabel="Open Approvals"
          right={
            pendingApprovals > 0 ? (
              <Badge variant="outline" className="text-[11px] font-normal text-amber-600 border-amber-300">
                {pendingApprovals} pending
              </Badge>
            ) : undefined
          }
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <EkbMiniStat
              label="Pending Approvals"
              value={pendingApprovals}
              icon={ClipboardCheck}
              color="text-amber-600"
              hint="Farmer payments awaiting your review"
            />
              <EkbMiniStat
              label="Approval Right"
              value="Granted"
              icon={Shield}
              color="text-emerald-600"
              hint="MD & Operations Manager only"
            />
          </div>
        </EkbDashboardSection>
      )}

      {/* ─── 1 · Farmer Profiling ─── */}
      <EkbDashboardSection
        icon={Users}
        title="Farmer Profiling"
        description="Farmers profiled and their categorization (youth, gender, district, multiple crops)"
        accent="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600"
        collapsible
        onViewAll={() => setActiveModule('farmers')}
        viewAllLabel="Open Farmer Profiling"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Farmers Profiled"
              value={fmtNum(fp?.totalFarmers)}
              icon={Users}
              color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600"
            />
            <StatCard
              label="Youth (18–35)"
              value={fmtNum(youthCount)}
              icon={GraduationCap}
              color="bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600"
            />
            <StatCard
              label="Female Farmers"
              value={fmtNum(femaleCount)}
              icon={Users}
              color="bg-rose-50 dark:bg-rose-950/40 text-rose-600"
            />
            <StatCard
              label="Multiple-Crop Farmers"
              value={fmtNum(fp?.multiCropFarmers)}
              icon={Sprout}
              color="bg-amber-50 dark:bg-amber-950/40 text-amber-600"
            />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Farmer Categorization by District</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!fp || fp.byDistrict.length === 0 ? (
                <EmptyState message="No farmer location data yet" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>District</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Male</TableHead>
                      <TableHead className="text-right">Female</TableHead>
                      <TableHead className="text-right">Youth (18–35)</TableHead>
                      <TableHead className="text-right">Adults (36+)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fp.byDistrict.map((d) => (
                      <TableRow key={d.district}>
                        <TableCell className="text-sm font-medium">{d.district}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{fmtNum(d.total)}</TableCell>
                        <TableCell className="text-right text-sm">{fmtNum(d.male)}</TableCell>
                        <TableCell className="text-right text-sm">{fmtNum(d.female)}</TableCell>
                        <TableCell className="text-right text-sm">{fmtNum(d.youth)}</TableCell>
                        <TableCell className="text-right text-sm">{fmtNum(d.adult)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </EkbDashboardSection>

      {/* ─── 2 · Trainings ─── */}
      <EkbDashboardSection
        icon={GraduationCap}
        title="Trainings"
        description="Group trainings and farmer visits by main topic and by funder"
        accent="bg-purple-50 dark:bg-purple-950/40 text-purple-600"
        collapsible
        onViewAll={() => setActiveModule('training')}
        viewAllLabel="Open Trainings"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="Group Trainings"
              value={fmtNum(trainings?.totalGroupTrainings)}
              icon={GraduationCap}
              color="bg-purple-50 dark:bg-purple-950/40 text-purple-600"
            />
            <StatCard
              label="Farmer Visits"
              value={fmtNum(trainings?.totalFarmerVisits)}
              icon={MapPin}
              color="bg-teal-50 dark:bg-teal-950/40 text-teal-600"
            />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Trainings by Main Topic</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!trainings || trainings.byTopic.length === 0 ? (
                <EmptyState message="No trainings recorded yet" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Main Topic</TableHead>
                      <TableHead className="text-right">Group Trainings</TableHead>
                      <TableHead className="text-right">Farmer Visits</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trainings.byTopic.map((t) => (
                      <TableRow key={t.key}>
                        <TableCell className="text-sm font-medium">{t.label}</TableCell>
                        <TableCell className="text-right text-sm">{fmtNum(t.groupTrainings)}</TableCell>
                        <TableCell className="text-right text-sm">{fmtNum(t.farmerVisits)}</TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {fmtNum(t.groupTrainings + t.farmerVisits)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Trainings by Funder</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!trainings || trainings.byFunder.length === 0 ? (
                <EmptyState message="No trainings recorded yet" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funder</TableHead>
                      <TableHead className="text-right">Group Trainings</TableHead>
                      <TableHead className="text-right">Farmer Visits</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trainings.byFunder.map((t) => (
                      <TableRow key={t.key}>
                        <TableCell className="text-sm font-medium">{t.label}</TableCell>
                        <TableCell className="text-right text-sm">{fmtNum(t.groupTrainings)}</TableCell>
                        <TableCell className="text-right text-sm">{fmtNum(t.farmerVisits)}</TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {fmtNum(t.groupTrainings + t.farmerVisits)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </EkbDashboardSection>

      {/* ─── 3 · Produce Purchase ─── */}
      <ProduceSection
        icon={ShoppingCart}
        title="Produce Purchase"
        description="Weight of produce purchased — drill down per year, season, month, then district, sub-county and village"
        accent="bg-blue-50 dark:bg-blue-950/40 text-blue-600"
        breakdowns={data.purchases?.byCommodity || []}
        viewAllModule="purchases"
        viewAllLabel="Open Purchases"
        badge={
          <Badge variant="outline" className="text-[11px] font-normal">
            <ShoppingCart className="w-3 h-3 mr-1" />
            {(data.purchases?.byCommodity || []).reduce((s, b) => s + b.txns, 0)} transactions
          </Badge>
        }
        drillTitlePrefix="Purchases"
        includeBuyers={false}
      />

      {/* ─── 4 · Produce Sales ─── */}
      <ProduceSection
        icon={Receipt}
        title="Produce Sales"
        description="Weight of produce sold — drill down per year, season, month and by company sold to"
        accent="bg-purple-50 dark:bg-purple-950/40 text-purple-600"
        breakdowns={data.sales?.byCommodity || []}
        viewAllModule="sales"
        viewAllLabel="Open Sales"
        badge={
          <Badge variant="outline" className="text-[11px] font-normal">
            <Receipt className="w-3 h-3 mr-1" />
            {(data.sales?.byCommodity || []).reduce((s, b) => s + b.txns, 0)} transactions
          </Badge>
        }
        drillTitlePrefix="Sales"
        includeBuyers
      />

      {/* ─── 5 · Revenue ─── */}
      <EkbDashboardSection
        icon={DollarSign}
        title="Revenue"
        description="Revenue earned per produce sold — per year, season and month"
        accent="bg-amber-50 dark:bg-amber-950/40 text-amber-600"
        collapsible
      >
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Revenue (net of charges &amp; tax)</p>
                  <p className="text-3xl font-bold mt-1">{fmtUGX(data.revenue?.total)}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <RevenueByProduce byCommodity={data.revenue?.byCommodity || []} />
        </div>
      </EkbDashboardSection>

      {/* ─── 6 · Loans ─── */}
      <EkbDashboardSection
        icon={CreditCard}
        title="Loans"
        description="Farmers who have accessed loans — by year, season, district, sub-county, gender and age"
        accent="bg-teal-50 dark:bg-teal-950/40 text-teal-600"
        collapsible
        onViewAll={() => setActiveModule('vsla')}
        viewAllLabel="Open VSLA Loans"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Farmers Accessed Loans"
              value={fmtNum(data.loans?.farmersWithLoans)}
              icon={Users}
              color="bg-teal-50 dark:bg-teal-950/40 text-teal-600"
            />
            <StatCard
              label="Total Loans"
              value={fmtNum(data.loans?.totalLoans)}
              icon={CreditCard}
              color="bg-blue-50 dark:bg-blue-950/40 text-blue-600"
            />
            <StatCard
              label="Total Loan Value"
              value={fmtUGX(data.loans?.totalAmount)}
              icon={DollarSign}
              color="bg-amber-50 dark:bg-amber-950/40 text-amber-600"
            />
            <StatCard
              label="Female Borrowers"
              value={fmtNum(data.loans?.byGender.find((g) => g.key === 'Female')?.farmers)}
              icon={Users}
              color="bg-rose-50 dark:bg-rose-950/40 text-rose-600"
            />
          </div>

          {data.loans && (
            <DisaggTable
              title="Loan Access Disaggregation"
              rows={{
                'Per year': data.loans.byYear,
                'Per season': data.loans.bySeason,
                'Per district': data.loans.byDistrict,
                'Per sub-county': data.loans.bySubCounty,
                'By gender': data.loans.byGender,
                'By age': data.loans.byAge,
              }}
            />
          )}
        </div>
      </EkbDashboardSection>

      {/* ─── 7 · Inputs Access ─── */}
      <EkbDashboardSection
        icon={Package}
        title="Inputs Access"
        description="Farmers accessing inputs — by year, season, district, sub-county, gender, age and input type"
        accent="bg-amber-50 dark:bg-amber-950/40 text-amber-600"
        collapsible
        onViewAll={() => setActiveModule('input-distribution')}
        viewAllLabel="Open Input Distribution"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Farmers Accessing Inputs"
              value={fmtNum(data.inputs?.farmersWithInputs)}
              icon={Users}
              color="bg-amber-50 dark:bg-amber-950/40 text-amber-600"
            />
            <StatCard
              label="Distributions"
              value={fmtNum(data.inputs?.totalDistributions)}
              icon={Package}
              color="bg-blue-50 dark:bg-blue-950/40 text-blue-600"
            />
            <StatCard
              label="Female Recipients"
              value={fmtNum(data.inputs?.byGender.find((g) => g.key === 'Female')?.farmers)}
              icon={Users}
              color="bg-rose-50 dark:bg-rose-950/40 text-rose-600"
            />
            <StatCard
              label="Youth Recipients (18–35)"
              value={fmtNum(data.inputs?.byAge.find((a) => a.key === 'Youth (18–35)')?.farmers)}
              icon={GraduationCap}
              color="bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600"
            />
          </div>

          {data.inputs && data.inputs.byType.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Farmers by Input Type</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Input Type</TableHead>
                      <TableHead className="text-right">Farmers</TableHead>
                      <TableHead className="text-right">Distributions</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.inputs.byType.map((t) => (
                      <TableRow key={t.key}>
                        <TableCell className="text-sm font-medium">{t.label}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{fmtNum(t.farmers)}</TableCell>
                        <TableCell className="text-right text-sm">{fmtNum(t.txns)}</TableCell>
                        <TableCell className="text-right text-sm">{fmtNum(t.volume)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {data.inputs && data.inputs.seedlingByCrop.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Seedlings by Crop</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seedling</TableHead>
                      <TableHead className="text-right">Farmers</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.inputs.seedlingByCrop.map((t) => (
                      <TableRow key={t.key}>
                        <TableCell className="text-sm font-medium">{t.key}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{fmtNum(t.farmers)}</TableCell>
                        <TableCell className="text-right text-sm">{fmtNum(t.volume)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {data.inputs && (
            <DisaggTable
              title="Input Access Disaggregation"
              rows={{
                'Per year': data.inputs.byYear,
                'Per season': data.inputs.bySeason,
                'Per district': data.inputs.byDistrict,
                'Per sub-county': data.inputs.bySubCounty,
                'By gender': data.inputs.byGender,
                'By age': data.inputs.byAge,
              }}
            />
          )}
        </div>
      </EkbDashboardSection>

      {/* ─── 8 · Loyalty ─── */}
      <EkbDashboardSection
        icon={Heart}
        title="Loyalty"
        description="Loyal farmers (≥1 sale) and repeat sellers (≥2 sales) per year and per season — details on demand"
        accent="bg-rose-50 dark:bg-rose-950/40 text-rose-600"
        collapsible
      >
        <div className="space-y-4">
          {!loyalty ||
          (loyalty.byYear.length === 0 && loyalty.bySeason.length === 0) ? (
            <EmptyState message="No sales recorded yet" />
          ) : (
            <>
              {loyalty.byYear.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Loyalty per Year</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Year</TableHead>
                          <TableHead className="text-right">Loyal Farmers</TableHead>
                          <TableHead className="text-right">Repeat Sellers</TableHead>
                          <TableHead className="text-right">Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loyalty.byYear.map((r) => (
                          <TableRow key={r.period}>
                            <TableCell className="text-sm font-medium">{r.period}</TableCell>
                            <TableCell className="text-right text-sm font-medium">{fmtNum(r.loyalFarmers)}</TableCell>
                            <TableCell className="text-right text-sm">{fmtNum(r.repeatSellers)}</TableCell>
                            <TableCell className="text-right">
                              <button
                                type="button"
                                onClick={() => setLoyaltyRow(r)}
                                className="inline-flex items-center gap-0.5 text-[11px] font-medium px-2 py-1 rounded-md border bg-background hover:bg-accent transition-colors"
                              >
                                View details <ChevronRight className="w-3 h-3" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {loyalty.bySeason.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Loyalty per Season</CardTitle>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Season A = Mar–Aug · Season B = Sep–Feb
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Season</TableHead>
                          <TableHead className="text-right">Loyal Farmers</TableHead>
                          <TableHead className="text-right">Repeat Sellers</TableHead>
                          <TableHead className="text-right">Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loyalty.bySeason.map((r) => (
                          <TableRow key={r.period}>
                            <TableCell className="text-sm font-medium">{seasonLabel(r.period)}</TableCell>
                            <TableCell className="text-right text-sm font-medium">{fmtNum(r.loyalFarmers)}</TableCell>
                            <TableCell className="text-right text-sm">{fmtNum(r.repeatSellers)}</TableCell>
                            <TableCell className="text-right">
                              <button
                                type="button"
                                onClick={() => setLoyaltyRow(r)}
                                className="inline-flex items-center gap-0.5 text-[11px] font-medium px-2 py-1 rounded-md border bg-background hover:bg-accent transition-colors"
                              >
                                View details <ChevronRight className="w-3 h-3" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </EkbDashboardSection>

      <LoyaltyDetailsDialog open={!!loyaltyRow} onClose={() => setLoyaltyRow(null)} row={loyaltyRow} />
    </div>
  )
}

// ─── Revenue by produce (time drill inline) ───────────────────────────────

function RevenueByProduce({ byCommodity }: { byCommodity: ProduceBreakdown[] }) {
  const [drill, setDrill] = useState<ProduceBreakdown | null>(null)
  if (byCommodity.length === 0) return <EmptyState message="No sales recorded yet" />
  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Revenue per Produce</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produce</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Volume (kg)</TableHead>
                <TableHead className="text-right">Revenue (UGX)</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byCommodity.map((b) => (
                <TableRow key={b.commodity}>
                  <TableCell className="text-sm font-medium">{b.commodity}</TableCell>
                  <TableCell className="text-right text-sm">{fmtNum(b.txns)}</TableCell>
                  <TableCell className="text-right text-sm">{fmtNum(b.volume)}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{fmtUGX(b.value)}</TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      onClick={() => setDrill(b)}
                      className="inline-flex items-center gap-0.5 text-[11px] font-medium px-2 py-1 rounded-md border bg-background hover:bg-accent transition-colors"
                    >
                      View details <ChevronRight className="w-3 h-3" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ProduceDrillDialog
        open={!!drill}
        onClose={() => setDrill(null)}
        breakdown={drill}
        titlePrefix="Revenue"
        includeBuyers={false}
      />
    </>
  )
}

// ─── Disaggregation table (loans / inputs) ────────────────────────────────

function DisaggTable({ title, rows }: { title: string; rows: Record<string, AggRow[]> }) {
  const [view, setView] = useState<string>(Object.keys(rows)[0])
  const current = rows[view] || []
  const isGenderOrAge = view === 'By gender' || view === 'By age'
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">{title}</CardTitle>
        <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5 flex-wrap">
          {Object.keys(rows).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setView(k)}
              className={cn(
                'px-2 py-0.5 rounded text-[10px] font-medium transition-colors',
                view === k ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {k}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isGenderOrAge ? view.replace('By ', '') : view.replace('Per ', '')}</TableHead>
              <TableHead className="text-right">Farmers</TableHead>
              <TableHead className="text-right">Amount (UGX)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {current.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-6">
                  No data yet
                </TableCell>
              </TableRow>
            ) : (
              current.map((r) => (
                <TableRow key={r.key}>
                  <TableCell className="text-sm font-medium">
                    {view === 'Per season' ? seasonLabel(r.key) : r.key}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">{fmtNum(r.farmers)}</TableCell>
                  <TableCell className="text-right text-sm">{fmtUGX(r.value)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
