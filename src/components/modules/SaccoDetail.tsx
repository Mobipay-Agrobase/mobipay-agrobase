'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  ArrowLeft, Users, DollarSign, TrendingUp, TrendingDown, Wallet,
  Landmark, Download, UserPlus, FileText, Calendar, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

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
    totalRepayable: number
    amountRepaid: number
    status: string
    createdAt: string
  }>
}

const CHART_COLORS = ['#D4875A', '#5B8DB8', '#3CB4A0', '#E6A838', '#9B6B9E', '#6B8040', '#D45D5D', '#5A7A9B']

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#E6A838',
  APPROVED: '#5B8DB8',
  DISBURSED: '#3CB4A0',
  REPAID: '#6B8040',
  DEFAULTED: '#D45D5D',
  WRITTEN_OFF: '#9B6B9E',
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

  // Compute KPIs
  const totalMembers = detail.members.length
  const activeMembers = detail.members.filter(m => m.status === 'ACTIVE').length
  const totalShares = detail.members.reduce((s, m) => s + m.sharesOwned, 0)
  const totalShareCapital = totalShares * detail.shareValue
  const totalSavings = detail.members.reduce((s, m) => s + m.totalSavings, 0)
  const totalDisbursed = detail.loans
    .filter(l => ['DISBURSED', 'REPAID', 'DEFAULTED'].includes(l.status))
    .reduce((s, l) => s + l.principal, 0)
  const totalOutstanding = detail.loans
    .filter(l => l.status === 'DISBURSED')
    .reduce((s, l) => s + (l.totalRepayable - l.amountRepaid), 0)
  const totalRepaid = detail.loans.reduce((s, l) => s + l.amountRepaid, 0)
  const activeLoans = detail.loans.filter(l => l.status === 'DISBURSED').length
  const pendingLoans = detail.loans.filter(l => l.status === 'PENDING').length
  const defaultedLoans = detail.loans.filter(l => l.status === 'DEFAULTED').length
  const portfolioAtRisk = detail.loans
    .filter(l => l.status === 'DEFAULTED')
    .reduce((s, l) => s + (l.totalRepayable - l.amountRepaid), 0)
  const parRatio = totalDisbursed > 0 ? (portfolioAtRisk / totalDisbursed) * 100 : 0

  // Chart data
  const loanStatusData = ['PENDING', 'DISBURSED', 'REPAID', 'DEFAULTED'].map(status => ({
    name: status,
    count: detail.loans.filter(l => l.status === status).length,
    value: detail.loans.filter(l => l.status === status).length,
    color: STATUS_COLORS[status],
  })).filter(d => d.count > 0)

  const genderData = [
    { name: 'Male', value: detail.members.filter(m => m.fullName.match(/^(John|Peter|James|David|Samuel|Michael|Francis|William|Thomas|Emmanuel|Christopher|Patrick|Gerald|Stephen|Moses|Richard|Geoffrey|Andrew|Henry|Charles|Paul|Simon|Denis|Martin)/) ).length, color: '#5B8DB8' },
    { name: 'Female', value: detail.members.filter(m => !m.fullName.match(/^(John|Peter|James|David|Samuel|Michael|Francis|William|Thomas|Emmanuel|Christopher|Patrick|Gerald|Stephen|Moses|Richard|Geoffrey|Andrew|Henry|Charles|Paul|Simon|Denis|Martin)/) ).length, color: '#D45D5D' },
  ].filter(d => d.value > 0)

  // Loan disbursement trend (last 6 months)
  const now = new Date()
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 0)
    const monthLoans = detail.loans.filter(l => {
      const created = new Date(l.createdAt)
      return created >= d && created <= monthEnd
    })
    const monthDisbursed = monthLoans
      .filter(l => ['DISBURSED', 'REPAID', 'DEFAULTED'].includes(l.status))
      .reduce((s, l) => s + l.principal, 0)
    const monthRepaid = monthLoans.reduce((s, l) => s + l.amountRepaid, 0)
    return {
      month: d.toLocaleDateString('en', { month: 'short' }),
      disbursed: Math.round(monthDisbursed / 1000), // in thousands UGX
      repaid: Math.round(monthRepaid / 1000),
    }
  })

  // Top 5 members by share capital
  const topMembers = [...detail.members]
    .sort((a, b) => (b.sharesOwned * detail.shareValue) - (a.sharesOwned * detail.shareValue))
    .slice(0, 5)
    .map(m => ({
      name: m.fullName,
      shares: m.sharesOwned,
      capital: m.sharesOwned * detail.shareValue,
    }))

  // Savings distribution (buckets)
  const savingsBuckets = [
    { name: '0-50K', count: detail.members.filter(m => m.totalSavings < 50000).length },
    { name: '50-100K', count: detail.members.filter(m => m.totalSavings >= 50000 && m.totalSavings < 100000).length },
    { name: '100-200K', count: detail.members.filter(m => m.totalSavings >= 100000 && m.totalSavings < 200000).length },
    { name: '200K+', count: detail.members.filter(m => m.totalSavings >= 200000).length },
  ]

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
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open(`/api/sacco/reports?saccoId=${detail.id}&type=summary&format=csv`, '_blank')}>
            <Download className="w-4 h-4 mr-2" /> Summary
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open(`/api/sacco/reports?saccoId=${detail.id}&type=members&format=csv`, '_blank')}>
            <Download className="w-4 h-4 mr-2" /> Members
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open(`/api/sacco/reports?saccoId=${detail.id}&type=loans&format=csv`, '_blank')}>
            <Download className="w-4 h-4 mr-2" /> Loans
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open(`/api/sacco/reports?saccoId=${detail.id}&type=financial-statement&format=csv`, '_blank')}>
            <FileText className="w-4 h-4 mr-2" /> Financials
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <KpiCard label="Members" value={activeMembers.toString()} sub={`${totalMembers} total`} icon={Users} color="#5B8DB8" />
        <KpiCard label="Share Capital" value={`${(totalShareCapital / 1000000).toFixed(1)}M`} sub={`${totalShares} shares`} icon={Wallet} color="#3CB4A0" />
        <KpiCard label="Total Savings" value={`${(totalSavings / 1000000).toFixed(1)}M`} sub="UGX" icon={DollarSign} color="#6B8040" />
        <KpiCard label="Disbursed" value={`${(totalDisbursed / 1000000).toFixed(1)}M`} sub="UGX" icon={TrendingUp} color="#E6A838" />
        <KpiCard label="Outstanding" value={`${(totalOutstanding / 1000000).toFixed(1)}M`} sub={`${activeLoans} active`} icon={TrendingDown} color="#D45D5D" />
        <KpiCard label="PAR" value={`${parRatio.toFixed(1)}%`} sub={`${defaultedLoans} defaulted`} icon={AlertCircle} color={parRatio > 10 ? '#D45D5D' : '#3CB4A0'} />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members ({totalMembers})</TabsTrigger>
          <TabsTrigger value="loans">Loans ({detail.loans.length})</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab — Charts + Infographics */}
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

            {/* Loan Status Distribution */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Loan Portfolio by Status</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={loanStatusData}
                      cx="50%" cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, count }: { name: string; count: number }) => `${name}: ${count}`}
                      labelLine={false}
                      style={{ fontSize: 11 }}
                    >
                      {loanStatusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
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
                    <Bar dataKey="count" name="Members" fill="#5B8DB8" radius={[4, 4, 0, 0]} />
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
                <FinancialMetric label="Interest Income" value={detail.loans.reduce((s, l) => s + (l.totalRepayable - l.principal), 0)} sub="From all loans" color="#E6A838" />
                <FinancialMetric label="Portfolio at Risk" value={portfolioAtRisk} sub={`${parRatio.toFixed(1)}% of disbursed`} color="#D45D5D" />
              </div>
            </CardContent>
          </Card>
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
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium">Member #</th>
                      <th className="text-left py-2 px-3 font-medium">Name</th>
                      <th className="text-right py-2 px-3 font-medium">Shares</th>
                      <th className="text-right py-2 px-3 font-medium">Share Capital</th>
                      <th className="text-right py-2 px-3 font-medium">Savings</th>
                      <th className="text-right py-2 px-3 font-medium">Borrowed</th>
                      <th className="text-right py-2 px-3 font-medium">Repaid</th>
                      <th className="text-center py-2 px-3 font-medium">Status</th>
                      <th className="text-left py-2 px-3 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.members.map(m => (
                      <tr key={m.id} className="border-b hover:bg-muted/30">
                        <td className="py-2 px-3 font-mono text-xs">{m.memberNumber}</td>
                        <td className="py-2 px-3 font-medium">{m.fullName}</td>
                        <td className="py-2 px-3 text-right">{m.sharesOwned}</td>
                        <td className="py-2 px-3 text-right">{(m.sharesOwned * detail.shareValue).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right">{m.totalSavings.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right">{m.totalBorrowed.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right">{m.totalRepaid.toLocaleString()}</td>
                        <td className="py-2 px-3 text-center">
                          <Badge variant={m.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px]">{m.status}</Badge>
                        </td>
                        <td className="py-2 px-3 text-xs text-muted-foreground">{new Date(m.joinedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loans Tab */}
        <TabsContent value="loans">
          <Card>
            <CardHeader><CardTitle className="text-sm">Loan Portfolio ({detail.loans.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium">Loan #</th>
                      <th className="text-right py-2 px-3 font-medium">Principal</th>
                      <th className="text-right py-2 px-3 font-medium">Total Repayable</th>
                      <th className="text-right py-2 px-3 font-medium">Repaid</th>
                      <th className="text-right py-2 px-3 font-medium">Outstanding</th>
                      <th className="text-center py-2 px-3 font-medium">Status</th>
                      <th className="text-left py-2 px-3 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.loans.map(l => (
                      <tr key={l.id} className="border-b hover:bg-muted/30">
                        <td className="py-2 px-3 font-mono text-xs">{l.loanNumber}</td>
                        <td className="py-2 px-3 text-right">{l.principal.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right">{l.totalRepayable.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-emerald-600">{l.amountRepaid.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-orange-600">{(l.totalRepayable - l.amountRepaid).toLocaleString()}</td>
                        <td className="py-2 px-3 text-center">
                          <Badge style={{ backgroundColor: STATUS_COLORS[l.status] || '#999' }} className="text-[10px] text-white">{l.status}</Badge>
                        </td>
                        <td className="py-2 px-3 text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleDateString()}</td>
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
              { type: 'summary', label: 'Summary Report', desc: 'KPIs + portfolio overview', icon: TrendingUp },
              { type: 'members', label: 'Member Roster', desc: 'All members with shares + balances', icon: Users },
              { type: 'loans', label: 'Loan Portfolio', desc: 'All loans with status + outstanding', icon: DollarSign },
              { type: 'financial-statement', label: 'Financial Statement', desc: 'Balance sheet + income statement', icon: FileText },
            ].map(r => (
              <Card key={r.type} className="hover:shadow-md transition-shadow cursor-pointer" >
                <CardContent className="p-4 flex items-center gap-3" onClick={() => window.open(`/api/sacco/reports?saccoId=${detail.id}&type=${r.type}&format=csv`, '_blank')}>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <r.icon className="w-5 h-5 text-primary" />
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

function FinancialMetric({ label, value, sub, color }: { label: string; value: number; sub: string; color: string }) {
  return (
    <div className="p-3 rounded-lg border" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-lg font-bold mt-1" style={{ color }}>UGX {(value / 1000000).toFixed(2)}M</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
    </div>
  )
}
