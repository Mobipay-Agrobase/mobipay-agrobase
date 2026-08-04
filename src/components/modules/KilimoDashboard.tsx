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
  PiggyBank, Users, DollarSign, TrendingUp, Wallet, Landmark,
  ArrowRight, Calendar, CreditCard, Handshake,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

const CHART_COLORS = ['#D4875A', '#5B8DB8', '#3CB4A0', '#E6A838', '#9B6B9E', '#6B8040']

export function KilimoDashboard() {
  const [vslaGroups, setVslaGroups] = useState<any[]>([])
  const [nssfData, setNssfData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const setActiveModule = useAppStore((s) => s.setActiveModule)

  useEffect(() => {
    Promise.all([
      fetch('/api/vsla/groups').then(r => r.json()).catch(() => ({ groups: [] })),
      fetch('/api/nssf/contributions?limit=50').then(r => r.json()).catch(() => ({})),
    ]).then(([vslaRes, nssfRes]) => {
      setVslaGroups(vslaRes.groups || [])
      setNssfData(nssfRes)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  const totalGroups = vslaGroups.length
  const activeGroups = vslaGroups.filter((g: any) => g.isActive).length
  const totalMembers = vslaGroups.reduce((s: number, g: any) => s + (g._count?.members || 0), 0)
  const totalLoans = vslaGroups.reduce((s: number, g: any) => s + (g._count?.loans || 0), 0)

  const nssfContributions = nssfData?.contributions || nssfData?.data || []
  const totalNssfCollected = nssfContributions.reduce((s: number, c: any) => s + (c.employeeAmount || c.amount || 0), 0)
  const totalNssfEmployer = nssfContributions.reduce((s: number, c: any) => s + (c.employerAmount || 0), 0)

  // Chart: VSLA groups by activity
  const groupStatusData = [
    { name: 'Active', value: activeGroups, color: '#3CB4A0' },
    { name: 'Inactive', value: totalGroups - activeGroups, color: '#D45D5D' },
  ].filter(d => d.value > 0)

  // Chart: top VSLA groups by loans
  const topGroupsByLoans = vslaGroups
    .map((g: any) => ({ name: g.name?.length > 15 ? g.name.substring(0, 12) + '...' : g.name, loans: g._count?.loans || 0, members: g._count?.members || 0 }))
    .sort((a: any, b: any) => b.loans - a.loans)
    .slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kilimo Trust Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {totalGroups} VSLA groups · {totalMembers} members · NSSF collections
          </p>
        </div>
        <Button onClick={() => setActiveModule('vsla')}>
          Manage VSLAs <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="VSLA Groups" value={totalGroups.toString()} icon={PiggyBank} color="#D4875A" />
        <KpiCard label="Active Groups" value={activeGroups.toString()} icon={TrendingUp} color="#3CB4A0" />
        <KpiCard label="Members" value={totalMembers.toString()} icon={Users} color="#5B8DB8" />
        <KpiCard label="Active Loans" value={totalLoans.toString()} icon={CreditCard} color="#E6A838" />
        <KpiCard label="NSSF Collected" value={`UGX ${(totalNssfCollected / 1000000).toFixed(1)}M`} icon={Wallet} color="#6B8040" />
        <KpiCard label="NSSF Employer" value={`UGX ${(totalNssfEmployer / 1000000).toFixed(1)}M`} icon={Handshake} color="#9B6B9E" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">VSLA Groups by Loan Activity</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topGroupsByLoans} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="loans" name="Loans" fill="#E6A838" radius={[0, 4, 4, 0]} />
                <Bar dataKey="members" name="Members" fill="#5B8DB8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Active vs Inactive VSLA Groups</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={groupStatusData} cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={3} dataKey="value" label={({ name, value }: { name: string; value: number }) => `${name}: ${value}`} labelLine={false} style={{ fontSize: 12 }}>
                  {groupStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Manage VSLAs', icon: PiggyBank, module: 'vsla', color: '#D4875A' },
          { label: 'NSSF Contributions', icon: Wallet, module: 'nssf-contributions', color: '#6B8040' },
          { label: 'Farmers', icon: Users, module: 'farmers', color: '#5B8DB8' },
          { label: 'Reports', icon: TrendingUp, module: 'reports', color: '#3CB4A0' },
        ].map(action => (
          <Card key={action.label} className="cursor-pointer hover:shadow-md transition-shadow">
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

export default KilimoDashboard
