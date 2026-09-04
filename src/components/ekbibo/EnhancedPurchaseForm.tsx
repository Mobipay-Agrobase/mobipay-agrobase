'use client'

import React, { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Loader2, Save, Calculator, Scale, DollarSign, Droplet,
  Bug, AlertCircle, UserPlus, X
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { DialogFooter, DialogClose, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStagedAttachments, StagedAttachmentsInput } from '@/components/attachments/StagedAttachments'
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

export function EnhancedPurchaseForm({ farmers: initialFarmers, onClose, onSaved }: EnhancedPurchaseFormProps) {
  const [farmers, setFarmers] = useState<any[]>(initialFarmers)
  const [saving, setSaving] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickAdd, setQuickAdd] = useState({ firstName: '', lastName: '', phone: '', district: '' })
  const [quickAdding, setQuickAdding] = useState(false)
  const staged = useStagedAttachments()
  const [form, setForm] = useState<Record<string, string>>({
    farmerId: '',
    commodity: 'coffee',
    variety: '',
    totalWeight: '',
    moistureReading: '',
    defectCount: '',
    qualityDeduction: '',
    dailyPrice: '',
    loanDeduction: '',
    inputDeduction: '',
    momoCharges: '',
    momoTax: '',
  })

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleQuickAdd = async () => {
    if (!quickAdd.firstName.trim() || !quickAdd.lastName.trim() || !quickAdd.phone.trim()) {
      toast.error('First name, last name, and phone are required')
      return
    }
    setQuickAdding(true)
    try {
      const res = await fetch('/api/farmers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: quickAdd.firstName.trim(),
          lastName: quickAdd.lastName.trim(),
          phone: quickAdd.phone.trim(),
          district: quickAdd.district.trim() || undefined,
          memberType: 'General',
          createLogin: true,  // auto-create mobile login
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create farmer')
      }
      const newFarmer = await res.json()
      setFarmers(prev => [newFarmer, ...prev])
      setForm(prev => ({ ...prev, farmerId: newFarmer.id }))
      toast.success(`${quickAdd.firstName} ${quickAdd.lastName} added — selected as the farmer`)
      setQuickAdd({ firstName: '', lastName: '', phone: '', district: '' })
      setShowQuickAdd(false)
    } catch (e: any) {
      toast.error(e.message || 'Failed to add farmer')
    } finally {
      setQuickAdding(false)
    }
  }

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
        // EKIBBO enhanced fields (evidence files upload after creation — see below)
        moistureReading: form.moistureReading ? parseFloat(form.moistureReading) : null,
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
        // Upload staged evidence files now that the purchase exists
        const purchaseId = (data as any)?.data?.id
        if (purchaseId && staged.staged.length > 0) {
          const result = await staged.uploadAll(String(purchaseId), 'purchase')
          staged.clear()
          if (result.failures.length > 0) {
            toast.warning(`Purchase created, but ${result.failures.length} attachment(s) failed — retry from the purchase detail page`)
          } else {
            toast.success(`${result.uploaded} attachment(s) uploaded`)
          }
        }
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
          <div className="flex items-center justify-between">
            <Label>Farmer *</Label>
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1" onClick={() => setShowQuickAdd(true)}>
              <UserPlus className="w-3 h-3" /> Quick Add
            </Button>
          </div>
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
        <StagedAttachmentsInput
          staged={staged.staged}
          onAdd={staged.addFiles}
          onRemove={staged.remove}
          onDescribe={staged.describe}
          uploading={saving}
          label="Quality evidence"
          hint="Moisture meter photos, weighing slips, signed receipts — images/PDF, max 5 MB each. Uploaded automatically when the purchase is saved."
        />
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

      {/* Quick Add Farmer Dialog — extension officers can add a new farmer contact inline during payment */}
      <Dialog open={showQuickAdd} onOpenChange={setShowQuickAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2"><UserPlus className="w-4 h-4" /> Quick Add Farmer</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowQuickAdd(false)}><X className="w-3 h-3" /></Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">First Name *</Label>
                <Input value={quickAdd.firstName} onChange={e => setQuickAdd(p => ({ ...p, firstName: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Last Name *</Label>
                <Input value={quickAdd.lastName} onChange={e => setQuickAdd(p => ({ ...p, lastName: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phone *</Label>
              <Input value={quickAdd.phone} onChange={e => setQuickAdd(p => ({ ...p, phone: e.target.value }))} placeholder="+256..." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">District (optional)</Label>
              <Input value={quickAdd.district} onChange={e => setQuickAdd(p => ({ ...p, district: e.target.value }))} />
            </div>
            <p className="text-xs text-muted-foreground">A mobile-app login is auto-created with the phone number as the default password. The farmer can change it later via Forgot Password.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuickAdd(false)}>Cancel</Button>
            <Button onClick={handleQuickAdd} disabled={quickAdding} className="gap-2">
              {quickAdding && <Loader2 className="w-3 h-3 animate-spin" />} Add &amp; Select
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
