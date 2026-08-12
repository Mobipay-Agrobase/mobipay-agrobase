'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  BarChart3, Users, MapPin, Sprout, PiggyBank, DollarSign, GraduationCap,
  CreditCard, Loader2, Database, TrendingUp, Activity, RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const PALETTE = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#ec4899', '#64748b']

interface Row { label: string; value: number; [k: string]: any }

export default function ReportsView() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/reports/analytics')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(d => setData(d))
      .catch(e => { console.error(e); toast.error(`Failed to load analytics: ${e.message}`) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-sm text-muted-foreground">Computing analytics…</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><div className="h-24 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Database className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="font-medium">Failed to load analytics</p>
          <Button className="mt-4" onClick={load} variant="outline"><RefreshCw className="w-4 h-4 mr-2" /> Retry</Button>
        </CardContent>
      </Card>
    )
  }

  const ov = data.overview || {}

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Reports & Analytics</h3>
          <p className="text-sm text-muted-foreground">Multi-dimensional insights across farmers, farms, finances, and programs</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} /> Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview" className="gap-1.5"><Activity className="w-3.5 h-3.5" /> Overview</TabsTrigger>
          <TabsTrigger value="demographics" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Demographics</TabsTrigger>
          <TabsTrigger value="crops" className="gap-1.5"><Sprout className="w-3.5 h-3.5" /> Crops &amp; Farm</TabsTrigger>
          <TabsTrigger value="geography" className="gap-1.5"><MapPin className="w-3.5 h-3.5" /> Geography</TabsTrigger>
          {data.vsla && <TabsTrigger value="vsla" className="gap-1.5"><PiggyBank className="w-3.5 h-3.5" /> VSLA</TabsTrigger>}
          <TabsTrigger value="financial" className="gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Financial</TabsTrigger>
          <TabsTrigger value="training" className="gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> Training</TabsTrigger>
          <TabsTrigger value="credit" className="gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Credit</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Kpi label="Farmers" value={ov.farmerCount} icon={Users} color="text-emerald-600" />
            <Kpi label="Farm Lands" value={ov.farmLandCount} icon={MapPin} color="text-blue-600" />
            <Kpi label="Cultivations" value={ov.cultivationCount} icon={Sprout} color="text-amber-600" />
            <Kpi label="Trainings" value={ov.trainingsCount} icon={GraduationCap} color="text-cyan-600" />
            <Kpi label="Active Loans" value={ov.loansActive} icon={CreditCard} color="text-purple-600" />
            <Kpi label="Total Savings" value={fmtUGX(ov.savingsTotal)} icon={PiggyBank} color="text-rose-600" />
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Welcome to Analytics</CardTitle><CardDescription>Choose a tab above to explore detailed breakdowns — demographics (gender, age, education, marital status), crops, geography, VSLA portfolio, financial transactions, training attendance, and credit score distribution.</CardDescription></CardHeader>
          </Card>
        </TabsContent>

        {/* Demographics */}
        <TabsContent value="demographics" className="mt-4 space-y-4">
          {data.demographics ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Gender Distribution" desc="Active farmers by gender">
                  <PieChart500 data={data.demographics.gender} />
                </ChartCard>
                <ChartCard title="Education Levels" desc="Farmers by education attainment">
                  <BarChart500 data={data.demographics.education} />
                </ChartCard>
                <ChartCard title="Marital Status" desc="Marital status distribution">
                  <PieChart500 data={data.demographics.maritalStatus} />
                </ChartCard>
                <ChartCard title="Age Bands" desc="Farmers grouped by age range">
                  <BarChart500 data={data.demographics.ageBand} />
                </ChartCard>
                <ChartCard title="Member Type" desc="General / Commercial / Contract Farmer split">
                  <PieChart500 data={data.demographics.memberType} />
                </ChartCard>
              </div>
              <InsightList
                title="Demographic Insights"
                insights={buildDemographicInsights(data.demographics)}
              />
            </>
          ) : <EmptyState />}
        </TabsContent>

        {/* Crops & Farm Area */}
        <TabsContent value="crops" className="mt-4 space-y-4">
          {data.crops ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Kpi label="Total Crops Grown" value={data.crops.crops.length} icon={Sprout} color="text-emerald-600" />
                <Kpi label="Total Farm Area (ha)" value={data.crops.totalFarmSize.toFixed(2)} icon={MapPin} color="text-blue-600" />
                <Kpi label="Avg Farm Size (ha)" value={data.crops.avgFarmSize.toFixed(2)} icon={TrendingUp} color="text-amber-600" />
                <Kpi label="Farmers w/ Size" value={data.crops.farmersWithSize} icon={Users} color="text-purple-600" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Crop Distribution" desc="Top crops grown by farmer count">
                  <BarChart500 data={(data.crops.crops || []).slice(0, 12)} />
                </ChartCard>
                <ChartCard title="Farm Size Bands" desc="Farmers grouped by total farm area">
                  <BarChart500 data={data.farmArea?.bands || []} />
                </ChartCard>
                <ChartCard title="Land Ownership" desc="Owned / Rented / Leased">
                  <PieChart500 data={data.farmArea?.ownership || []} />
                </ChartCard>
              </div>
              <InsightList
                title="Crop &amp; Farm Insights"
                insights={buildCropInsights(data.crops, data.farmArea)}
              />
            </>
          ) : <EmptyState />}
        </TabsContent>

        {/* Geography */}
        <TabsContent value="geography" className="mt-4 space-y-4">
          {data.geography ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Farmers by District" desc="Top districts by farmer count">
                  <BarChart500 data={(data.geography.district || []).slice(0, 15)} />
                </ChartCard>
                <ChartCard title="Farmers by Sub-County" desc="Sub-county distribution">
                  <BarChart500 data={(data.geography.subCounty || []).slice(0, 15)} />
                </ChartCard>
                <ChartCard title="Top Villages" desc="Villages with most farmers">
                  <BarChart500 data={(data.geography.village || []).slice(0, 15)} />
                </ChartCard>
              </div>
              <InsightList
                title="Geographic Insights"
                insights={buildGeoInsights(data.geography)}
              />
            </>
          ) : <EmptyState />}
        </TabsContent>

        {/* VSLA */}
        {data.vsla && (
          <TabsContent value="vsla" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi label="VSLA Groups" value={data.vsla.groups} icon={PiggyBank} color="text-blue-600" />
              <Kpi label="Total Savings" value={fmtUGX(data.vsla.totalSavings)} icon={DollarSign} color="text-emerald-600" />
              <Kpi label="Savings Transactions" value={data.vsla.savingsCount} icon={Activity} color="text-amber-600" />
              <Kpi label="Loan Statuses" value={data.vsla.loansByStatus.length} icon={CreditCard} color="text-purple-600" />
            </div>
            <ChartCard title="Loan Portfolio by Status" desc="Loan counts and amounts by status">
              <BarChart500 data={(data.vsla.loansByStatus || []).map((r: any) => ({ label: r.label, value: r.count }))} />
            </ChartCard>
          </TabsContent>
        )}

        {/* Financial */}
        <TabsContent value="financial" className="mt-4 space-y-4">
          {data.financial ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Kpi label="Total Purchase Value" value={fmtUGX(data.financial.totalPurchaseValue)} icon={DollarSign} color="text-rose-600" />
                <Kpi label="Total Sales Value" value={fmtUGX(data.financial.totalSalesValue)} icon={DollarSign} color="text-emerald-600" />
                <Kpi label="Purchase Commodities" value={data.financial.purchasesByCommodity.length} icon={Sprout} color="text-blue-600" />
                <Kpi label="Sales Commodities" value={data.financial.salesByCommodity.length} icon={Sprout} color="text-amber-600" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Purchases by Commodity" desc="Total purchase value per commodity (UGX)">
                  <BarChart500 data={(data.financial.purchasesByCommodity || []).slice(0, 10)} />
                </ChartCard>
                <ChartCard title="Sales by Commodity" desc="Total sales revenue per commodity (UGX)">
                  <BarChart500 data={(data.financial.salesByCommodity || []).slice(0, 10)} />
                </ChartCard>
              </div>
            </>
          ) : <EmptyState />}
        </TabsContent>

        {/* Training */}
        <TabsContent value="training" className="mt-4 space-y-4">
          {data.training ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Kpi label="Total Trainings" value={data.training.totalTrainings} icon={GraduationCap} color="text-cyan-600" />
                <Kpi label="Total Attendance" value={data.training.totalAttendance} icon={Users} color="text-emerald-600" />
                <Kpi label="Avg Attendance" value={data.training.totalTrainings > 0 ? (data.training.totalAttendance / data.training.totalTrainings).toFixed(1) : '0'} icon={TrendingUp} color="text-amber-600" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Trainings by Topic" desc="Number of trainings per topic">
                  <BarChart500 data={(data.training.byTopic || []).slice(0, 12)} />
                </ChartCard>
                <ChartCard title="Attendance by Location" desc="Total attendance per location">
                  <BarChart500 data={(data.training.byLocation || []).slice(0, 12)} />
                </ChartCard>
              </div>
            </>
          ) : <EmptyState />}
        </TabsContent>

        {/* Credit */}
        <TabsContent value="credit" className="mt-4 space-y-4">
          {data.credit ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Kpi label="Credit Scores" value={data.credit.totalScores} icon={CreditCard} color="text-purple-600" />
                <Kpi label="Average Score" value={data.credit.avgScore.toFixed(1)} icon={TrendingUp} color="text-emerald-600" />
                <Kpi label="Scores 60+" value={(data.credit.bands || []).filter((b: any) => b.label === '61-80' || b.label === '81-100').reduce((s: number, b: any) => s + b.value, 0)} icon={Activity} color="text-blue-600" />
              </div>
              <ChartCard title="Credit Score Distribution" desc="Farmers by score band">
                <BarChart500 data={data.credit.bands || []} />
              </ChartCard>
            </>
          ) : <EmptyState />}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function fmtUGX(n: number) {
  return 'UGX ' + (Number(n) || 0).toLocaleString()
}

function Kpi({ label, value, icon: Icon, color }: { label: string; value: any; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <Icon className={cn('w-4 h-4', color)} />
        </div>
        <p className="text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}

function ChartCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        {desc && <CardDescription className="text-xs">{desc}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function BarChart500({ data }: { data: Row[] }) {
  if (!data || data.length === 0) return <EmptyState small />
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(v: any) => Number(v).toLocaleString()} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function PieChart500({ data }: { data: Row[] }) {
  if (!data || data.length === 0) return <EmptyState small />
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius="72%" label>
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Pie>
          <Tooltip formatter={(v: any) => Number(v).toLocaleString()} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function EmptyState({ small }: { small?: boolean }) {
  return (
    <div className={cn('text-center text-muted-foreground', small ? 'py-8' : 'py-12')}>
      <Database className={cn('mx-auto mb-2 opacity-40', small ? 'w-6 h-6' : 'w-10 h-10')} />
      <p className={cn('text-muted-foreground', small ? 'text-xs' : 'text-sm')}>No data available</p>
      {!small && <p className="text-xs mt-1">Data will appear once records are created.</p>}
    </div>
  )
}

function InsightList({ title, insights }: { title: string; insights: string[] }) {
  if (insights.length === 0) return null
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600" /> {title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5 text-sm">
          {insights.map((s, i) => (
            <li key={i} className="flex items-start gap-2">
              <Badge variant="outline" className="text-[10px] mt-0.5">{i + 1}</Badge>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function topItem(rows: Row[] | undefined): { label: string; value: number; pct: number } | null {
  if (!rows || rows.length === 0) return null
  const total = rows.reduce((s, r) => s + (r.value || 0), 0)
  const top = [...rows].sort((a, b) => b.value - a.value)[0]
  return { label: top.label, value: top.value, pct: total > 0 ? Math.round((top.value / total) * 100) : 0 }
}

function buildDemographicInsights(d: any): string[] {
  const out: string[] = []
  const g = topItem(d.gender)
  if (g) out.push(`Gender split: ${g.label} leads with ${g.value} farmers (${g.pct}%).`)
  const ed = topItem(d.education)
  if (ed) out.push(`Most common education: ${ed.label} (${ed.value} farmers, ${ed.pct}%).`)
  const m = topItem(d.maritalStatus)
  if (m) out.push(`Marital status: ${m.label} is most common (${m.pct}%).`)
  const a = topItem(d.ageBand)
  if (a) out.push(`Largest age band: ${a.label} (${a.value} farmers, ${a.pct}%).`)
  if (d.totalFarmers) out.push(`Total active farmers analysed: ${d.totalFarmers}.`)
  return out
}

function buildCropInsights(c: any, fa: any): string[] {
  const out: string[] = []
  const top = topItem(c.crops)
  if (top) out.push(`Top crop: ${top.label} grown by ${top.value} farmers.`)
  if (c.crops?.length) out.push(`${c.crops.length} distinct crops recorded across the tenant.`)
  if (c.avgFarmSize) out.push(`Average farm size: ${Number(c.avgFarmSize).toFixed(2)} ha.`)
  if (c.totalFarmSize) out.push(`Total cultivated area: ${Number(c.totalFarmSize).toFixed(2)} ha.`)
  const ow = topItem(fa?.ownership)
  if (ow) out.push(`Land ownership: ${ow.label} (${ow.pct}%).`)
  const band = topItem(fa?.bands)
  if (band) out.push(`Most common farm-size band: ${band.label} (${band.value} farmers).`)
  return out
}

function buildGeoInsights(g: any): string[] {
  const out: string[] = []
  const d = topItem(g.district)
  if (d) out.push(`Top district: ${d.label} (${d.value} farmers, ${d.pct}%).`)
  const sc = topItem(g.subCounty)
  if (sc) out.push(`Top sub-county: ${sc.label} (${sc.value} farmers).`)
  if (g.district?.length) out.push(`Farmers span ${g.district.length} districts and ${g.subCounty.length} sub-counties.`)
  return out
}
