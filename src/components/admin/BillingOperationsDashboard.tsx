'use client'

/**
 * MobiPay-Internal Billing Operations Dashboard
 * ─────────────────────────────────────────────
 * SUPER_ADMIN only. Shows billing across ALL tenants.
 *
 * Features:
 *   • KPI cards: total fees this month, investment remaining, active agreements
 *   • Per-tenant agreement table with recovery progress bars
 *   • Edit upfrontInvestment and feeRate (with audit log + reason field)
 *   • Create new agreement
 *   • View audit history per agreement
 *
 * File: src/components/admin/BillingOperationsDashboard.tsx
 */

import React, { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  DollarSign, TrendingUp, TrendingDown, Building2, Activity, Loader2,
  CheckCircle, Clock, AlertCircle, RefreshCw, Edit3, Plus, History,
  Receipt, PiggyBank, Percent
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { CreateAgreementDialog } from './CreateAgreementDialog'

const fmtUGX = (n: number | null | undefined) => 'UGX ' + (Number(n) || 0).toLocaleString()
const fmtPct = (n: number | null | undefined) => (Number(n) || 0).toFixed(1) + '%'

interface Agreement {
  id: string
  tenantId: string
  tenant: { id: string; name: string; country: string }
  billingModel: string
  costTrackingMode: string
  feeType: string | null
  feeRate: number | null
  feeAppliesTo: string | null
  upfrontInvestment: number | null
  recoveryPeriodMonths: number | null
  recurringMonthlyCost: number | null
  status: string
  startDate: string
  recoveredAt: string | null
  recoveredAmount: number
  totalFeesCollected: number
  totalRecurringCost: number
  investmentChanges: any[]
  feeRateChanges: any[]
  createdAt: string
}

interface Overview {
  agreements: Agreement[]
  totalFeesThisMonth: number
  totalInvestmentRemaining: number
  totalRecoveries: number
  activeAgreements: number
  recoveredAgreements: number
}

export function BillingOperationsDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [editAgreement, setEditAgreement] = useState<Agreement | null>(null)
  const [editField, setEditField] = useState<'investment' | 'feeRate'>('investment')
  const [editValue, setEditValue] = useState('')
  const [editReason, setEditReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [showHistory, setShowHistory] = useState<Agreement | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const fetchOverview = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch('/api/admin/billing/overview')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setOverview(data)
    } catch (e: any) {
      toast.error('Failed to load billing overview')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchOverview() }, [fetchOverview])

  const openEdit = (agreement: Agreement, field: 'investment' | 'feeRate') => {
    setEditAgreement(agreement)
    setEditField(field)
    setEditValue(field === 'investment'
      ? String(agreement.upfrontInvestment || 0)
      : String(agreement.feeRate || 0)
    )
    setEditReason('')
  }

  const handleSave = async () => {
    if (!editAgreement) return
    if (!editReason.trim()) {
      toast.error('Please provide a reason for the change (audit log requirement)')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/billing/agreements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreementId: editAgreement.id,
          action: editField === 'investment' ? 'updateInvestment' : 'updateFeeRate',
          newAmount: editField === 'investment' ? parseFloat(editValue) : undefined,
          newRate: editField === 'feeRate' ? parseFloat(editValue) : undefined,
          reason: editReason,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Update failed')
      }

      toast.success(`${editField === 'investment' ? 'Investment amount' : 'Fee rate'} updated — audit log recorded`)
      setEditAgreement(null)
      fetchOverview(true)
    } catch (e: any) {
      toast.error(e.message || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!overview) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">Billing data unavailable</p>
        <Button variant="outline" className="mt-3" onClick={() => fetchOverview()}>
          <RefreshCw className="w-4 h-4 mr-1.5" /> Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            Billing Operations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            MobiPay-internal view — billing agreements, fee collection, and investment recovery across all tenants
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchOverview(true)} disabled={refreshing}>
            <RefreshCw className={cn('w-4 h-4 mr-1.5', refreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Create Agreement
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fees This Month</p>
                <p className="text-2xl font-bold mt-1">{fmtUGX(overview.totalFeesThisMonth)}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Investment Remaining</p>
                <p className="text-2xl font-bold mt-1">{fmtUGX(overview.totalInvestmentRemaining)}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Agreements</p>
                <p className="text-2xl font-bold mt-1">{overview.activeAgreements}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fully Recovered</p>
                <p className="text-2xl font-bold mt-1">{overview.recoveredAgreements}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 dark:bg-purple-950/40 text-purple-600">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agreements Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">All Billing Agreements</CardTitle>
          <CardDescription>
            {overview.agreements.length} agreement{overview.agreements.length !== 1 ? 's' : ''} • Click "Edit" to change investment amount or fee rate (audit logged)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {overview.agreements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No billing agreements yet</p>
              <p className="text-sm mt-1">Create one for EKIBBO or any other tenant to start metering fees.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Fee Rate</TableHead>
                  <TableHead>Investment</TableHead>
                  <TableHead>Recovered</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.agreements.map((a) => {
                  const investment = Number(a.upfrontInvestment) || 0
                  const recovered = Number(a.recoveredAmount) || 0
                  const pct = investment > 0 ? Math.min(100, (recovered / investment) * 100) : 0
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{a.tenant.name}</div>
                        <div className="text-xs text-muted-foreground">{a.tenant.country}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{a.billingModel}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{a.feeType || '—'}</TableCell>
                      <TableCell className="text-sm font-medium">
                        {a.feeType === 'PERCENTAGE' ? `${Number(a.feeRate || 0) * 100}%` :
                         a.feeType === 'PER_KG' ? `UGX ${a.feeRate}/kg` :
                         a.feeType === 'FLAT_PER_TXN' ? `UGX ${a.feeRate}/txn` : '—'}
                      </TableCell>
                      <TableCell className="text-sm">{investment > 0 ? fmtUGX(investment) : '—'}</TableCell>
                      <TableCell className="text-sm">{fmtUGX(recovered)}</TableCell>
                      <TableCell className="w-[120px]">
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-2 flex-1" />
                          <span className="text-xs font-medium w-8 text-right">{pct.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          'text-[10px]',
                          a.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                          a.status === 'RECOVERED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                          a.status === 'TERMINATED' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' :
                          'bg-gray-100 text-gray-700'
                        )}>{a.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {a.billingModel === 'VENDOR_FINANCING' && a.status === 'ACTIVE' && (
                            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openEdit(a, 'investment')}>
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          )}
                          {a.feeType && (
                            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openEdit(a, 'feeRate')}>
                              <Percent className="w-3 h-3" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setShowHistory(a)}>
                            <History className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editAgreement} onOpenChange={(o) => !o && setEditAgreement(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit {editField === 'investment' ? 'Upfront Investment' : 'Fee Rate'}
            </DialogTitle>
          </DialogHeader>
          {editAgreement && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p><strong>Tenant:</strong> {editAgreement.tenant.name}</p>
                <p><strong>Current {editField === 'investment' ? 'investment' : 'fee rate'}:</strong> {
                  editField === 'investment'
                    ? fmtUGX(editAgreement.upfrontInvestment)
                    : editAgreement.feeType === 'PERCENTAGE'
                      ? `${Number(editAgreement.feeRate) * 100}%`
                      : `UGX ${editAgreement.feeRate}/${editAgreement.feeType === 'PER_KG' ? 'kg' : 'txn'}`
                }</p>
              </div>
              <div className="space-y-2">
                <Label>New {editField === 'investment' ? 'investment amount (UGX)' : 'fee rate'}</Label>
                <Input
                  type="number"
                  step={editField === 'feeRate' && editAgreement.feeType === 'PERCENTAGE' ? '0.001' : '1'}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={editField === 'investment' ? 'e.g. 30000000' : 'e.g. 0.015 (for 1.5%)'}
                />
                {editField === 'feeRate' && editAgreement.feeType === 'PERCENTAGE' && (
                  <p className="text-xs text-muted-foreground">
                    Enter as a decimal: 0.02 = 2%, 0.015 = 1.5%, 0.01 = 1%
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Reason for change <span className="text-rose-600">*</span></Label>
                <Textarea
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Actual dev time was higher than estimated — increased from 28M to 30M"
                />
                <p className="text-xs text-muted-foreground">
                  This reason is recorded in the audit log with your user ID and timestamp.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
              Save & Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={!!showHistory} onOpenChange={(o) => !o && setShowHistory(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit History — {showHistory?.tenant.name}</DialogTitle>
          </DialogHeader>
          {showHistory && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <h4 className="text-sm font-semibold mb-2">Investment Changes ({(showHistory.investmentChanges ?? []).length})</h4>
                {(showHistory.investmentChanges ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No changes recorded</p>
                ) : (
                  <div className="space-y-2">
                    {(showHistory.investmentChanges ?? []).map((c: any) => (
                      <div key={c.id} className="p-3 rounded-lg border text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{fmtUGX(c.previousAmount)} → {fmtUGX(c.newAmount)}</span>
                          <span className="text-muted-foreground">{new Date(c.changedAt).toLocaleString()}</span>
                        </div>
                        <p className="text-muted-foreground">{c.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Fee Rate Changes ({(showHistory.feeRateChanges ?? []).length})</h4>
                {(showHistory.feeRateChanges ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No changes recorded</p>
                ) : (
                  <div className="space-y-2">
                    {(showHistory.feeRateChanges ?? []).map((c: any) => (
                      <div key={c.id} className="p-3 rounded-lg border text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{Number(c.previousRate) * 100}% → {Number(c.newRate) * 100}%</span>
                          <span className="text-muted-foreground">{new Date(c.changedAt).toLocaleString()}</span>
                        </div>
                        <p className="text-muted-foreground">{c.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Agreement Dialog */}
      <CreateAgreementDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={() => fetchOverview(true)}
      />
    </div>
  )
}

export default BillingOperationsDashboard
