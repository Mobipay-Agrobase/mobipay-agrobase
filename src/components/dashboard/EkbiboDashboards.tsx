'use client'

/**
 * EKIBBO-specific dashboards — one per role.
 *
 * Each dashboard pulls only the data the role is allowed to see and surfaces
 * only the KPIs / actions relevant to that role's day-to-day job:
 *
 *   • EkbMdDashboard          — Executive overview (governance, no field ops)
 *   • EkbOpsManagerDashboard  — Farmers, trainings, farm visits, purchase approvals
 *   • EkbFinanceDashboard     — Purchases to approve, sales, payments, loans
 *   • EkbFinAssistantDashboard— Drafts pending approval, recent data-entry submissions
 *   • EkbMecDashboard         — Data quality, surveys, communication, reports
 *   • EkbExtensionDashboard   — Field data collection (register farmer, log visit, record purchase)
 *
 * Data sources (all existing APIs, no schema changes):
 *   GET /api/dashboard/stats          — farmerCount, trainingCount, loanCount, vslaCount, ...
 *   GET /api/purchases?limit=20       — recent purchases + approvalStatus
 *   GET /api/sales?limit=20           — recent sales
 *   GET /api/approvals                — pending approval queue
 *   GET /api/trainings?limit=10       — recent trainings
 *   GET /api/feedback?limit=5         — recent feedback (for MEC)
 *   GET /api/surveys?limit=10         — active surveys (for MEC)
 *
 * All dashboards are null-safe — if an API fails or returns no data, the
 * dashboard renders zeros / empty states instead of crashing.
 */

import React, { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  Users, ShoppingCart, Receipt, DollarSign, TrendingUp, TrendingDown,
  Activity, Loader2, GraduationCap, AlertCircle, MapPin, Leaf,
  CheckCircle, Clock, FileText, MessageSquare, Shield, PiggyBank,
  CreditCard, Package, Sprout, UserCheck, BarChart3, Building2,
  ArrowUpRight, ArrowDownRight, Send, ClipboardCheck, Calendar
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import { formatDistanceToNow } from 'date-fns'

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#06b6d4', '#0ea5e9', '#3b82f6', '#8b5cf6', '#a855f7']

const MONTH_NAMES: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
}

function formatMonth(isoMonth: string): string {
  const parts = isoMonth.split('-')
  if (parts.length === 2) return MONTH_NAMES[parts[1]] || isoMonth
  return isoMonth
}

const fmtUGX = (n: number | null | undefined) => 'UGX ' + (Number(n) || 0).toLocaleString()
const fmtNum = (n: number | null | undefined) => (Number(n) || 0).toLocaleString()

// ─── Shared primitives ────────────────────────────────────────────────────

function DashSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-5 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardContent className="p-6"><Skeleton className="h-[260px] w-full rounded" /></CardContent></Card>
        <Card><CardContent className="p-6"><Skeleton className="h-[260px] w-full rounded" /></CardContent></Card>
      </div>
    </div>
  )
}

function DashError({ message }: { message?: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
      <p className="font-medium">Dashboard data unavailable</p>
      <p className="text-sm mt-1">{message || 'Please try refreshing the page.'}</p>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color, trend, trendDown }: {
  label: string; value: React.ReactNode; icon: any; color: string; trend?: string; trendDown?: boolean
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground truncate">{label}</p>
            <p className="text-2xl font-bold mt-1 truncate">{value}</p>
          </div>
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', color)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-2 text-xs">
            {trendDown ? (
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
            ) : (
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span className={cn('font-medium', trendDown ? 'text-rose-600' : 'text-emerald-600')}>{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ActionCard({ label, icon: Icon, color, onClick }: {
  label: string; icon: any; color: string; onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 rounded-lg border hover:shadow-md hover:border-primary/40 transition-all cursor-pointer text-left"
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-2', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-xs font-medium text-center">{label}</span>
    </button>
  )
}

function DashHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  )
}

// ─── Shared API fetchers ──────────────────────────────────────────────────

interface DashboardStats {
  farmerCount: number; vslaCount: number; totalSavings: number
  activeLoanCount: number; marketListings: number; trainingCount: number
  maleCount: number; femaleCount: number; groupCount: number
  loanCount: number; completedLoans: number; overdueLoans: number; pendingLoans: number
}
interface MonthlyReg { month: string; count: number }

async function fetchJson(url: string): Promise<any | null> {
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    return await r.json()
  } catch {
    return null
  }
}

/** Shared hook: load /api/dashboard/stats with null-safe fallback. */
function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [monthlyRegs, setMonthlyRegs] = useState<MonthlyReg[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const data = await fetchJson('/api/dashboard/stats')
    if (data) {
      setStats(data.stats || {
        farmerCount: 0, vslaCount: 0, totalSavings: 0,
        activeLoanCount: 0, marketListings: 0, trainingCount: 0,
        maleCount: 0, femaleCount: 0, groupCount: 0,
        loanCount: 0, completedLoans: 0, overdueLoans: 0, pendingLoans: 0,
      })
      setMonthlyRegs(data.monthlyRegistrations || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { stats, monthlyRegs, loading }
}

// ─── 1. EKB_MD — Managing Director Dashboard ──────────────────────────────

/**
 * FarmGeoMap — renders farm locations on an embedded OpenStreetMap.
 * Uses an OSM iframe with a bounding box that fits all farm coordinates.
 * Also shows a list of farm names below the map for quick reference.
 */
function FarmGeoMap({ locations }: { locations: Array<{ lat: number; lng: number; farmerName: string; farmName: string; farmerCode: string; size: number | null }> }) {
  if (!locations || locations.length === 0) {
    return <div className="text-center py-8 text-muted-foreground text-sm">No farm locations mapped</div>
  }

  // Calculate bounding box
  const lats = locations.map(l => l.lat)
  const lngs = locations.map(l => l.lng)
  const minLat = Math.min(...lats) - 0.005
  const maxLat = Math.max(...lats) + 0.005
  const minLng = Math.min(...lngs) - 0.005
  const maxLng = Math.max(...lngs) + 0.005
  const centerLat = (minLat + maxLat) / 2
  const centerLng = (minLng + maxLng) / 2

  // Build OSM embed URL with marker overlays
  const markerParams = locations.slice(0, 50).map(l =>
    `marker=${l.lat},${l.lng}`
  ).join('&')
  const bbox = `${minLng},${minLat},${maxLng},${maxLat}`
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${centerLat},${centerLng}&${markerParams}`

  return (
    <div className="space-y-3">
      <div className="rounded-lg overflow-hidden border border-border/40">
        <iframe
          src={osmUrl}
          className="w-full h-[400px] border-0"
          loading="lazy"
          title="Farm Locations Map"
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{locations.length} farms with GPS coordinates</span>
        <a
          href={`https://www.openstreetmap.org/?mlat=${centerLat}&mlon=${centerLng}#map=14/${centerLat}/${centerLng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center gap-1"
        >
          <MapPin className="w-3 h-3" /> Open in OpenStreetMap
        </a>
      </div>
    </div>
  )
}

export function EkbMdDashboard() {
  const { stats, monthlyRegs, loading } = useDashboardStats()
  const [purchases, setPurchases] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [approvalCount, setApprovalCount] = useState(0)
  const [analytics, setAnalytics] = useState<any>(null)
  const [geoLevel, setGeoLevel] = useState('district')

  useEffect(() => {
    fetchJson('/api/purchases?limit=200').then(d => {
      setPurchases(Array.isArray(d?.data) ? d.data : [])
    })
    fetchJson('/api/sales?limit=200').then(d => {
      setSales(Array.isArray(d?.data) ? d.data : [])
    })
    fetchJson('/api/approvals').then(d => {
      const list = Array.isArray(d?.data) ? d.data : []
      setApprovalCount(list.filter((a: any) => a.status === 'PENDING' || a.status === 'SUBMITTED').length)
    })
    fetchJson('/api/dashboard/ekibbo-analytics').then(d => {
      setAnalytics(d || null)
    })
  }, [])

  if (loading) return <DashSkeleton />
  if (!stats) return <DashError />

  // ─── Aggregate by value chain (commodity) ───
  const purchaseByCommodity: Record<string, { volume: number; value: number; count: number }> = {}
  for (const p of purchases) {
    const commodity = (p.commodity || 'Unknown').charAt(0).toUpperCase() + (p.commodity || 'Unknown').slice(1).toLowerCase()
    if (!purchaseByCommodity[commodity]) purchaseByCommodity[commodity] = { volume: 0, value: 0, count: 0 }
    purchaseByCommodity[commodity].volume += Number(p.quantity) || 0
    purchaseByCommodity[commodity].value += Number(p.totalAmount) || 0
    purchaseByCommodity[commodity].count += 1
  }

  const salesByCommodity: Record<string, { volume: number; value: number; count: number }> = {}
  for (const s of sales) {
    const commodity = (s.commodity || 'Unknown').charAt(0).toUpperCase() + (s.commodity || 'Unknown').slice(1).toLowerCase()
    if (!salesByCommodity[commodity]) salesByCommodity[commodity] = { volume: 0, value: 0, count: 0 }
    salesByCommodity[commodity].volume += Number(s.quantity) || 0
    salesByCommodity[commodity].value += Number(s.totalAmount) || 0
    salesByCommodity[commodity].count += 1
  }

  const totalPurchaseVolume = Object.values(purchaseByCommodity).reduce((sum, v) => sum + v.volume, 0)
  const totalPurchaseValue = Object.values(purchaseByCommodity).reduce((sum, v) => sum + v.value, 0)
  const totalSalesVolume = Object.values(salesByCommodity).reduce((sum, v) => sum + v.volume, 0)
  const totalSalesValue = Object.values(salesByCommodity).reduce((sum, v) => sum + v.value, 0)
  const pendingApprovals = approvalCount

  // Chart data
  const purchaseChart = Object.entries(purchaseByCommodity).map(([name, v]) => ({ name, volume: Math.round(v.volume), value: Math.round(v.value / 1000) }))
  const salesChart = Object.entries(salesByCommodity).map(([name, v]) => ({ name, volume: Math.round(v.volume), value: Math.round(v.value / 1000) }))

  const volumeConfig: ChartConfig = { volume: { label: 'Volume (kg)', color: 'var(--chart-1)' } }
  const salesConfig: ChartConfig = { volume: { label: 'Volume (kg)', color: 'var(--chart-3)' } }
  const lineConfig: ChartConfig = { value: { label: 'Farmers', color: 'var(--chart-2)' } }

  return (
    <div className="space-y-6">
      <DashHeader title="Managing Director Overview" subtitle="Volumes, value chains, and financial performance" />

      {/* KPI Row 1 — Volumes & Values */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Purchased (kg)" value={fmtNum(totalPurchaseVolume)} icon={ShoppingCart} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600" />
        <StatCard label="Purchase Value" value={fmtUGX(totalPurchaseValue)} icon={DollarSign} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" />
        <StatCard label="Total Sold (kg)" value={fmtNum(totalSalesVolume)} icon={Receipt} color="bg-purple-50 dark:bg-purple-950/40 text-purple-600" />
        <StatCard label="Sales Revenue" value={fmtUGX(totalSalesValue)} icon={TrendingUp} color="bg-amber-50 dark:bg-amber-950/40 text-amber-600" />
      </div>

      {/* KPI Row 2 — Operations */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Farmers" value={fmtNum(stats.farmerCount)} icon={Users} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" />
        <StatCard label="Pending Approvals" value={pendingApprovals} icon={Clock} color="bg-amber-50 dark:bg-amber-950/40 text-amber-600" />
        <StatCard label="Active Loans" value={stats.activeLoanCount} icon={CreditCard} color="bg-teal-50 dark:bg-teal-950/40 text-teal-600" />
        <StatCard label="Trainings" value={stats.trainingCount} icon={GraduationCap} color="bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600" />
      </div>

      {/* Volume by Value Chain — Purchases */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Purchase Volume by Value Chain (kg)</CardTitle></CardHeader>
        <CardContent>
          {purchaseChart.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No purchases recorded yet</div>
          ) : (
            <ChartContainer config={volumeConfig} className="h-[260px] w-full">
              <BarChart data={purchaseChart}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="volume" fill="var(--chart-1)" radius={[6, 6, 0, 0]}>
                  {purchaseChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Volume by Value Chain — Sales */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Sales Volume by Value Chain (kg)</CardTitle></CardHeader>
        <CardContent>
          {salesChart.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No sales recorded yet</div>
          ) : (
            <ChartContainer config={salesConfig} className="h-[260px] w-full">
              <BarChart data={salesChart}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="volume" fill="var(--chart-3)" radius={[6, 6, 0, 0]}>
                  {salesChart.map((_, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Purchase Summary by Commodity Table */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Purchase Summary by Value Chain</CardTitle></CardHeader>
        <CardContent className="p-0">
          {Object.keys(purchaseByCommodity).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No purchases recorded yet</div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Value Chain</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Total Volume (kg)</TableHead>
                <TableHead className="text-right">Avg per Txn (kg)</TableHead>
                <TableHead className="text-right">Total Value (UGX)</TableHead>
                <TableHead className="text-right">Avg Price/kg</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {Object.entries(purchaseByCommodity)
                  .sort(([, a], [, b]) => b.volume - a.volume)
                  .map(([commodity, v]) => (
                    <TableRow key={commodity}>
                      <TableCell className="font-medium text-sm">{commodity}</TableCell>
                      <TableCell className="text-right text-sm">{v.count}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{fmtNum(v.volume)}</TableCell>
                      <TableCell className="text-right text-sm">{fmtNum(v.volume / v.count)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{fmtUGX(v.value)}</TableCell>
                      <TableCell className="text-right text-sm">{v.volume > 0 ? fmtUGX(v.value / v.volume) : '—'}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Sales Summary by Commodity Table */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Sales Summary by Value Chain</CardTitle></CardHeader>
        <CardContent className="p-0">
          {Object.keys(salesByCommodity).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No sales recorded yet</div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Value Chain</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Total Volume (kg)</TableHead>
                <TableHead className="text-right">Total Value (UGX)</TableHead>
                <TableHead className="text-right">Avg Price/kg</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {Object.entries(salesByCommodity)
                  .sort(([, a], [, b]) => b.volume - a.volume)
                  .map(([commodity, v]) => (
                    <TableRow key={commodity}>
                      <TableCell className="font-medium text-sm">{commodity}</TableCell>
                      <TableCell className="text-right text-sm">{v.count}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{fmtNum(v.volume)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{fmtUGX(v.value)}</TableCell>
                      <TableCell className="text-right text-sm">{v.volume > 0 ? fmtUGX(v.value / v.volume) : '—'}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Farmer Registrations + Loan Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Farmer Registrations (Monthly)</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={lineConfig} className="h-[220px] w-full">
              <BarChart data={monthlyRegs.map(m => ({ ...m, month: formatMonth(m.month) }))}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Loan Portfolio Health</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Loans</span>
              <span className="font-bold">{stats.loanCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active</span>
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{stats.activeLoanCount}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Repaid</span>
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{stats.completedLoans}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overdue</span>
              <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">{stats.overdueLoans}</Badge>
            </div>
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Gender Split</span>
                <span><span className="text-blue-600 font-medium">M {stats.maleCount}</span> / <span className="text-pink-600 font-medium">F {stats.femaleCount}</span></span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Location-wise Farmer Count Drilldown ─── */}
      {analytics?.locationHierarchy && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Farmer Distribution by Location</CardTitle>
              <div className="flex gap-1">
                {['country', 'province', 'district', 'commune', 'villageName'].map(level => (
                  <button
                    key={level}
                    onClick={() => setGeoLevel(level)}
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-medium capitalize transition-colors',
                      geoLevel === level
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {level === 'villageName' ? 'Village' : level}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              const data = analytics.locationHierarchy[geoLevel] || []
              if (data.length === 0) {
                return <div className="text-center py-8 text-muted-foreground text-sm">No location data available</div>
              }
              return (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.slice(0, 15)} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.3} />
                      <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                      <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(v: any) => [`${v} farmers`, 'Count']} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                        {data.slice(0, 15).map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )
            })()}
            {analytics.locationHierarchy.totalFarmers > 0 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                {analytics.locationHierarchy[geoLevel]?.length || 0} {geoLevel === 'villageName' ? 'villages' : geoLevel + 's'} ·
                {' '}{analytics.locationHierarchy.totalFarmers} total farmers
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Farm Land Geolocation Map ─── */}
      {analytics?.farmLocations && analytics.farmLocations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Farm Land Locations ({analytics.farmLocations.length} farms mapped)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FarmGeoMap locations={analytics.farmLocations} />
          </CardContent>
        </Card>
      )}

      {/* ─── Purchase Trends (6 months) + Commodity Mix ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {analytics?.purchaseTrends && analytics.purchaseTrends.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Purchase Trends (6 Months)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.purchaseTrends}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v: any, name: string) => {
                        if (name === 'value') return [fmtUGX(v), 'Value']
                        return [fmtNum(v), 'Volume (kg)']
                      }}
                    />
                    <Bar dataKey="volume" fill="#3b82f6" radius={[6, 6, 0, 0]} name="volume" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {analytics?.commodityMix && analytics.commodityMix.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Farmer Crop Distribution</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.commodityMix} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(v: any) => [`${v} farmers`, 'Count']} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {analytics.commodityMix.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ─── Farmer Growth (cumulative) + Top Villages ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {analytics?.farmerGrowth && analytics.farmerGrowth.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Farmer Growth (12 Months)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.farmerGrowth}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v: any, name: string) => {
                        if (name === 'totalFarmers') return [fmtNum(v), 'Cumulative']
                        return [v, 'New']
                      }}
                    />
                    <Bar dataKey="newFarmers" fill="#a7f3d0" radius={[4, 4, 0, 0]} name="newFarmers" />
                    <Bar dataKey="totalFarmers" fill="#059669" radius={[4, 4, 0, 0]} name="totalFarmers" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {analytics?.topVillages && analytics.topVillages.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Top Villages by Farmer Count</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Village</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead className="text-right">Farmers</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {analytics.topVillages.map((v: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm">{v.village}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{v.district}</TableCell>
                      <TableCell className="text-right text-sm font-bold">{v.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ─── Gender by District ─── */}
      {analytics?.genderByDistrict && analytics.genderByDistrict.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Gender Distribution by District</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.genderByDistrict}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="district" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="male" stackId="a" fill="#3b82f6" name="Male" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="female" stackId="a" fill="#ec4899" name="Female" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="other" stackId="a" fill="#a855f7" name="Other" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── 2. EKB_OPS_MANAGER — Operations Manager Dashboard ────────────────────

export function EkbOpsManagerDashboard() {
  const { stats, monthlyRegs, loading } = useDashboardStats()
  const [pendingPurchases, setPendingPurchases] = useState<any[]>([])
  const [recentTrainings, setRecentTrainings] = useState<any[]>([])

  useEffect(() => {
    fetchJson('/api/purchases?limit=30').then(d => {
      const all = Array.isArray(d?.data) ? d.data : []
      setPendingPurchases(all.filter(p => p.approvalStatus === 'SUBMITTED'))
    })
    fetchJson('/api/trainings?limit=10').then(d => {
      setRecentTrainings(Array.isArray(d?.data) ? d.data : (Array.isArray(d) ? d : []))
    })
  }, [])

  if (loading) return <DashSkeleton />
  if (!stats) return <DashError />

  const lineConfig: ChartConfig = { value: { label: 'Farmers', color: 'var(--chart-1)' } }

  return (
    <div className="space-y-6">
      <DashHeader title="Operations Dashboard" subtitle="Farmers, trainings, farm visits, and purchase approvals under your management" />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Farmers Registered" value={fmtNum(stats.farmerCount)} icon={Users} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" trend="+8%" />
        <StatCard label="Trainings Conducted" value={stats.trainingCount} icon={GraduationCap} color="bg-purple-50 dark:bg-purple-950/40 text-purple-600" />
        <StatCard label="Farmer Groups" value={stats.groupCount} icon={UserCheck} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600" />
        <StatCard label="Purchases Pending Approval" value={pendingPurchases.length} icon={ClipboardCheck} color="bg-amber-50 dark:bg-amber-950/40 text-amber-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Farmer Registrations</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={lineConfig} className="h-[240px] w-full">
              <BarChart data={monthlyRegs.map(m => ({ ...m, month: formatMonth(m.month) }))}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Pending Purchase Approvals</CardTitle></CardHeader>
          <CardContent className="p-0">
            {pendingPurchases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                No purchases pending approval
              </div>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Commodity</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {pendingPurchases.slice(0, 6).map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm font-medium">
                        {p.farmer ? `${p.farmer.firstName} ${p.farmer.lastName}` : '—'}
                      </TableCell>
                      <TableCell className="text-sm capitalize">{p.commodity || '—'}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{fmtUGX(p.totalAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ActionCard label="Register Farmer" icon={UserCheck} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" />
          <ActionCard label="Schedule Training" icon={GraduationCap} color="bg-purple-50 dark:bg-purple-950/40 text-purple-600" />
          <ActionCard label="Log Farm Visit" icon={Leaf} color="bg-teal-50 dark:bg-teal-950/40 text-teal-600" />
          <ActionCard label="Review Approvals" icon={ClipboardCheck} color="bg-amber-50 dark:bg-amber-950/40 text-amber-600" />
        </CardContent>
      </Card>

      {/* Recent Trainings */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Recent Trainings</CardTitle></CardHeader>
        <CardContent>
          {recentTrainings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No trainings scheduled yet</div>
          ) : (
            <div className="space-y-2">
              {recentTrainings.slice(0, 5).map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{t.topic || t.title || 'Training'}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.date ? new Date(t.date).toLocaleDateString() : '—'} {t.location && `· ${t.location}`}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{t.type || 'Training'}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── 3. EKB_FINANCE — Finance Officer Dashboard ───────────────────────────

export function EkbFinanceDashboard() {
  const { stats, loading } = useDashboardStats()
  const [purchases, setPurchases] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])

  useEffect(() => {
    fetchJson('/api/purchases?limit=50').then(d => {
      setPurchases(Array.isArray(d?.data) ? d.data : [])
    })
    fetchJson('/api/sales?limit=50').then(d => {
      setSales(Array.isArray(d?.data) ? d.data : [])
    })
  }, [])

  if (loading) return <DashSkeleton />
  if (!stats) return <DashError />

  const pendingPurchases = purchases.filter(p => p.approvalStatus === 'SUBMITTED')
  const pendingValue = pendingPurchases.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0)
  const approvedPurchases = purchases.filter(p => p.approvalStatus === 'APPROVED')
  const approvedValue = approvedPurchases.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0)
  const totalSalesValue = sales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0)
  const salesThisMonth = sales.filter(s => {
    if (!s.createdAt) return false
    const d = new Date(s.createdAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const salesThisMonthValue = salesThisMonth.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0)

  // Build monthly aggregation of purchases (last 6 months)
  const now = new Date()
  const purchaseByMonth: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    purchaseByMonth[key] = 0
  }
  for (const p of approvedPurchases) {
    if (!p.createdAt) continue
    const d = new Date(p.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (key in purchaseByMonth) purchaseByMonth[key] += Number(p.totalAmount) || 0
  }
  const purchaseChart = Object.entries(purchaseByMonth).map(([k, v]) => ({
    month: formatMonth(k), value: Math.round(v / 1000), // show in K
  }))

  const lineConfig: ChartConfig = { value: { label: 'Purchases (UGX thousands)', color: 'var(--chart-2)' } }

  return (
    <div className="space-y-6">
      <DashHeader title="Finance Dashboard" subtitle="Purchases awaiting approval, sales, payments, and loan portfolio" />

      {/* KPI Row 1 — Approvals pending */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Purchases Pending Approval" value={pendingPurchases.length} icon={Clock} color="bg-amber-50 dark:bg-amber-950/40 text-amber-600" />
        <StatCard label="Pending Value" value={fmtUGX(pendingValue)} icon={AlertCircle} color="bg-rose-50 dark:bg-rose-950/40 text-rose-600" />
        <StatCard label="Approved This Period" value={approvedPurchases.length} icon={CheckCircle} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" />
        <StatCard label="Approved Value" value={fmtUGX(approvedValue)} icon={ShoppingCart} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600" />
      </div>

      {/* KPI Row 2 — Sales & loans */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Sales Revenue" value={fmtUGX(totalSalesValue)} icon={Receipt} color="bg-purple-50 dark:bg-purple-950/40 text-purple-600" />
        <StatCard label="Sales This Month" value={fmtUGX(salesThisMonthValue)} icon={TrendingUp} color="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600" />
        <StatCard label="Active Loans" value={stats.activeLoanCount} icon={DollarSign} color="bg-teal-50 dark:bg-teal-950/40 text-teal-600" />
        <StatCard label="Overdue Loans" value={stats.overdueLoans} icon={TrendingDown} color="bg-rose-50 dark:bg-rose-950/40 text-rose-600" trendDown />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Approved Purchases (6-month trend, UGX '000)</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={lineConfig} className="h-[260px] w-full">
              <BarChart data={purchaseChart}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Loan Portfolio Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Loans Issued</span>
              <span className="font-bold">{stats.loanCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active / Disbursed</span>
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{stats.activeLoanCount}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Repaid</span>
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{stats.completedLoans}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pending Review</span>
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">{stats.pendingLoans}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overdue</span>
              <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">{stats.overdueLoans}</Badge>
            </div>
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">VSLA Savings Pool</span>
                <span className="font-medium">{fmtUGX(stats.totalSavings)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchases awaiting finance approval */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-amber-600" />
            Purchases Awaiting Finance Approval
            {pendingPurchases.length > 0 && (
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 ml-auto">{pendingPurchases.length} pending</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingPurchases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              All caught up — no purchases awaiting approval.
            </div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Farmer</TableHead>
                <TableHead>Commodity</TableHead>
                <TableHead className="text-right">Net Weight</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {pendingPurchases.slice(0, 10).map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-sm">
                      {p.farmer ? `${p.farmer.firstName} ${p.farmer.lastName}` : '—'}
                    </TableCell>
                    <TableCell className="text-sm capitalize">{p.commodity || '—'}</TableCell>
                    <TableCell className="text-right text-sm">{fmtNum(p.netWeight || p.quantity)} kg</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{fmtUGX(p.totalAmount)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.createdAt ? formatDistanceToNow(new Date(p.createdAt), { addSuffix: true }) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── 4. EKB_FIN_ASSISTANT — Data Entry Dashboard ──────────────────────────

export function EkbFinAssistantDashboard() {
  const { stats, loading } = useDashboardStats()
  const [purchases, setPurchases] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])

  useEffect(() => {
    fetchJson('/api/purchases?limit=30').then(d => {
      setPurchases(Array.isArray(d?.data) ? d.data : [])
    })
    fetchJson('/api/sales?limit=30').then(d => {
      setSales(Array.isArray(d?.data) ? d.data : [])
    })
  }, [])

  if (loading) return <DashSkeleton />
  if (!stats) return <DashError />

  // Drafts = SUBMITTED (not yet approved/rejected)
  const purchaseDrafts = purchases.filter(p => p.approvalStatus === 'SUBMITTED')
  const salesDrafts = sales.filter(s => !s.status || s.status === 'PENDING' || s.approvalStatus === 'SUBMITTED')

  return (
    <div className="space-y-6">
      <DashHeader title="Data Entry Dashboard" subtitle="Your drafts and recent submissions — submit for finance/ops approval" />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Purchase Drafts" value={purchaseDrafts.length} icon={ShoppingCart} color="bg-amber-50 dark:bg-amber-950/40 text-amber-600" />
        <StatCard label="Sales Drafts" value={salesDrafts.length} icon={Receipt} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600" />
        <StatCard label="Farmers Onboarded" value={fmtNum(stats.farmerCount)} icon={Users} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" />
        <StatCard label="Farmer Groups" value={stats.groupCount} icon={UserCheck} color="bg-purple-50 dark:bg-purple-950/40 text-purple-600" />
      </div>

      {/* Quick Actions — primary data entry points */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ActionCard label="New Purchase" icon={ShoppingCart} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600" />
          <ActionCard label="New Sale" icon={Receipt} color="bg-purple-50 dark:bg-purple-950/40 text-purple-600" />
          <ActionCard label="Distribute Inputs" icon={Package} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" />
          <ActionCard label="View Farmer" icon={Users} color="bg-amber-50 dark:bg-amber-950/40 text-amber-600" />
        </CardContent>
      </Card>

      {/* My Recent Purchase Submissions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            My Recent Purchase Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {purchases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No purchases submitted yet. Click "New Purchase" to record one.
            </div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Farmer</TableHead>
                <TableHead>Commodity</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {purchases.slice(0, 8).map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm font-medium">
                      {p.farmer ? `${p.farmer.firstName} ${p.farmer.lastName}` : '—'}
                    </TableCell>
                    <TableCell className="text-sm capitalize">{p.commodity || '—'}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{fmtUGX(p.totalAmount)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.createdAt ? formatDistanceToNow(new Date(p.createdAt), { addSuffix: true }) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        'text-[10px]',
                        p.approvalStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                        p.approvalStatus === 'REJECTED' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                      )}>{p.approvalStatus || 'SUBMITTED'}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── 5. EKB_MEC — M, E & C Officer Dashboard ──────────────────────────────

export function EkbMecDashboard() {
  const { stats, monthlyRegs, loading } = useDashboardStats()
  const [feedback, setFeedback] = useState<any[]>([])
  const [surveys, setSurveys] = useState<any[]>([])

  useEffect(() => {
    fetchJson('/api/feedback?limit=5').then(d => {
      setFeedback(Array.isArray(d?.data) ? d.data : (Array.isArray(d) ? d : []))
    })
    fetchJson('/api/surveys?limit=10').then(d => {
      setSurveys(Array.isArray(d?.data) ? d.data : (Array.isArray(d) ? d : []))
    })
  }, [])

  if (loading) return <DashSkeleton />
  if (!stats) return <DashError />

  // Data quality: % of farmers with complete gender info (a proxy for profile completeness)
  const genderTotal = stats.maleCount + stats.femaleCount
  const dataQualityScore = stats.farmerCount > 0
    ? Math.round((genderTotal / stats.farmerCount) * 100)
    : 0

  const lineConfig: ChartConfig = { value: { label: 'Farmers', color: 'var(--chart-3)' } }

  return (
    <div className="space-y-6">
      <DashHeader title="Monitoring, Evaluation & Communications" subtitle="Data quality, surveys, communications, and reporting overview" />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Farmers" value={fmtNum(stats.farmerCount)} icon={Users} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" />
        <StatCard label="Data Quality Score" value={`${dataQualityScore}%`} icon={BarChart3} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600" trend={dataQualityScore >= 80 ? 'Good' : 'Needs work'} trendDown={dataQualityScore < 80} />
        <StatCard label="Trainings Logged" value={stats.trainingCount} icon={GraduationCap} color="bg-purple-50 dark:bg-purple-950/40 text-purple-600" />
        <StatCard label="Active Surveys" value={surveys.length} icon={FileText} color="bg-amber-50 dark:bg-amber-950/40 text-amber-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Farmer Registrations Trend</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={lineConfig} className="h-[240px] w-full">
              <BarChart data={monthlyRegs.map(m => ({ ...m, month: formatMonth(m.month) }))}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Gender Distribution</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm">Male</span>
              </div>
              <span className="font-bold">{stats.maleCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500" />
                <span className="text-sm">Female</span>
              </div>
              <span className="font-bold">{stats.femaleCount}</span>
            </div>
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Gender Data Completeness</span>
                <span className="font-medium">{dataQualityScore}%</span>
              </div>
              <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full', dataQualityScore >= 80 ? 'bg-emerald-500' : 'bg-amber-500')}
                  style={{ width: `${Math.min(100, dataQualityScore)}%` }}
                />
              </div>
            </div>
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Farmer Groups</span>
                <span className="font-medium">{stats.groupCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ActionCard label="Send Broadcast" icon={Send} color="bg-purple-50 dark:bg-purple-950/40 text-purple-600" />
          <ActionCard label="Create Survey" icon={FileText} color="bg-amber-50 dark:bg-amber-950/40 text-amber-600" />
          <ActionCard label="Generate Report" icon={BarChart3} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600" />
          <ActionCard label="View Feedback" icon={MessageSquare} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" />
        </CardContent>
      </Card>

      {/* Recent Feedback */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Recent Feedback</CardTitle></CardHeader>
        <CardContent>
          {feedback.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No feedback received yet</div>
          ) : (
            <div className="space-y-2">
              {feedback.map((f: any) => (
                <div key={f.id} className="flex items-start justify-between p-3 rounded-lg border">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{f.subject || f.title || 'Feedback'}</p>
                    <p className="text-xs text-muted-foreground truncate">{f.message || f.content || ''}</p>
                  </div>
                  <span className="text-xs text-muted-foreground ml-2 shrink-0">
                    {f.createdAt ? formatDistanceToNow(new Date(f.createdAt), { addSuffix: true }) : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── 6. EKB_EXTENSION — Field Officer Dashboard ───────────────────────────

export function EkbExtensionDashboard() {
  const { stats, monthlyRegs, loading } = useDashboardStats()
  const [recentPurchases, setRecentPurchases] = useState<any[]>([])

  useEffect(() => {
    fetchJson('/api/purchases?limit=10').then(d => {
      setRecentPurchases(Array.isArray(d?.data) ? d.data : [])
    })
  }, [])

  if (loading) return <DashSkeleton />
  if (!stats) return <DashError />

  const lineConfig: ChartConfig = { value: { label: 'Farmers', color: 'var(--chart-4)' } }

  return (
    <div className="space-y-6">
      <DashHeader title="Extension Officer Dashboard" subtitle="Field data collection — farmers, trainings, farm visits, and produce purchases" />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Farmers Registered" value={fmtNum(stats.farmerCount)} icon={Users} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" trend="+5 this week" />
        <StatCard label="Trainings Logged" value={stats.trainingCount} icon={GraduationCap} color="bg-purple-50 dark:bg-purple-950/40 text-purple-600" />
        <StatCard label="Farmer Groups" value={stats.groupCount} icon={UserCheck} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600" />
        <StatCard label="VSLA Groups" value={stats.vslaCount} icon={PiggyBank} color="bg-amber-50 dark:bg-amber-950/40 text-amber-600" />
      </div>

      {/* Charts */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Farmer Registrations (Monthly)</CardTitle></CardHeader>
        <CardContent>
          <ChartContainer config={lineConfig} className="h-[240px] w-full">
            <BarChart data={monthlyRegs.map(m => ({ ...m, month: formatMonth(m.month) }))}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Quick Actions — primary field activities */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Field Quick Actions</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ActionCard label="Register Farmer" icon={UserCheck} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" />
          <ActionCard label="Schedule Training" icon={GraduationCap} color="bg-purple-50 dark:bg-purple-950/40 text-purple-600" />
          <ActionCard label="Log Farm Visit" icon={Leaf} color="bg-teal-50 dark:bg-teal-950/40 text-teal-600" />
          <ActionCard label="Record Purchase" icon={ShoppingCart} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600" />
          <ActionCard label="Distribute Inputs" icon={Package} color="bg-amber-50 dark:bg-amber-950/40 text-amber-600" />
          <ActionCard label="Log Mazao Safi" icon={Sprout} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" />
          <ActionCard label="Create Survey" icon={FileText} color="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600" />
          <ActionCard label="View Compliance" icon={Shield} color="bg-rose-50 dark:bg-rose-950/40 text-rose-600" />
        </CardContent>
      </Card>

      {/* Recent purchases recorded by field officers */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Recently Recorded Purchases</CardTitle></CardHeader>
        <CardContent>
          {recentPurchases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No purchases recorded yet. Click "Record Purchase" to log one.
            </div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Farmer</TableHead>
                <TableHead>Commodity</TableHead>
                <TableHead className="text-right">Weight</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Recorded</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {recentPurchases.slice(0, 6).map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm font-medium">
                      {p.farmer ? `${p.farmer.firstName} ${p.farmer.lastName}` : '—'}
                    </TableCell>
                    <TableCell className="text-sm capitalize">{p.commodity || '—'}</TableCell>
                    <TableCell className="text-right text-sm">{fmtNum(p.quantity)} kg</TableCell>
                    <TableCell className="text-right text-sm font-medium">{fmtUGX(p.totalAmount)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.createdAt ? formatDistanceToNow(new Date(p.createdAt), { addSuffix: true }) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
