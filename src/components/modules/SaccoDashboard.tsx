'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Landmark, Users, Wallet, DollarSign, TrendingUp, TrendingDown,
  AlertCircle, Download, ArrowRight,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

interface SaccoSummary {
  id: string
  name: string
  district: string | null
  memberCount: number
  loanCount: number
  meetingCount: number
  shareValue: number
  interestRate: number
  isActive: boolean
}

const CHART_COLORS = ['#D4875A', '#5B8DB8', '#3CB4A0', '#E6A838', '#9B6B9E', '#6B8040', '#D45D5D', '#5A7A9B']

export function SaccoDashboard() {
  const [saccos, setSaccos] = useState<SaccoSummary[]>([])
  const [loading, setLoading] = useState(true)
  const setActiveModule = useAppStore((s) => s.setActiveModule)

  useEffect(() => {
    fetch('/api/sacco')
      .then(r => r.json())
      .then(d => { setSaccos(d.saccos || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  const totalMembers = saccos.reduce((s, x) => s + x.memberCount, 0)
  const totalLoans = saccos.reduce((s, x) => s + x.loanCount, 0)
  const totalSaccos = saccos.length
  const districts = new Set(saccos.map(s => s.district).filter(Boolean))
  const totalShareCapital = saccos.reduce((s, x) => s + x.memberCount * x.shareValue * 5, 0) // approx 5 shares per member

  // Chart data: SACCO comparison by member count
  const saccoComparisonData = saccos.map(s => ({
    name: s.name.length > 15 ? s.name.substring(0, 12) + '...' : s.name,
    members: s.memberCount,
    loans: s.loanCount,
  }))

  // District distribution
  const districtData = Array.from(districts).map((d, i) => ({
    name: d,
    saccos: saccos.filter(s => s.district === d).length,
    members: saccos.filter(s => s.district === d).reduce((sum, s) => sum + s.memberCount, 0),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SACCO Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {totalSaccos} SACCOs · {totalMembers} members · {districts.size} districts
          </p>
        </div>
        <Button onClick={() => setActiveModule('sacco')}>
          Manage SACCOs <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="SACCOs" value={totalSaccos.toString()} icon={Landmark} color="#D4875A" />
        <KpiCard label="Members" value={totalMembers.toString()} icon={Users} color="#5B8DB8" />
        <KpiCard label="Active Loans" value={totalLoans.toString()} icon={TrendingUp} color="#E6A838" />
        <KpiCard label="Districts" value={districts.size.toString()} icon={AlertCircle} color="#3CB4A0" />
        <KpiCard label="Share Capital" value={`${(totalShareCapital / 1000000).toFixed(1)}M`} sub="UGX approx" icon={Wallet} color="#6B8040" />
        <KpiCard label="Avg Interest" value={`${(saccos.reduce((s, x) => s + x.interestRate, 0) / (totalSaccos || 1)).toFixed(1)}%`} sub="per annum" icon={DollarSign} color="#9B6B9E" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* SACCO Comparison — Members vs Loans */}
        <Card>
          <CardHeader><CardTitle className="text-sm">SACCO Comparison — Members vs Loans</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={saccoComparisonData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="members" name="Members" fill="#5B8DB8" radius={[0, 4, 4, 0]} />
                <Bar dataKey="loans" name="Loans" fill="#E6A838" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* District Distribution */}
        <Card>
          <CardHeader><CardTitle className="text-sm">District Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={districtData}
                  cx="50%" cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  paddingAngle={3}
                  dataKey="members"
                  nameKey="name"
                  label={({ name, members }: { name: string; members: number }) => `${name}: ${members}`}
                  labelLine={false}
                  style={{ fontSize: 11 }}
                >
                  {districtData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* SACCO Performance — Bar chart */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Members per SACCO</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={saccoComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="members" name="Members" fill="#3CB4A0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* District Summary Table */}
        <Card>
          <CardHeader><CardTitle className="text-sm">District Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">District</th>
                    <th className="text-right py-2 px-3 font-medium">SACCOs</th>
                    <th className="text-right py-2 px-3 font-medium">Members</th>
                    <th className="text-right py-2 px-3 font-medium">Loans</th>
                  </tr>
                </thead>
                <tbody>
                  {districtData.map(d => (
                    <tr key={d.name} className="border-b hover:bg-muted/30">
                      <td className="py-2 px-3 font-medium">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                          {d.name}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">{d.saccos}</td>
                      <td className="py-2 px-3 text-right">{d.members}</td>
                      <td className="py-2 px-3 text-right">
                        {saccos.filter(s => s.district === d.name).reduce((sum, s) => sum + s.loanCount, 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/30 font-medium">
                  <tr>
                    <td className="py-2 px-3">Total</td>
                    <td className="py-2 px-3 text-right">{totalSaccos}</td>
                    <td className="py-2 px-3 text-right">{totalMembers}</td>
                    <td className="py-2 px-3 text-right">{totalLoans}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Manage SACCOs', icon: Landmark, module: 'sacco', color: '#D4875A' },
          { label: 'Farmers', icon: Users, module: 'farmers', color: '#5B8DB8' },
          { label: 'Reports', icon: Download, module: 'reports', color: '#3CB4A0' },
          { label: 'Training', icon: TrendingUp, module: 'training', color: '#E6A838' },
        ].map(action => (
          <Card key={action.label} className="cursor-pointer hover:shadow-md transition-shadow" >
            <CardContent className="p-4 flex items-center gap-3" onClick={() => setActiveModule(action.module as any)}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: action.color + '20' }}>
                <action.icon className="w-5 h-5" style={{ color: action.color }} />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: React.ElementType; color: string }) {
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
        {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  )
}

export default SaccoDashboard
