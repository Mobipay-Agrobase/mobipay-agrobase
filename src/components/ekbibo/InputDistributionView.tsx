'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { safeFetch, extractArray } from '@/lib/safe-fetch'
import {
  Package, Plus, Search, Download, Pencil, Trash2, Loader2, Save,
  DollarSign, Wallet, CheckCircle, AlertCircle, Boxes, X
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
import { FarmerSearchSelect } from '@/components/ui/farmer-search-select'
import { useAppStore } from '@/lib/store'

interface InputDistribution {
  id: string
  farmerId: string
  inputType: string
  inputName?: string | null
  quantity: number
  unit: string
  unitCost: number
  totalCost: number
  paymentMode?: string | null
  amountPaid?: number | null
  balanceRemaining: number
  status: string
  distributionDate: string
  notes?: string | null
  farmer?: { id: string; firstName: string; lastName: string; farmerCode?: string | null }
}

interface Farmer {
  id: string
  firstName: string
  lastName: string
  farmerCode?: string | null
}

const INPUT_TYPES = [
  { value: 'tarpaulin', label: 'Tarpaulin' },
  { value: 'fertilizer', label: 'Fertilizer' },
  { value: 'pruning_saw', label: 'Pruning Saw' },
  { value: 'seedling', label: 'Seedling' },
]

const INPUT_UNITS = ['pcs', 'kg', 'liters', 'bags', 'meters']

const statusColor: Record<string, string> = {
  DISTRIBUTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  PARTIAL_REPAY: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  FULLY_REPAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

const fmtUGX = (n: number) => `UGX ${(Number(n) || 0).toLocaleString()}`

export default function InputDistributionView() {
  const [distributions, setDistributions] = useState<InputDistribution[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<InputDistribution | null>(null)

  const fetchDistributions = useCallback(async () => {
    setLoading(true)
    try {
      const data = await safeFetch('/api/input-distribution')
      if (!data) { setDistributions([]); return }
      setDistributions(extractArray(data, 'data', 'distributions'))
    } catch (e) {
      console.error(e)
      setDistributions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDistributions() }, [fetchDistributions])

  const openDetail = (id: string) => {
    useAppStore.getState().setSelectedInputDistId(id)
    useAppStore.getState().setActiveModule('input-dist-detail')
  }
  const openCreate = () => useAppStore.getState().setActiveModule('input-dist-create')

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this input distribution record?')) return
    try {
      const res = await fetch(`/api/input-distribution/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Distribution deleted')
        fetchDistributions()
      } else {
        toast.error('Failed to delete')
      }
    } catch {
      toast.error('Network error')
    }
  }

  const filtered = useMemo(() => {
    if (!search) return distributions
    const q = search.toLowerCase()
    return distributions.filter(d => {
      const name = d.farmer ? `${d.farmer.firstName} ${d.farmer.lastName}`.toLowerCase() : ''
      return name.includes(q) || (d.farmer?.farmerCode || '').toLowerCase().includes(q)
    })
  }, [distributions, search])

  const totalDistributions = distributions.length
  const totalValue = distributions.reduce((s, d) => s + (Number(d.totalCost) || 0), 0)
  const outstandingBalance = distributions.reduce((s, d) => s + (Number(d.balanceRemaining) || 0), 0)
  const fullyRepaidCount = distributions.filter(d => d.status === 'FULLY_REPAID' || (Number(d.balanceRemaining) || 0) === 0).length

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center"><Boxes className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-xs text-muted-foreground">Total Distributions</p><p className="text-xl font-bold">{totalDistributions}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center"><DollarSign className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-xs text-muted-foreground">Total Value</p><p className="text-lg font-bold">{fmtUGX(totalValue)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center"><Wallet className="w-5 h-5 text-amber-600" /></div>
          <div><p className="text-xs text-muted-foreground">Outstanding Balance</p><p className="text-lg font-bold">{fmtUGX(outstandingBalance)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/40 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-green-600" /></div>
          <div><p className="text-xs text-muted-foreground">Fully Repaid</p><p className="text-xl font-bold">{fullyRepaidCount}</p></div>
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
              filtered.map(d => ({
                Farmer: d.farmer ? `${d.farmer.firstName} ${d.farmer.lastName}` : '',
                FarmerCode: d.farmer?.farmerCode || '',
                InputType: d.inputType,
                InputName: d.inputName || '',
                Quantity: d.quantity,
                Unit: d.unit,
                UnitCost: d.unitCost,
                TotalCost: d.totalCost,
                PaymentMode: d.paymentMode || 'CREDIT',
                AmountPaid: d.amountPaid || 0,
                BalanceRemaining: d.balanceRemaining,
                Status: d.status,
                Date: d.distributionDate ? new Date(d.distributionDate).toLocaleDateString() : '',
              })),
              'input-distributions'
            )}
            disabled={filtered.length === 0}
            className="gap-2"
          >
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Distribute Input
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
              icon={Package}
              title="No input distributions yet"
              description='Click "Distribute Input" to record the first distribution'
              actionLabel="Distribute Input"
              onAction={openCreate}
            />
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Farmer</TableHead>
                    <TableHead className="hidden md:table-cell">Input Type</TableHead>
                    <TableHead className="hidden lg:table-cell">Input Name</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="hidden sm:table-cell">Unit</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Unit Cost</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Paid</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(d => {
                    const farmerName = d.farmer ? `${d.farmer.firstName} ${d.farmer.lastName}` : 'Unknown'
                    return (
                      <TableRow key={d.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => openDetail(d.id)}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{farmerName}</p>
                            {d.farmer?.farmerCode && <p className="text-[10px] text-muted-foreground font-mono">{d.farmer.farmerCode}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="text-[10px] capitalize">{d.inputType?.replace(/_/g, ' ') || '—'}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">{d.inputName || '—'}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{Number(d.quantity).toLocaleString()}</TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{d.unit || 'pcs'}</TableCell>
                        <TableCell className="text-right hidden md:table-cell text-sm">{fmtUGX(d.unitCost)}</TableCell>
                        <TableCell className="text-right text-sm font-semibold">{fmtUGX(d.totalCost)}</TableCell>
                        <TableCell className="text-right hidden lg:table-cell text-sm text-blue-600">{d.amountPaid ? fmtUGX(d.amountPaid) : '—'}</TableCell>
                        <TableCell className="text-right hidden lg:table-cell text-sm text-amber-600 dark:text-amber-400">{fmtUGX(d.balanceRemaining)}</TableCell>
                        <TableCell>
                          <Badge className={cn('text-[10px]', statusColor[d.status] || 'bg-gray-100 text-gray-700')}>
                            {(d.status || 'DISTRIBUTED').replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground whitespace-nowrap">
                          {d.distributionDate ? new Date(d.distributionDate).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); useAppStore.getState().setSelectedInputDistId(d.id); useAppStore.getState().setActiveModule('input-dist-edit') }} title="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={() => handleDelete(d.id)} title="Delete">
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
            <DialogTitle>{editing ? 'Edit Distribution' : 'Distribute Input'}</DialogTitle>
          </DialogHeader>
          <InputDistributionForm
            distribution={editing}
            onClose={() => { setShowCreate(false); setEditing(null) }}
            onSaved={() => { setShowCreate(false); setEditing(null); fetchDistributions() }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Distribution Form ─────────────────────────────────────────────

const PAYMENT_MODES = [
  { value: 'CREDIT', label: 'Credit (pay later)', hint: 'Full amount remains as balance' },
  { value: 'CASH_FULL', label: 'Cash — Full payment', hint: 'Paid in full now, no balance' },
  { value: 'CASH_PARTIAL', label: 'Cash — Partial (installments)', hint: 'Pay part now, balance to be paid' },
]

function InputDistributionForm({
  distribution,
  onClose,
  onSaved,
}: {
  distribution: InputDistribution | null
  onClose: () => void
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({
    farmerId: distribution?.farmerId || '',
    inputType: distribution?.inputType || 'tarpaulin',
    inputName: distribution?.inputName || '',
    quantity: distribution?.quantity ?? '',
    unit: distribution?.unit || 'pcs',
    unitCost: distribution?.unitCost ?? '',
    distributionDate: distribution?.distributionDate
      ? new Date(distribution.distributionDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    status: distribution?.status || 'DISTRIBUTED',
    notes: distribution?.notes || '',
    // ── Ekibbo payment fields ──
    paymentMode: distribution?.paymentMode || 'CREDIT',
    amountPaid: distribution?.amountPaid != null ? String(distribution.amountPaid) : '',
  })

  const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const qty = Number(form.quantity) || 0
  const unitCost = Number(form.unitCost) || 0
  const totalCost = qty * unitCost
  const paid = form.paymentMode === 'CASH_FULL'
    ? totalCost
    : form.paymentMode === 'CASH_PARTIAL'
      ? Math.max(0, Math.min(Number(form.amountPaid) || 0, totalCost))
      : 0
  const balance = Math.max(0, totalCost - paid)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.farmerId) { toast.error('Farmer is required'); return }
    if (!form.inputType) { toast.error('Input type is required'); return }
    if (!form.quantity || qty <= 0) { toast.error('Quantity must be greater than zero'); return }
    if (!form.unitCost || unitCost <= 0) { toast.error('Unit cost must be greater than zero'); return }

    setSaving(true)
    try {
      if (!distribution && form.paymentMode === 'CASH_PARTIAL' && paid <= 0) {
        toast.error('Enter the amount the farmer is paying now')
        setSaving(false)
        return
      }
      const payload: Record<string, any> = {
        farmerId: form.farmerId,
        inputType: form.inputType,
        inputName: form.inputName || null,
        quantity: String(form.quantity),
        unit: form.unit || 'pcs',
        unitCost: String(form.unitCost),
        distributionDate: form.distributionDate || null,
        notes: form.notes || null,
        paymentMode: form.paymentMode,
        amountPaid: form.paymentMode === 'CASH_PARTIAL' ? String(form.amountPaid) : undefined,
      }
      if (distribution) {
        payload.status = form.status
        payload.balanceRemaining = String(distribution.balanceRemaining)
      }
      const url = distribution ? `/api/input-distribution/${distribution.id}` : '/api/input-distribution'
      const method = distribution ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success(distribution ? 'Distribution updated' : 'Input distributed successfully')
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
        <FarmerSearchSelect value={form.farmerId} onChange={v => update('farmerId', v)} />
        <p className="text-[11px] text-muted-foreground">Type to search by name, farmer code or phone.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Input Type *</Label>
          <Select value={form.inputType} onValueChange={v => update('inputType', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {INPUT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Input Name</Label>
          <Input
            value={form.inputName}
            onChange={e => update('inputName', e.target.value)}
            placeholder="e.g. 5x7m Tarpaulin, NPK 25-10-5"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <Label>Quantity *</Label>
          <Input type="number" step="any" min="0" value={form.quantity} onChange={e => update('quantity', e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Unit</Label>
          <Select value={form.unit} onValueChange={v => update('unit', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {INPUT_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Unit Cost (UGX) *</Label>
          <Input type="number" step="any" min="0" value={form.unitCost} onChange={e => update('unitCost', e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input type="date" value={form.distributionDate} onChange={e => update('distributionDate', e.target.value)} />
        </div>
      </div>

      {distribution && (
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => update('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DISTRIBUTED">Distributed</SelectItem>
              <SelectItem value="PARTIAL_REPAY">Partial Repay</SelectItem>
              <SelectItem value="FULLY_REPAID">Fully Repaid</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea
          value={form.notes}
          onChange={e => update('notes', e.target.value)}
          rows={2}
          placeholder="Optional notes about this distribution..."
        />
      </div>

      {/* ── Payment (Ekibbo: balance when paying cash in installments) ── */}
      {!distribution && (
        <div className="border rounded-lg p-3 space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2"><Wallet className="w-4 h-4 text-primary" /> Payment</h4>
          <div className="space-y-2">
            {PAYMENT_MODES.map(m => (
              <label
                key={m.value}
                className={cn(
                  'flex items-start gap-2.5 p-2.5 rounded-md border cursor-pointer transition-colors',
                  form.paymentMode === m.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                )}
              >
                <input
                  type="radio"
                  name="paymentMode"
                  className="mt-0.5 accent-primary"
                  checked={form.paymentMode === m.value}
                  onChange={() => update('paymentMode', m.value)}
                />
                <span className="flex flex-col">
                  <span className="text-sm font-medium">{m.label}</span>
                  <span className="text-[11px] text-muted-foreground">{m.hint}</span>
                </span>
              </label>
            ))}
          </div>
          {form.paymentMode === 'CASH_PARTIAL' && (
            <div className="space-y-1.5">
              <Label>Amount Paid Now (UGX) *</Label>
              <Input
                type="number" step="any" min="0" max={totalCost || undefined}
                value={form.amountPaid}
                onChange={e => update('amountPaid', e.target.value)}
                placeholder="0"
              />
            </div>
          )}
        </div>
      )}

      {/* Auto-calc */}
      <div className="bg-muted/50 p-3 rounded-lg space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Cost (auto):</span>
          <span className="font-bold text-emerald-700 dark:text-emerald-400">{fmtUGX(totalCost)}</span>
        </div>
        {!distribution && paid > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Paid Now:</span>
            <span className="font-medium text-blue-600">{fmtUGX(paid)}</span>
          </div>
        )}
        {!distribution && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Balance to be Paid:</span>
            <span className="font-bold text-amber-600">{fmtUGX(balance)}</span>
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">
          = {qty.toLocaleString()} {form.unit} × {fmtUGX(unitCost)}
        </p>
      </div>

      <DialogFooter className="gap-2">
        <DialogClose asChild><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></DialogClose>
        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {distribution ? 'Update Distribution' : 'Distribute Input'}
        </Button>
      </DialogFooter>
    </form>
  )
}
