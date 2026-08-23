'use client'

import React, { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import {
  Loader2, Save, Calculator, Scale, Droplet, Bug, ArrowLeft, AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { FarmerSearchSelect } from '@/components/ui/farmer-search-select'

const COMMODITIES = ['coffee', 'cocoa', 'vanilla', 'cassava', 'avocado', 'jackfruit']
const COMMODITY_FORMS: Record<string, string[]> = {
  coffee: ['Fresh Cherry', 'Wet Parchment', 'Dry Parchment', 'Green Beans', 'Dry Cherry'],
  cocoa: ['Wet Beans', 'Dry Beans', 'Pods'],
  vanilla: ['Green Vanilla', 'Cured Vanilla'],
  cassava: ['Fresh Tubers', 'Dry Chips', 'Flour'],
  avocado: ['Fresh Fruit'],
  jackfruit: ['Fresh Fruit', 'Slices'],
}
const DEFAULT_MOISTURE_THRESHOLD = 13

const fmtUGX = (n: number) => `UGX ${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
const fmtKg = (n: number) => `${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} kg`

export default function PurchaseFormPage({
  mode, purchaseId,
}: {
  mode: 'create' | 'edit'
  purchaseId?: string
}) {
  const { setActiveModule } = useAppStore()
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({
    farmerId: '', commodity: 'coffee', form: '',
    totalWeight: '', moistureReading: '', moistureThreshold: String(DEFAULT_MOISTURE_THRESHOLD),
    defectCount: '', qualityDeduction: '', dailyPrice: '',
    loanDeduction: '', inputDeduction: '', momoCharges: '', momoTax: '',
  })

  useEffect(() => {
    if (mode !== 'edit' || !purchaseId) return
    setLoading(true)
    fetch(`/api/purchases/${purchaseId}`)
      .then(r => r.json())
      .then(({ data }) => {
        if (!data) throw new Error()
        setForm({
          farmerId: data.farmerId || '',
          commodity: data.commodity || 'coffee',
          form: data.variety || '',
          totalWeight: String(data.quantity ?? ''),
          moistureReading: data.moistureReading != null ? String(data.moistureReading) : '',
          moistureThreshold: data.moistureThreshold != null ? String(data.moistureThreshold) : String(DEFAULT_MOISTURE_THRESHOLD),
          defectCount: data.defectCount != null ? String(data.defectCount) : '',
          qualityDeduction: data.qualityDeduction != null ? String(data.qualityDeduction) : '',
          dailyPrice: data.dailyPrice != null ? String(data.dailyPrice) : String(data.unitPrice ?? ''),
          loanDeduction: data.loanDeduction != null ? String(data.loanDeduction) : '',
          inputDeduction: data.inputDeduction != null ? String(data.inputDeduction) : '',
          momoCharges: data.momoCharges != null ? String(data.momoCharges) : '',
          momoTax: data.momoTax != null ? String(data.momoTax) : '',
        })
      })
      .catch(() => toast.error('Failed to load purchase'))
      .finally(() => setLoading(false))
  }, [mode, purchaseId])

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const totalWeight = Number(form.totalWeight) || 0
  const moisture = Number(form.moistureReading) || 0
  const threshold = Number(form.moistureThreshold) || DEFAULT_MOISTURE_THRESHOLD
  const qualityDeduction = Number(form.qualityDeduction) || 0
  const dailyPrice = Number(form.dailyPrice) || 0
  const loanDeduction = Number(form.loanDeduction) || 0
  const inputDeduction = Number(form.inputDeduction) || 0
  const momoCharges = Number(form.momoCharges) || 0
  const momoTax = Number(form.momoTax) || 0

  const moistureExcess = Math.max(0, moisture - threshold)
  const moistureDeduction = Math.min(totalWeight, moistureExcess * (totalWeight / 100))
  const netWeight = Math.max(0, totalWeight - qualityDeduction - moistureDeduction)
  const purchaseTotal = netWeight * dailyPrice
  const netPayment = purchaseTotal - loanDeduction - inputDeduction - momoCharges - momoTax

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.farmerId) { toast.error('Farmer is required'); return }
    if (totalWeight <= 0) { toast.error('Total weight must be greater than zero'); return }
    if (dailyPrice <= 0) { toast.error('Daily price must be greater than zero'); return }
    setSaving(true)
    try {
      const payload = {
        farmerId: form.farmerId,
        commodity: form.commodity,
        variety: form.form || null,
        quantity: String(form.totalWeight),
        unit: 'kg',
        unitPrice: dailyPrice,
        dailyPrice,
        moistureReading: form.moistureReading || null,
        moistureThreshold: threshold,
        moistureDeduction: moistureDeduction || null,
        defectCount: form.defectCount || null,
        qualityDeduction: form.qualityDeduction || null,
        loanDeduction: form.loanDeduction || null,
        inputDeduction: form.inputDeduction || null,
        momoCharges: form.momoCharges || null,
        momoTax: form.momoTax || null,
      }
      const res = await fetch(mode === 'edit' ? `/api/purchases/${purchaseId}` : '/api/purchases', {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'edit' ? {
          variety: payload.variety, quantity: payload.quantity, unitPrice: dailyPrice,
          moistureReading: payload.moistureReading, moistureThreshold: threshold,
          moistureDeduction: payload.moistureDeduction, defectCount: payload.defectCount,
          qualityDeduction: payload.qualityDeduction, loanDeduction: payload.loanDeduction,
          inputDeduction: payload.inputDeduction, momoCharges: payload.momoCharges,
          momoTax: payload.momoTax, netWeight, totalAmount: purchaseTotal, netPayment,
        } : { ...payload, totalAmount: purchaseTotal, netWeight, netPayment, status: 'PENDING', approvalStatus: 'SUBMITTED' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      toast.success(mode === 'edit' ? 'Purchase updated' : 'Purchase created — submit it for approval from the detail page')
      setActiveModule('purchases')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save purchase')
    } finally {
      setSaving(false)
    }
  }

  const formOptions = COMMODITY_FORMS[form.commodity] || []

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveModule('purchases')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">{mode === 'edit' ? 'Edit Purchase' : 'New Purchase'}</h2>
              <p className="text-xs text-muted-foreground">
                {mode === 'edit' ? 'Update purchase record' : 'Record produce bought from a farmer — moisture & loan deductions are auto-applied'}
              </p>
            </div>
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
                    <Label>Commodity *</Label>
                    <Select value={form.commodity} onValueChange={v => { update('commodity', v); update('form', '') }} disabled={mode === 'edit'}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COMMODITIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Form *</Label>
                    <Select value={form.form} onValueChange={v => update('form', v)}>
                      <SelectTrigger><SelectValue placeholder="Select form" /></SelectTrigger>
                      <SelectContent>
                        {formOptions.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2"><Scale className="w-4 h-4 text-primary" /><h3 className="text-sm font-semibold">Quality & Weight</h3></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5"><Label>Total Weight (kg) *</Label><Input type="number" step="any" min="0" value={form.totalWeight} onChange={e => update('totalWeight', e.target.value)} required /></div>
                  <div className="space-y-1.5"><Label><Droplet className="w-3 h-3 inline" /> Moisture (%)</Label><Input type="number" step="any" min="0" max="100" value={form.moistureReading} onChange={e => update('moistureReading', e.target.value)} placeholder="0.0" /></div>
                  <div className="space-y-1.5"><Label>Moisture Std. (%)</Label><Input type="number" step="any" min="0" max="100" value={form.moistureThreshold} onChange={e => update('moistureThreshold', e.target.value)} /></div>
                  <div className="space-y-1.5"><Label><Bug className="w-3 h-3 inline" /> Defects (blacks)</Label><Input type="number" min="0" value={form.defectCount} onChange={e => update('defectCount', e.target.value)} placeholder="0" /></div>
                </div>
                {moistureExcess > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Moisture {moisture}% is {moistureExcess.toFixed(1)}% above standard — auto-deducting {fmtKg(moistureDeduction)}.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Quality Deduction (kg)</Label><Input type="number" step="any" min="0" value={form.qualityDeduction} onChange={e => update('qualityDeduction', e.target.value)} placeholder="0.00" /></div>
                  <div className="space-y-1.5"><Label>Daily Price (UGX/kg) *</Label><Input type="number" step="any" min="0" value={form.dailyPrice} onChange={e => update('dailyPrice', e.target.value)} required /></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="text-sm font-semibold">Money Deductions (UGX)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5"><Label>Loan Deduction</Label><Input type="number" step="any" min="0" value={form.loanDeduction} onChange={e => update('loanDeduction', e.target.value)} placeholder="0" /></div>
                  <div className="space-y-1.5"><Label>Input Deduction</Label><Input type="number" step="any" min="0" value={form.inputDeduction} onChange={e => update('inputDeduction', e.target.value)} placeholder="0" /></div>
                  <div className="space-y-1.5"><Label>MoMo Charges</Label><Input type="number" step="any" min="0" value={form.momoCharges} onChange={e => update('momoCharges', e.target.value)} placeholder="0" /></div>
                  <div className="space-y-1.5"><Label>MoMo Tax</Label><Input type="number" step="any" min="0" value={form.momoTax} onChange={e => update('momoTax', e.target.value)} placeholder="0" /></div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2"><Calculator className="w-4 h-4 text-primary" /><h3 className="text-sm font-semibold text-primary">Auto-Calculated</h3></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-background rounded-md p-3 border">
                  <p className="text-[11px] text-muted-foreground mb-1">Net Weight</p>
                  <p className="text-lg font-bold">{fmtKg(netWeight)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{fmtKg(totalWeight)} − {fmtKg(qualityDeduction)} quality − {fmtKg(moistureDeduction)} moisture</p>
                </div>
                <div className="bg-background rounded-md p-3 border">
                  <p className="text-[11px] text-muted-foreground mb-1">Purchase Total</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{fmtUGX(purchaseTotal)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{fmtKg(netWeight)} × {fmtUGX(dailyPrice)}/kg</p>
                </div>
                <div className="bg-background rounded-md p-3 border-2 border-emerald-400/50">
                  <p className="text-[11px] text-muted-foreground mb-1">Net Payment to Farmer</p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{fmtUGX(netPayment)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Total − loan − input − MoMo − tax</p>
                </div>
              </div>
              {netPayment < 0 && (
                <p className="text-xs text-red-600 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Net payment is negative — deductions exceed purchase total.</p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setActiveModule('purchases')}>Cancel</Button>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {mode === 'edit' ? 'Update Purchase' : 'Create Purchase'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
