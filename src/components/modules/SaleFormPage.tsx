'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { ArrowLeft, Loader2, Save, Calculator, AlertCircle, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { FarmerSearchSelect } from '@/components/ui/farmer-search-select'
import { safeFetch, extractArray } from '@/lib/safe-fetch'

const PRODUCE_ITEMS = ['Hulled Coffee', 'Cocoa', 'Cassava', 'Avocado', 'Vanilla', 'Jackfruit']
const INPUT_ITEMS = ['Fertilizers', 'Tarpaulins', 'Seedlings', 'Pruning Saws']
const fmtUGX = (n: number) => `UGX ${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`

export default function SaleFormPage({
  mode, saleId,
}: {
  mode: 'create' | 'edit'
  saleId?: string
}) {
  const { setActiveModule } = useAppStore()
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [batches, setBatches] = useState<any[]>([])
  const [form, setForm] = useState<Record<string, string>>({
    farmerId: '', customerName: '', category: 'PRODUCE', product: PRODUCE_ITEMS[0],
    quantity: '', unitPrice: '', charges: '', taxAmount: '',
    paymentMethod: 'MOBILE_MONEY', loanDeducted: '', batchId: '',
  })

  useEffect(() => {
    safeFetch('/api/traceability/batches?limit=100&status=COLLECTED')
      .then(d => setBatches(extractArray(d, 'data', 'batches')))
      .catch(() => {})
    if (mode !== 'edit' || !saleId) return
    setLoading(true)
    fetch(`/api/sales/${saleId}`).then(r => r.json()).then(({ data }) => {
      if (!data) throw new Error()
      setForm({
        farmerId: data.farmerId || '',
        customerName: data.customerName || '',
        category: data.category || 'PRODUCE',
        product: data.product || '',
        quantity: String(data.quantity ?? ''),
        unitPrice: data.unitPrice != null ? String(data.unitPrice) : '',
        charges: data.charges != null ? String(data.charges) : '',
        taxAmount: data.taxAmount != null ? String(data.taxAmount) : '',
        paymentMethod: data.paymentMethod || 'MOBILE_MONEY',
        loanDeducted: data.loanDeducted != null ? String(data.loanDeducted) : '',
        batchId: data.batchId || '',
      })
    }).catch(() => toast.error('Failed to load sale')).finally(() => setLoading(false))
  }, [mode, saleId])

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const qty = Number(form.quantity) || 0
  const unitPrice = Number(form.unitPrice) || 0
  const charges = Number(form.charges) || 0
  const taxAmount = Number(form.taxAmount) || 0
  const loanDeducted = Number(form.loanDeducted) || 0
  const totalAmount = qty * unitPrice
  const netAmount = totalAmount - charges - taxAmount

  const items = form.category === 'PRODUCE' ? PRODUCE_ITEMS : INPUT_ITEMS
  useEffect(() => { if (!items.includes(form.product)) update("product", items[0]) }, [form.category])

  const selectedBatch = useMemo(() => batches.find(b => b.batchId === form.batchId), [batches, form.batchId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customerName.trim()) { toast.error('Buyer / customer name is required'); return }
    if (qty <= 0) { toast.error('Quantity must be greater than zero'); return }
    if (selectedBatch && qty > selectedBatch.quantityKg) {
      toast.error(`Only ${selectedBatch.quantityKg} kg available in batch ${selectedBatch.batchId}`); return
    }
    setSaving(true)
    try {
      const payload = {
        farmerId: form.farmerId || null,
        customerName: form.customerName.trim(),
        category: form.category,
        product: form.product,
        quantity: String(qty),
        unitPrice,
        totalAmount,
        charges: charges || null,
        taxAmount: taxAmount || null,
        netAmount,
        paymentMethod: form.paymentMethod,
        loanDeducted: loanDeducted || null,
        batchId: form.batchId || null,
        status: 'PENDING',
      }
      const res = await fetch(mode === 'edit' ? `/api/sales/${saleId}` : '/api/sales', {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      toast.success(mode === 'edit' ? 'Sale updated' : 'Sale created — approve it from the detail page')
      setActiveModule('sales')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save sale')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveModule('sales')}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h2 className="text-lg font-semibold">{mode === 'edit' ? 'Edit Sale' : 'New Sale'}</h2>
            <p className="text-xs text-muted-foreground">Sell produce to a buyer — link a traceability batch for end-to-end chain</p>
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Buyer / Customer *</Label>
                    <Input value={form.customerName} onChange={e => update('customerName', e.target.value)} placeholder="e.g. Kampala Traders Ltd" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={v => update('category', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRODUCE">Produce</SelectItem>
                        <SelectItem value="INPUT">Inputs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Product *</Label>
                    <Select value={form.product} onValueChange={v => update('product', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {items.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Payment Method</Label>
                    <Select value={form.paymentMethod} onValueChange={v => update('paymentMethod', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                        <SelectItem value="BANK">Bank Transfer</SelectItem>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="LOAN_DEDUCTION">Loan Deduction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Traceability Batch <span className="text-muted-foreground font-normal">(optional — links this sale into the E2E chain)</span></Label>
                  <Select value={form.batchId} onValueChange={v => update('batchId', v)}>
                    <SelectTrigger><SelectValue placeholder="No batch link" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No batch link</SelectItem>
                      {batches.map(b => (
                        <SelectItem key={b.id} value={b.batchId}>
                          {b.batchId} · {b.commodity} · {b.quantityKg}kg {b.farmer ? `· ${b.farmer.firstName} ${b.farmer.lastName}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedBatch && qty > 0 && qty > selectedBatch.quantityKg && (
                    <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Quantity exceeds the {selectedBatch.quantityKg}kg in this batch</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Source Farmer <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <FarmerSearchSelect value={form.farmerId} onChange={v => update('farmerId', v)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5"><Label>Quantity (kg) *</Label><Input type="number" step="any" min="0" value={form.quantity} onChange={e => update('quantity', e.target.value)} required /></div>
                  <div className="space-y-1.5"><Label>Unit Price (UGX) *</Label><Input type="number" step="any" min="0" value={form.unitPrice} onChange={e => update('unitPrice', e.target.value)} required /></div>
                  <div className="space-y-1.5"><Label>Charges (UGX)</Label><Input type="number" step="any" min="0" value={form.charges} onChange={e => update('charges', e.target.value)} placeholder="0" /></div>
                  <div className="space-y-1.5"><Label>Tax (UGX)</Label><Input type="number" step="any" min="0" value={form.taxAmount} onChange={e => update('taxAmount', e.target.value)} placeholder="0" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Loan Deducted (UGX)</Label><Input type="number" step="any" min="0" value={form.loanDeducted} onChange={e => update('loanDeducted', e.target.value)} placeholder="0" /></div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2"><Calculator className="w-4 h-4 text-primary" /><h3 className="text-sm font-semibold text-primary">Auto-Calculated</h3></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-background rounded-md p-3 border">
                  <p className="text-[11px] text-muted-foreground mb-1">Gross Amount</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{fmtUGX(totalAmount)}</p>
                </div>
                <div className="bg-background rounded-md p-3 border-2 border-emerald-400/50">
                  <p className="text-[11px] text-muted-foreground mb-1">Net Proceeds</p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{fmtUGX(netAmount)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Gross − charges − tax</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setActiveModule('sales')}>Cancel</Button>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {mode === 'edit' ? 'Update Sale' : 'Create Sale'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
