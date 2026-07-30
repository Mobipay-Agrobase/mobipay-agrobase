'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Users, Ticket, Store, DollarSign, TrendingUp, ArrowRight,
  HandHeart, Wallet, MapPin,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

const CHART_COLORS = ['#D4875A', '#5B8DB8', '#3CB4A0', '#E6A838', '#9B6B9E', '#6B8040']

export function ResetDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const setActiveModule = useAppStore((s) => s.setActiveModule)

  useEffect(() => {
    fetch('/api/reset/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
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

  const stats = data?.stats || data?.data?.stats || {}
  const beneficiaries = stats.beneficiaries || 0
  const vouchers = stats.vouchers || 0
  const merchants = stats.merchants || 0
  const cashDisbursed = stats.cashDisbursed || 0
  const vouchersRedeemed = stats.vouchersRedeemed || 0
  const settlements = stats.settlements || 0

  // Chart data
  const voucherStatusData = [
    { name: 'Issued', value: vouchers, color: '#5B8DB8' },
    { name: 'Redeemed', value: vouchersRedeemed, color: '#3CB4A0' },
    { name: 'Pending', value: Math.max(0, vouchers - vouchersRedeemed), color: '#E6A838' },
  ].filter(d => d.value > 0)

  const settlementData = data?.settlements || data?.data?.settlements || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ReSET MarketLink Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {beneficiaries} beneficiaries · {merchants} merchants · {vouchers} vouchers
          </p>
        </div>
        <Button onClick={() => setActiveModule('reset-dashboard' as any)}>
          Manage ReSET <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Beneficiaries" value={beneficiaries.toString()} icon={Users} color="#5B8DB8" />
        <KpiCard label="Vouchers" value={vouchers.toString()} icon={Ticket} color="#E6A838" />
        <KpiCard label="Merchants" value={merchants.toString()} icon={Store} color="#3CB4A0" />
        <KpiCard label="Cash Disbursed" value={`UGX ${(cashDisbursed / 1000000).toFixed(1)}M`} icon={Wallet} color="#D4875A" />
        <KpiCard label="Vouchers Redeemed" value={vouchersRedeemed.toString()} icon={TrendingUp} color="#6B8040" />
        <KpiCard label="Settlements" value={settlements.toString()} icon={DollarSign} color="#9B6B9E" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Voucher Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={voucherStatusData} cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={3} dataKey="value" label={({ name, value }: { name: string; value: number }) => `${name}: ${value}`} labelLine={false} style={{ fontSize: 12 }}>
                  {voucherStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Cash Disbursements by Settlement</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Array.isArray(settlementData) ? settlementData.slice(0, 10).map((s: any) => ({ name: s.settlementName || s.id?.substring(0, 8) || 'N/A', amount: s.amount || 0 })) : []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="amount" name="Amount (UGX)" fill="#D4875A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Beneficiaries', icon: Users, module: 'reset-beneficiaries', color: '#5B8DB8' },
          { label: 'Vouchers', icon: Ticket, module: 'reset-vouchers', color: '#E6A838' },
          { label: 'Merchants', icon: Store, module: 'reset-merchants', color: '#3CB4A0' },
          { label: 'Reports', icon: TrendingUp, module: 'reset-reports', color: '#6B8040' },
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

export default ResetDashboard
