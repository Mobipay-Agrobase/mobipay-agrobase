'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  Users, PiggyBank, DollarSign, Store, ArrowUpRight, ArrowDownRight,
  Activity, Loader2, TrendingUp, UserCheck, GraduationCap, AlertCircle,
  Calendar, MapPin, Sprout, ShoppingCart, Receipt, Award, Leaf, Target,
  Building2, CreditCard, FileText, TrendingDown, CheckCircle, Clock,
  Wallet, RefreshCw, Landmark, PieChart as PieChartIcon, BarChart3, Inbox,
  ChevronDown
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, PieChart, Pie, LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import { formatDistanceToNow } from 'date-fns'
import { MapDashboard } from '@/components/dashboard/MapDashboard'
import {
  EkbMdDashboard,
  EkbOpsManagerDashboard,
  EkbFinanceDashboard,
  EkbFinAssistantDashboard,
  EkbMecDashboard,
  EkbExtensionDashboard,
} from '@/components/dashboard/EkbiboDashboards'
import BillingOperationsDashboard from '@/components/admin/BillingOperationsDashboard'
import SupportTicketsView from '@/components/billing/SupportTicketsView'

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

const statusColor: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  PROCESSING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

export default function DashboardView() {
  const { user } = useAppStore()
  const role = user?.role || 'TENANT_ADMIN'

  // Route to role-specific dashboard
  switch (role) {
    case 'SUPER_ADMIN':
      return <SuperAdminDashboard />
    case 'COUNTRY_ADMIN':
      return <CountryAdminDashboard />
    case 'FARMER':
      return <FarmerDashboard userId={user?.userId || ''} />
    case 'VSLA_MEMBER':
      return <VslaMemberDashboard userId={user?.userId || ''} />
    case 'EXTENSION_OFFICER':
      return <ExtensionOfficerDashboard userId={user?.userId || ''} />
    case 'AGENT':
      return <AgentDashboard userId={user?.userId || ''} />
    case 'CBT':
      return <CbtDashboard userId={user?.userId || ''} />

    // ─── MobiPay internal staff ───
    case 'MOBIPAY_FINANCE':
      return <BillingOperationsDashboard />
    case 'MOBIPAY_SUPPORT':
      return <SupportTicketsView />

    // ─── EKIBBO role-specific dashboards ───
    case 'EKB_MD':
      return <EkbMdDashboard />
    case 'EKB_OPS_MANAGER':
      return <EkbOpsManagerDashboard />
    case 'EKB_FINANCE':
      return <EkbFinanceDashboard />
    case 'EKB_FIN_ASSISTANT':
      return <EkbFinAssistantDashboard />
    case 'EKB_MEC':
      return <EkbMecDashboard />
    case 'EKB_EXTENSION':
      return <EkbExtensionDashboard />

    case 'TENANT_ADMIN':
    default:
      return <TenantAdminDashboard />
  }
}

// ─── Shared Loading & Error Components ────────────────────────────

function DashboardSkeleton() {
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

function DashboardError() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
      <p className="font-medium">Dashboard data unavailable</p>
      <p className="text-sm mt-1">Please try refreshing the page.</p>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color, trend }: {
  label: string; value: any; icon: any; color: string; trend?: string
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-2 text-xs">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-600 font-medium">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Shared Dashboard Layout Components ───────────────────────────

/**
 * DashboardSection — a consistent wrapper that groups related KPIs,
 * charts, and tables under a single labelled header. Eliminates the
 * "mixed charts" problem by giving every domain its own labelled home.
 *
 * Props:
 *  - onViewAll:   when set, renders a "View all →" button on the right
 *                  side of the header that deep-links to the relevant
 *                  module page (e.g. farmers, vsla, reports). Uses a
 *                  callback rather than a URL because this app navigates
 *                  via the Zustand `setActiveModule` store action, not
 *                  via URL routing.
 *  - viewAllLabel: override the default "View all" label.
 *  - collapsible:  when true, renders a chevron toggle that collapses
 *                  the section body. Useful for power users who want
 *                  to focus on one domain at a time. Default state is
 *                  open; persistence is handled by the caller via
 *                  `defaultCollapsed`.
 *  - defaultCollapsed: starting collapsed state (only used when
 *                  `collapsible` is true).
 */
function DashboardSection({
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

  // Compose the right-side cluster: caller-provided `right` node + View all button + collapse toggle.
  // stopPropagation prevents the cluster's interactive elements (buttons) from
  // bubbling up to the section header's collapse-on-click handler.
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
 * MiniStat — a compact sub-stat tile used inside grouped sections.
 * Pairs a small icon + label with a big value and optional hint line.
 */
function MiniStat({
  label,
  value,
  icon: Icon,
  color = 'text-muted-foreground',
  hint,
}: {
  label: string
  value: React.ReactNode
  icon: any
  color?: string
  hint?: React.ReactNode
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
 * LoanPortfolioCard — visualises the loan portfolio breakdown as
 * a stacked horizontal progress bar + legend. Replaces the old
 * inline badge soup with a single, scannable visual.
 */
function LoanPortfolioCard({
  total, active, completed, overdue, pending,
}: {
  total: number
  active: number
  completed: number
  overdue: number
  pending: number
}) {
  const safeTotal = Math.max(total, 1) // avoid divide-by-zero when total is 0
  const segments = [
    { label: 'Active', value: active, color: 'bg-amber-500', text: 'text-amber-600' },
    { label: 'Repaid', value: completed, color: 'bg-emerald-500', text: 'text-emerald-600' },
    { label: 'Overdue', value: overdue, color: 'bg-red-500', text: 'text-red-600' },
    { label: 'Pending', value: pending, color: 'bg-slate-400', text: 'text-slate-500' },
  ]
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Loan Portfolio</p>
            <p className="text-2xl font-bold mt-0.5">{total}</p>
          </div>
          <FileText className="w-5 h-5 text-muted-foreground/60" />
        </div>
        {/* Stacked bar */}
        <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
          {segments.map(seg => (
            seg.value > 0 && (
              <div
                key={seg.label}
                className={cn('h-full transition-all', seg.color)}
                style={{ width: `${(seg.value / safeTotal) * 100}%` }}
                title={`${seg.label}: ${seg.value}`}
              />
            )
          ))}
        </div>
        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {segments.map(seg => (
            <div key={seg.label} className="flex items-center gap-1.5 text-xs">
              <span className={cn('w-2 h-2 rounded-sm', seg.color)} />
              <span className="text-muted-foreground">{seg.label}</span>
              <span className={cn('ml-auto font-semibold', seg.text)}>{seg.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Tenant Admin Dashboard ───────────────────────────────────────

interface DashboardStats {
  farmerCount: number; vslaCount: number; totalSavings: number
  activeLoanCount: number; marketListings: number; trainingCount: number
  maleCount: number; femaleCount: number; groupCount: number
  loanCount: number; completedLoans: number; overdueLoans: number; pendingLoans: number
}
interface Transaction { id: string; type: string; recipientName: string; amount: number; status: string; createdAt: string; description?: string }
interface MonthlyReg { month: string; count: number }
interface VslaSavingsRow { name: string; total: number }

function TenantAdminDashboard() {
  const setActiveModule = useAppStore(s => s.setActiveModule)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [monthlyRegs, setMonthlyRegs] = useState<MonthlyReg[]>([])
  const [vslaSavings, setVslaSavings] = useState<VslaSavingsRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async (opts?: { silent?: boolean }) => {
    if (opts?.silent) setRefreshing(true); else setLoading(true)
    try {
      const res = await fetch('/api/dashboard/stats')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setStats(data.stats || {
        farmerCount: 0, vslaCount: 0, totalSavings: 0,
        activeLoanCount: 0, marketListings: 0, trainingCount: 0,
        maleCount: 0, femaleCount: 0, groupCount: 0,
        loanCount: 0, completedLoans: 0, overdueLoans: 0, pendingLoans: 0,
      })
      setTransactions(data.recentTransactions || [])
      setMonthlyRegs(data.monthlyRegistrations || [])
      setVslaSavings(data.vslaSavingsByGroup || [])
      setLastUpdated(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <DashboardSkeleton />
  if (!stats) return <DashboardError />

  const s = stats
  const fmtMoney = (num: number) => 'UGX ' + num.toLocaleString()
  const fmtCompact = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}k`
    return String(num)
  }
  const lineConfig: ChartConfig = { count: { label: 'Farmers', color: 'var(--chart-1)' } }
  const savingsConfig: ChartConfig = { total: { label: 'Savings (UGX)', color: 'var(--chart-2)' } }
  const totalGender = s.maleCount + s.femaleCount
  const malePct = totalGender ? Math.round((s.maleCount / totalGender) * 100) : 0
  const femalePct = totalGender ? 100 - malePct : 0

  return (
    <div className="space-y-8">
      {/* ─── Page Header ─── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Tenant Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Overview of your cooperative / organization
            {lastUpdated && (
              <span className="ml-2 text-xs text-muted-foreground/70">
                · Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => fetchData({ silent: true })}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border bg-background hover:bg-accent transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* ─── Hero KPI Strip ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Farmers" value={s.farmerCount.toLocaleString()} icon={Users} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" trend="+12%" />
        <StatCard label="Total Savings" value={fmtCompact(s.totalSavings)} icon={Wallet} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600" />
        <StatCard label="Active Loans" value={s.activeLoanCount} icon={CreditCard} color="bg-amber-50 dark:bg-amber-950/40 text-amber-600" />
        <StatCard label="Market Listings" value={s.marketListings} icon={Store} color="bg-purple-50 dark:bg-purple-950/40 text-purple-600" />
      </div>

      {/* ─── Section 1 · Farmer Network ─── */}
      <DashboardSection
        icon={Users}
        title="Farmer Network"
        description="Registry composition and monthly growth"
        accent="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600"
        collapsible
        onViewAll={() => setActiveModule('farmers')}
        viewAllLabel="Open Farmer Profiling"
        right={
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500" />Male {malePct}%</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-pink-500" />Female {femalePct}%</span>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Mini stats column */}
          <div className="grid grid-cols-2 gap-4 lg:col-span-1">
            <MiniStat
              label="Total Farmers"
              value={s.farmerCount.toLocaleString()}
              icon={Users}
              color="text-emerald-600"
              hint={
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    M {s.maleCount}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                    F {s.femaleCount}
                  </span>
                </div>
              }
            />
            <MiniStat
              label="Farmer Groups"
              value={s.groupCount}
              icon={Users}
              color="text-indigo-600"
              hint="Active groupings"
            />
            {/* Gender split bar */}
            <Card className="col-span-2">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Gender Distribution</p>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
                  <div className="h-full bg-blue-500" style={{ width: `${malePct}%` }} />
                  <div className="h-full bg-pink-500" style={{ width: `${femalePct}%` }} />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span><span className="font-semibold text-blue-600">{s.maleCount}</span> Male ({malePct}%)</span>
                  <span><span className="font-semibold text-pink-600">{s.femaleCount}</span> Female ({femalePct}%)</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Registration chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm">Farmer Registrations · Last 12 months</CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">Monthly new active farmer registrations</p>
              </div>
              <BarChart3 className="w-4 h-4 text-muted-foreground/60" />
            </CardHeader>
            <CardContent>
              <ChartContainer config={lineConfig} className="h-[240px] w-full">
                <BarChart data={monthlyRegs.map(m => ({ ...m, month: formatMonth(m.month) }))}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </DashboardSection>

      {/* ─── Section 2 · Financial Health ─── */}
      <DashboardSection
        icon={Landmark}
        title="Financial Health"
        description="VSLA savings pool and loan portfolio composition"
        accent="bg-blue-50 dark:bg-blue-950/40 text-blue-600"
        collapsible
        onViewAll={() => setActiveModule('vsla')}
        viewAllLabel="Open VSLA Management"
        right={
          <Badge variant="outline" className="text-[11px] font-normal">
            <PiggyBank className="w-3 h-3 mr-1" />
            {s.vslaCount} VSLA groups
          </Badge>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* VSLA Savings by group chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm">VSLA Savings by Group · Top 10</CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Cumulative completed savings · Total {fmtMoney(s.totalSavings)}
                </p>
              </div>
              <PieChartIcon className="w-4 h-4 text-muted-foreground/60" />
            </CardHeader>
            <CardContent>
              {vslaSavings.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  <PiggyBank className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No VSLA savings recorded yet
                </div>
              ) : (
                <ChartContainer config={savingsConfig} className="h-[260px] w-full">
                  <BarChart data={vslaSavings} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => fmtCompact(v)} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} axisLine={false} tickLine={false} />
                    <ChartTooltip content={<ChartTooltipContent formatter={(v: any) => fmtMoney(Number(v))} />} />
                    <Bar dataKey="total" fill="var(--chart-2)" radius={[0, 6, 6, 0]}>
                      {vslaSavings.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Loan portfolio card + total savings */}
          <div className="space-y-4">
            <LoanPortfolioCard
              total={s.loanCount}
              active={s.activeLoanCount}
              completed={s.completedLoans}
              overdue={s.overdueLoans}
              pending={s.pendingLoans}
            />
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Savings Pool</p>
                  <p className="text-2xl font-bold mt-1">{fmtMoney(s.totalSavings)}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Across {s.vslaCount} VSLA {s.vslaCount === 1 ? 'group' : 'groups'}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardSection>

      {/* ─── Section 3 · Programs & Market ─── */}
      <DashboardSection
        icon={Sprout}
        title="Programs & Market"
        description="Capacity-building activities and market activity"
        accent="bg-purple-50 dark:bg-purple-950/40 text-purple-600"
        collapsible
        onViewAll={() => setActiveModule('training')}
        viewAllLabel="Open Training & Groups"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniStat label="VSLA Groups" value={s.vslaCount} icon={PiggyBank} color="text-blue-600" hint="Active savings groups" />
          <MiniStat label="Trainings" value={s.trainingCount} icon={GraduationCap} color="text-purple-600" hint="Total conducted" />
          <MiniStat label="Market Listings" value={s.marketListings} icon={Store} color="text-pink-600" hint="Currently available" />
          <MiniStat label="Farmer Groups" value={s.groupCount} icon={Users} color="text-indigo-600" hint="Active cooperatives" />
        </div>
      </DashboardSection>

      {/* ─── Section 4 · Geographic Distribution ─── */}
      <DashboardSection
        icon={MapPin}
        title="Geographic Distribution"
        description="Farmer plot locations and district-level density"
        accent="bg-teal-50 dark:bg-teal-950/40 text-teal-600"
        collapsible
        defaultCollapsed
        onViewAll={() => setActiveModule('farm-lands')}
        viewAllLabel="Open Farm Land Registry"
      >
        <MapDashboard />
      </DashboardSection>

      {/* ─── Section 5 · Recent Activity ─── */}
      <DashboardSection
        icon={Activity}
        title="Recent Activity"
        description="Latest payments and VSLA transactions"
        accent="bg-slate-100 dark:bg-slate-900/40 text-slate-600"
        collapsible
        onViewAll={() => setActiveModule('payments')}
        viewAllLabel="Open Payments"
        right={transactions.length > 0 && (
          <Badge variant="outline" className="text-[11px] font-normal">
            <Clock className="w-3 h-3 mr-1" />
            Last {Math.min(transactions.length, 8)} of {transactions.length}
          </Badge>
        )}
      >
        <Card>
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No recent transactions
              </div>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="w-[110px]">Type</TableHead><TableHead>Recipient</TableHead>
                  <TableHead className="text-right">Amount</TableHead><TableHead className="w-[140px]">Date</TableHead><TableHead className="w-[110px]">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {transactions.slice(0, 8).map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell><Badge variant="outline" className="text-[10px] font-mono">{tx.type || 'PAYMENT'}</Badge></TableCell>
                      <TableCell className="font-medium text-sm">{tx.recipientName}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{fmtMoney(tx.amount)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}</TableCell>
                      <TableCell><Badge className={cn('text-[10px]', statusColor[tx.status] || 'bg-gray-100')}>{tx.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </DashboardSection>
    </div>
  )
}

// ─── Country Admin Dashboard ──────────────────────────────────────

function CountryAdminDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  if (loading) return <DashboardSkeleton />
  if (error || !data || !data.stats) return <DashboardError />

  const s = data.stats || {}
  const fmt = (n: number) => n?.toLocaleString() || '0'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Country Dashboard</h2>
        <p className="text-sm text-muted-foreground">Overview across all tenants in your country</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Farmers" value={fmt(s.farmerCount)} icon={Users} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" />
        <StatCard label="VSLA Groups" value={fmt(s.vslaCount)} icon={PiggyBank} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600" />
        <StatCard label="Total Savings" value={`UGX ${fmt(s.totalSavings)}`} icon={DollarSign} color="bg-amber-50 dark:bg-amber-950/40 text-amber-600" />
        <StatCard label="Active Loans" value={fmt(s.activeLoanCount)} icon={CreditCard} color="bg-purple-50 dark:bg-purple-950/40 text-purple-600" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Trainings" value={fmt(s.trainingCount)} icon={GraduationCap} color="bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600" />
        <StatCard label="Market Listings" value={fmt(s.marketListings)} icon={Store} color="bg-pink-50 dark:bg-pink-950/40 text-pink-600" />
        <StatCard label="Farmer Groups" value={fmt(s.groupCount)} icon={Users} color="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600" />
        <StatCard label="Total Loans" value={fmt(s.loanCount)} icon={FileText} color="bg-teal-50 dark:bg-teal-950/40 text-teal-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Farmer Registrations (Monthly)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={(data.monthlyRegistrations || []).map((m: any) => ({ ...m, month: formatMonth(m.month) }))}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">VSLA Savings by Group</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.vslaSavingsByGroup || []} layout="vertical">
                <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="total" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Super Admin Dashboard ────────────────────────────────────────

function SuperAdminDashboard() {
  const setActiveModule = useAppStore(s => s.setActiveModule)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async (opts?: { silent?: boolean }) => {
    if (opts?.silent) setRefreshing(true); else setLoading(true)
    try {
      const res = await fetch('/api/admin/dashboard')
      if (!res.ok) { setData(null); return }
      const d = await res.json()
      setData(d)
      setLastUpdated(new Date())
    } catch {
      setData(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <DashboardSkeleton />
  if (!data) return <DashboardError />

  const countryData = Object.entries(data.tenants?.byCountry || {}).map(([name, value]) => ({ name, value: value as number }))
  const planData = Object.entries(data.revenue?.byPlan || {}).map(([name, value]) => ({ name, value: value as number }))
  const fmtMoney = (n: number) => `$${(n || 0).toLocaleString()}`
  const fmtMrr = (n: number) => `$${((n || 0) / 1000).toFixed(1)}K`
  const newFarmers30d = data.recentActivity?.newFarmers || 0
  const newTenants30d = data.recentActivity?.newTenants || 0
  const newLoans30d = data.recentActivity?.newLoans || 0
  const newPayments30d = data.recentActivity?.newPayments || 0
  const totalRecent = newFarmers30d + newTenants30d + newLoans30d + newPayments30d
  const safeRecentTotal = Math.max(totalRecent, 1)
  const recentSegments = [
    { label: 'Farmers', value: newFarmers30d, color: 'bg-emerald-500', text: 'text-emerald-600' },
    { label: 'Tenants', value: newTenants30d, color: 'bg-blue-500', text: 'text-blue-600' },
    { label: 'Loans', value: newLoans30d, color: 'bg-amber-500', text: 'text-amber-600' },
    { label: 'Payments', value: newPayments30d, color: 'bg-purple-500', text: 'text-purple-600' },
  ]
  const countryConfig: ChartConfig = { value: { label: 'Tenants', color: 'var(--chart-3)' } }
  const planConfig: ChartConfig = { value: { label: 'Subscriptions', color: 'var(--chart-4)' } }
  const recentTenants = data.tenants?.recent || []

  return (
    <div className="space-y-8">
      {/* ─── Page Header ─── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Platform Overview</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cross-tenant platform metrics across all countries
            {lastUpdated && (
              <span className="ml-2 text-xs text-muted-foreground/70">
                · Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => fetchData({ silent: true })}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border bg-background hover:bg-accent transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* ─── Hero KPI Strip ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Tenants" value={data.tenants?.active || 0} icon={Building2} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600" />
        <StatCard label="Total Farmers" value={(data.farmers?.total || 0).toLocaleString()} icon={Users} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" />
        <StatCard label="MRR" value={fmtMrr(data.revenue?.mrr || 0)} icon={DollarSign} color="bg-amber-50 dark:bg-amber-950/40 text-amber-600" />
        <StatCard label="EUDR Compliance" value={`${data.compliance?.eudrRate || 0}%`} icon={CheckCircle} color="bg-purple-50 dark:bg-purple-950/40 text-purple-600" />
      </div>

      {/* ─── Section 1 · Tenant Distribution ─── */}
      <DashboardSection
        icon={Building2}
        title="Tenant Distribution"
        description="Active tenants by country and subscription plan"
        accent="bg-blue-50 dark:bg-blue-950/40 text-blue-600"
        collapsible
        onViewAll={() => setActiveModule('super-admin-tenants')}
        viewAllLabel="Open Tenants"
        right={
          <Badge variant="outline" className="text-[11px] font-normal">
            <Building2 className="w-3 h-3 mr-1" />
            {data.tenants?.active || 0} active
          </Badge>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Country breakdown pie */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm">Tenants by Country</CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {countryData.length} {countryData.length === 1 ? 'country' : 'countries'} · {data.tenants?.active || 0} tenants
                </p>
              </div>
              <MapPin className="w-4 h-4 text-muted-foreground/60" />
            </CardHeader>
            <CardContent>
              {countryData.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No tenant data yet
                </div>
              ) : (
                <ChartContainer config={countryConfig} className="h-[220px] w-full">
                  <PieChart>
                    <Pie data={countryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e: any) => e.name}>
                      {countryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Plan breakdown pie */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm">Subscriptions by Plan</CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {planData.length} {planData.length === 1 ? 'plan' : 'plans'} · {data.revenue?.activeSubscriptions || 0} active
                </p>
              </div>
              <CreditCard className="w-4 h-4 text-muted-foreground/60" />
            </CardHeader>
            <CardContent>
              {planData.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No subscription data yet
                </div>
              ) : (
                <ChartContainer config={planConfig} className="h-[220px] w-full">
                  <PieChart>
                    <Pie data={planData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e: any) => e.name}>
                      {planData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardSection>

      {/* ─── Section 2 · Revenue & Subscriptions ─── */}
      <DashboardSection
        icon={DollarSign}
        title="Revenue & Subscriptions"
        description="MRR, active subscriptions, and revenue by plan"
        accent="bg-amber-50 dark:bg-amber-950/40 text-amber-600"
        collapsible
        onViewAll={() => setActiveModule('super-admin-revenue')}
        viewAllLabel="Open Revenue"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniStat label="MRR" value={fmtMrr(data.revenue?.mrr || 0)} icon={DollarSign} color="text-amber-600" hint="Monthly recurring revenue" />
          <MiniStat label="Active Subscriptions" value={data.revenue?.activeSubscriptions || 0} icon={CreditCard} color="text-pink-600" hint="Across all tenants" />
          <MiniStat label="Active Tenants" value={data.tenants?.active || 0} icon={Building2} color="text-blue-600" hint="Paying + trial" />
          <MiniStat label="ARPU" value={fmtMoney((data.revenue?.mrr || 0) / Math.max(data.tenants?.active || 1, 1))} icon={TrendingUp} color="text-emerald-600" hint="Avg revenue / tenant" />
        </div>
      </DashboardSection>

      {/* ─── Section 3 · Platform Impact ─── */}
      <DashboardSection
        icon={Leaf}
        title="Platform Impact"
        description="Carbon credits, impact events, EUDR compliance"
        accent="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600"
        collapsible
        onViewAll={() => setActiveModule('super-admin-impact')}
        viewAllLabel="Open Impact"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniStat label="Impact Events" value={data.impact?.totalImpactEvents || 0} icon={Activity} color="text-indigo-600" hint="Total tracked" />
          <MiniStat label="Carbon Credits" value={data.impact?.carbonCreditsIssued || 0} icon={Leaf} color="text-emerald-600" hint="Issued (tCO₂e)" />
          <MiniStat label="EUDR Compliance" value={`${data.compliance?.eudrRate || 0}%`} icon={CheckCircle} color="text-purple-600" hint="Of active farmers" />
          <MiniStat label="VSLA Groups" value={data.platform?.activeVslaGroups || 0} icon={PiggyBank} color="text-cyan-600" hint="Across all tenants" />
        </div>
      </DashboardSection>

      {/* ─── Section 4 · Recent Activity (30d) ─── */}
      <DashboardSection
        icon={Activity}
        title="Recent Activity · 30 days"
        description="Net-new entities across the platform in the last 30 days"
        accent="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600"
        collapsible
        right={
          <Badge variant="outline" className="text-[11px] font-normal">
            <Clock className="w-3 h-3 mr-1" />
            {totalRecent} events
          </Badge>
        }
      >
        <Card>
          <CardContent className="p-4 space-y-3">
            {/* Stacked bar */}
            <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
              {recentSegments.map(seg => (
                seg.value > 0 && (
                  <div
                    key={seg.label}
                    className={cn('h-full transition-all', seg.color)}
                    style={{ width: `${(seg.value / safeRecentTotal) * 100}%` }}
                    title={`${seg.label}: ${seg.value}`}
                  />
                )
              ))}
            </div>
            {/* Legend + values */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {recentSegments.map(seg => (
                <div key={seg.label} className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-sm', seg.color)} />
                  <div className="flex-1">
                    <p className="text-[11px] text-muted-foreground">{seg.label}</p>
                    <p className={cn('text-base font-bold leading-tight', seg.text)}>{seg.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </DashboardSection>

      {/* ─── Section 5 · Recently Onboarded Tenants ─── */}
      <DashboardSection
        icon={Building2}
        title="Recently Onboarded Tenants"
        description="Latest tenants added to the platform"
        accent="bg-slate-100 dark:bg-slate-900/40 text-slate-600"
        collapsible
        defaultCollapsed
        onViewAll={() => setActiveModule('super-admin-tenants')}
        viewAllLabel="Open Tenants"
        right={recentTenants.length > 0 && (
          <Badge variant="outline" className="text-[11px] font-normal">
            <Clock className="w-3 h-3 mr-1" />
            Last {Math.min(recentTenants.length, 10)} of {recentTenants.length}
          </Badge>
        )}
      >
        <Card>
          <CardContent className="p-0">
            {recentTenants.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No recently onboarded tenants
              </div>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Country</TableHead>
                  <TableHead className="text-right">Users</TableHead><TableHead className="text-right">Farmers</TableHead><TableHead className="text-center">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {recentTenants.slice(0, 10).map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium text-sm">{t.name}</TableCell>
                      <TableCell className="text-sm">{t.type}</TableCell>
                      <TableCell className="text-sm">{t.country || '—'}</TableCell>
                      <TableCell className="text-right text-sm">{t._count?.users || 0}</TableCell>
                      <TableCell className="text-right text-sm">{t._count?.farmerProfiles || 0}</TableCell>
                      <TableCell className="text-center"><Badge variant={t.isActive ? 'default' : 'secondary'} className="text-[10px]">{t.isActive ? 'Active' : 'Suspended'}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </DashboardSection>
    </div>
  )
}

// ─── Farmer Dashboard ─────────────────────────────────────────────

function FarmerDashboard({ userId }: { userId: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch farmer's own profile + their data
    fetch(`/api/mobile/dashboard?userId=${userId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [userId])

  if (loading) return <DashboardSkeleton />

  const farmer = data?.farmer || {}
  const farms = data?.farms || []
  const trainings = data?.upcomingTrainings || []
  const savings = data?.savings || 0
  const loans = data?.loans || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">My Farm Dashboard</h2>
        <p className="text-sm text-muted-foreground">Your farm overview and upcoming activities</p>
      </div>

      {/* Personal Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="My Farm Lands" value={farms.length} icon={MapPin} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" />
        <StatCard label="My Savings" value={`UGX ${savings.toLocaleString()}`} icon={PiggyBank} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600" />
        <StatCard label="Active Loans" value={loans.filter((l: any) => l.status === 'DISBURSED').length} icon={DollarSign} color="bg-amber-50 dark:bg-amber-950/40 text-amber-600" />
        <StatCard label="Upcoming Trainings" value={trainings.length} icon={GraduationCap} color="bg-purple-50 dark:bg-purple-950/40 text-purple-600" />
      </div>

      {/* My Farms */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">My Farm Lands</CardTitle></CardHeader>
        <CardContent className="p-0">
          {farms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No farm lands registered yet</div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Farm Name</TableHead><TableHead>Area (ha)</TableHead><TableHead>Crops</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {farms.map((f: any) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium text-sm">{f.name}</TableCell>
                    <TableCell className="text-sm">{f.sizeHectares?.toFixed(2) ?? '—'}</TableCell>
                    <TableCell className="text-sm">{f._count?.cultivations || 0} cultivation(s)</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Trainings */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Upcoming Trainings</CardTitle></CardHeader>
        <CardContent>
          {trainings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No upcoming trainings</div>
          ) : (
            <div className="space-y-2">
              {trainings.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{t.topic}</p>
                    <p className="text-xs text-muted-foreground">{t.date ? new Date(t.date).toLocaleDateString() : '—'} {t.location && `· ${t.location}`}</p>
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

// ─── VSLA Member Dashboard ────────────────────────────────────────

function VslaMemberDashboard({ userId }: { userId: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/mobile/dashboard?userId=${userId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [userId])

  if (loading) return <DashboardSkeleton />

  const savings = data?.savings || 0
  const loans = data?.loans || []
  const meetings = data?.upcomingMeetings || []
  const group = data?.vslaGroup || {}

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">My VSLA Dashboard</h2>
        <p className="text-sm text-muted-foreground">Savings, loans, and meeting schedule</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Savings" value={`UGX ${savings.toLocaleString()}`} icon={PiggyBank} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" />
        <StatCard label="Active Loans" value={loans.filter((l: any) => l.status === 'DISBURSED').length} icon={DollarSign} color="bg-amber-50 dark:bg-amber-950/40 text-amber-600" />
        <StatCard label="Shares Owned" value={data?.sharesOwned || 0} icon={Award} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600" />
        <StatCard label="Upcoming Meetings" value={meetings.length} icon={Calendar} color="bg-purple-50 dark:bg-purple-950/40 text-purple-600" />
      </div>

      {/* My VSLA Group */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">My VSLA Group: {group.name || '—'}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><p className="text-muted-foreground text-xs">Share Value</p><p className="font-medium">UGX {group.shareValue?.toLocaleString() || '—'}</p></div>
          <div><p className="text-muted-foreground text-xs">Loan Rate</p><p className="font-medium">{group.loanRate || '—'}%</p></div>
          <div><p className="text-muted-foreground text-xs">Max Loan</p><p className="font-medium">UGX {group.maxLoanAmount?.toLocaleString() || '—'}</p></div>
          <div><p className="text-muted-foreground text-xs">Meeting</p><p className="font-medium">{group.meetingFrequency || 'Weekly'}</p></div>
        </CardContent>
      </Card>

      {/* Upcoming Meetings */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Upcoming Meetings</CardTitle></CardHeader>
        <CardContent>
          {meetings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No upcoming meetings scheduled</div>
          ) : (
            <div className="space-y-2">
              {meetings.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{m.agenda || 'VSLA Meeting'}</p>
                    <p className="text-xs text-muted-foreground">{m.meetingDate ? new Date(m.meetingDate).toLocaleDateString() : '—'} {m.startTime && `at ${m.startTime}`}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Extension Officer Dashboard ──────────────────────────────────

function ExtensionOfficerDashboard({ userId }: { userId: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />

  const s = data?.stats || {}

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Extension Officer Dashboard</h2>
        <p className="text-sm text-muted-foreground">Farmers under your advisory, trainings, and farm visits</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Farmers Registered" value={s.farmerCount || 0} icon={Users} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" />
        <StatCard label="Trainings Conducted" value={s.trainingCount || 0} icon={GraduationCap} color="bg-purple-50 dark:bg-purple-950/40 text-purple-600" />
        <StatCard label="VSLA Groups" value={s.vslaCount || 0} icon={PiggyBank} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600" />
        <StatCard label="Farmer Groups" value={s.groupCount || 0} icon={Users} color="bg-amber-50 dark:bg-amber-950/40 text-amber-600" />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ActionCard label="Register Farmer" icon={UserCheck} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" />
          <ActionCard label="Schedule Training" icon={GraduationCap} color="bg-purple-50 dark:bg-purple-950/40 text-purple-600" />
          <ActionCard label="Log Farm Visit" icon={Leaf} color="bg-teal-50 dark:bg-teal-950/40 text-teal-600" />
          <ActionCard label="Log Mazao Safi Practice" icon={Sprout} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" />
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Agent Dashboard ──────────────────────────────────────────────

function AgentDashboard({ userId }: { userId: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />

  const s = data?.stats || {}

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Agent Dashboard</h2>
        <p className="text-sm text-muted-foreground">Farmer mobilization and field data collection</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Farmers Registered" value={s.farmerCount || 0} icon={Users} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" />
        <StatCard label="VSLA Savings" value={`UGX ${(s.totalSavings || 0).toLocaleString()}`} icon={PiggyBank} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600" />
        <StatCard label="Trainings" value={s.trainingCount || 0} icon={GraduationCap} color="bg-purple-50 dark:bg-purple-950/40 text-purple-600" />
        <StatCard label="Farmer Groups" value={s.groupCount || 0} icon={Users} color="bg-amber-50 dark:bg-amber-950/40 text-amber-600" />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <ActionCard label="Register Farmer" icon={UserCheck} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" />
          <ActionCard label="Record Saving" icon={PiggyBank} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600" />
          <ActionCard label="Enroll in Training" icon={GraduationCap} color="bg-purple-50 dark:bg-purple-950/40 text-purple-600" />
        </CardContent>
      </Card>
    </div>
  )
}

// ─── CBT Dashboard ────────────────────────────────────────────────

function CbtDashboard({ userId }: { userId: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />

  const s = data?.stats || {}

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">CBT Dashboard</h2>
        <p className="text-sm text-muted-foreground">Community-based training activities</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Trainings" value={s.trainingCount || 0} icon={GraduationCap} color="bg-purple-50 dark:bg-purple-950/40 text-purple-600" />
        <StatCard label="Farmers" value={s.farmerCount || 0} icon={Users} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" />
        <StatCard label="VSLA Groups" value={s.vslaCount || 0} icon={PiggyBank} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600" />
        <StatCard label="Market Listings" value={s.marketListings || 0} icon={Store} color="bg-pink-50 dark:bg-pink-950/40 text-pink-600" />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <ActionCard label="Schedule Training" icon={GraduationCap} color="bg-purple-50 dark:bg-purple-950/40 text-purple-600" />
          <ActionCard label="Mark Attendance" icon={CheckCircle} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" />
          <ActionCard label="View Farmers" icon={Users} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600" />
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Shared Action Card ───────────────────────────────────────────

function ActionCard({ label, icon: Icon, color }: { label: string; icon: any; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-2', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-xs font-medium text-center">{label}</span>
    </div>
  )
}
