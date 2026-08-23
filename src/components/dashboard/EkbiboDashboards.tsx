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
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  Users, ShoppingCart, Receipt, DollarSign, TrendingUp, TrendingDown,
  Activity, Loader2, GraduationCap, AlertCircle, MapPin, Leaf,
  CheckCircle, Clock, FileText, MessageSquare, Shield, PiggyBank,
  CreditCard, Package, Sprout, UserCheck, BarChart3, Building2,
  ArrowUpRight, ArrowDownRight, Send, ClipboardCheck, Calendar,
  ChevronDown, RefreshCw, Inbox, Heart, Download
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

// ─── New shared primitives (mirrors the DashboardView.tsx pattern) ────────

/**
 * EkbDashboardSection — labelled wrapper that groups related KPIs, charts,
 * and tables under a single header. Supports View-all deep-links (via the
 * Zustand setActiveModule store action) and a collapsible variant.
 */
function EkbDashboardSection({
  icon: Icon,
  title,
  description,
  accent = 'bg-primary/10 text-primary',
  right,
  onViewAll,
  viewAllLabel = 'View all',
  collapsible = false,
  defaultCollapsed = false,
  children,
}: {
  icon: any
  title: string
  description?: string
  accent?: string
  right?: React.ReactNode
  onViewAll?: () => void
  viewAllLabel?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const rightCluster = (
    <div
      className="flex items-center gap-3 flex-wrap"
      onClick={collapsible ? (e) => e.stopPropagation() : undefined}
    >
      {right}
      {onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary hover:underline"
        >
          {viewAllLabel}
          <ArrowUpRight className="w-3 h-3" />
        </button>
      )}
      {collapsible && (
        <button
          type="button"
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
          aria-expanded={!collapsed}
          className="inline-flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <ChevronDown className={cn('w-4 h-4 transition-transform', collapsed && '-rotate-90')} />
        </button>
      )}
    </div>
  )
  return (
    <section className="space-y-3">
      <div
        className={cn(
          'flex items-center justify-between gap-2 sm:gap-3 flex-wrap',
          collapsible && 'cursor-pointer select-none',
        )}
        onClick={collapsible ? () => setCollapsed(c => !c) : undefined}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className={cn('w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0', accent)}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight leading-tight truncate">{title}</h3>
            {description && (
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight mt-0.5 hidden sm:block">{description}</p>
            )}
          </div>
        </div>
        {rightCluster}
      </div>
      {!collapsed && children}
    </section>
  )
}

/**
 * EkbMiniStat — compact sub-stat tile for in-section KPIs.
 */
function EkbMiniStat({
  label, value, icon: Icon, color = 'text-muted-foreground', hint,
}: {
  label: string; value: React.ReactNode; icon: any; color?: string; hint?: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className={cn('w-3.5 h-3.5', color)} />
          <span className="text-xs font-medium">{label}</span>
        </div>
        <p className="text-xl font-bold mt-2 leading-none">{value}</p>
        {hint && <div className="mt-2 text-[11px] text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  )
}

/**
 * EkbPageHeader — page-level header with title, last-updated timestamp,
 * and silent Refresh button.
 */
function EkbPageHeader({
  title, subtitle, lastUpdated, refreshing, onRefresh,
}: {
  title: string; subtitle: string; lastUpdated: Date | null; refreshing: boolean; onRefresh: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {subtitle}
          {lastUpdated && (
            <span className="ml-2 text-xs text-muted-foreground/70">
              · Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </span>
          )}
        </p>
      </div>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border bg-background hover:bg-accent transition-colors disabled:opacity-50"
      >
        <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
        {refreshing ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground text-sm">
      <Inbox className="w-8 h-8 mx-auto mb-2 opacity-30" />
      {message}
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

/** Shared hook: load /api/dashboard/stats with null-safe fallback + manual refresh. */
function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [monthlyRegs, setMonthlyRegs] = useState<MonthlyReg[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetch = useCallback(async (opts?: { silent?: boolean }) => {
    if (opts?.silent) setRefreshing(true); else setLoading(true)
    const data = await fetchJson('/api/dashboard/stats')
    if (data) {
      setStats(data.stats || {
        farmerCount: 0, vslaCount: 0, totalSavings: 0,
        activeLoanCount: 0, marketListings: 0, trainingCount: 0,
        maleCount: 0, femaleCount: 0, groupCount: 0,
        loanCount: 0, completedLoans: 0, overdueLoans: 0, pendingLoans: 0,
      })
      setMonthlyRegs(data.monthlyRegistrations || [])
      setLastUpdated(new Date())
    }
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { stats, monthlyRegs, loading, refreshing, lastUpdated, refresh: fetch }
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

  // Build OSM embed URL — use bounding box + center marker
  // Use layer=mapnik (default street view with labels)
  // For satellite view, OSM doesn't provide it directly — use the standard
  // mapnik layer which shows street names + place labels
  const bbox = `${minLng},${minLat},${maxLng},${maxLat}`
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${centerLat},${centerLng}`

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
      {/* Show farm count + a scrollable list of farm names with coordinates */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{locations.length} farms with GPS coordinates (map shows center of cluster)</span>
        <a
          href={`https://www.openstreetmap.org/?mlat=${centerLat}&mlon=${centerLng}#map=12/${centerLat}/${centerLng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center gap-1"
        >
          <MapPin className="w-3 h-3" /> Open in OpenStreetMap
        </a>
      </div>
      {/* Compact farm list */}
      <div className="max-h-32 overflow-y-auto rounded-lg border border-border/40 p-2 space-y-1">
        {locations.slice(0, 20).map((l, i) => (
          <div key={i} className="flex items-center justify-between text-[11px] py-0.5 px-1 hover:bg-muted/30 rounded">
            <span className="font-medium truncate">{l.farmName}</span>
            <span className="text-muted-foreground shrink-0 ml-2">{l.farmerName}</span>
          </div>
        ))}
        {locations.length > 20 && (
          <p className="text-[10px] text-muted-foreground text-center pt-1">+ {locations.length - 20} more farms</p>
        )}
      </div>
    </div>
  )
}

export function EkbMdDashboard() {
  const setActiveModule = useAppStore(s => s.setActiveModule)
  const { stats, monthlyRegs, loading, refreshing, lastUpdated, refresh } = useDashboardStats()
  const [purchases, setPurchases] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [approvalCount, setApprovalCount] = useState(0)
  const [analytics, setAnalytics] = useState<any>(null)
  const [geoLevel, setGeoLevel] = useState('district')
  const [analyticsRefreshing, setAnalyticsRefreshing] = useState(false)
  const [analyticsUpdated, setAnalyticsUpdated] = useState<Date | null>(null)

  // ─── Loyalty state (Phase 1) ────────────────────────────────────────────
  // Loyalty KPI + secondary metrics, fetched from /api/dashboard/ekibbo-loyalty
  // with a date-range filter. Default period = year-to-date.
  const [loyalty, setLoyalty] = useState<any>(null)
  const [loyaltyPeriod, setLoyaltyPeriod] = useState<string>('ytd') // 'ytd' | '30d' | '90d' | 'all'
  const [loyaltyRefreshing, setLoyaltyRefreshing] = useState(false)
  const [loyaltyUpdated, setLoyaltyUpdated] = useState<Date | null>(null)

  // ─── Loyalty Cycle state (Phase 2) ─────────────────────────────────────
  // Engagement-depth distribution: how many farmers completed 0/1/2/3/4 stages
  // of the loyalty cycle (Training → Input → Sale → Repeat).
  const [cycle, setCycle] = useState<any>(null)

  const fetchLoyalty = useCallback(async (period: string, opts?: { silent?: boolean }) => {
    if (opts?.silent) setLoyaltyRefreshing(true)
    try {
      const now = new Date()
      let from: string, to: string
      if (period === 'ytd') {
        from = `${now.getUTCFullYear()}-01-01`
        to = now.toISOString().split('T')[0]
      } else if (period === '30d') {
        const d = new Date(now.getTime() - 30 * 86400000)
        from = d.toISOString().split('T')[0]
        to = now.toISOString().split('T')[0]
      } else if (period === '90d') {
        const d = new Date(now.getTime() - 90 * 86400000)
        from = d.toISOString().split('T')[0]
        to = now.toISOString().split('T')[0]
      } else { // 'all'
        from = '2020-01-01'
        to = now.toISOString().split('T')[0]
      }
      const data = await fetchJson(`/api/dashboard/ekibbo-loyalty?from=${from}&to=${to}`)
      const cycleData = await fetchJson(`/api/dashboard/ekibbo-loyalty/cycle?from=${from}&to=${to}`)
      setLoyalty(data || null)
      setCycle(cycleData || null)
      setLoyaltyUpdated(new Date())
    } catch {
      setLoyalty(null)
      setCycle(null)
    } finally {
      setLoyaltyRefreshing(false)
    }
  }, [])

  const fetchAux = useCallback(async (opts?: { silent?: boolean }) => {
    if (opts?.silent) setAnalyticsRefreshing(true)
    const [p, s, a, an] = await Promise.all([
      fetchJson('/api/purchases?limit=200'),
      fetchJson('/api/sales?limit=200'),
      fetchJson('/api/approvals'),
      fetchJson('/api/dashboard/ekibbo-analytics'),
    ])
    setPurchases(Array.isArray(p?.data) ? p.data : [])
    setSales(Array.isArray(s?.data) ? s.data : [])
    const aList = Array.isArray(a?.data) ? a.data : []
    setApprovalCount(aList.filter((x: any) => x.status === 'PENDING' || x.status === 'SUBMITTED').length)
    setAnalytics(an || null)
    setAnalyticsUpdated(new Date())
    setAnalyticsRefreshing(false)
  }, [])

  useEffect(() => {
    fetchAux()
    fetchLoyalty(loyaltyPeriod)
  }, [fetchAux, fetchLoyalty, loyaltyPeriod])

  const handleRefresh = useCallback(() => {
    refresh({ silent: true })
    fetchAux({ silent: true })
    fetchLoyalty(loyaltyPeriod, { silent: true })
  }, [refresh, fetchAux, fetchLoyalty, loyaltyPeriod])

  const handleLoyaltyPeriodChange = useCallback((p: string) => {
    setLoyaltyPeriod(p)
    // The useEffect above will refetch when loyaltyPeriod changes
  }, [])

  const handleLoyaltyExport = useCallback(() => {
    const now = new Date()
    let from: string, to: string
    if (loyaltyPeriod === 'ytd') {
      from = `${now.getUTCFullYear()}-01-01`
      to = now.toISOString().split('T')[0]
    } else if (loyaltyPeriod === '30d') {
      const d = new Date(now.getTime() - 30 * 86400000)
      from = d.toISOString().split('T')[0]
      to = now.toISOString().split('T')[0]
    } else if (loyaltyPeriod === '90d') {
      const d = new Date(now.getTime() - 90 * 86400000)
      from = d.toISOString().split('T')[0]
      to = now.toISOString().split('T')[0]
    } else {
      from = '2020-01-01'
      to = now.toISOString().split('T')[0]
    }
    // Open the export URL in a new tab — browser will download the CSV
    window.open(`/api/dashboard/ekibbo-loyalty/export?from=${from}&to=${to}`, '_blank')
  }, [loyaltyPeriod])

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
    <div className="space-y-8">
      <EkbPageHeader
        title="Managing Director Overview"
        subtitle="Volumes, value chains, and financial performance"
        lastUpdated={lastUpdated || analyticsUpdated}
        refreshing={refreshing || analyticsRefreshing}
        onRefresh={handleRefresh}
      />

      {/* ─── Hero KPI Strip — Volumes & Values ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Purchased (kg)" value={fmtNum(totalPurchaseVolume)} icon={ShoppingCart} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600" />
        <StatCard label="Purchase Value" value={fmtUGX(totalPurchaseValue)} icon={DollarSign} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" />
        <StatCard label="Total Sold (kg)" value={fmtNum(totalSalesVolume)} icon={Receipt} color="bg-purple-50 dark:bg-purple-950/40 text-purple-600" />
        <StatCard label="Sales Revenue" value={fmtUGX(totalSalesValue)} icon={TrendingUp} color="bg-amber-50 dark:bg-amber-950/40 text-amber-600" />
      </div>

      {/* ─── Section 1 · Operations Snapshot ─── */}
      <EkbDashboardSection
        icon={Users}
        title="Operations Snapshot"
        description="Farmer network, approvals queue, and training activity"
        accent="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600"
        collapsible
        onViewAll={() => setActiveModule('farmers')}
        viewAllLabel="Open Farmer Profiling"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <EkbMiniStat label="Total Farmers" value={fmtNum(stats.farmerCount)} icon={Users} color="text-emerald-600" hint="Registered in your tenant" />
          <EkbMiniStat label="Pending Approvals" value={pendingApprovals} icon={Clock} color="text-amber-600" hint="Awaiting your review" />
          <EkbMiniStat label="Active Loans" value={stats.activeLoanCount} icon={CreditCard} color="text-teal-600" hint="Disbursed + outstanding" />
          <EkbMiniStat label="Trainings" value={stats.trainingCount} icon={GraduationCap} color="text-cyan-600" hint="Total conducted" />
        </div>
      </EkbDashboardSection>

      {/* ─── Section 2 · Purchase Performance ─── */}
      <EkbDashboardSection
        icon={ShoppingCart}
        title="Purchase Performance"
        description="Volume and value by commodity value chain"
        accent="bg-blue-50 dark:bg-blue-950/40 text-blue-600"
        collapsible
        onViewAll={() => setActiveModule('purchases')}
        viewAllLabel="Open Purchases"
        right={
          <Badge variant="outline" className="text-[11px] font-normal">
            <ShoppingCart className="w-3 h-3 mr-1" />
            {purchases.length} purchases
          </Badge>
        }
      >
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm">Purchase Volume by Value Chain (kg)</CardTitle>
              <BarChart3 className="w-4 h-4 text-muted-foreground/60" />
            </CardHeader>
            <CardContent>
              {purchaseChart.length === 0 ? (
                <EmptyState message="No purchases recorded yet" />
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

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Purchase Summary by Value Chain</CardTitle></CardHeader>
            <CardContent className="p-0">
              {Object.keys(purchaseByCommodity).length === 0 ? (
                <EmptyState message="No purchases recorded yet" />
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
        </div>
      </EkbDashboardSection>

      {/* ─── Section 3 · Sales Performance ─── */}
      <EkbDashboardSection
        icon={Receipt}
        title="Sales Performance"
        description="Volume and revenue by commodity value chain"
        accent="bg-purple-50 dark:bg-purple-950/40 text-purple-600"
        collapsible
        onViewAll={() => setActiveModule('sales')}
        viewAllLabel="Open Sales"
        right={
          <Badge variant="outline" className="text-[11px] font-normal">
            <Receipt className="w-3 h-3 mr-1" />
            {sales.length} sales
          </Badge>
        }
      >
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm">Sales Volume by Value Chain (kg)</CardTitle>
              <BarChart3 className="w-4 h-4 text-muted-foreground/60" />
            </CardHeader>
            <CardContent>
              {salesChart.length === 0 ? (
                <EmptyState message="No sales recorded yet" />
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

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Sales Summary by Value Chain</CardTitle></CardHeader>
            <CardContent className="p-0">
              {Object.keys(salesByCommodity).length === 0 ? (
                <EmptyState message="No sales recorded yet" />
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
        </div>
      </EkbDashboardSection>

      {/* ─── Section 3.5 · Customer Loyalty (Phase 1) ─── */}
      <EkbDashboardSection
        icon={Heart}
        title="Customer Loyalty"
        description="Farmers who sold produce to EKiBBO + repeat-seller + engagement signals"
        accent="bg-rose-50 dark:bg-rose-950/40 text-rose-600"
        collapsible
        right={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
              {([['30d', '30 days'], ['90d', '90 days'], ['ytd', 'YTD'], ['all', 'All time']] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleLoyaltyPeriodChange(key)}
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-medium transition-colors',
                    loyaltyPeriod === key
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {loyaltyUpdated && (
              <span className="text-[10px] text-muted-foreground hidden md:inline">
                Updated {formatDistanceToNow(loyaltyUpdated, { addSuffix: true })}
              </span>
            )}
            <button
              type="button"
              onClick={handleLoyaltyExport}
              className="inline-flex items-center gap-0.5 text-[11px] font-medium px-2 py-1 rounded-md border bg-background hover:bg-accent transition-colors"
              title="Download per-farmer loyalty breakdown as CSV"
            >
              <Download className="w-3 h-3" /> CSV
            </button>
          </div>
        }
      >
        {loyaltyRefreshing && !loyalty ? (
          <Card><CardContent className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Computing loyalty metrics…</p>
          </CardContent></Card>
        ) : !loyalty ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            <Heart className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No loyalty data available for the selected period.</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-4">
            {/* ─── Hero KPI: Loyalty Rate ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-1">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Loyal Farmer Rate</p>
                      <p className="text-3xl font-bold mt-1">
                        {loyalty.kpi.loyalFarmerRate === null ? '—' : `${loyalty.kpi.loyalFarmerRate}%`}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {loyalty.kpi.loyalFarmerCount} of {loyalty.kpi.activeFarmerCount} active farmers
                      </p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0">
                      <Heart className="w-5 h-5" />
                    </div>
                  </div>
                  {/* Progress bar: loyal / active */}
                  {loyalty.kpi.activeFarmerCount > 0 && (
                    <div className="mt-3">
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-rose-500" style={{ width: `${loyalty.kpi.loyalFarmerRate}%` }} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardContent className="p-5">
                  <p className="text-xs font-medium text-muted-foreground mb-3">Loyalty Breakdown</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Loyal Farmers</p>
                      <p className="text-xl font-bold text-rose-600">{loyalty.kpi.loyalFarmerCount}</p>
                      <p className="text-[10px] text-muted-foreground">sold ≥1 produce</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Repeat Sellers</p>
                      <p className="text-xl font-bold text-amber-600">{loyalty.kpi.repeatSellerCount}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {loyalty.kpi.repeatSellerRate === null ? '—' : `${loyalty.kpi.repeatSellerRate}% of loyal`}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Active Farmers</p>
                      <p className="text-xl font-bold text-blue-600">{loyalty.kpi.activeFarmerCount}</p>
                      <p className="text-[10px] text-muted-foreground">any engagement</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Avg Sales / Farmer</p>
                      <p className="text-xl font-bold text-emerald-600">{loyalty.engagement.avgSalesPerFarmer}</p>
                      <p className="text-[10px] text-muted-foreground">among loyal</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ─── Engagement signals ─── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <EkbMiniStat label="Total Sales" value={loyalty.engagement.totalSalesCount} icon={ShoppingCart} color="text-blue-600" hint="Produce sold" />
              <EkbMiniStat label="Multi-Crop Farmers" value={loyalty.engagement.multiCropFarmerCount} icon={Leaf} color="text-emerald-600" hint="≥2 distinct crops" />
              <EkbMiniStat label="Input Buyers" value={loyalty.engagement.inputPurchaseFarmerCount} icon={Package} color="text-amber-600" hint="took inputs" />
              <EkbMiniStat label="Training Attendees" value={loyalty.engagement.trainingFarmerCount} icon={GraduationCap} color="text-purple-600" hint="attended ≥1" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <EkbMiniStat label="Farm Visits" value={loyalty.engagement.farmVisitFarmerCount} icon={MapPin} color="text-teal-600" hint="≥1 visit" />
              <EkbMiniStat label="Crops Sold" value={loyalty.engagement.cropsSoldCount} icon={Sprout} color="text-indigo-600" hint="distinct products" />
              <EkbMiniStat label="Loyal Farmers" value={loyalty.kpi.loyalFarmerCount} icon={Heart} color="text-rose-600" hint="≥1 sale" />
              <EkbMiniStat label="Repeat Sellers" value={loyalty.kpi.repeatSellerCount} icon={RefreshCw} color="text-amber-700" hint="≥2 sales" />
            </div>

            {/* ─── Monthly trend mini-chart ─── */}
            {loyalty.trend && loyalty.trend.length > 0 && (
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-sm">Monthly Loyalty Trend</CardTitle>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Loyal farmers (sold) vs. active farmers (any engagement) per month
                    </p>
                  </div>
                  <BarChart3 className="w-4 h-4 text-muted-foreground/60" />
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{ loyal: { label: 'Loyal', color: 'var(--chart-1)' }, active: { label: 'Active', color: 'var(--chart-3)' } }} className="h-[220px] w-full">
                    <BarChart data={loyalty.trend}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="active" fill="var(--chart-3)" radius={[4, 4, 0, 0]} name="Active" />
                      <Bar dataKey="loyal" fill="var(--chart-1)" radius={[4, 4, 0, 0]} name="Loyal" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </EkbDashboardSection>

      {/* ─── Section 3.6 · Loyalty Cycle (Phase 2) ─── */}
      {cycle && cycle.totals.engagedFarmers > 0 && (
        <EkbDashboardSection
          icon={RefreshCw}
          title="Loyalty Cycle — Engagement Depth"
          description="Farmers who completed 0–4 stages: Training → Input → Sale → Repeat"
          accent="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600"
          collapsible
          defaultCollapsed
          right={
            <Badge variant="outline" className="text-[11px] font-normal">
              Avg {cycle.totals.avgStagesCompleted}/4 stages
            </Badge>
          }
        >
          <div className="space-y-4">
            {/* ─── Distribution bars ─── */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Stage Distribution</CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {cycle.totals.engagedFarmers} engaged farmers · {cycle.totals.fullCycleFarmers} completed all 4 stages ({cycle.totals.engagedFarmers > 0 ? Math.round((cycle.totals.fullCycleFarmers / cycle.totals.engagedFarmers) * 100) : 0}%)
                </p>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {cycle.distribution.map((d: any) => {
                  const tierLabels = ['New', 'Engaged', 'Active', 'Loyal', 'Champion']
                  const tierColors = ['bg-slate-400', 'bg-blue-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500']
                  const tierTextColors = ['text-slate-600', 'text-blue-600', 'text-amber-600', 'text-emerald-600', 'text-rose-600']
                  const maxCount = Math.max(...cycle.distribution.map((x: any) => x.count), 1)
                  return (
                    <div key={d.stages} className="flex items-center gap-3">
                      <div className="w-20 shrink-0">
                        <span className={cn('text-xs font-medium', tierTextColors[d.stages])}>
                          {tierLabels[d.stages]}
                        </span>
                        <p className="text-[10px] text-muted-foreground">{d.stages}/4 stages</p>
                      </div>
                      <div className="flex-1 h-7 bg-muted rounded-md overflow-hidden relative">
                        <div
                          className={cn('h-full transition-all', tierColors[d.stages])}
                          style={{ width: `${(d.count / maxCount) * 100}%` }}
                        />
                        <span className="absolute inset-0 flex items-center px-3 text-xs font-medium text-white mix-blend-difference">
                          {d.count} ({d.pct}%)
                        </span>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* ─── Funnel ─── */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Engagement Funnel</CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  How many farmers progressed through each stage of the cycle
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { label: 'Training / Farm Visit', count: cycle.funnel.training, icon: GraduationCap, color: 'bg-purple-500', text: 'text-purple-600' },
                    { label: 'Input Uptake', count: cycle.funnel.input, icon: Package, color: 'bg-amber-500', text: 'text-amber-600' },
                    { label: 'Sold Produce', count: cycle.funnel.sale, icon: ShoppingCart, color: 'bg-blue-500', text: 'text-blue-600' },
                    { label: 'Repeat Seller', count: cycle.funnel.repeat, icon: RefreshCw, color: 'bg-emerald-500', text: 'text-emerald-600' },
                  ].map((stage, i) => {
                    const maxCount = cycle.funnel.training || 1
                    const pct = cycle.totals.engagedFarmers > 0 ? Math.round((stage.count / cycle.totals.engagedFarmers) * 100) : 0
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className={cn('w-8 h-8 rounded-md flex items-center justify-center shrink-0', stage.color, 'bg-opacity-15')}>
                          <stage.icon className={cn('w-4 h-4', stage.text)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-medium truncate">{stage.label}</span>
                            <span className={cn('text-xs font-bold ml-2 shrink-0', stage.text)}>{stage.count} ({pct}%)</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className={cn('h-full transition-all', stage.color)} style={{ width: `${(stage.count / maxCount) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </EkbDashboardSection>
      )}

      {/* ─── Section 4 · Farmer Network & Loan Portfolio ─── */}
      <EkbDashboardSection
        icon={Users}
        title="Farmer Network & Loan Portfolio"
        description="Monthly registration trend and loan portfolio composition"
        accent="bg-teal-50 dark:bg-teal-950/40 text-teal-600"
        collapsible
        onViewAll={() => setActiveModule('vsla')}
        viewAllLabel="Open VSLA Management"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Farmer Registrations (Monthly)</CardTitle></CardHeader>
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
            <CardHeader className="pb-2"><CardTitle className="text-sm">Loan Portfolio Health</CardTitle></CardHeader>
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
      </EkbDashboardSection>

      {/* ─── Section 5 · Geographic Distribution ─── */}
      <EkbDashboardSection
        icon={MapPin}
        title="Geographic Distribution"
        description="Farmer density by location level + farm-level geolocation map"
        accent="bg-amber-50 dark:bg-amber-950/40 text-amber-600"
        collapsible
        defaultCollapsed
        onViewAll={() => setActiveModule('farm-lands')}
        viewAllLabel="Open Farm Land Registry"
      >
        <div className="space-y-4">
          {/* ─── Location-wise Farmer Count Drilldown ─── */}
          {analytics?.locationHierarchy && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Farmer Distribution by Location</CardTitle>
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
                    return <EmptyState message="No location data available" />
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
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Farm Land Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FarmGeoMap locations={analytics.farmLocations} />
              </CardContent>
            </Card>
          )}
        </div>
      </EkbDashboardSection>

      {/* ─── Section 6 · Trends & Crop Mix ─── */}
      <EkbDashboardSection
        icon={TrendingUp}
        title="Trends & Crop Mix"
        description="6-month purchase trends, farmer growth, and commodity distribution"
        accent="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600"
        collapsible
        defaultCollapsed
      >
        <div className="space-y-4">
          {/* ─── Purchase Trends (6 months) + Commodity Mix ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {analytics?.purchaseTrends && analytics.purchaseTrends.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Purchase Trends (6 Months)</CardTitle></CardHeader>
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
                <CardHeader className="pb-2"><CardTitle className="text-sm">Farmer Crop Distribution</CardTitle></CardHeader>
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
                <CardHeader className="pb-2"><CardTitle className="text-sm">Farmer Growth (12 Months)</CardTitle></CardHeader>
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
                <CardHeader className="pb-2"><CardTitle className="text-sm">Top Villages by Farmer Count</CardTitle></CardHeader>
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
              <CardHeader className="pb-2"><CardTitle className="text-sm">Gender Distribution by District</CardTitle></CardHeader>
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
      </EkbDashboardSection>
    </div>
  )
}

// ─── 2. EKB_OPS_MANAGER — Operations Manager Dashboard ────────────────────

export function EkbOpsManagerDashboard() {
  const { stats, monthlyRegs, loading } = useDashboardStats()
  const [pendingPurchases, setPendingPurchases] = useState<any[]>([])
  const [recentTrainings, setRecentTrainings] = useState<any[]>([])
  const [ops, setOps] = useState<any>(null)
  const [loyalty, setLoyalty] = useState<any>(null)

  useEffect(() => {
    fetchJson('/api/purchases?limit=30').then(d => {
      const all = Array.isArray(d?.data) ? d.data : []
      setPendingPurchases(all.filter(p => p.approvalStatus === 'SUBMITTED'))
    })
    fetchJson('/api/trainings?limit=10').then(d => {
      setRecentTrainings(Array.isArray(d?.data) ? d.data : (Array.isArray(d) ? d : []))
    })
    // Ekibbo feedback: full operations summary (registry, groups, volumes,
    // inputs, loans, loyalty) for the Operations Manager dashboard.
    fetchJson('/api/dashboard/ops-summary').then(setOps).catch(() => {})
    fetchJson('/api/dashboard/ekibbo-loyalty').then(setLoyalty).catch(() => {})
  }, [])

  if (loading) return <DashSkeleton />
  if (!stats) return <DashError />

  const lineConfig: ChartConfig = { value: { label: 'Farmers', color: 'var(--chart-1)' } }
  const volumeConfig: ChartConfig = { volumeKg: { label: 'Volume (kg)', color: 'var(--chart-2)' } }

  return (
    <div className="space-y-6">
      <DashHeader title="Operations Dashboard" subtitle="Farmers, trainings, farm visits, and purchase approvals under your management" />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Farmers Registered" value={fmtNum(stats.farmerCount)} icon={Users} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" trend="+8%" />
        <StatCard label="Trainings Conducted" value={stats.trainingCount} icon={GraduationCap} color="bg-purple-50 dark:bg-purple-950/40 text-purple-600" />
        <StatCard label="Farmer Groups" value={ops?.farmerGroups?.total ?? stats.groupCount} icon={UserCheck} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600" />
        <StatCard label="Purchases Pending Approval" value={pendingPurchases.length} icon={ClipboardCheck} color="bg-amber-50 dark:bg-amber-950/40 text-amber-600" />
      </div>

      {/* ── Operations Summary (Ekibbo feedback: registry, groups, volumes,
             inputs, loans, loyalty) ─────────────────────────────────────── */}
      {ops && (
        <>
          {/* Registry + Loyalty row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Farmer Registry</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-muted/50">
                    <p className="text-[11px] text-muted-foreground">Total Registered</p>
                    <p className="text-xl font-bold">{fmtNum(ops.farmerRegistry?.total ?? 0)}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/50">
                    <p className="text-[11px] text-muted-foreground">Active</p>
                    <p className="text-xl font-bold text-emerald-600">{fmtNum(ops.farmerRegistry?.active ?? 0)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">By District</p>
                  <div className="space-y-1">
                    {(ops.farmerRegistry?.byDistrict || []).slice(0, 5).map((d: any) => (
                      <div key={d.district} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-muted-foreground" />{d.district}</span>
                        <span className="font-semibold">{d.count}</span>
                      </div>
                    ))}
                    {(ops.farmerRegistry?.byDistrict || []).length === 0 && (
                      <p className="text-xs text-muted-foreground">No district data yet</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Farmer Groups Formed</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-muted/50">
                    <p className="text-[11px] text-muted-foreground">Total Groups</p>
                    <p className="text-xl font-bold">{fmtNum(ops.farmerGroups?.total ?? 0)}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/50">
                    <p className="text-[11px] text-muted-foreground">Active</p>
                    <p className="text-xl font-bold text-emerald-600">{fmtNum(ops.farmerGroups?.active ?? 0)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Inputs Distributed by Type</p>
                  <div className="space-y-1">
                    {(ops.inputs?.byType || []).slice(0, 5).map((i: any) => (
                      <div key={i.inputType} className="flex items-center justify-between text-xs">
                        <span className="capitalize">{String(i.inputType || '').replace(/_/g, ' ')}</span>
                        <span className="font-semibold">{fmtNum(i.quantity)} × · {fmtUGX(i.value)}</span>
                      </div>
                    ))}
                    {(ops.inputs?.byType || []).length === 0 && (
                      <p className="text-xs text-muted-foreground">No inputs distributed yet</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Loyalty Summary</CardTitle></CardHeader>
              <CardContent>
                {loyalty?.kpi ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-lg bg-muted/50">
                        <p className="text-[11px] text-muted-foreground">Loyal Farmers</p>
                        <p className="text-xl font-bold">{fmtNum(loyalty.kpi.loyalFarmerCount ?? 0)}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/50">
                        <p className="text-[11px] text-muted-foreground">Loyalty Rate</p>
                        <p className="text-xl font-bold text-emerald-600">
                          {loyalty.kpi.loyalFarmerRate != null ? `${loyalty.kpi.loyalFarmerRate}%` : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Repeat sellers: <span className="font-semibold text-foreground">{loyalty.kpi.repeatSellerCount ?? 0}</span>
                        {loyalty.kpi.repeatSellerRate != null && ` (${loyalty.kpi.repeatSellerRate}%)`}</p>
                      <p>Avg sales / farmer: <span className="font-semibold text-foreground">{loyalty.engagement?.avgSalesPerFarmer ?? 0}</span></p>
                      <p>Multi-crop farmers: <span className="font-semibold text-foreground">{loyalty.engagement?.multiCropFarmerCount ?? 0}</span></p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">Loyalty data not available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Volumes purchased — by crop, district, season */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Volumes Purchased by Crop</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={volumeConfig} className="h-[220px] w-full">
                  <BarChart data={(ops.purchases?.byCrop || []).slice(0, 6)}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="crop" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="volumeKg" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Volumes by District</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={volumeConfig} className="h-[220px] w-full">
                  <BarChart data={(ops.purchases?.byDistrict || []).slice(0, 6)}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="district" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="volumeKg" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Farmers with Loans by Season</CardTitle></CardHeader>
              <CardContent className="p-0">
                {(ops.loans?.bySeason || []).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">No loan data yet</div>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Season</TableHead>
                      <TableHead className="text-right">Farmers</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {ops.loans.bySeason.slice(0, 6).map((s: any) => (
                        <TableRow key={s.season}>
                          <TableCell className="text-sm">{s.season}</TableCell>
                          <TableCell className="text-right text-sm font-medium">{s.farmers}</TableCell>
                          <TableCell className="text-right text-sm">{fmtUGX(s.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Purchases by season table */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Volumes Purchased by Season</CardTitle></CardHeader>
            <CardContent className="p-0">
              {(ops.purchases?.bySeason || []).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No purchases yet</div>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Season</TableHead>
                    <TableHead className="text-right">Volume (kg)</TableHead>
                    <TableHead className="text-right">Value (UGX)</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {ops.purchases.bySeason.map((s: any) => (
                      <TableRow key={s.season}>
                        <TableCell className="text-sm font-medium">{s.season}</TableCell>
                        <TableCell className="text-right text-sm">{fmtNum(s.volumeKg)}</TableCell>
                        <TableCell className="text-right text-sm">{fmtUGX(s.value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

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
