'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  Search, Plus, X, Loader2, Filter, Layers, Droplets, Wind,
  Package, Star, TrendingUp, Clock, CheckCircle, AlertCircle, BarChart3,
  Trash2, Play, XCircle, CheckCheck
} from 'lucide-react'
import { safeFetch, extractArray } from '@/lib/safe-fetch'
import { hasPermission } from '@/lib/permissions'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts'

interface ProcessingBatch {
  id: string
  inputCommodity: string
  processType: string
  outputProduct: string
  inputQuantity: number
  inputUnit: string
  outputQuantity: number
  outputUnit: string
  qualityGrade: string
  qualityScore: number
  // Second review (L): workflow statuses. New batches enter as PENDING,
  // are approved/rejected (Approval Hub or here), then started and
  // completed. FAILED is a legacy value kept for display only.
  status: 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'FAILED'
  batchNumber: string
  facility: string
  startDate: string
  endDate?: string
  notes?: string
}

const PROCESS_TYPES = ['Washing', 'Drying', 'Hulling', 'Grading', 'Roasting', 'Packaging']
const QUALITY_GRADES = ['Premium', 'Grade 1', 'Grade 2', 'Grade 3', 'Below Standard']
const COMMODITIES = ['Arabica Coffee', 'Robusta Coffee', 'Sunflower Seeds', 'Maize', 'Sesame', 'Vanilla', 'Cocoa']

const processIcon: Record<string, React.ReactNode> = {
  Washing: <Droplets className="w-4 h-4" />,
  Drying: <Wind className="w-4 h-4" />,
  Hulling: <Layers className="w-4 h-4" />,
  Grading: <BarChart3 className="w-4 h-4" />,
  Roasting: <Star className="w-4 h-4" />,
  Packaging: <Package className="w-4 h-4" />,
}

const processColor: Record<string, string> = {
  Washing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Drying: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Hulling: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Grading: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  Roasting: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  Packaging: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
}

const statusColor: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  APPROVED: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

const gradeColor: Record<string, string> = {
  Premium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  'Grade 1': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'Grade 2': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Grade 3': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'Below Standard': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

const BAR_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#14b8a6', '#f97316', '#10b981']

// NOTE: demo/mock data fallbacks removed (second review L) — the module
// shows the REAL batches from /api/processing and a real empty state.

export default function ProcessingView() {
  const { user } = useAppStore()
  const [batches, setBatches] = useState<ProcessingBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [processFilter, setProcessFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [commodityFilter, setCommodityFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  // Second review (L): workflow action state.
  const [busyId, setBusyId] = useState<string | null>(null)
  const [completeTarget, setCompleteTarget] = useState<ProcessingBatch | null>(null)
  const [rejectTarget, setRejectTarget] = useState<ProcessingBatch | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const canApprove = hasPermission(user?.role || '', 'processing:approve')
  const canOperate = hasPermission(user?.role || '', 'processing:update')

  const fetchBatches = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (processFilter) params.set('processType', processFilter)
      if (statusFilter) params.set('status', statusFilter)
      if (commodityFilter) params.set('commodity', commodityFilter)
      if (search) params.set('search', search)
      const url = `/api/processing${params.toString() ? `?${params}` : ''}`
      const data = await safeFetch(url)
      const raw = extractArray(data, 'batches', 'data')
      // Second review (L): real data only — no demo fallback. Empty list = real
      // empty state (the reviewer explicitly called out fabricated content).
      const mapped: ProcessingBatch[] = raw.map((b: any) => ({
        id: b.id,
        batchNumber: b.batchNumber || '',
        inputCommodity: b.inputCommodity || '',
        processType: b.processType || '',
        outputProduct: b.outputProduct || '',
        inputQuantity: Number(b.inputQuantity) || 0,
        inputUnit: b.inputUnit || 'kg',
        outputQuantity: Number(b.outputQuantity) || 0,
        outputUnit: b.outputUnit || 'kg',
        qualityGrade: b.qualityGrade || '',
        qualityScore: Number(b.qualityScore) || 0,
        status: b.status || 'PENDING',
        facility: b.facility || '',
        startDate: b.startDate || new Date().toISOString(),
        endDate: b.endDate || undefined,
        notes: b.notes || undefined,
      }))
      setBatches(mapped)
    } catch {
      setBatches([])
    } finally {
      setLoading(false)
    }
  }, [processFilter, statusFilter, commodityFilter, search])

  useEffect(() => { fetchBatches() }, [fetchBatches])

  const handleDelete = async (id: string, batchNumber: string) => {
    if (!confirm(`Delete batch "${batchNumber}"? This action cannot be undone.`)) return
    try {
      const res = await fetch(`/api/processing/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Batch deleted')
        fetchBatches()
      } else {
        toast.error('Failed to delete batch')
      }
    } catch {
      toast.error('Failed to delete batch')
    }
  }

  // ── Second review (L): the workflow state machine, one button per legal
  // transition. The server re-validates permissions + status anyway.
  const runWorkflowAction = async (
    batch: ProcessingBatch,
    action: 'approve' | 'reject' | 'start' | 'complete',
    extra?: Record<string, unknown>
  ) => {
    setBusyId(batch.id)
    try {
      const res = await fetch(`/api/processing/${batch.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      const body = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success(`Batch ${batch.batchNumber} ${action === 'complete' ? 'completed' : `${action}d`}`)
        fetchBatches()
        return true
      }
      toast.error(body.error || `Failed to ${action} batch`)
      return false
    } catch {
      toast.error(`Failed to ${action} batch`)
      return false
    } finally {
      setBusyId(null)
    }
  }

  const filtered = batches.filter(b => {
    if (search && !b.batchNumber.toLowerCase().includes(search.toLowerCase()) && !b.inputCommodity.toLowerCase().includes(search.toLowerCase()) && !b.outputProduct.toLowerCase().includes(search.toLowerCase())) return false
    if (processFilter && b.processType !== processFilter) return false
    if (statusFilter && b.status !== statusFilter) return false
    if (commodityFilter && b.inputCommodity !== commodityFilter) return false
    return true
  })

  const totalBatches = batches.length
  const pendingApproval = batches.filter(b => b.status === 'PENDING').length
  const approved = batches.filter(b => b.status === 'APPROVED').length
  const inProgress = batches.filter(b => b.status === 'IN_PROGRESS').length
  const completed = batches.filter(b => b.status === 'COMPLETED').length
  const avgQuality = batches.filter(b => b.qualityScore > 0).length > 0
    ? (batches.filter(b => b.qualityScore > 0).reduce((s, b) => s + b.qualityScore, 0) / batches.filter(b => b.qualityScore > 0).length).toFixed(1)
    : '—'

  // Process type distribution for bar chart
  const processTypeCounts = PROCESS_TYPES.map(pt => ({
    name: pt,
    count: batches.filter(b => b.processType === pt).length,
  }))
  const barConfig: ChartConfig = Object.fromEntries(processTypeCounts.map((d, i) => [d.name, { label: d.name, color: BAR_COLORS[i] }]))

  // Quality distribution for pie
  const qualityDist = QUALITY_GRADES.map(g => ({
    name: g,
    value: batches.filter(b => b.qualityGrade === g).length,
  })).filter(d => d.value > 0)
  const QUALITY_COLORS = ['#eab308', '#10b981', '#3b82f6', '#f59e0b', '#ef4444']
  const qualityPieConfig: ChartConfig = Object.fromEntries(qualityDist.map((d, i) => [d.name, { label: d.name, color: QUALITY_COLORS[i % QUALITY_COLORS.length] }]))

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            Post-Harvest Processing
          </h3>
          <p className="text-sm text-muted-foreground">Processing batch management, quality control, and value addition</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Batch
        </Button>
      </div>

      {/* Stats — second review (L): workflow pipeline statuses */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <Layers className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Batches</p>
              <p className="text-xl font-bold">{totalBatches}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Approval</p>
              <p className="text-xl font-bold text-amber-600">{pendingApproval}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Approved (ready to start)</p>
              <p className="text-xl font-bold text-teal-600">{approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">In Progress</p>
              <p className="text-xl font-bold text-blue-600">{inProgress}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed · Avg {avgQuality !== '—' ? `${avgQuality}/100` : '—'}</p>
              <p className="text-xl font-bold">{completed}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Process Type Distribution</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={barConfig} className="h-[180px] w-full">
              <BarChart data={processTypeCounts} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                  {processTypeCounts.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Quality Grade Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ChartContainer config={qualityPieConfig} className="h-[140px] w-[140px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={qualityDist} cx="50%" cy="50%" innerRadius={30} outerRadius={65} dataKey="value" strokeWidth={1}>
                    {qualityDist.map((_, i) => <Cell key={i} fill={QUALITY_COLORS[i % QUALITY_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="flex-1 space-y-1.5">
                {qualityDist.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: QUALITY_COLORS[i % QUALITY_COLORS.length] }} />
                      <span className="text-xs">{d.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{d.value}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by batch number, commodity, or product..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={processFilter} onValueChange={v => setProcessFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-[140px]"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Process" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {PROCESS_TYPES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={commodityFilter} onValueChange={v => setCommodityFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Commodity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {COMMODITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="PENDING">Pending Approval</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
        {(processFilter || statusFilter || search || commodityFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setProcessFilter(''); setStatusFilter(''); setSearch(''); setCommodityFilter('') }} className="gap-1">
            <X className="w-3.5 h-3.5" /> Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Layers className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No processing batches found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead className="hidden md:table-cell">Process</TableHead>
                    <TableHead>Commodity → Product</TableHead>
                    <TableHead className="hidden sm:table-cell">Quantity In/Out</TableHead>
                    <TableHead className="hidden lg:table-cell">Quality</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="w-[150px]">Workflow</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(b => {
                    const recovery = b.outputQuantity > 0 && b.inputQuantity > 0 ? ((b.outputQuantity / b.inputQuantity) * 100).toFixed(0) : null
                    return (
                      <TableRow key={b.id}>
                        <TableCell>
                          <div>
                            <p className="font-mono text-sm font-medium">{b.batchNumber}</p>
                            <p className="text-[10px] text-muted-foreground">{b.facility}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge className={cn('text-[10px] gap-1', processColor[b.processType])}>
                            {processIcon[b.processType]} {b.processType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{b.inputCommodity}</p>
                          <p className="text-[10px] text-muted-foreground">→ {b.outputProduct}</p>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="text-sm">
                            <span className="font-medium">{b.inputQuantity.toLocaleString()} {b.inputUnit}</span>
                            <span className="text-muted-foreground mx-1">→</span>
                            <span className={b.outputQuantity > 0 ? 'font-medium text-emerald-600' : 'text-muted-foreground'}>
                              {b.outputQuantity > 0 ? `${b.outputQuantity.toLocaleString()} ${b.outputUnit}` : '—'}
                            </span>
                            {recovery && <p className="text-[10px] text-muted-foreground">{recovery}% recovery</p>}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {b.qualityScore > 0 ? (
                            <div className="flex items-center gap-2 min-w-[100px]">
                              <Progress value={b.qualityScore} className="h-2 flex-1" />
                              <span className={cn('text-xs font-medium', b.qualityScore >= 85 ? 'text-emerald-600' : b.qualityScore >= 70 ? 'text-amber-600' : 'text-red-600')}>
                                {b.qualityScore}
                              </span>
                            </div>
                          ) : <span className="text-xs text-muted-foreground">N/A</span>}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('text-[10px]', gradeColor[b.qualityGrade] || '')}>{b.qualityGrade}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('text-[10px]', statusColor[b.status])}>{b.status.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {new Date(b.startDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {/* Second review (L): workflow buttons — one per legal
                              transition, permission-gated (server re-checks). */}
                          <div className="flex items-center gap-1">
                            {busyId === b.id && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                            {busyId !== b.id && b.status === 'PENDING' && canApprove && (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" onClick={() => runWorkflowAction(b, 'approve')} title="Approve batch">
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => { setRejectTarget(b); setRejectReason('') }} title="Reject batch">
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {busyId !== b.id && b.status === 'APPROVED' && canOperate && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => runWorkflowAction(b, 'start')} title="Start processing">
                                <Play className="w-4 h-4" />
                              </Button>
                            )}
                            {busyId !== b.id && b.status === 'IN_PROGRESS' && canOperate && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" onClick={() => setCompleteTarget(b)} title="Complete batch">
                                <CheckCheck className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(b.id, b.batchNumber)} title="Delete batch">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">Showing {filtered.length} of {totalBatches} batches</p>
          </div>
        )}
      </Card>

      {/* Add Batch Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              New Processing Batch
            </DialogTitle>
          </DialogHeader>
          <AddBatchForm onClose={() => { setShowAdd(false); fetchBatches() }} />
        </DialogContent>
      </Dialog>

      {/* ── Second review (L): Reject dialog (reason required) ── */}
      <Dialog open={!!rejectTarget} onOpenChange={open => { if (!open) setRejectTarget(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Reject Batch {rejectTarget?.batchNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {rejectTarget?.inputCommodity} · {rejectTarget?.processType} · {rejectTarget?.inputQuantity} {rejectTarget?.inputUnit} · {rejectTarget?.facility}
            </p>
            <div className="space-y-1.5">
              <Label>Reason *</Label>
              <Input
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Why is this batch rejected?"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || busyId !== null}
              onClick={async () => {
                if (!rejectTarget) return
                const ok = await runWorkflowAction(rejectTarget, 'reject', { reason: rejectReason.trim() })
                if (ok) setRejectTarget(null)
              }}
            >
              Reject Batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Second review (L): Complete dialog (output quantity + grade) ── */}
      <CompleteBatchDialog
        batch={completeTarget}
        busy={busyId !== null}
        onClose={() => setCompleteTarget(null)}
        onSubmit={async extra => {
          if (!completeTarget) return false
          return runWorkflowAction(completeTarget, 'complete', extra)
        }}
      />
    </div>
  )
}

/**
 * Second review (L): completing a batch records the output quantity, unit,
 * quality grade and score — the numbers that feed recovery-rate + quality
 * analytics. Submitted through the workflow route (IN_PROGRESS → COMPLETED).
 */
function CompleteBatchDialog({
  batch,
  busy,
  onClose,
  onSubmit,
}: {
  batch: ProcessingBatch | null
  busy: boolean
  onClose: () => void
  onSubmit: (extra: Record<string, unknown>) => Promise<boolean>
}) {
  const [form, setForm] = useState({ outputQuantity: '', outputUnit: 'kg', qualityGrade: 'Grade 1', qualityScore: '', notes: '' })
  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (batch) {
      setForm({
        outputQuantity: '',
        outputUnit: batch.outputUnit || 'kg',
        qualityGrade: batch.qualityGrade || 'Grade 1',
        qualityScore: '',
        notes: '',
      })
    }
  }, [batch])

  return (
    <Dialog open={!!batch} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCheck className="w-5 h-5 text-green-600" />
            Complete Batch {batch?.batchNumber}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={async e => {
            e.preventDefault()
            const qty = parseFloat(form.outputQuantity)
            if (!Number.isFinite(qty) || qty <= 0) { toast.error('Output quantity must be a positive number'); return }
            const ok = await onSubmit({
              outputQuantity: qty,
              outputUnit: form.outputUnit,
              qualityGrade: form.qualityGrade,
              qualityScore: form.qualityScore ? parseFloat(form.qualityScore) : undefined,
              notes: form.notes || undefined,
            })
            if (ok) onClose()
          }}
          className="space-y-4"
        >
          <p className="text-sm text-muted-foreground">
            {batch?.inputCommodity} · {batch?.processType} · input {batch?.inputQuantity} {batch?.inputUnit}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Output Quantity *</Label>
              <Input type="number" step="any" min="0" value={form.outputQuantity} onChange={e => update('outputQuantity', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Output Unit</Label>
              <Input value={form.outputUnit} onChange={e => update('outputUnit', e.target.value)} placeholder="kg / L / bags" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Quality Grade</Label>
              <Select value={form.qualityGrade} onValueChange={v => update('qualityGrade', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{QUALITY_GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quality Score (0-100)</Label>
              <Input type="number" min="0" max="100" value={form.qualityScore} onChange={e => update('qualityScore', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Completion notes..." />
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" disabled={busy} className="gap-2">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Complete Batch
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddBatchForm({ onClose }: { onClose: () => void }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    inputCommodity: '', processType: '', outputProduct: '', inputQuantity: '',
    inputUnit: 'kg', outputQuantity: '', outputUnit: 'kg', qualityGrade: '',
    facility: '', notes: '', startDate: new Date().toISOString().split('T')[0],
  })
  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.inputCommodity || !form.processType || !form.outputProduct || !form.inputQuantity || !form.facility) {
      toast.error('Commodity, process type, output product, input quantity, and facility are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/processing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputCommodity: form.inputCommodity,
          processType: form.processType,
          outputProduct: form.outputProduct,
          inputQuantity: parseFloat(form.inputQuantity),
          inputUnit: form.inputUnit,
          outputQuantity: form.outputQuantity ? parseFloat(form.outputQuantity) : 0,
          outputUnit: form.outputUnit,
          qualityGrade: form.qualityGrade || 'Grade 2',
          facility: form.facility,
          startDate: form.startDate,
          notes: form.notes,
          status: 'PENDING',
        }),
      })
      if (res.ok) {
        toast.success('Processing batch created successfully')
        onClose()
        return
      }
      const errBody = await res.json().catch(() => null)
      toast.error(errBody?.error || 'Failed to create processing batch')
    } catch {
      toast.error('Failed to create processing batch')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Input Commodity *</Label>
          <Select value={form.inputCommodity} onValueChange={v => update('inputCommodity', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{COMMODITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Process Type *</Label>
          <Select value={form.processType} onValueChange={v => update('processType', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{PROCESS_TYPES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Output Product *</Label>
        <Input value={form.outputProduct} onChange={e => update('outputProduct', e.target.value)} placeholder="e.g. Washed Arabica Parchment" required />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Input Qty *</Label>
          <Input type="number" value={form.inputQuantity} onChange={e => update('inputQuantity', e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Output Qty</Label>
          <Input type="number" value={form.outputQuantity} onChange={e => update('outputQuantity', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Quality Grade</Label>
          <Select value={form.qualityGrade} onValueChange={v => update('qualityGrade', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{QUALITY_GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Facility *</Label>
          <Input value={form.facility} onChange={e => update('facility', e.target.value)} placeholder="Processing center name" required />
        </div>
        <div className="space-y-1.5">
          <Label>Start Date</Label>
          <Input type="date" value={form.startDate} onChange={e => update('startDate', e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Input value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Any additional notes..." />
      </div>
      <DialogFooter className="gap-2">
        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
        <Button type="submit" disabled={saving} className="gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Create Batch
        </Button>
      </DialogFooter>
    </form>
  )
}