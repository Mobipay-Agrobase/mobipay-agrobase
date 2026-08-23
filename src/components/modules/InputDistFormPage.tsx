'use client'

import React, { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { ArrowLeft, Loader2, Save, Wallet, Boxes } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { FarmerSearchSelect } from '@/components/ui/farmer-search-select'

const INPUT_TYPES = [
  { value: 'tarpaulin', label: 'Tarpaulin' },
  { value: 'fertilizer', label: 'Fertilizer' },
  { value: 'pruning_saw', label: 'Pruning Saw' },
  { value: 'seedling', label: 'Seedling' },
]
const INPUT_UNITS = ['pcs', 'kg', 'liters', 'bags', 'meters']
const fmtUGX = (n: number) => `UGX ${(Number(n) || 0).toLocaleString()}`

const PAYMENT_MODES = [
  { value: 'CREDIT', label: 'Credit (pay later)', hint: 'Full amount remains as balance' },
  { value: 'CASH_FULL', label: 'Cash — Full payment', hint: 'Paid in full now, no balance' },
  { value: 'CASH_PARTIAL', label: 'Cash — Partial (installments)', hint: 'Pay part now, balance to be paid' },
]

export default function InputDistFormPage({
  mode, distributionId,
}: {
  mode: 'create' | 'edit'
  distributionId?: string
}) {
  const { setActiveModule } = useAppStore()
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({
    farmerId: '', inputType: 'tarpaulin', inputName: '', quantity: '',
    unit: 'pcs', unitCost: '', distributionDate: new Date().toISOString().split('T')[0],
    paymentMode: 'CREDIT', amountPaid: '', notes: '',
  })

  useEffect(() => {
    if (mode !== 'edit' || !distributionId) return
    setLoading(true)
    fetch(`/api/input-distribution?farmerId=&limit=200`).then(r => r.json()).then(d => {
      const all = d.data || []
      const dist = all.find((x: any) => x.id === distributionId)
      if (!dist) throw new Error()
      setForm({
        farmerId: dist.farmerId, inputType: dist.inputType, inputName: dist.inputName || '',
        quantity: String(dist.quantity ?? ''), unit: dist.unit || 'pcs',
        unitCost: String(dist.unitCost ?? ''),
        distributionDate: dist.distributionDate ? new Date(dist.distributionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        paymentMode: dist.paymentMode || 'CREDIT',
        amountPaid: dist.amountPaid != null ? String(dist.amountPaid) : '',
        notes: dist.notes || '',
      })
    }).catch(() => toast.error('Failed to load distribution')).finally(() => setLoading(false))
  }, [mode, distributionId])

  const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const qty = Number(form.quantity) || 0
  const unitCost = Number(form.unitCost) || 0
  const totalCost = qty * unitCost
  const paid = form.paymentMode === 'CASH_FULL' ? totalCost
    : form.paymentMode === 'CASH_PARTIAL' ? Math.max(0, Math.min(Number(form.amountPaid) || 0, totalCost)) : 0
  const balance = Math.max(0, totalCost - paid)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.farmerId) { toast.error('Farmer is required'); return }
    if (qty <= 0) { toast.error('Quantity must be greater than zero'); return }
    if (unitCost <= 0) { toast.error('Unit cost must be greater than zero'); return }
    if (form.paymentMode === 'CASH_PARTIAL' && paid <= 0) { toast.error('Enter the amount the farmer is paying now'); return }
    setSaving(true)
    try {
      const payload: Record<string, any> = {
        farmerId: form.farmerId, inputType: form.inputType, inputName: form.inputName || null,
        quantity: String(form.quantity), unit: form.unit, unitCost: String(form.unitCost),
        distributionDate: form.distributionDate || null, notes: form.notes || null,
        paymentMode: form.paymentMode,
        amountPaid: form.paymentMode === 'CASH_PARTIAL' ? String(form.amountPaid) : undefined,
      }
      const res = await fetch(mode === 'edit' ? `/api/input-distribution/${distributionId}` : '/api/input-distribution', {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      toast.success(mode === 'edit' ? 'Distribution updated' : 'Input distributed successfully')
      setActiveModule('input-distribution')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveModule('input-distribution')}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h2 className="text-lg font-semibold">{mode === 'edit' ? 'Edit Input Distribution' : 'Distribute Input'}</h2>
            <p className="text-xs text-muted-foreground">Record inputs given to a farmer — cash installments tracked with balance</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {loading ? (
          <div className="space-y-4 max-w-3xl">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded" />)}</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <Label>Farmer *</Label>
                  <FarmerSearchSelect value={form.farmerId} onChange={v => update('farmerId', v)} disabled={mode === 'edit'} />
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                    <Input value={form.inputName} onChange={e => update('inputName', e.target.value)} placeholder="e.g. 5x7m Tarpaulin, NPK 25-10-5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5"><Label>Quantity *</Label><Input type="number" step="any" min="0" value={form.quantity} onChange={e => update('quantity', e.target.value)} required /></div>
                  <div className="space-y-1.5">
                    <Label>Unit</Label>
                    <Select value={form.unit} onValueChange={v => update('unit', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{INPUT_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Unit Cost (UGX) *</Label><Input type="number" step="any" min="0" value={form.unitCost} onChange={e => update('unitCost', e.target.value)} required /></div>
                  <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.distributionDate} onChange={e => update('distributionDate', e.target.value)} /></div>
                </div>
              </CardContent>
            </Card>

            {mode === 'create' && (
              <Card>
                <CardContent className="p-3 space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><Wallet className="w-4 h-4 text-primary" /> Payment</h3>
                  <div className="space-y-2">
                    {PAYMENT_MODES.map(m => (
                      <label key={m.value} className={cn(
                        'flex items-start gap-2.5 p-2.5 rounded-md border cursor-pointer transition-colors',
                        form.paymentMode === m.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50',
                      )}>
                        <input type="radio" name="paymentMode" className="mt-0.5 accent-primary"
                          checked={form.paymentMode === m.value} onChange={() => update('paymentMode', m.value)} />
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
                      <Input type="number" step="any" min="0" max={totalCost || undefined} value={form.amountPaid} onChange={e => update('amountPaid', e.target.value)} placeholder="0" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Optional notes about this distribution..." />
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground text-xs"><Boxes className="w-3.5 h-3.5" /> Summary</div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Cost</span><span className="font-bold text-emerald-700 dark:text-emerald-400">{fmtUGX(totalCost)}</span></div>
              {mode === 'create' && paid > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Paid Now</span><span className="font-medium text-blue-600">{fmtUGX(paid)}</span></div>}
              {mode === 'create' && <div className="flex justify-between"><span className="text-muted-foreground">Balance to be Paid</span><span className="font-bold text-amber-600">{fmtUGX(balance)}</span></div>}
              <p className="text-[10px] text-muted-foreground">= {qty.toLocaleString()} {form.unit} × {fmtUGX(unitCost)}</p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setActiveModule('input-distribution')}>Cancel</Button>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {mode === 'edit' ? 'Update Distribution' : 'Distribute Input'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
