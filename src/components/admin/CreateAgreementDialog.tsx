'use client'

/**
 * Create Billing Agreement Dialog
 * ─────────────────────────────────
 * SUPER_ADMIN + MOBIPAY_FINANCE — creates a new BillingAgreement for a tenant.
 *
 * Features:
 *   - Tenant selector (dropdown of all tenants)
 *   - Billing model picker (SUBSCRIPTION / VENDOR_FINANCING / HYBRID)
 *   - Conditional fields based on model
 *   - Live preview of recovery math
 *   - Creates Subscription record too (for SUBSCRIPTION/HYBRID models)
 *   - Generates first invoice (for SUBSCRIPTION/HYBRID models)
 */

import React, { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Plus, Calculator, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Tenant {
  id: string
  name: string
  country: string | null
  type: string
}

interface CreateAgreementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

const BILLING_MODELS = [
  {
    value: 'VENDOR_FINANCING',
    label: 'Vendor Financing',
    description: 'No upfront cost. Fees only. Investment recovered over time.',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  {
    value: 'SUBSCRIPTION',
    label: 'Subscription Only',
    description: 'Fixed annual/monthly fee. No transaction fees.',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  {
    value: 'HYBRID',
    label: 'Hybrid',
    description: 'Lower subscription + lower per-kg fee.',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
]

const FEE_TYPES = [
  { value: 'PERCENTAGE', label: 'Percentage (% of transaction)' },
  { value: 'PER_KG', label: 'Per Kilogram (UGX/kg)' },
  { value: 'FLAT_PER_TXN', label: 'Flat per Transaction (UGX/txn)' },
  { value: 'NONE', label: 'No transaction fee' },
]

const FEE_APPLIES_TO = [
  { value: 'PURCHASES', label: 'Purchases only' },
  { value: 'SALES', label: 'Sales only' },
  { value: 'PAYOUTS', label: 'Payouts only' },
  { value: 'ALL', label: 'All transactions' },
]

const fmtUGX = (n: number) => 'UGX ' + (n || 0).toLocaleString()

export function CreateAgreementDialog({ open, onOpenChange, onCreated }: CreateAgreementDialogProps) {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loadingTenants, setLoadingTenants] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [tenantId, setTenantId] = useState('')
  const [billingModel, setBillingModel] = useState('VENDOR_FINANCING')
  const [costTrackingMode, setCostTrackingMode] = useState('FIXED')

  // Subscription fields
  const [subscriptionAmount, setSubscriptionAmount] = useState('')
  const [subscriptionCycle, setSubscriptionCycle] = useState('ANNUAL')

  // Fee fields
  const [feeType, setFeeType] = useState('PERCENTAGE')
  const [feeRate, setFeeRate] = useState('0.02')
  const [feeAppliesTo, setFeeAppliesTo] = useState('PURCHASES')

  // Vendor financing fields
  const [upfrontInvestment, setUpfrontInvestment] = useState('28000000')
  const [recoveryPeriodMonths, setRecoveryPeriodMonths] = useState('24')
  const [recurringMonthlyCost, setRecurringMonthlyCost] = useState('3400000')

  // Fetch tenants on mount
  useEffect(() => {
    if (!open) return
    fetchTenants()
  }, [open])

  const fetchTenants = useCallback(async () => {
    setLoadingTenants(true)
    try {
      const res = await fetch('/api/admin/tenants?limit=200')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setTenants(data.tenants || data.data || [])
    } catch {
      toast.error('Failed to load tenants')
    } finally {
      setLoadingTenants(false)
    }
  }, [])

  // Live preview calculations
  const investment = parseFloat(upfrontInvestment) || 0
  const recoveryMonths = parseInt(recoveryPeriodMonths) || 24
  const monthlyCost = parseFloat(recurringMonthlyCost) || 0
  const rate = parseFloat(feeRate) || 0
  const subAmount = parseFloat(subscriptionAmount) || 0

  // For percentage fee: assume UGX 175M/month volume for preview
  const previewVolume = 175_000_000
  const previewFee = billingModel === 'VENDOR_FINANCING' || billingModel === 'HYBRID'
    ? (feeType === 'PERCENTAGE' ? previewVolume * rate : feeType === 'PER_KG' ? 10000 * rate : rate)
    : 0
  const previewSurplus = previewFee - monthlyCost
  const projectedRecovery = previewSurplus > 0 ? Math.ceil(investment / previewSurplus) : 0

  const handleSave = async () => {
    if (!tenantId) {
      toast.error('Please select a tenant')
      return
    }

    setSaving(true)
    try {
      const body: any = {
        tenantId,
        billingModel,
        costTrackingMode,
      }

      // Add subscription fields if applicable
      if (billingModel === 'SUBSCRIPTION' || billingModel === 'HYBRID') {
        body.subscriptionAmount = subAmount
        body.subscriptionCurrency = 'UGX'
        body.subscriptionCycle = subscriptionCycle
      }

      // Add fee fields if applicable
      if (billingModel === 'VENDOR_FINANCING' || billingModel === 'HYBRID') {
        body.feeType = feeType
        body.feeRate = rate
        body.feeAppliesTo = feeAppliesTo
      }

      // Add vendor financing fields if applicable
      if (billingModel === 'VENDOR_FINANCING') {
        body.upfrontInvestment = investment
        body.recoveryPeriodMonths = recoveryMonths
        body.recurringMonthlyCost = monthlyCost
      }

      const res = await fetch('/api/admin/billing/agreements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create agreement')
      }

      toast.success('Billing agreement created successfully!')
      onOpenChange(false)
      onCreated()

      // Reset form
      setTenantId('')
      setBillingModel('VENDOR_FINANCING')
      setUpfrontInvestment('28000000')
      setFeeRate('0.02')
    } catch (e: any) {
      toast.error(e.message || 'Failed to create agreement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Billing Agreement</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tenant selector */}
          <div className="space-y-2">
            <Label>Tenant *</Label>
            {loadingTenants ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading tenants...
              </div>
            ) : (
              <Select value={tenantId} onValueChange={setTenantId}>
                <SelectTrigger><SelectValue placeholder="Select a tenant..." /></SelectTrigger>
                <SelectContent>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.country || '—'}) — {t.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Billing model picker */}
          <div className="space-y-2">
            <Label>Billing Model *</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {BILLING_MODELS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setBillingModel(m.value)}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all',
                    billingModel === m.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{m.label}</span>
                    {billingModel === m.value && <Badge className="text-[10px]">Selected</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{m.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Subscription fields (SUBSCRIPTION or HYBRID) */}
          {(billingModel === 'SUBSCRIPTION' || billingModel === 'HYBRID') && (
            <div className="space-y-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Subscription Terms</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Subscription Amount (UGX) *</Label>
                  <Input
                    type="number"
                    value={subscriptionAmount}
                    onChange={(e) => setSubscriptionAmount(e.target.value)}
                    placeholder="e.g. 30000000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Billing Cycle</Label>
                  <Select value={subscriptionCycle} onValueChange={setSubscriptionCycle}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="ANNUAL">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Fee fields (VENDOR_FINANCING or HYBRID) */}
          {(billingModel === 'VENDOR_FINANCING' || billingModel === 'HYBRID') && (
            <div className="space-y-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Fee Structure</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Fee Type</Label>
                  <Select value={feeType} onValueChange={setFeeType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FEE_TYPES.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>
                    Fee Rate {feeType === 'PERCENTAGE' ? '(decimal, 0.02 = 2%)' : feeType === 'PER_KG' ? '(UGX/kg)' : '(UGX/txn)'}
                  </Label>
                  <Input
                    type="number"
                    step={feeType === 'PERCENTAGE' ? '0.001' : '1'}
                    value={feeRate}
                    onChange={(e) => setFeeRate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Fee Applies To</Label>
                <Select value={feeAppliesTo} onValueChange={setFeeAppliesTo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FEE_APPLIES_TO.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Vendor financing fields (VENDOR_FINANCING only) */}
          {billingModel === 'VENDOR_FINANCING' && (
            <div className="space-y-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Vendor Financing Terms</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Upfront Investment (UGX)</Label>
                  <Input
                    type="number"
                    value={upfrontInvestment}
                    onChange={(e) => setUpfrontInvestment(e.target.value)}
                    placeholder="e.g. 28000000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Recovery Period (months)</Label>
                  <Input
                    type="number"
                    value={recoveryPeriodMonths}
                    onChange={(e) => setRecoveryPeriodMonths(e.target.value)}
                    placeholder="e.g. 24"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Recurring Monthly Cost (UGX)</Label>
                  <Input
                    type="number"
                    value={recurringMonthlyCost}
                    onChange={(e) => setRecurringMonthlyCost(e.target.value)}
                    placeholder="e.g. 3400000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Cost Tracking Mode</Label>
                  <Select value={costTrackingMode} onValueChange={setCostTrackingMode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">Fixed (predetermined monthly cost)</SelectItem>
                      <SelectItem value="ACTUAL">Actual (metered per tenant)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Live preview */}
          {billingModel === 'VENDOR_FINANCING' && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold">Recovery Preview</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Assumed volume</p>
                    <p className="font-medium">{fmtUGX(previewVolume)}/mo</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly fee</p>
                    <p className="font-medium">{fmtUGX(previewFee)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly surplus</p>
                    <p className={cn('font-medium', previewSurplus >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                      {fmtUGX(previewSurplus)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Projected recovery</p>
                    <p className="font-medium">
                      {projectedRecovery > 0 ? `~${projectedRecovery} months` : 'Never (surplus ≤ 0)'}
                    </p>
                  </div>
                </div>
                {previewSurplus <= 0 && (
                  <div className="mt-3 flex items-start gap-2 p-2 rounded bg-rose-50 dark:bg-rose-950/30">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-700 dark:text-rose-300">
                      At this fee rate and volume, the investment will never be recovered.
                      Consider increasing the fee rate or the assumed volume.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={saving || !tenantId}>
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Plus className="w-4 h-4 mr-1.5" />}
            Create & Activate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
