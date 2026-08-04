'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  ArrowLeft, Users, DollarSign, TrendingUp, TrendingDown, Wallet,
  Landmark, Download, UserPlus, FileText, Calendar, AlertCircle,
  Percent, Activity, Award, Target,
} from 'lucide-react'
import { toast } from 'sonner'

// Null-safe number formatter
const fmt = (v: unknown): string => (typeof v === 'number' && !isNaN(v) ? v.toLocaleString() : '0')
const fmtUgx = (v: unknown): string => `UGX ${fmt(v)}`
const safeNum = (v: unknown): number => (typeof v === 'number' && !isNaN(v) ? v : 0)

interface SaccoDetail {
  id: string
  name: string
  district: string | null
  registrationNo: string | null
  shareValue: number
  minShares: number
  interestRate: number
  maxLoanMultiplier: number
  isActive: boolean
  establishedAt: string | null
  members: Array<{
    id: string
    memberNumber: string
    fullName: string
    gender?: string | null
    occupation?: string | null
    sharesOwned: number
    totalSavings: number
    totalBorrowed: number
    totalRepaid: number
    status: string
    joinedAt: string
  }>
  loans: Array<{
    id: string
    loanNumber: string
    principal: number
    interestRate?: number
    interestAmount?: number
    totalRepayable: number
    amountRepaid: number
    purpose?: string | null
    status: string
    disbursedAt?: string | null
    dueDate?: string | null
    createdAt: string
  }>
}

const CHART_COLORS = ['#D4875A', '#5B8DB8', '#3CB4A0', '#E6A838', '#9B6B9E', '#6B8040', '#D45D5D', '#5A7A9B', '#B08050', '#764ba2']
const STATUS_COLORS: Record<string, string> = {
  PENDING: '#E6A838', APPROVED: '#5B8DB8', DISBURSED: '#3CB4A0',
  REPAID: '#6B8040', DEFAULTED: '#D45D5D', WRITTEN_OFF: '#9B6B9E',
}

interface Props {
  saccoId: string
  onBack: () => void
}

export function SaccoDetail({ saccoId, onBack }: Props) {
  const [detail, setDetail] = useState<SaccoDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/sacco/${saccoId}`)
      .then(r => r.json())
      .then(d => { setDetail(d.sacco || null); setLoading(false) })
      .catch(() => { toast.error('Failed to load SACCO detail'); setLoading(false) })
  }, [saccoId])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!detail) {
    return <div className="text-center text-muted-foreground p-8">SACCO not found</div>
  }

  const members = detail.members || []
  const loans = detail.loans || []
  const shareValue = safeNum(detail.shareValue)

  // ─── KPIs ─────────────────────────────────────────────────────
  const totalMembers = members.length
  const activeMembers = members.filter(m => m.status === 'ACTIVE').length
  const totalShares = members.reduce((s, m) => s + safeNum(m.sharesOwned), 0)
  const totalShareCapital = totalShares * shareValue
  const totalSavings = members.reduce((s, m) => s + safeNum(m.totalSavings), 0)
  const totalBorrowed = members.reduce((s, m) => s + safeNum(m.totalBorrowed), 0)
  const totalRepaid = members.reduce((s, m) => s + safeNum(m.totalRepaid), 0)
  const totalDisbursed = loans
    .filter(l => ['DISBURSED', 'REPAID', 'DEFAULTED'].includes(l.status))
    .reduce((s, l) => s + safeNum(l.principal), 0)
  const totalOutstanding = loans
    .filter(l => l.status === 'DISBURSED')
    .reduce((s, l) => s + (safeNum(l.totalRepayable) - safeNum(l.amountRepaid)), 0)
  const totalRepaidLoans = loans.reduce((s, l) => s + safeNum(l.amountRepaid), 0)
  const activeLoans = loans.filter(l => l.status === 'DISBURSED').length
  const pendingLoans = loans.filter(l => l.status === 'PENDING').length
  const repaidLoans = loans.filter(l => l.status === 'REPAID').length
  const defaultedLoans = loans.filter(l => l.status === 'DEFAULTED').length
  const portfolioAtRisk = loans
    .filter(l => l.status === 'DEFAULTED')
    .reduce((s, l) => s + (safeNum(l.totalRepayable) - safeNum(l.amountRepaid)), 0)
  const parRatio = totalDisbursed > 0 ? (portfolioAtRisk / totalDisbursed) * 100 : 0
  const repaymentRate = totalDisbursed > 0 ? (totalRepaidLoans / totalDisbursed) * 100 : 0
  const interestIncome = loans.reduce((s, l) => s + safeNum(l.interestAmount), 0)
  const avgLoanSize = loans.length > 0 ? totalDisbursed / loans.length : 0

  // ─── Chart Data ───────────────────────────────────────────────

  // Loan status distribution
  const loanStatusData = ['PENDING', 'DISBURSED', 'REPAID', 'DEFAULTED'].map(status => ({
    name: status, count: loans.filter(l => l.status === status).length,
    value: loans.filter(l => l.status === status).length,
    color: STATUS_COLORS[status],
  })).filter(d => d.count > 0)

  // Gender distribution
  const genderData = [
    { name: 'Male', value: members.filter(m => m.gender === 'Male').length, color: '#5B8DB8' },
    { name: 'Female', value: members.filter(m => m.gender === 'Female').length, color: '#D45D5D' },
    { name: 'Other', value: members.filter(m => m.gender && m.gender !== 'Male' && m.gender !== 'Female').length, color: '#9B6B9E' },
  ].filter(d => d.value > 0)

  // Occupation breakdown
  const occupationMap = new Map<string, number>()
  members.forEach(m => {
    const occ = m.occupation || 'Unknown'
    occupationMap.set(occ, (occupationMap.get(occ) || 0) + 1)
  })
  const occupationData = Array.from(occupationMap.entries()).map(([name, value], i) => ({
    name, value, color: CHART_COLORS[i % CHART_COLORS.length],
  })).sort((a, b) => b.value - a.value)

  // Loan purpose analysis
  const purposeMap = new Map<string, number>()
  loans.forEach(l => {
    const purpose = l.purpose || 'Unspecified'
    purposeMap.set(purpose, (purposeMap.get(purpose) || 0) + 1)
  })
  const purposeData = Array.from(purposeMap.entries()).map(([name, value], i) => ({
    name, value, color: CHART_COLORS[i % CHART_COLORS.length],
  })).sort((a, b) => b.value - a.value)

  // Loan disbursement + repayment trend (last 6 months)
  const now = new Date()
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 0)
    const monthLoans = loans.filter(l => {
      const created = new Date(l.createdAt)
      return created >= d && created <= monthEnd
    })
    const monthDisbursed = monthLoans
      .filter(l => ['DISBURSED', 'REPAID', 'DEFAULTED'].includes(l.status))
      .reduce((s, l) => s + safeNum(l.principal), 0)
    const monthRepaid = monthLoans.reduce((s, l) => s + safeNum(l.amountRepaid), 0)
    return {
      month: d.toLocaleDateString('en', { month: 'short' }),
      disbursed: Math.round(monthDisbursed / 1000),
      repaid: Math.round(monthRepaid / 1000),
    }
  })

  // Member growth trend
  const memberGrowthData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const cumulative = members.filter(m => new Date(m.joinedAt) <= d).length
    return {
      month: d.toLocaleDateString('en', { month: 'short' }),
      members: cumulative,
    }
  })

  // Top 5 members by share capital
  const topMembers = [...members]
    .sort((a, b) => (safeNum(b.sharesOwned) * shareValue) - (safeNum(a.sharesOwned) * shareValue))
    .slice(0, 5)
    .map(m => ({
      name: m.fullName,
      shares: safeNum(m.sharesOwned),
      capital: safeNum(m.sharesOwned) * shareValue,
    }))

  // Savings distribution (buckets)
  const savingsBuckets = [
    { name: '0-50K', count: members.filter(m => safeNum(m.totalSavings) < 50000).length, fill: '#D4875A' },
    { name: '50-100K', count: members.filter(m => safeNum(m.totalSavings) >= 50000 && safeNum(m.totalSavings) < 100000).length, fill: '#5B8DB8' },
    { name: '100-200K', count: members.filter(m => safeNum(m.totalSavings) >= 100000 && safeNum(m.totalSavings) < 200000).length, fill: '#3CB4A0' },
    { name: '200K+', count: members.filter(m => safeNum(m.totalSavings) >= 200000).length, fill: '#6B8040' },
  ]

  // Loan aging analysis (days outstanding)
  const agingBuckets = [
    { name: 'Current', count: 0, amount: 0, fill: '#3CB4A0' },
    { name: '1-30 days', count: 0, amount: 0, fill: '#E6A838' },
    { name: '31-60 days', count: 0, amount: 0, fill: '#D4875A' },
    { name: '61-90 days', count: 0, amount: 0, fill: '#D45D5D' },
    { name: '90+ days', count: 0, amount: 0, fill: '#9B6B9E' },
  ]
  loans.filter(l => l.status === 'DISBURSED').forEach(l => {
    const outstanding = safeNum(l.totalRepayable) - safeNum(l.amountRepaid)
    if (outstanding <= 0) return
    const daysOverdue = l.dueDate ? Math.max(0, Math.floor((now.getTime() - new Date(l.dueDate).getTime()) / 86400000)) : 0
    if (daysOverdue === 0) { agingBuckets[0].count++; agingBuckets[0].amount += outstanding }
    else if (daysOverdue <= 30) { agingBuckets[1].count++; agingBuckets[1].amount += outstanding }
    else if (daysOverdue <= 60) { agingBuckets[2].count++; agingBuckets[2].amount += outstanding }
    else if (daysOverdue <= 90) { agingBuckets[3].count++; agingBuckets[3].amount += outstanding }
    else { agingBuckets[4].count++; agingBuckets[4].amount += outstanding }
  })

  // Repayment rate gauge data
  const repaymentGauge = [{ name: 'Repayment', value: Math.round(repaymentRate), fill: repaymentRate > 80 ? '#3CB4A0' : repaymentRate > 60 ? '#E6A838' : '#D45D5D' }]

  // PAR gauge data
  const parGauge = [{ name: 'PAR', value: Math.round(parRatio), fill: parRatio < 5 ? '#3CB4A0' : parRatio < 10 ? '#E6A838' : '#D45D5D' }]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Landmark className="w-6 h-6 text-primary" />
              {detail.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {detail.district || 'No district'} · {detail.registrationNo || 'No reg. no.'} · Est. {detail.establishedAt ? new Date(detail.establishedAt).getFullYear() : '—'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => window.open(`/api/sacco/reports?saccoId=${detail.id}&type=summary&format=csv`, '_blank')}>
            <Download className="w-4 h-4 mr-1" /> Summary
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open(`/api/sacco/reports?saccoId=${detail.id}&type=members&format=csv`, '_blank')}>
            <Download className="w-4 h-4 mr-1" /> Members
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open(`/api/sacco/reports?saccoId=${detail.id}&type=loans&format=csv`, '_blank')}>
            <Download className="w-4 h-4 mr-1" /> Loans
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open(`/api/sacco/reports?saccoId=${detail.id}&type=financial-statement&format=csv`, '_blank')}>
            <FileText className="w-4 h-4 mr-1" /> Financials
          </Button>
        </div>
      </div>

      {/* KPI Cards — Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <KpiCard label="Members" value={fmt(activeMembers)} sub={`${totalMembers} total`} icon={Users} color="#5B8DB8" />
        <KpiCard label="Share Capital" value={`${(totalShareCapital / 1000000).toFixed(1)}M`} sub={`${fmt(totalShares)} shares`} icon={Wallet} color="#3CB4A0" />
        <KpiCard label="Total Savings" value={`${(totalSavings / 1000000).toFixed(1)}M`} sub="UGX" icon={DollarSign} color="#6B8040" />
        <KpiCard label="Disbursed" value={`${(totalDisbursed / 1000000).toFixed(1)}M`} sub="UGX" icon={TrendingUp} color="#E6A838" />
        <KpiCard label="Outstanding" value={`${(totalOutstanding / 1000000).toFixed(1)}M`} sub={`${activeLoans} active`} icon={TrendingDown} color="#D45D5D" />
        <KpiCard label="Avg Loan" value={`${(avgLoanSize / 1000).toFixed(0)}K`} sub="UGX" icon={Activity} color="#9B6B9E" />
        <KpiCard label="Interest Income" value={`${(interestIncome / 1000000).toFixed(1)}M`} sub="UGX" icon={Percent} color="#D4875A" />
      </div>

      {/* KPI Cards — Row 2 (Risk Metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <RiskCard label="Repayment Rate" value={`${repaymentRate.toFixed(1)}%`} icon={Target} color={repaymentRate > 80 ? '#3CB4A0' : '#E6A838'} sub={`${repaidLoans} repaid`} />
        <RiskCard label="Portfolio at Risk" value={`${parRatio.toFixed(1)}%`} icon={AlertCircle} color={parRatio < 5 ? '#3CB4A0' : '#D45D5D'} sub={`${defaultedLoans} defaulted`} />
        <RiskCard label="Pending Loans" value={fmt(pendingLoans)} icon={Calendar} color="#E6A838" sub="awaiting approval" />
        <RiskCard label="Active Loans" value={fmt(activeLoans)} icon={Activity} color="#5B8DB8" sub={`${(totalOutstanding / 1000000).toFixed(1)}M UGX outstanding`} />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="loans">Loan Analytics</TabsTrigger>
          <TabsTrigger value="members">Members ({totalMembers})</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Loan Disbursement + Repayment Trend */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Loan Disbursement & Repayment Trend (6 months, UGX '000)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="disbursedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E6A838" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#E6A838" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="repaidGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3CB4A0" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3CB4A0" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="disbursed" name="Disbursed" stroke="#E6A838" fill="url(#disbursedGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="repaid" name="Repaid" stroke="#3CB4A0" fill="url(#repaidGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Member Growth Trend */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Member Growth Trend (6 months)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={memberGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="members" name="Cumulative Members" stroke="#5B8DB8" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Loan Status Pie */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Loan Portfolio by Status</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={loanStatusData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} dataKey="value" label={({ name, count }: { name: string; count: number }) => `${name}: ${count}`} labelLine={false} style={{ fontSize: 11 }}>
                      {loanStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gender Distribution */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Gender Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={genderData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} dataKey="value" label={({ name, value }: { name: string; value: number }) => `${name}: ${value}`} labelLine={false} style={{ fontSize: 12 }}>
                      {genderData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top 5 Members by Share Capital */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Top 5 Members by Share Capital (UGX)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topMembers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `UGX ${v.toLocaleString()}`} />
                    <Bar dataKey="capital" fill="#D4875A" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Savings Distribution */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Member Savings Distribution (UGX)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={savingsBuckets}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Members" radius={[4, 4, 0, 0]}>
                      {savingsBuckets.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary Infographic */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Financial Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FinancialMetric label="Total Assets" value={totalSavings + totalOutstanding} sub="Savings + Loans Outstanding" color="#3CB4A0" />
                <FinancialMetric label="Member Equity" value={totalShareCapital + totalSavings} sub="Shares + Savings" color="#5B8DB8" />
                <FinancialMetric label="Interest Income" value={interestIncome} sub="From all loans" color="#E6A838" />
                <FinancialMetric label="Portfolio at Risk" value={portfolioAtRisk} sub={`${parRatio.toFixed(1)}% of disbursed`} color="#D45D5D" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loan Analytics Tab */}
        <TabsContent value="loans" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Repayment Rate Gauge */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Repayment Rate</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" data={repaymentGauge} startAngle={180} endAngle={0}>
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar background dataKey="value" cornerRadius={10} fill={repaymentGauge[0].fill} />
                    <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 32, fontWeight: 'bold', fill: repaymentGauge[0].fill }}>
                      {repaymentGauge[0].value}%
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
                <p className="text-center text-xs text-muted-foreground">{fmt(totalRepaidLoans)} UGX repaid out of {fmt(totalDisbursed)} UGX disbursed</p>
              </CardContent>
            </Card>

            {/* PAR Gauge */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Portfolio at Risk (PAR)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" data={parGauge} startAngle={180} endAngle={0}>
                    <PolarAngleAxis type="number" domain={[0, 30]} angleAxisId={0} tick={false} />
                    <RadialBar background dataKey="value" cornerRadius={10} fill={parGauge[0].fill} />
                    <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 32, fontWeight: 'bold', fill: parGauge[0].fill }}>
                      {parGauge[0].value}%
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
                <p className="text-center text-xs text-muted-foreground">{fmt(portfolioAtRisk)} UGX at risk out of {fmt(totalDisbursed)} UGX disbursed</p>
              </CardContent>
            </Card>

            {/* Loan Aging Analysis */}
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-sm">Loan Aging Analysis (Outstanding by Days Overdue)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={agingBuckets}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="count" name="Number of Loans" fill="#5B8DB8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="amount" name="Outstanding Amount (UGX)" fill="#D4875A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Loan Purpose Analysis */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Loan Purpose Analysis</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={purposeData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} dataKey="value" label={({ name, value }: { name: string; value: number }) => `${name}: ${value}`} labelLine={false} style={{ fontSize: 11 }}>
                      {purposeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Loan Portfolio Table */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Loan Portfolio Detail ({loans.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left py-2 px-3 font-medium">Loan #</th>
                        <th className="text-right py-2 px-3 font-medium">Principal</th>
                        <th className="text-right py-2 px-3 font-medium">Outstanding</th>
                        <th className="text-center py-2 px-3 font-medium">Status</th>
                        <th className="text-left py-2 px-3 font-medium">Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loans.map(l => (
                        <tr key={l.id} className="border-b hover:bg-muted/30">
                          <td className="py-2 px-3 font-mono text-xs">{l.loanNumber}</td>
                          <td className="py-2 px-3 text-right">{fmt(l.principal)}</td>
                          <td className="py-2 px-3 text-right text-orange-600">{fmt(safeNum(l.totalRepayable) - safeNum(l.amountRepaid))}</td>
                          <td className="py-2 px-3 text-center">
                            <Badge style={{ backgroundColor: STATUS_COLORS[l.status] || '#999' }} className="text-[10px] text-white">{l.status}</Badge>
                          </td>
                          <td className="py-2 px-3 text-xs">{l.purpose || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Member Roster ({totalMembers})</CardTitle>
              <Button size="sm" variant="outline" onClick={() => toast.info('Add member dialog coming soon')}>
                <UserPlus className="w-4 h-4 mr-1" /> Add Member
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium">Member #</th>
                      <th className="text-left py-2 px-3 font-medium">Name</th>
                      <th className="text-left py-2 px-3 font-medium">Gender</th>
                      <th className="text-left py-2 px-3 font-medium">Occupation</th>
                      <th className="text-right py-2 px-3 font-medium">Shares</th>
                      <th className="text-right py-2 px-3 font-medium">Capital</th>
                      <th className="text-right py-2 px-3 font-medium">Savings</th>
                      <th className="text-right py-2 px-3 font-medium">Borrowed</th>
                      <th className="text-right py-2 px-3 font-medium">Repaid</th>
                      <th className="text-center py-2 px-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(m => (
                      <tr key={m.id} className="border-b hover:bg-muted/30">
                        <td className="py-2 px-3 font-mono text-xs">{m.memberNumber}</td>
                        <td className="py-2 px-3 font-medium">{m.fullName}</td>
                        <td className="py-2 px-3">{m.gender || '—'}</td>
                        <td className="py-2 px-3">{m.occupation || '—'}</td>
                        <td className="py-2 px-3 text-right">{fmt(m.sharesOwned)}</td>
                        <td className="py-2 px-3 text-right">{fmt(safeNum(m.sharesOwned) * shareValue)}</td>
                        <td className="py-2 px-3 text-right">{fmt(m.totalSavings)}</td>
                        <td className="py-2 px-3 text-right">{fmt(m.totalBorrowed)}</td>
                        <td className="py-2 px-3 text-right text-emerald-600">{fmt(m.totalRepaid)}</td>
                        <td className="py-2 px-3 text-center">
                          <Badge variant={m.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px]">{m.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { type: 'summary', label: 'Summary Report', desc: 'KPIs + portfolio overview + key metrics', icon: TrendingUp, color: '#3CB4A0' },
              { type: 'members', label: 'Member Roster', desc: 'All members with shares, savings, balances', icon: Users, color: '#5B8DB8' },
              { type: 'loans', label: 'Loan Portfolio', desc: 'All loans with status, outstanding, aging', icon: DollarSign, color: '#E6A838' },
              { type: 'financial-statement', label: 'Financial Statement', desc: 'Balance sheet + income statement + surplus', icon: FileText, color: '#D4875A' },
            ].map(r => (
              <Card key={r.type} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3" onClick={() => window.open(`/api/sacco/reports?saccoId=${detail.id}&type=${r.type}&format=csv`, '_blank')}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: r.color + '20' }}>
                    <r.icon className="w-5 h-5" style={{ color: r.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{r.label}</div>
                    <div className="text-xs text-muted-foreground">{r.desc}</div>
                  </div>
                  <Download className="w-4 h-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function KpiCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub: string; icon: React.ElementType; color: string }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        </div>
        <div className="text-xl font-bold" style={{ color }}>{value}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
      </CardContent>
    </Card>
  )
}

function RiskCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub: string; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="p-3 border-l-4" style={{ borderLeftColor: color }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div className="text-xl font-bold" style={{ color }}>{value}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
      </CardContent>
    </Card>
  )
}

function FinancialMetric({ label, value, sub, color }: { label: string; value: number; sub: string; color: string }) {
  return (
    <div className="p-3 rounded-lg border" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-lg font-bold mt-1" style={{ color }}>UGX {(value / 1000000).toFixed(2)}M</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
    </div>
  )
}

// Re-export PolarAngleAxis for RadialBarChart
import { PolarAngleAxis } from 'recharts'
