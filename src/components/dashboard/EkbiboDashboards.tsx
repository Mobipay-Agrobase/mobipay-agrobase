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

import { EkibboInsightsDashboard } from '@/components/dashboard/EkibboInsightsDashboard'

export const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#06b6d4', '#0ea5e9', '#3b82f6', '#8b5cf6', '#a855f7']

const MONTH_NAMES: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
}

export function formatMonth(isoMonth: string): string {
  const parts = isoMonth.split('-')
  if (parts.length === 2) return MONTH_NAMES[parts[1]] || isoMonth
  return isoMonth
}

export const fmtUGX = (n: number | null | undefined) => 'UGX ' + (Number(n) || 0).toLocaleString()
export const fmtNum = (n: number | null | undefined) => (Number(n) || 0).toLocaleString()

// ─── Shared primitives ────────────────────────────────────────────────────

export function DashSkeleton() {
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

export function DashError({ message }: { message?: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
      <p className="font-medium">Dashboard data unavailable</p>
      <p className="text-sm mt-1">{message || 'Please try refreshing the page.'}</p>
    </div>
  )
}

export function StatCard({ label, value, icon: Icon, color, trend, trendDown }: {
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
export function EkbDashboardSection({
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
export function EkbMiniStat({
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
export function EkbPageHeader({
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

export function EmptyState({ message }: { message: string }) {
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


export function EkbMdDashboard() {
  // NB (EKIBBO dashboard feedback): MD, Operations Manager and MEC officer
  // share the SAME unified dashboard. Only financial-approval rights differ.
  return <EkibboInsightsDashboard canApprove />
}

// ─── 2. EKB_OPS_MANAGER — Operations Manager Dashboard ────────────────────

export function EkbOpsManagerDashboard() {
  // NB (EKIBBO dashboard feedback): MD, Operations Manager and MEC officer
  // share the SAME unified dashboard. Only financial-approval rights differ.
  return <EkibboInsightsDashboard canApprove />
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
  // NB (EKIBBO dashboard feedback): MD, Operations Manager and MEC officer
  // share the SAME unified dashboard. Only financial-approval rights differ
  // (M&E officer cannot approve finances).
  return <EkibboInsightsDashboard canApprove={false} />
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
