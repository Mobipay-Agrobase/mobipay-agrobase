'use client'

import React, { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Loader2, Save, Calculator, Scale, DollarSign, Camera, Droplet,
  Bug, AlertCircle
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export interface EnhancedPurchaseFormProps {
  farmers: any[]
  onClose: () => void
  onSaved: () => void
}

const COMMODITIES = [
  { value: 'coffee', label: 'Coffee' },
  { value: 'cocoa', label: 'Cocoa' },
  { value: 'vanilla', label: 'Vanilla' },
  { value: 'cassava', label: 'Cassava' },
  { value: 'avocado', label: 'Avocado' },
  { value: 'jackfruit', label: 'Jackfruit' },
]

const fmtUGX = (n: number) => `UGX ${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
const fmtKg = (n: number) => `${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} kg`

export function EnhancedPurchaseForm({ farmers, onClose, onSaved }: EnhancedPurchaseFormProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({
    farmerId: '',
    commodity: 'coffee',
    variety: '',
    totalWeight: '',
    moistureReading: '',
    moisturePhotoUrl: '',
    defectCount: '',
    qualityDeduction: '',
    dailyPrice: '',
    loanDeduction: '',
    inputDeduction: '',
    momoCharges: '',
    momoTax: '',
  })

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  // Auto-calculations (real-time)
  const totalWeight = Number(form.totalWeight) || 0
  const qualityDeduction = Number(form.qualityDeduction) || 0
  const dailyPrice = Number(form.dailyPrice) || 0
  const loanDeduction = Number(form.loanDeduction) || 0
  const inputDeduction = Number(form.inputDeduction) || 0
  const momoCharges = Number(form.momoCharges) || 0
  const momoTax = Number(form.momoTax) || 0

  const calc = useMemo(() => {
    const netWeight = Math.max(0, totalWeight - qualityDeduction)
    const purchaseTotal = netWeight * dailyPrice
    const netPayment = purchaseTotal - loanDeduction - inputDeduction - momoCharges - momoTax
    return { netWeight, purchaseTotal, netPayment }
  }, [totalWeight, qualityDeduction, dailyPrice, loanDeduction, inputDeduction, momoCharges, momoTax])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.farmerId) { toast.error('Farmer is required'); return }
    if (!form.commodity) { toast.error('Commodity is required'); return }
    if (!form.totalWeight || totalWeight <= 0) { toast.error('Total weight must be greater than zero'); return }
    if (!form.dailyPrice || dailyPrice <= 0) { toast.error('Daily price must be greater than zero'); return }
    if (qualityDeduction > totalWeight) { toast.error('Quality deduction cannot exceed total weight'); return }

    setSaving(true)
    try {
      const payload: Record<string, any> = {
        farmerId: form.farmerId,
        commodity: form.commodity,
        variety: form.variety || null,
        quantity: String(form.totalWeight),
        unit: 'kg',
        unitPrice: dailyPrice,
        totalAmount: calc.purchaseTotal,
        status: 'PENDING',
        approvalStatus: 'SUBMITTED',
        // EKIBBO enhanced fields
        moistureReading: form.moistureReading ? parseFloat(form.moistureReading) : null,
        moisturePhotoUrl: form.moisturePhotoUrl || null,
        defectCount: form.defectCount ? parseInt(form.defectCount) : null,
        qualityDeduction: form.qualityDeduction ? parseFloat(form.qualityDeduction) : null,
        dailyPrice,
        loanDeduction: form.loanDeduction ? parseFloat(form.loanDeduction) : null,
        inputDeduction: form.inputDeduction ? parseFloat(form.inputDeduction) : null,
        momoCharges: form.momoCharges ? parseFloat(form.momoCharges) : null,
        momoTax: form.momoTax ? parseFloat(form.momoTax) : null,
      }
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success('Purchase created successfully')
        onSaved()
      } else {
        toast.error(data.error || 'Failed to create purchase')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Farmer + Commodity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Farmer *</Label>
          <Select value={form.farmerId} onValueChange={v => update('farmerId', v)}>
            <SelectTrigger><SelectValue placeholder={farmers.length === 0 ? 'No farmers available' : 'Select farmer'} /></SelectTrigger>
            <SelectContent>
              {farmers.map((f: any) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.firstName || ''} {f.lastName || ''}{f.farmerCode ? ` (${f.farmerCode})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Commodity *</Label>
          <Select value={form.commodity} onValueChange={v => update('commodity', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {COMMODITIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Variety <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Input
          value={form.variety}
          onChange={e => update('variety', e.target.value)}
          placeholder="e.g. SL14, Robusta, Bourbon"
        />
      </div>

      <Separator />

      {/* Quality & Weight */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Scale className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-semibold">Quality & Weight</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label>Total Weight (kg) *</Label>
            <Input
              type="number" step="any" min="0"
              value={form.totalWeight}
              onChange={e => update('totalWeight', e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Moisture (%)</Label>
            <div className="relative">
              <Droplet className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                type="number" step="any" min="0" max="100"
                value={form.moistureReading}
                onChange={e => update('moistureReading', e.target.value)}
                placeholder="0.0"
                className="pl-8"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Defects (blacks)</Label>
            <div className="relative">
              <Bug className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                type="number" min="0"
                value={form.defectCount}
                onChange={e => update('defectCount', e.target.value)}
                placeholder="0"
                className="pl-8"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Quality Deduction (kg)</Label>
            <Input
              type="number" step="any" min="0"
              value={form.qualityDeduction}
              onChange={e => update('qualityDeduction', e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Moisture Photo URL</Label>
        <div className="relative">
          <Camera className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={form.moisturePhotoUrl}
            onChange={e => update('moisturePhotoUrl', e.target.value)}
            placeholder="https://...  (paste URL; mobile camera coming soon)"
            className="pl-9"
          />
        </div>
        <p className="text-[11px] text-muted-foreground">Paste a URL for now. Mobile app will support camera capture.</p>
      </div>

      <Separator />

      {/* Pricing & Deductions */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-semibold">Pricing & Deductions (UGX)</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Daily Price (UGX/kg) *</Label>
            <Input
              type="number" step="any" min="0"
              value={form.dailyPrice}
              onChange={e => update('dailyPrice', e.target.value)}
              placeholder="0"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Loan Deduction <span className="text-muted-foreground font-normal">(opt)</span></Label>
            <Input
              type="number" step="any" min="0"
              value={form.loanDeduction}
              onChange={e => update('loanDeduction', e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Input Deduction <span className="text-muted-foreground font-normal">(opt)</span></Label>
            <Input
              type="number" step="any" min="0"
              value={form.inputDeduction}
              onChange={e => update('inputDeduction', e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label>MoMo Charges</Label>
            <Input
              type="number" step="any" min="0"
              value={form.momoCharges}
              onChange={e => update('momoCharges', e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label>MoMo Tax</Label>
            <Input
              type="number" step="any" min="0"
              value={form.momoTax}
              onChange={e => update('momoTax', e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Auto-calc summary — highlighted boxes */}
      <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-semibold text-primary">Auto-Calculated</h4>
          <Badge variant="outline" className="text-[10px] ml-auto">Real-time</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-background rounded-md p-3 border">
            <p className="text-[11px] text-muted-foreground mb-1">Net Weight</p>
            <p className="text-lg font-bold">{fmtKg(calc.netWeight)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {totalWeight} − {qualityDeduction}
            </p>
          </div>
          <div className="bg-background rounded-md p-3 border">
            <p className="text-[11px] text-muted-foreground mb-1">Purchase Total</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{fmtUGX(calc.purchaseTotal)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {fmtKg(calc.netWeight)} × {fmtUGX(dailyPrice)}/kg
            </p>
          </div>
          <div className="bg-background rounded-md p-3 border-2 border-emerald-400/50 dark:border-emerald-500/40">
            <p className="text-[11px] text-muted-foreground mb-1">Net Payment to Farmer</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{fmtUGX(calc.netPayment)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Total − loan − input − MoMo − tax
            </p>
          </div>
        </div>
        {calc.netPayment < 0 && (
          <p className="text-xs text-red-600 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Net payment is negative — deductions exceed purchase total.
          </p>
        )}
      </div>

      <DialogFooter className="gap-2">
        <DialogClose asChild><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></DialogClose>
        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Create Purchase
        </Button>
      </DialogFooter>
    </form>
  )
}
