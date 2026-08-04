'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { PiggyBank, RefreshCw, Loader2, Search, Plus, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { exportToCSV } from '@/components/ui/empty-state'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  FAILED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  REFUNDED: 'bg-gray-100 text-gray-700',
}

function formatUGX(n: any) { const num = typeof n === 'number' ? n : Number(n) || 0; return `UGX ${num.toLocaleString()}` }
function formatDate(d: any) { return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' }

export default function NssfContributionsView() {
  const [contributions, setContributions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showContribute, setShowContribute] = useState(false)
  const [contributing, setContributing] = useState(false)
  
  // Pagination + filters
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const fetchContributions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/nssf/contributions?${params.toString()}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setContributions(data.data || data.contributions || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch {
      setContributions([])
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { fetchContributions() }, [fetchContributions])

  // Client-side search filter (since API doesn't support search param)
  const filtered = contributions.filter(c => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      c.farmer?.firstName?.toLowerCase().includes(term) ||
      c.farmer?.lastName?.toLowerCase().includes(term) ||
      c.farmer?.phone?.toLowerCase().includes(term) ||
      c.paymentReference?.toLowerCase().includes(term)
    )
  })

  const handleContribute = async (formData: any) => {
    setContributing(true)
    try {
      const res = await fetch('/api/nssf/contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        toast.success('NSSF contribution submitted successfully')
        setShowContribute(false)
        fetchContributions()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to submit contribution')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setContributing(false)
    }
  }

  const handleExport = () => {
    const csvData = filtered.map(c => ({
      Date: formatDate(c.contributionDate || c.createdAt),
      Farmer: c.farmer ? `${c.farmer.firstName} ${c.farmer.lastName}` : '—',
      Phone: c.farmer?.phone || '—',
      Amount: Number(c.amount),
      Currency: c.currency || 'UGX',
      Method: c.paymentMethod || '—',
      Status: c.status,
      Reference: c.paymentReference || '—',
    }))
    exportToCSV(csvData, 'nssf-contributions')
    toast.success('Exported to CSV')
  }

  const completedTotal = filtered.filter(c => c.status === 'COMPLETED').reduce((s, c) => s + (Number(c.amount) || 0), 0)

  if (loading && contributions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Total Contributions</p>
          <p className="text-xl font-bold">{total}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Completed Amount</p>
          <p className="text-lg font-bold text-emerald-600">{formatUGX(completedTotal)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Completed Count</p>
          <p className="text-xl font-bold">{filtered.filter(c => c.status === 'COMPLETED').length}</p>
        </CardContent></Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search farmer name, phone, reference..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1) } }}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'ALL' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0} className="gap-2">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
        <Button variant="outline" size="sm" onClick={fetchContributions} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
        <Button size="sm" onClick={() => setShowContribute(true)} className="gap-2">
          <Plus className="w-3.5 h-3.5" /> New Contribution
        </Button>
      </div>

      {/* Table */}
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="text-xs">Date</TableHead>
            <TableHead className="text-xs">Farmer</TableHead>
            <TableHead className="text-xs">Phone</TableHead>
            <TableHead className="text-xs text-right">Amount</TableHead>
            <TableHead className="text-xs">Method</TableHead>
            <TableHead className="text-xs">Reference</TableHead>
            <TableHead className="text-xs">Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length > 0 ? filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="text-xs">{formatDate(c.contributionDate || c.createdAt)}</TableCell>
                <TableCell className="text-xs font-medium">
                  {c.farmer ? `${c.farmer.firstName} ${c.farmer.lastName}` : '—'}
                </TableCell>
                <TableCell className="text-xs">{c.farmer?.phone || '—'}</TableCell>
                <TableCell className="text-xs text-right font-medium">{formatUGX(Number(c.amount))}</TableCell>
                <TableCell className="text-xs">{c.paymentMethod || '—'}</TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">{c.paymentReference || '—'}</TableCell>
                <TableCell><Badge className={STATUS_COLORS[c.status] || 'bg-gray-100'}>{c.status}</Badge></TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No NSSF contributions found. Click "New Contribution" to add one.
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent></Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages} · {total} total records
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="gap-1">
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="gap-1">
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Contribute Dialog */}
      {showContribute && <ContributeDialog onClose={() => setShowContribute(false)} onSubmit={handleContribute} contributing={contributing} />}
    </div>
  )
}

function ContributeDialog({ onClose, onSubmit, contributing }: { onClose: () => void; onSubmit: (data: any) => void; contributing: boolean }) {
  const [form, setForm] = useState({ registrationId: '', amount: '', paymentMethod: 'MTN_MOMO' })

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New NSSF Contribution</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Registration ID</Label><Input value={form.registrationId} onChange={e => setForm({ ...form, registrationId: e.target.value })} placeholder="Enter NSSF registration ID" /></div>
          <div><Label>Amount (UGX)</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 50000" /></div>
          <div>
            <Label>Payment Method</Label>
            <Select value={form.paymentMethod} onValueChange={v => setForm({ ...form, paymentMethod: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MTN_MOMO">MTN MoMo</SelectItem>
                <SelectItem value="AIRTEL_MONEY">Airtel Money</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={() => onSubmit({ ...form, amount: parseFloat(form.amount) })} disabled={contributing || !form.registrationId || !form.amount}>
            {contributing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
