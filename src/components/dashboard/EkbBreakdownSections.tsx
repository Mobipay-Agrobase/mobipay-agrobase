'use client'

/**
 * EkbBreakdownSections — Phase B dashboard sections that disaggregate data
 * across farmer demographics, training funders, purchase/sales time/geo
 * dimensions, sales-by-buyer, revenue-per-produce, loans/inputs disaggregation,
 * farm land KPIs, and input distribution categorization (Tools/Fertilizers/Seedlings).
 *
 * All data is fetched from /api/dashboard/ekibbo-breakdowns — one endpoint
 * that returns everything in parallel. Each section has its own empty state
 * and rendering, so a missing field in the response doesn't break the others.
 */

import { useEffect, useState, useCallback } from 'react'
import {
  Users, GraduationCap, ShoppingCart, Receipt, Building2, Sprout,
  LandPlot, Leaf, Banknote, Wrench, TestTube, Trees, Package,
  RefreshCw, AlertCircle, MapPin, Calendar, TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip, Cell, PieChart, Pie,
} from 'recharts'
import { cn } from '@/lib/utils'

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#06b6d4', '#0ea5e9', '#3b82f6', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e']
const fmtUGX = (n: number | null | undefined) => 'UGX ' + (Number(n) || 0).toLocaleString()
const fmtNum = (n: number | null | undefined) => (Number(n) || 0).toLocaleString()
const fmtK = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(Math.round(n))
}

async function fetchJson(url: string) {
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    return await r.json()
  } catch {
    return null
  }
}

interface BreakdownData {
  farmerCategorization: any
  trainingsByFunder: any[]
  purchaseBreakdown: any
  salesBreakdown: any
  salesByBuyer: any[]
  revenueByProduce: any[]
  loansDisaggregation: any
  inputsDisaggregation: any
  farmLandKpis: any
  inputDistributionByCategory: any
}

export function EkbBreakdownSections() {
  const [data, setData] = useState<BreakdownData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetch_ = useCallback(async (opts?: { silent?: boolean }) => {
    if (opts?.silent) setRefreshing(true); else setLoading(true)
    setError(null)
    const d = await fetchJson('/api/dashboard/ekibbo-breakdowns')
    if (d) {
      setData(d)
      setLastUpdated(new Date())
    } else {
      setError('Failed to load breakdowns')
    }
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-[180px] w-full rounded" /></CardContent></Card>
        ))}
      </div>
    )
  }

  if (error && !data) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{error}</p>
          <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => fetch_()}>
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const refreshBtn = (
    <Button variant="ghost" size="sm" onClick={() => fetch_({ silent: true })} disabled={refreshing} className="gap-1.5 h-7 text-xs">
      <RefreshCw className={cn('w-3 h-3', refreshing && 'animate-spin')} />
      {refreshing ? 'Refreshing...' : lastUpdated ? `Updated ${formatAgo(lastUpdated)}` : 'Refresh'}
    </Button>
  )

  return (
    <div className="space-y-6">
      {/* Section 1: Farmer Categorization */}
      <FarmerCategorizationSection data={data.farmerCategorization} right={refreshBtn} />

      {/* Section 2: Training Dashboard by Funder */}
      <TrainingsByFunderSection data={data.trainingsByFunder} />

      {/* Section 3: Purchase Breakdowns */}
      <PurchaseBreakdownSection data={data.purchaseBreakdown} />

      {/* Section 4: Sales Breakdowns */}
      <SalesBreakdownSection data={data.salesBreakdown} />

      {/* Section 5: Sales by Buyer Company */}
      <SalesByBuyerSection data={data.salesByBuyer} />

      {/* Section 6: Revenue per Produce */}
      <RevenueByProduceSection data={data.revenueByProduce} />

      {/* Section 7: Loans Disaggregation */}
      <LoansDisaggregationSection data={data.loansDisaggregation} />

      {/* Section 8: Inputs Disaggregation */}
      <InputsDisaggregationSection data={data.inputsDisaggregation} />

      {/* Section 9: Farm Land KPIs + Plant Breakdown */}
      <FarmLandKpisSection data={data.farmLandKpis} />

      {/* Section 10: Input Distribution by Category */}
      <InputDistributionCategorySection data={data.inputDistributionByCategory} />
    </div>
  )
}

function formatAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function SectionHeader({ icon: Icon, title, description, accent, right }: {
  icon: any; title: string; description: string; accent: string; right?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', accent)}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight truncate">{title}</h3>
          <p className="text-xs text-muted-foreground leading-tight mt-0.5 hidden sm:block">{description}</p>
        </div>
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  )
}

function EmptyHint({ message }: { message: string }) {
  return <p className="text-xs text-muted-foreground italic py-2">{message}</p>
}

function DataTable({ rows, columns }: { rows: any[]; columns: { key: string; label: string; align?: 'left' | 'right' }[] }) {
  if (!rows || rows.length === 0) return <EmptyHint message="No data available" />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {columns.map(c => (
              <th key={c.key} className={cn('py-2 px-2 text-xs font-medium text-muted-foreground whitespace-nowrap', c.align === 'right' ? 'text-right' : 'text-left')}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/30 hover:bg-muted/30">
              {columns.map(c => (
                <td key={c.key} className={cn('py-1.5 px-2 whitespace-nowrap', c.align === 'right' ? 'text-right tabular-nums' : 'text-left')}>
                  {r[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── 1. Farmer Categorization ─────────────────────────────────────────────
function FarmerCategorizationSection({ data, right }: { data: any; right?: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <SectionHeader
          icon={Users}
          title="Farmer Categorization"
          description="Demographic breakdown — youth, gender, district, age band"
          accent="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600"
          right={right}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {!data ? <EmptyHint message="No farmer data available" /> : (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiTile label="Total Farmers" value={fmtNum(data.totalFarmers)} icon={Users} accent="text-emerald-600" />
              <KpiTile label={`Youth (${data.byYouth.ageRange})`} value={fmtNum(data.byYouth.youth)} sub={`${data.byYouth.youthRate}% of total`} icon={Users} accent="text-amber-600" />
              <KpiTile label="Male" value={fmtNum(data.byGender.find((g: any) => g.label === 'Male')?.count || 0)} icon={Users} accent="text-blue-600" />
              <KpiTile label="Female" value={fmtNum(data.byGender.find((g: any) => g.label === 'Female')?.count || 0)} icon={Users} accent="text-rose-600" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gender pie */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">By Gender</h4>
                {data.byGender.every((g: any) => g.count === 0) ? <EmptyHint message="No gender data" /> : (
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.byGender} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={70} label={(e: any) => `${e.label}: ${e.count}`}>
                          {data.byGender.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              {/* Age band bar */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">By Age Band</h4>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.byAgeBand} layout="vertical" margin={{ left: 20, right: 10 }}>
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.3} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={50} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            {/* By District table */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Top Districts</h4>
              <DataTable
                rows={data.byDistrict}
                columns={[{ key: 'label', label: 'District' }, { key: 'count', label: 'Farmers', align: 'right' }]}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ─── 2. Trainings by Funder ───────────────────────────────────────────────
function TrainingsByFunderSection({ data }: { data: any[] }) {
  const total = (data || []).reduce((s, f) => s + f.count, 0)
  const totalAttendees = (data || []).reduce((s, f) => s + f.attendees, 0)
  return (
    <Card>
      <CardHeader className="pb-2">
        <SectionHeader
          icon={GraduationCap}
          title="Trainings by Funder"
          description="Training count + attendee reach grouped by funding partner"
          accent="bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <KpiTile label="Total Trainings" value={fmtNum(total)} icon={GraduationCap} accent="text-cyan-600" />
          <KpiTile label="Total Attendees" value={fmtNum(totalAttendees)} icon={Users} accent="text-emerald-600" />
          <KpiTile label="Funders" value={fmtNum((data || []).length)} icon={Building2} accent="text-purple-600" />
        </div>
        {(!data || data.length === 0) ? <EmptyHint message="No trainings recorded" /> : (
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ left: 0, right: 10, top: 10 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="funder" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                  formatter={(v: any, name: any) => name === 'count' ? [v, 'Trainings'] : [v, 'Attendees']}
                />
                <Bar dataKey="count" name="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="attendees" name="attendees" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <DataTable
          rows={(data || []).map((f: any) => ({
            funder: f.funder,
            count: f.count,
            attendees: f.attendees,
            avg: f.avgAttendeesPerTraining,
            topics: (f.topics || []).join(', '),
          }))}
          columns={[
            { key: 'funder', label: 'Funder' },
            { key: 'count', label: 'Trainings', align: 'right' },
            { key: 'attendees', label: 'Attendees', align: 'right' },
            { key: 'avg', label: 'Avg/Training', align: 'right' },
            { key: 'topics', label: 'Topics' },
          ]}
        />
      </CardContent>
    </Card>
  )
}

// ─── 3. Purchase Breakdowns ───────────────────────────────────────────────
function PurchaseBreakdownSection({ data }: { data: any }) {
  if (!data) return <Card><CardContent className="py-6"><EmptyHint message="Purchase breakdown unavailable" /></CardContent></Card>
  return (
    <Card>
      <CardHeader className="pb-2">
        <SectionHeader
          icon={ShoppingCart}
          title="Purchase Breakdowns"
          description="Volume, value, count by year / season / district / commodity"
          accent="bg-amber-50 dark:bg-amber-950/40 text-amber-600"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile label="Total Purchases" value={fmtNum(data.totalPurchases)} icon={ShoppingCart} accent="text-amber-600" />
          <KpiTile label="Years Active" value={fmtNum((data.byYear || []).length)} icon={Calendar} accent="text-cyan-600" />
          <KpiTile label="Districts" value={fmtNum((data.byDistrict || []).length)} icon={MapPin} accent="text-emerald-600" />
          <KpiTile label="Commodities" value={fmtNum((data.byCommodity || []).length)} icon={Leaf} accent="text-rose-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BreakdownBlock title="By Year" data={data.byYear} valueLabel="Value (UGX '000)" valueFormatter={(v: number) => fmtK(v)} />
          <BreakdownBlock title="By Season" data={data.bySeason} valueLabel="Value (UGX '000)" valueFormatter={(v: number) => fmtK(v)} />
          <BreakdownBlock title="By Commodity (Top 10)" data={(data.byCommodity || []).slice(0, 10)} valueLabel="Value (UGX '000)" valueFormatter={(v: number) => fmtK(v)} />
          <BreakdownBlock title="By District (Top 10)" data={(data.byDistrict || []).slice(0, 10)} valueLabel="Value (UGX '000)" valueFormatter={(v: number) => fmtK(v)} />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── 4. Sales Breakdowns ─────────────────────────────────────────────────
function SalesBreakdownSection({ data }: { data: any }) {
  if (!data) return <Card><CardContent className="py-6"><EmptyHint message="Sales breakdown unavailable" /></CardContent></Card>
  return (
    <Card>
      <CardHeader className="pb-2">
        <SectionHeader
          icon={Receipt}
          title="Sales Breakdowns"
          description="Volume, value, count by year / season / district / commodity"
          accent="bg-purple-50 dark:bg-purple-950/40 text-purple-600"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile label="Total Sales" value={fmtNum(data.totalSales)} icon={Receipt} accent="text-purple-600" />
          <KpiTile label="Years Active" value={fmtNum((data.byYear || []).length)} icon={Calendar} accent="text-cyan-600" />
          <KpiTile label="Districts" value={fmtNum((data.byDistrict || []).length)} icon={MapPin} accent="text-emerald-600" />
          <KpiTile label="Commodities" value={fmtNum((data.byCommodity || []).length)} icon={Leaf} accent="text-rose-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BreakdownBlock title="By Year" data={data.byYear} valueLabel="Value (UGX '000)" valueFormatter={(v: number) => fmtK(v)} />
          <BreakdownBlock title="By Season" data={data.bySeason} valueLabel="Value (UGX '000)" valueFormatter={(v: number) => fmtK(v)} />
          <BreakdownBlock title="By Commodity (Top 10)" data={(data.byCommodity || []).slice(0, 10)} valueLabel="Value (UGX '000)" valueFormatter={(v: number) => fmtK(v)} />
          <BreakdownBlock title="By District (Top 10)" data={(data.byDistrict || []).slice(0, 10)} valueLabel="Value (UGX '000)" valueFormatter={(v: number) => fmtK(v)} />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── 5. Sales by Buyer Company ───────────────────────────────────────────
function SalesByBuyerSection({ data }: { data: any[] }) {
  const totalValue = (data || []).reduce((s, b) => s + (b.value || 0), 0)
  return (
    <Card>
      <CardHeader className="pb-2">
        <SectionHeader
          icon={Building2}
          title="Sales by Buyer Company"
          description="Which buyers purchase from your farmers, and for how much"
          accent="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <KpiTile label="Buyer Companies" value={fmtNum((data || []).length)} icon={Building2} accent="text-indigo-600" />
          <KpiTile label="Total Sales Value" value={fmtUGX(totalValue)} icon={Receipt} accent="text-purple-600" />
          <KpiTile label="Avg per Buyer" value={fmtUGX((data || []).length > 0 ? Math.round(totalValue / data.length) : 0)} icon={TrendingUp} accent="text-emerald-600" />
        </div>
        <DataTable
          rows={(data || []).map((b: any) => ({
            buyerName: b.buyerName,
            count: b.count,
            volume: fmtNum(b.volume),
            value: fmtUGX(b.value),
            lastSale: b.lastSale,
          }))}
          columns={[
            { key: 'buyerName', label: 'Buyer' },
            { key: 'count', label: 'Sales', align: 'right' },
            { key: 'volume', label: 'Volume (kg)', align: 'right' },
            { key: 'value', label: 'Total Value', align: 'right' },
            { key: 'lastSale', label: 'Last Sale', align: 'right' },
          ]}
        />
      </CardContent>
    </Card>
  )
}

// ─── 6. Revenue per Produce ──────────────────────────────────────────────
function RevenueByProduceSection({ data }: { data: any[] }) {
  const totalRevenue = (data || []).reduce((s, p) => s + (p.value || 0), 0)
  return (
    <Card>
      <CardHeader className="pb-2">
        <SectionHeader
          icon={Leaf}
          title="Revenue per Produce"
          description="Top crops by revenue generated — drives prioritization decisions"
          accent="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <KpiTile label="Total Revenue" value={fmtUGX(totalRevenue)} icon={Receipt} accent="text-emerald-600" />
          <KpiTile label="Total Produces" value={fmtNum((data || []).length)} icon={Leaf} accent="text-rose-600" />
          <KpiTile label="Top Produce" value={(data && data[0]?.produce) || '—'} sub={(data && data[0]) ? fmtUGX(data[0].value) : ''} icon={TrendingUp} accent="text-amber-600" />
        </div>
        {(!data || data.length === 0) ? <EmptyHint message="No sales recorded yet" /> : (
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(data || []).slice(0, 10)} margin={{ left: 0, right: 10, top: 10 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="produce" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmtK(v)} />
                <Tooltip formatter={(v: number) => fmtUGX(v)} />
                <Bar dataKey="value" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {(data || []).slice(0, 10).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <DataTable
          rows={(data || []).map((p: any) => ({
            produce: p.produce,
            volume: fmtNum(p.volume),
            value: fmtUGX(p.value),
            avgPrice: p.avgPricePerUnit ? fmtUGX(p.avgPricePerUnit) : '—',
            count: p.count,
          }))}
          columns={[
            { key: 'produce', label: 'Produce' },
            { key: 'volume', label: 'Volume (kg)', align: 'right' },
            { key: 'value', label: 'Revenue', align: 'right' },
            { key: 'avgPrice', label: 'Avg Price/kg', align: 'right' },
            { key: 'count', label: 'Sales', align: 'right' },
          ]}
        />
      </CardContent>
    </Card>
  )
}

// ─── 7. Loans Disaggregation ─────────────────────────────────────────────
function LoansDisaggregationSection({ data }: { data: any }) {
  if (!data) return <Card><CardContent className="py-6"><EmptyHint message="Loans disaggregation unavailable" /></CardContent></Card>
  return (
    <Card>
      <CardHeader className="pb-2">
        <SectionHeader
          icon={Banknote}
          title="Loans Disaggregation"
          description="Loan distribution by gender, age, district, type"
          accent="bg-rose-50 dark:bg-rose-950/40 text-rose-600"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <KpiTile label="Total Loans" value={fmtNum(data.totalLoans)} icon={Banknote} accent="text-rose-600" />
          <KpiTile label="Total Amount" value={fmtUGX(data.totalAmount)} icon={Receipt} accent="text-purple-600" />
          <KpiTile label="Avg Loan Size" value={fmtUGX(data.totalLoans > 0 ? Math.round(data.totalAmount / data.totalLoans) : 0)} icon={TrendingUp} accent="text-emerald-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BreakdownBlock title="By Gender" data={(data.byGender || []).map((g: any) => ({ label: g.label, count: g.count, value: g.amount }))} valueLabel="Amount (UGX '000)" valueFormatter={(v: number) => fmtK(v)} />
          <BreakdownBlock title="By Age Band" data={(data.byAgeBand || []).map((g: any) => ({ label: g.label, count: g.count, value: g.amount }))} valueLabel="Amount (UGX '000)" valueFormatter={(v: number) => fmtK(v)} />
          <BreakdownBlock title="By Type" data={(data.byType || []).map((g: any) => ({ label: g.label, count: g.count, value: g.amount }))} valueLabel="Amount (UGX '000)" valueFormatter={(v: number) => fmtK(v)} />
          <BreakdownBlock title="Top Districts" data={(data.byDistrict || []).slice(0, 10).map((g: any) => ({ label: g.label, count: g.count, value: g.amount }))} valueLabel="Amount (UGX '000)" valueFormatter={(v: number) => fmtK(v)} />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── 8. Inputs Disaggregation ────────────────────────────────────────────
function InputsDisaggregationSection({ data }: { data: any }) {
  if (!data) return <Card><CardContent className="py-6"><EmptyHint message="Inputs disaggregation unavailable" /></CardContent></Card>
  return (
    <Card>
      <CardHeader className="pb-2">
        <SectionHeader
          icon={Package}
          title="Inputs Disaggregation"
          description="Input distribution by gender, age, district, type"
          accent="bg-amber-50 dark:bg-amber-950/40 text-amber-600"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <KpiTile label="Total Distributions" value={fmtNum(data.totalDistributions)} icon={Package} accent="text-amber-600" />
          <KpiTile label="Total Cost" value={fmtUGX(data.totalAmount)} icon={Receipt} accent="text-purple-600" />
          <KpiTile label="Avg per Distribution" value={fmtUGX(data.totalDistributions > 0 ? Math.round(data.totalAmount / data.totalDistributions) : 0)} icon={TrendingUp} accent="text-emerald-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BreakdownBlock title="By Gender" data={(data.byGender || []).map((g: any) => ({ label: g.label, count: g.count, value: g.amount }))} valueLabel="Amount (UGX '000)" valueFormatter={(v: number) => fmtK(v)} />
          <BreakdownBlock title="By Age Band" data={(data.byAgeBand || []).map((g: any) => ({ label: g.label, count: g.count, value: g.amount }))} valueLabel="Amount (UGX '000)" valueFormatter={(v: number) => fmtK(v)} />
          <BreakdownBlock title="By Type" data={(data.byType || []).map((g: any) => ({ label: g.label, count: g.count, value: g.amount }))} valueLabel="Amount (UGX '000)" valueFormatter={(v: number) => fmtK(v)} />
          <BreakdownBlock title="Top Districts" data={(data.byDistrict || []).slice(0, 10).map((g: any) => ({ label: g.label, count: g.count, value: g.amount }))} valueLabel="Amount (UGX '000)" valueFormatter={(v: number) => fmtK(v)} />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── 9. Farm Land KPIs + Plant Breakdown ─────────────────────────────────
function FarmLandKpisSection({ data }: { data: any }) {
  if (!data) return <Card><CardContent className="py-6"><EmptyHint message="Farm land data unavailable" /></CardContent></Card>
  return (
    <Card>
      <CardHeader className="pb-2">
        <SectionHeader
          icon={LandPlot}
          title="Farm Land KPIs"
          description="Total plots, acreage, plant counts and crop distribution"
          accent="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile label="Total Plots" value={fmtNum(data.totalPlots)} icon={LandPlot} accent="text-emerald-600" />
          <KpiTile label="Total Acreage" value={`${fmtNum(data.totalAcreageHa)} ha`} icon={Sprout} accent="text-amber-600" />
          <KpiTile label="Total Plants/Trees" value={fmtNum(data.totalPlants)} icon={Trees} accent="text-rose-600" />
          <KpiTile label="Avg Acreage/Plot" value={`${fmtNum(data.avgAcreagePerPlot)} ha`} icon={TrendingUp} accent="text-cyan-600" />
        </div>
        {(!data.plantBreakdown || data.plantBreakdown.length === 0) ? <EmptyHint message="No cultivations recorded" /> : (
          <>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.plantBreakdown} margin={{ left: 0, right: 10, top: 10 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="cropName" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmtK(v)} />
                  <Tooltip />
                  <Bar dataKey="plantCount" name="Plants/Trees" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <DataTable
              rows={(data.plantBreakdown || []).map((c: any) => ({
                cropName: c.cropName,
                plantCount: fmtNum(c.plantCount),
                areaHa: `${c.areaHa} ha`,
                plotCount: c.plotCount,
              }))}
              columns={[
                { key: 'cropName', label: 'Crop' },
                { key: 'plantCount', label: 'Plants/Trees', align: 'right' },
                { key: 'areaHa', label: 'Area (ha)', align: 'right' },
                { key: 'plotCount', label: 'Plots', align: 'right' },
              ]}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ─── 10. Input Distribution by Category ──────────────────────────────────
function InputDistributionCategorySection({ data }: { data: any }) {
  if (!data) return <Card><CardContent className="py-6"><EmptyHint message="Input distribution data unavailable" /></CardContent></Card>
  const catIcon = (cat: string) => {
    if (cat === 'Tools') return Wrench
    if (cat === 'Fertilizers') return TestTube
    if (cat === 'Seedlings') return Trees
    return Package
  }
  const catColor = (cat: string) => {
    if (cat === 'Tools') return 'text-amber-600'
    if (cat === 'Fertilizers') return 'text-emerald-600'
    if (cat === 'Seedlings') return 'text-rose-600'
    return 'text-blue-600'
  }
  return (
    <Card>
      <CardHeader className="pb-2">
        <SectionHeader
          icon={Package}
          title="Input Distribution by Category"
          description="Tools, Fertilizers, Seedlings — volume and value per category"
          accent="bg-blue-50 dark:bg-blue-950/40 text-blue-600"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(data.categories || []).map((c: any) => (
            <KpiTile
              key={c.category}
              label={c.category}
              value={fmtNum(c.count)}
              sub={`${c.pct}% • ${fmtUGX(c.amount)}`}
              icon={catIcon(c.category)}
              accent={catColor(c.category)}
            />
          ))}
        </div>
        {(!data.categories || data.categories.length === 0) ? <EmptyHint message="No input distributions recorded" /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Distribution by Count</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.categories} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={70} label={(e: any) => `${e.category}: ${e.count}`}>
                      {data.categories.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Distribution by Value (UGX '000)</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.categories} margin={{ left: 0, right: 10, top: 10 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmtK(v)} />
                    <Tooltip formatter={(v: number) => fmtUGX(v * 1000)} />
                    <Bar dataKey="amount" name="Value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                      {data.categories.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
        <DataTable
          rows={(data.categories || []).map((c: any) => ({
            category: c.category,
            count: c.count,
            quantity: fmtNum(c.quantity),
            amount: fmtUGX(c.amount),
            pct: `${c.pct}%`,
            types: (c.types || []).join(', '),
          }))}
          columns={[
            { key: 'category', label: 'Category' },
            { key: 'count', label: 'Count', align: 'right' },
            { key: 'quantity', label: 'Quantity', align: 'right' },
            { key: 'amount', label: 'Amount', align: 'right' },
            { key: 'pct', label: '%', align: 'right' },
            { key: 'types', label: 'Types' },
          ]}
        />
      </CardContent>
    </Card>
  )
}

// ─── Shared KPI tile + breakdown block ────────────────────────────────────
function KpiTile({ label, value, sub, icon: Icon, accent }: {
  label: string; value: React.ReactNode; sub?: React.ReactNode; icon: any; accent: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-lg font-bold mt-1 truncate">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>}
          </div>
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-muted/40', accent)}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function BreakdownBlock({ title, data, valueLabel, valueFormatter }: {
  title: string
  data: any[]
  valueLabel: string
  valueFormatter: (v: number) => string
}) {
  if (!data || data.length === 0) return (
    <div>
      <h4 className="text-xs font-semibold text-muted-foreground mb-2">{title}</h4>
      <EmptyHint message="No data" />
    </div>
  )
  return (
    <div>
      <h4 className="text-xs font-semibold text-muted-foreground mb-2">{title}</h4>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 0, right: 10, top: 5 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={valueFormatter} />
            <Tooltip formatter={(v: number) => valueFormatter(v)} />
            <Bar dataKey="value" name={valueLabel} fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
