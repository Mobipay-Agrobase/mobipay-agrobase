'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  FileText, BarChart3, Download, Search, Users, PiggyBank, DollarSign,
  GraduationCap, CreditCard, Receipt, TrendingUp,
  MapPin, Calendar, Layers, Database, Loader2, X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface ReportCategory {
  title: string
  icon: React.ElementType
  color: string
  bgColor: string
  reports: { key: string; label: string; description: string }[]
}

const REPORT_CATEGORIES: ReportCategory[] = [
  {
    title: 'Farmer Reports', icon: Users, color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    reports: [
      { key: 'farmer-registration', label: 'Farmer Registration Report', description: 'All registered farmers with demographics and status' },
      { key: 'farmer-demographics', label: 'Demographics Analysis', description: 'Gender, age, education distribution across regions' },
      { key: 'farmer-crop', label: 'Crop Distribution', description: 'Farmers by crop type, variety, and cultivation area' },
      { key: 'farmer-geo', label: 'Geographic Distribution', description: 'Farmer concentration by district, sub-county, and village' },
    ],
  },
  {
    title: 'VSLA Reports', icon: PiggyBank, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/40',
    reports: [
      { key: 'vsla-savings', label: 'Savings Report', description: 'Individual and group savings over time periods' },
      { key: 'vsla-loans', label: 'Loan Portfolio', description: 'Loan disbursements, repayments, and outstanding balance' },
      { key: 'vsla-meetings', label: 'Meeting Attendance', description: 'Attendance rates and meeting frequency analysis' },
      { key: 'vsla-performance', label: 'Group Performance', description: 'Comparative performance across all VSLA groups' },
    ],
  },
  {
    title: 'Financial Reports', icon: DollarSign, color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    reports: [
      { key: 'purchase-summary', label: 'Purchase Summary', description: 'All purchases by commodity, value chain, and time period' },
      { key: 'sales-summary', label: 'Sales Summary', description: 'All sales by commodity, buyer, and revenue' },
      { key: 'payment-summary', label: 'Payment Summary', description: 'All payments by type, status, and time period' },
      { key: 'loan-portfolio', label: 'Loan Portfolio Report', description: 'Active loans, outstanding balances, repayment status' },
    ],
  },
  {
    title: 'Training & Extension', icon: GraduationCap, color: 'text-cyan-600', bgColor: 'bg-cyan-50 dark:bg-cyan-950/40',
    reports: [
      { key: 'training-attendance', label: 'Training Attendance', description: 'Farmer participation in training sessions' },
      { key: 'training-coverage', label: 'Extension Coverage', description: 'Extension officer coverage and farmer reach' },
    ],
  },
  {
    title: 'Credit & Risk', icon: CreditCard, color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-950/40',
    reports: [
      { key: 'credit-scores', label: 'Credit Score Distribution', description: '4-factor credit score analysis across farmers' },
      { key: 'loan-default', label: 'Default Risk Assessment', description: 'Identify high-risk loans and default patterns' },
    ],
  },
  {
    title: 'System & Operations', icon: Database, color: 'text-slate-600', bgColor: 'bg-slate-50 dark:bg-slate-950/40',
    reports: [
      { key: 'audit-log', label: 'Audit Trail', description: 'Complete system audit log with user actions' },
      { key: 'user-summary', label: 'User Summary', description: 'All platform users by role and status' },
    ],
  },
]

// CSV export helper
function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    toast.info('No data to export')
    return
  }
  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success(`Exported ${data.length} records to ${filename}.csv`)
}

const fmtUGX = (n: number) => 'UGX ' + (Number(n) || 0).toLocaleString()
const fmtNum = (n: number) => (Number(n) || 0).toLocaleString()

export default function ReportsView() {
  const [search, setSearch] = useState('')
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [reportData, setReportData] = useState<any[]>([])
  const [reportLoading, setReportLoading] = useState(false)
  const [reportMeta, setReportMeta] = useState<any>(null)

  const filteredCategories = REPORT_CATEGORIES.map(cat => ({
    ...cat,
    reports: cat.reports.filter(r =>
      r.label.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.reports.length > 0)

  const fetchReport = useCallback(async (reportKey: string) => {
    setSelectedReport(reportKey)
    setReportLoading(true)
    setReportData([])
    setReportMeta(null)

    try {
      // Map report keys to API endpoints
      const apiMap: Record<string, { url: string; transform?: (data: any) => any[]; meta?: any }> = {
        'farmer-registration': {
          url: '/api/farmers?limit=500',
          transform: (d) => (d.farmers || d.data || d || []).map((f: any) => ({
            farmerCode: f.farmerCode || '',
            firstName: f.firstName || '',
            lastName: f.lastName || '',
            phone: f.phone || '',
            gender: f.gender || '',
            district: f.district || '',
            village: f.village || '',
            farmSize: f.farmSize ? `${f.farmSize} ha` : '',
            status: f.status || '',
            registeredOn: f.createdAt ? new Date(f.createdAt).toLocaleDateString() : '',
          })),
          meta: { title: 'Farmer Registration Report', columns: ['farmerCode', 'firstName', 'lastName', 'phone', 'gender', 'district', 'village', 'farmSize', 'status', 'registeredOn'] }
        },
        'farmer-demographics': {
          url: '/api/farmers?limit=500',
          transform: (d) => {
            const farmers = d.farmers || d.data || d || []
            const genderCount: Record<string, number> = {}
            const districtCount: Record<string, number> = {}
            for (const f of farmers) {
              const g = f.gender || 'Unknown'
              genderCount[g] = (genderCount[g] || 0) + 1
              const dist = f.district || 'Unknown'
              districtCount[dist] = (districtCount[dist] || 0) + 1
            }
            const genderRows = Object.entries(genderCount).map(([gender, count]) => ({ category: 'Gender', label: gender, count, percentage: `${((count / farmers.length) * 100).toFixed(1)}%` }))
            const districtRows = Object.entries(districtCount).map(([district, count]) => ({ category: 'District', label: district, count, percentage: `${((count / farmers.length) * 100).toFixed(1)}%` }))
            return [...genderRows, ...districtRows]
          },
          meta: { title: 'Demographics Analysis', columns: ['category', 'label', 'count', 'percentage'] }
        },
        'farmer-crop': {
          url: '/api/farmers?limit=500',
          transform: (d) => {
            const farmers = d.farmers || d.data || d || []
            const cropCount: Record<string, number> = {}
            for (const f of farmers) {
              const crops = f.mainCrops ? (typeof f.mainCrops === 'string' ? JSON.parse(f.mainCrops) : f.mainCrops) : ['Unknown']
              for (const c of Array.isArray(crops) ? crops : [crops]) {
                const crop = String(c)
                cropCount[crop] = (cropCount[crop] || 0) + 1
              }
            }
            return Object.entries(cropCount).map(([crop, count]) => ({ crop, farmerCount: count, percentage: `${((count / farmers.length) * 100).toFixed(1)}%` })).sort((a, b) => b.farmerCount - a.farmerCount)
          },
          meta: { title: 'Crop Distribution', columns: ['crop', 'farmerCount', 'percentage'] }
        },
        'farmer-geo': {
          url: '/api/farmers?limit=500',
          transform: (d) => {
            const farmers = d.farmers || d.data || d || []
            const geoCount: Record<string, number> = {}
            for (const f of farmers) {
              const loc = f.district ? `${f.district}${f.village ? ' / ' + f.village : ''}` : 'Unknown'
              geoCount[loc] = (geoCount[loc] || 0) + 1
            }
            return Object.entries(geoCount).map(([location, count]) => ({ location, farmerCount: count })).sort((a, b) => b.farmerCount - a.farmerCount)
          },
          meta: { title: 'Geographic Distribution', columns: ['location', 'farmerCount'] }
        },
        'vsla-savings': {
          url: '/api/vsla/savings?limit=500',
          transform: (d) => (d.savings || d.data || d || []).map((s: any) => ({
            member: s.farmer ? `${s.farmer.firstName} ${s.farmer.lastName}` : '—',
            group: s.vslaGroup?.name || '—',
            type: s.transactionType || s.type || '',
            amount: Number(s.amount || 0),
            date: s.transactionDate ? new Date(s.transactionDate).toLocaleDateString() : '',
            status: s.status || '',
          })),
          meta: { title: 'VSLA Savings Report', columns: ['member', 'group', 'type', 'amount', 'date', 'status'] }
        },
        'vsla-loans': {
          url: '/api/vsla/loans?limit=500',
          transform: (d) => (d.loans || d.data || d || []).map((l: any) => ({
            member: l.farmer ? `${l.farmer.firstName} ${l.farmer.lastName}` : '—',
            group: l.vslaGroup?.name || '—',
            amount: Number(l.amount || 0),
            interestRate: l.interestRate ? `${l.interestRate}%` : '',
            status: l.status || '',
            dueDate: l.dueDate ? new Date(l.dueDate).toLocaleDateString() : '',
            disbursedOn: l.disbursedAt ? new Date(l.disbursedAt).toLocaleDateString() : '',
          })),
          meta: { title: 'VSLA Loan Portfolio', columns: ['member', 'group', 'amount', 'interestRate', 'status', 'dueDate', 'disbursedOn'] }
        },
        'purchase-summary': {
          url: '/api/purchases?limit=500',
          transform: (d) => {
            const purchases = d.data || d || []
            const byCommodity: Record<string, { volume: number; value: number; count: number }> = {}
            for (const p of purchases) {
              const c = p.commodity || 'Unknown'
              if (!byCommodity[c]) byCommodity[c] = { volume: 0, value: 0, count: 0 }
              byCommodity[c].volume += Number(p.quantity) || 0
              byCommodity[c].value += Number(p.totalAmount) || 0
              byCommodity[c].count += 1
            }
            return Object.entries(byCommodity).map(([commodity, v]) => ({
              commodity, transactions: v.count, totalVolumeKg: v.volume, totalValueUGX: v.value, avgPricePerKg: v.volume > 0 ? Math.round(v.value / v.volume) : 0,
            })).sort((a, b) => b.totalVolumeKg - a.totalVolumeKg)
          },
          meta: { title: 'Purchase Summary by Commodity', columns: ['commodity', 'transactions', 'totalVolumeKg', 'totalValueUGX', 'avgPricePerKg'] }
        },
        'sales-summary': {
          url: '/api/sales?limit=500',
          transform: (d) => {
            const sales = d.data || d || []
            const byCommodity: Record<string, { volume: number; value: number; count: number }> = {}
            for (const s of sales) {
              const c = s.commodity || 'Unknown'
              if (!byCommodity[c]) byCommodity[c] = { volume: 0, value: 0, count: 0 }
              byCommodity[c].volume += Number(s.quantity) || 0
              byCommodity[c].value += Number(s.totalAmount) || 0
              byCommodity[c].count += 1
            }
            return Object.entries(byCommodity).map(([commodity, v]) => ({
              commodity, transactions: v.count, totalVolumeKg: v.volume, totalRevenueUGX: v.value, avgPricePerKg: v.volume > 0 ? Math.round(v.value / v.volume) : 0,
            })).sort((a, b) => b.totalVolumeKg - a.totalVolumeKg)
          },
          meta: { title: 'Sales Summary by Commodity', columns: ['commodity', 'transactions', 'totalVolumeKg', 'totalRevenueUGX', 'avgPricePerKg'] }
        },
        'payment-summary': {
          url: '/api/dashboard/stats',
          transform: (d) => {
            const txns = d.recentTransactions || d.stats?.recentTransactions || []
            return txns.map((t: any) => ({
              type: t.type || 'PAYMENT',
              recipient: t.recipientName || '—',
              amount: Number(t.amount || 0),
              status: t.status || '',
              date: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '',
            }))
          },
          meta: { title: 'Payment Summary', columns: ['type', 'recipient', 'amount', 'status', 'date'] }
        },
        'loan-portfolio': {
          url: '/api/vsla/loans?limit=500',
          transform: (d) => {
            const loans = d.loans || d.data || d || []
            const byStatus: Record<string, { count: number; amount: number }> = {}
            for (const l of loans) {
              const s = l.status || 'Unknown'
              if (!byStatus[s]) byStatus[s] = { count: 0, amount: 0 }
              byStatus[s].count += 1
              byStatus[s].amount += Number(l.amount) || 0
            }
            return Object.entries(byStatus).map(([status, v]) => ({
              status, loanCount: v.count, totalAmountUGX: v.amount, avgLoanUGX: v.count > 0 ? Math.round(v.amount / v.count) : 0,
            }))
          },
          meta: { title: 'Loan Portfolio Summary', columns: ['status', 'loanCount', 'totalAmountUGX', 'avgLoanUGX'] }
        },
        'training-attendance': {
          url: '/api/trainings?limit=200',
          transform: (d) => {
            const trainings = d.data || d || []
            return trainings.map((t: any) => ({
              topic: t.topic || t.title || '',
              type: t.type || '',
              date: t.date ? new Date(t.date).toLocaleDateString() : '',
              location: t.location || '',
              attendanceCount: t._count?.attendances || t.attendeeCount || 0,
              trainer: t.trainer || '',
            }))
          },
          meta: { title: 'Training Attendance Report', columns: ['topic', 'type', 'date', 'location', 'attendanceCount', 'trainer'] }
        },
        'training-coverage': {
          url: '/api/trainings?limit=200',
          transform: (d) => {
            const trainings = d.data || d || []
            const byLocation: Record<string, { count: number; attendance: number }> = {}
            for (const t of trainings) {
              const loc = t.location || 'Unknown'
              if (!byLocation[loc]) byLocation[loc] = { count: 0, attendance: 0 }
              byLocation[loc].count += 1
              byLocation[loc].attendance += t._count?.attendances || 0
            }
            return Object.entries(byLocation).map(([location, v]) => ({
              location, trainingCount: v.count, totalAttendance: v.attendance, avgAttendance: v.count > 0 ? Math.round(v.attendance / v.count) : 0,
            })).sort((a, b) => b.totalAttendance - a.totalAttendance)
          },
          meta: { title: 'Extension Coverage by Location', columns: ['location', 'trainingCount', 'totalAttendance', 'avgAttendance'] }
        },
        'credit-scores': {
          url: '/api/dashboard/stats',
          transform: (d) => {
            const scores = d.data || d || []
            const bands = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 }
            for (const s of scores) {
              const score = s.totalScore || s.score || 0
              if (score <= 20) bands['0-20']++
              else if (score <= 40) bands['21-40']++
              else if (score <= 60) bands['41-60']++
              else if (score <= 80) bands['61-80']++
              else bands['81-100']++
            }
            return Object.entries(bands).map(([band, count]) => ({
              scoreBand: band, farmerCount: count, percentage: scores.length > 0 ? `${((count / scores.length) * 100).toFixed(1)}%` : '0%',
            }))
          },
          meta: { title: 'Credit Score Distribution', columns: ['scoreBand', 'farmerCount', 'percentage'] }
        },
        'loan-default': {
          url: '/api/vsla/loans?limit=500',
          transform: (d) => {
            const loans = d.loans || d.data || d || []
            return loans.filter((l: any) => l.status === 'OVERDUE' || l.status === 'DEFAULTED').map((l: any) => ({
              member: l.farmer ? `${l.farmer.firstName} ${l.farmer.lastName}` : '—',
              group: l.vslaGroup?.name || '—',
              amount: Number(l.amount || 0),
              status: l.status,
              dueDate: l.dueDate ? new Date(l.dueDate).toLocaleDateString() : '',
              daysOverdue: l.dueDate ? Math.floor((Date.now() - new Date(l.dueDate).getTime()) / 86400000) : 0,
            })).sort((a: any, b: any) => b.daysOverdue - a.daysOverdue)
          },
          meta: { title: 'Default Risk Assessment', columns: ['member', 'group', 'amount', 'status', 'dueDate', 'daysOverdue'] }
        },
        'audit-log': {
          url: '/api/dashboard/stats',
          transform: () => {
            // Audit log API doesn't exist yet — return empty
            return []
          },
          meta: { title: 'Audit Trail', columns: ['user', 'action', 'entityType', 'entityId', 'timestamp'] }
        },
        'user-summary': {
          url: '/api/users?limit=500',
          transform: (d) => (d.data || d.users || d || []).map((u: any) => ({
            name: `${u.firstName} ${u.lastName}`,
            email: u.email || '',
            phone: u.phone || '',
            role: u.role || '',
            active: u.isActive ? 'Yes' : 'No',
            lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never',
          })),
          meta: { title: 'User Summary', columns: ['name', 'email', 'phone', 'role', 'active', 'lastLogin'] }
        },
      }

      const config = apiMap[reportKey]
      if (!config) {
        toast.error('Report not configured')
        return
      }

      const res = await fetch(config.url)
      if (!res.ok) {
        throw new Error(`API returned ${res.status}`)
      }
      const data = await res.json()
      let transformed: any[] = []
      try {
        const result = config.transform ? config.transform(data) : (data.data || data || [])
        transformed = Array.isArray(result) ? result : []
      } catch (e) {
        console.error('Transform error:', e)
        transformed = []
      }
      setReportData(transformed)
      setReportMeta(config.meta || { title: 'Report', columns: transformed.length > 0 ? Object.keys(transformed[0]) : [] })
    } catch (error: any) {
      console.error('Report fetch error:', error)
      toast.error(`Failed to generate report: ${error.message}`)
      setReportData([])
    } finally {
      setReportLoading(false)
    }
  }, [])

  const handleCloseReport = () => {
    setSelectedReport(null)
    setReportData([])
    setReportMeta(null)
  }

  const formatCellValue = (value: any, column: string) => {
    if (value === null || value === undefined) return '—'
    if (column.toLowerCase().includes('amount') || column.toLowerCase().includes('value') || column.toLowerCase().includes('ugx') || column.toLowerCase().includes('revenue') || column.toLowerCase().includes('price')) {
      return fmtUGX(Number(value))
    }
    if (column.toLowerCase().includes('volume') || column.toLowerCase().includes('kg') || column.toLowerCase().includes('count')) {
      return fmtNum(Number(value))
    }
    return String(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Reports & Analytics</h3>
          <p className="text-sm text-muted-foreground">{REPORT_CATEGORIES.reduce((s, c) => s + c.reports.length, 0)} report types available</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search reports..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="space-y-6">
        {filteredCategories.map(cat => {
          const Icon = cat.icon
          return (
            <div key={cat.title}>
              <div className="flex items-center gap-2 mb-3">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', cat.bgColor)}>
                  <Icon className={cn('w-4 h-4', cat.color)} />
                </div>
                <h4 className="font-semibold text-sm">{cat.title}</h4>
                <Badge variant="outline" className="text-[10px]">{cat.reports.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {cat.reports.map(report => (
                  <Card key={report.key} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => fetchReport(report.key)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h5 className="font-medium text-sm group-hover:text-primary transition-colors">{report.label}</h5>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{report.description}</p>
                        </div>
                        <Download className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Report Viewer Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(o) => !o && handleCloseReport()}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{reportMeta?.title || 'Report'}</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportToCSV(reportData, selectedReport || 'report')}
                  disabled={reportLoading || reportData.length === 0}
                  className="gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {reportLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : reportData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No data available for this report</p>
              <p className="text-sm mt-1">Data will appear here once records are created.</p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-2">
                <Badge variant="outline">{reportData.length} records</Badge>
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {(reportMeta?.columns || (reportData.length > 0 ? Object.keys(reportData[0]) : [])).map((col: string) => (
                        <TableHead key={col} className="whitespace-nowrap capitalize">
                          {col.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.slice(0, 100).map((row, idx) => (
                      <TableRow key={idx}>
                        {(reportMeta?.columns || Object.keys(row)).map((col: string) => (
                          <TableCell key={col} className="whitespace-nowrap text-sm">
                            {formatCellValue(row[col], col)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {reportData.length > 100 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Showing first 100 of {reportData.length} records. Export CSV for full data.
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
