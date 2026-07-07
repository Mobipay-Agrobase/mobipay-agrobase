'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { safeFetch, extractArray } from '@/lib/safe-fetch'
import {
  Shield, Plus, Search, Download, Pencil, Trash2, Loader2, Save,
  Users, CheckCircle, AlertCircle, Umbrella, DollarSign, XCircle, X
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { EmptyState, exportToCSV } from '@/components/ui/empty-state'

interface CropInsurance {
  id: string
  farmerId: string
  crop: string
  provider?: string | null
  policyNumber?: string | null
  premium?: number | null
  coverageAmount?: number | null
  status: string
  enrollmentDate: string
  payoutAmount?: number | null
  payoutDate?: string | null
  notes?: string | null
  farmer?: { id: string; firstName: string; lastName: string; farmerCode?: string | null }
}

interface Farmer {
  id: string
  firstName: string
  lastName: string
  farmerCode?: string | null
}

const CROPS = [
  { value: 'coffee', label: 'Coffee' },
  { value: 'cocoa', label: 'Cocoa' },
  { value: 'vanilla', label: 'Vanilla' },
  { value: 'cassava', label: 'Cassava' },
  { value: 'avocado', label: 'Avocado' },
  { value: 'jackfruit', label: 'Jackfruit' },
]

const statusColor: Record<string, string> = {
  ENROLLED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  ACTIVE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  LAPSED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  PAYOUT_PAID: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
}

const fmtUGX = (n: number) => `UGX ${(Number(n) || 0).toLocaleString()}`

export default function CropInsuranceView() {
  const [records, setRecords] = useState<CropInsurance[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<CropInsurance | null>(null)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const data = await safeFetch('/api/crop-insurance')
      if (!data) { setRecords([]); return }
      setRecords(extractArray(data, 'data', 'records', 'cropInsurance'))
    } catch (e) {
      console.error(e)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this crop insurance record?')) return
    try {
      const res = await fetch(`/api/crop-insurance/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Insurance record deleted')
        fetchRecords()
      } else {
        toast.error('Failed to delete')
      }
    } catch {
      toast.error('Network error')
    }
  }

  const filtered = useMemo(() => {
    if (!search) return records
    const q = search.toLowerCase()
    return records.filter(r => {
      const name = r.farmer ? `${r.farmer.firstName} ${r.farmer.lastName}`.toLowerCase() : ''
      return name.includes(q) || (r.farmer?.farmerCode || '').toLowerCase().includes(q)
    })
  }, [records, search])

  const totalEnrolled = records.length
  const activeCount = records.filter(r => r.status === 'ACTIVE' || r.status === 'ENROLLED').length
  const lapsedCount = records.filter(r => r.status === 'LAPSED' || r.status === 'CANCELLED').length
  const payoutsReceived = records.filter(r => (Number(r.payoutAmount) || 0) > 0).length

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center"><Umbrella className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-xs text-muted-foreground">Total Enrolled</p><p className="text-xl font-bold">{totalEnrolled}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center"><Shield className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-bold">{activeCount}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center"><XCircle className="w-5 h-5 text-red-600" /></div>
          <div><p className="text-xs text-muted-foreground">Lapsed</p><p className="text-xl font-bold">{lapsedCount}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center"><DollarSign className="w-5 h-5 text-amber-600" /></div>
          <div><p className="text-xs text-muted-foreground">Payouts Received</p><p className="text-xl font-bold">{payoutsReceived}</p></div>
        </CardContent></Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by farmer name or code..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearch('')}>
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(
              filtered.map(r => ({
                Farmer: r.farmer ? `${r.farmer.firstName} ${r.farmer.lastName}` : '',
                FarmerCode: r.farmer?.farmerCode || '',
                Crop: r.crop,
                Provider: r.provider || '',
                PolicyNumber: r.policyNumber || '',
                Premium: r.premium || 0,
                Coverage: r.coverageAmount || 0,
                Status: r.status,
                PayoutAmount: r.payoutAmount || 0,
                PayoutDate: r.payoutDate ? new Date(r.payoutDate).toLocaleDateString() : '',
                EnrollmentDate: r.enrollmentDate ? new Date(r.enrollmentDate).toLocaleDateString() : '',
              })),
              'crop-insurance'
            )}
            disabled={filtered.length === 0}
            className="gap-2"
          >
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button onClick={() => { setEditing(null); setShowCreate(true) }} className="gap-2">
            <Plus className="w-4 h-4" /> Enroll Farmer
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No crop insurance records yet"
              description='Click "Enroll Farmer" to enroll the first farmer'
              actionLabel="Enroll Farmer"
              onAction={() => { setEditing(null); setShowCreate(true) }}
            />
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Farmer</TableHead>
                    <TableHead className="hidden sm:table-cell">Crop</TableHead>
                    <TableHead className="hidden md:table-cell">Provider</TableHead>
                    <TableHead className="hidden lg:table-cell">Policy #</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Premium</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Coverage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Payout</TableHead>
                    <TableHead className="hidden xl:table-cell">Payout Date</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(r => {
                    const farmerName = r.farmer ? `${r.farmer.firstName} ${r.farmer.lastName}` : 'Unknown'
                    return (
                      <TableRow key={r.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{farmerName}</p>
                            {r.farmer?.farmerCode && <p className="text-[10px] text-muted-foreground font-mono">{r.farmer.farmerCode}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="text-[10px] capitalize">{r.crop || '—'}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{r.provider || '—'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs font-mono text-muted-foreground">{r.policyNumber || '—'}</TableCell>
                        <TableCell className="text-right hidden md:table-cell text-sm">{r.premium ? fmtUGX(r.premium) : '—'}</TableCell>
                        <TableCell className="text-right hidden lg:table-cell text-sm font-medium">{r.coverageAmount ? fmtUGX(r.coverageAmount) : '—'}</TableCell>
                        <TableCell>
                          <Badge className={cn('text-[10px]', statusColor[r.status] || 'bg-gray-100 text-gray-700')}>
                            {(r.status || 'ENROLLED').replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right hidden lg:table-cell text-sm text-emerald-700 dark:text-emerald-400">
                          {r.payoutAmount ? fmtUGX(r.payoutAmount) : '—'}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-xs text-muted-foreground whitespace-nowrap">
                          {r.payoutDate ? new Date(r.payoutDate).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(r); setShowCreate(true) }} title="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={() => handleDelete(r.id)} title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
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
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={open => { setShowCreate(open); if (!open) setEditing(null) }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Insurance Record' : 'Enroll Farmer in Crop Insurance'}</DialogTitle>
          </DialogHeader>
          <CropInsuranceForm
            record={editing}
            onClose={() => { setShowCreate(false); setEditing(null) }}
            onSaved={() => { setShowCreate(false); setEditing(null); fetchRecords() }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Insurance Form ─────────────────────────────────────────────

function CropInsuranceForm({
  record,
  onClose,
  onSaved,
}: {
  record: CropInsurance | null
  onClose: () => void
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [farmersLoading, setFarmersLoading] = useState(true)
  const [form, setForm] = useState<Record<string, any>>({
    farmerId: record?.farmerId || '',
    crop: record?.crop || 'coffee',
    provider: record?.provider || '',
    policyNumber: record?.policyNumber || '',
    premium: record?.premium ?? '',
    coverageAmount: record?.coverageAmount ?? '',
    enrollmentDate: record?.enrollmentDate
      ? new Date(record.enrollmentDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    status: record?.status || 'ENROLLED',
    payoutAmount: record?.payoutAmount ?? '',
    payoutDate: record?.payoutDate ? new Date(record.payoutDate).toISOString().split('T')[0] : '',
    notes: record?.notes || '',
  })

  useEffect(() => {
    let cancelled = false
    safeFetch('/api/farmers?limit=200').then(data => {
      if (cancelled) return
      const arr = extractArray(data, 'farmers', 'data')
      setFarmers(arr)
      setFarmersLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.farmerId) { toast.error('Farmer is required'); return }
    if (!form.crop) { toast.error('Crop is required'); return }

    setSaving(true)
    try {
      const payload: Record<string, any> = {
        farmerId: form.farmerId,
        crop: form.crop,
        provider: form.provider || null,
        policyNumber: form.policyNumber || null,
        premium: form.premium ? String(form.premium) : null,
        coverageAmount: form.coverageAmount ? String(form.coverageAmount) : null,
        enrollmentDate: form.enrollmentDate || null,
        notes: form.notes || null,
      }
      if (record) {
        payload.status = form.status
        payload.payoutAmount = form.payoutAmount ? String(form.payoutAmount) : null
        payload.payoutDate = form.payoutDate || null
      }
      const url = record ? `/api/crop-insurance/${record.id}` : '/api/crop-insurance'
      const method = record ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success(record ? 'Insurance record updated' : 'Farmer enrolled successfully')
        onSaved()
      } else {
        toast.error(data.error || 'Failed to save')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Farmer *</Label>
        <Select value={form.farmerId} onValueChange={v => update('farmerId', v)}>
          <SelectTrigger><SelectValue placeholder={farmersLoading ? 'Loading farmers...' : 'Select farmer'} /></SelectTrigger>
          <SelectContent>
            {farmers.map(f => (
              <SelectItem key={f.id} value={f.id}>
                {f.firstName} {f.lastName}{f.farmerCode ? ` (${f.farmerCode})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {farmers.length === 0 && !farmersLoading && (
          <p className="text-xs text-amber-600 flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> No farmers found</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Crop *</Label>
          <Select value={form.crop} onValueChange={v => update('crop', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CROPS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Provider</Label>
          <Input value={form.provider} onChange={e => update('provider', e.target.value)} placeholder="e.g. UAP Old Mutual, Jubilee" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Policy Number</Label>
          <Input value={form.policyNumber} onChange={e => update('policyNumber', e.target.value)} placeholder="e.g. POL-2024-00123" />
        </div>
        <div className="space-y-1.5">
          <Label>Enrollment Date</Label>
          <Input type="date" value={form.enrollmentDate} onChange={e => update('enrollmentDate', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Premium (UGX)</Label>
          <Input type="number" step="any" min="0" value={form.premium} onChange={e => update('premium', e.target.value)} placeholder="e.g. 50000" />
        </div>
        <div className="space-y-1.5">
          <Label>Coverage Amount (UGX)</Label>
          <Input type="number" step="any" min="0" value={form.coverageAmount} onChange={e => update('coverageAmount', e.target.value)} placeholder="e.g. 2000000" />
        </div>
      </div>

      {record && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border border-dashed rounded-lg bg-muted/30">
          <div className="md:col-span-3 text-xs font-medium text-muted-foreground">Edit-only fields</div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => update('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ENROLLED">Enrolled</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="LAPSED">Lapsed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="PAYOUT_PAID">Payout Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Payout Amount (UGX)</Label>
            <Input type="number" step="any" min="0" value={form.payoutAmount} onChange={e => update('payoutAmount', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Payout Date</Label>
            <Input type="date" value={form.payoutDate} onChange={e => update('payoutDate', e.target.value)} />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea
          value={form.notes}
          onChange={e => update('notes', e.target.value)}
          rows={2}
          placeholder="Optional notes about this insurance policy..."
        />
      </div>

      <DialogFooter className="gap-2">
        <DialogClose asChild><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></DialogClose>
        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {record ? 'Update Record' : 'Enroll Farmer'}
        </Button>
      </DialogFooter>
    </form>
  )
}
