'use client'

/**
 * EKIBBO-Facing Recovery Dashboard
 * ────────────────────────────────
 * Visible to EKB_MD and EKB_FINANCE roles (anyone with billing:read).
 * Shows THIS tenant's recovery progress — not other tenants.
 *
 * Features:
 *   • KPI cards: investment remaining, recovered %, this month's fees/surplus
 *   • Recovery progress bar
 *   • Projected recovery month
 *   • This month's transaction count
 *
 * File: src/components/billing/RecoveryDashboard.tsx
 */

import React, { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle,
  RefreshCw, Loader2, PiggyBank, Receipt, Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const fmtUGX = (n: number | null | undefined) => 'UGX ' + (Number(n) || 0).toLocaleString()
const fmtPct = (n: number | null | undefined) => (Number(n) || 0).toFixed(1) + '%'

interface RecoveryData {
  agreement: any | null
  investmentRemaining: number
  recoveredPercent: number
  projectedRecoveryMonth: string | null
  thisMonthFees: number
  thisMonthCost: number
  thisMonthSurplus: number
  thisMonthTransactionCount: number
}

export function RecoveryDashboard() {
  const [data, setData] = useState<RecoveryData | null>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [paying, setPaying] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const [recoveryRes, invoicesRes] = await Promise.all([
        fetch('/api/billing/recovery'),
        fetch('/api/billing/invoices/list'),
      ])
      if (recoveryRes.ok) setData(await recoveryRes.json())
      if (invoicesRes.ok) {
        const invData = await invoicesRes.json()
        setInvoices(invData.invoices || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handlePay = async (invoiceId: string) => {
    setPaying(invoiceId)
    try {
      const res = await fetch('/api/billing/pay-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to initiate payment')
      }
      const data = await res.json()
      // Redirect to Flutterwave payment page
      if (data.paymentLink) {
        window.location.href = data.paymentLink
      }
    } catch (e: any) {
      alert(e.message || 'Payment failed to start')
    } finally {
      setPaying(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-48" />
      </div>
    )
  }

  if (!data || !data.agreement) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">No billing agreement found</p>
        <p className="text-sm mt-1">Contact MobiPay AgroSys to set up your billing arrangement.</p>
      </div>
    )
  }

  const a = data.agreement
  const isVendorFinancing = a.billingModel === 'VENDOR_FINANCING'
  const isRecovered = a.status === 'RECOVERED'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            Platform Recovery
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your billing arrangement with MobiPay AgroSys — fee collection and investment recovery status
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchData(true)} disabled={refreshing}>
          <RefreshCw className={cn('w-4 h-4 mr-1.5', refreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Billing Model Banner */}
      <Card className={cn(
        'border-l-4',
        isRecovered ? 'border-l-blue-500' : isVendorFinancing ? 'border-l-amber-500' : 'border-l-emerald-500'
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Billing Arrangement</p>
              <p className="text-lg font-bold">
                {a.billingModel === 'VENDOR_FINANCING' && 'Vendor Financing — No Upfront Cost'}
                {a.billingModel === 'SUBSCRIPTION' && 'Annual Subscription'}
                {a.billingModel === 'HYBRID' && 'Hybrid — Subscription + Reduced Fee'}
              </p>
            </div>
            <Badge className={cn(
              isRecovered ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
              'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
            )}>
              {isRecovered ? <><CheckCircle className="w-3 h-3 mr-1" />Recovered</> : 'Active'}
            </Badge>
          </div>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Fee Type</p>
              <p className="font-medium">{a.feeType === 'PERCENTAGE' ? `${Number(a.feeRate) * 100}% of transactions` :
                a.feeType === 'PER_KG' ? `UGX ${a.feeRate}/kg` : a.feeType || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Applies To</p>
              <p className="font-medium">{a.feeAppliesTo || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Started</p>
              <p className="font-medium">{a.startDate ? new Date(a.startDate).toLocaleDateString() : '—'}</p>
            </div>
            {a.recoveredAt && (
              <div>
                <p className="text-xs text-muted-foreground">Recovered On</p>
                <p className="font-medium">{new Date(a.recoveredAt).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isVendorFinancing && !isRecovered && (
          <>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Investment Remaining</p>
                    <p className="text-2xl font-bold mt-1">{fmtUGX(data.investmentRemaining)}</p>
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
                    <p className="text-sm text-muted-foreground">Recovered</p>
                    <p className="text-2xl font-bold mt-1">{fmtPct(data.recoveredPercent)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fees This Month</p>
                <p className="text-2xl font-bold mt-1">{fmtUGX(data.thisMonthFees)}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transactions This Month</p>
                <p className="text-2xl font-bold mt-1">{data.thisMonthTransactionCount}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 dark:bg-purple-950/40 text-purple-600">
                <Activity className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recovery Progress (vendor financing only) */}
      {isVendorFinancing && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-amber-600" />
              Investment Recovery Progress
            </CardTitle>
            <CardDescription>
              MobiPay's upfront investment is recovered from the surplus of transaction fees over recurring platform costs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-muted-foreground">Recovered: {fmtUGX(Number(a.recoveredAmount) || 0)}</span>
                <span className="text-muted-foreground">of {fmtUGX(Number(a.upfrontInvestment) || 0)}</span>
              </div>
              <Progress value={data.recoveredPercent} className="h-3" />
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="font-medium">{fmtPct(data.recoveredPercent)} recovered</span>
                {data.projectedRecoveryMonth && (
                  <span className="text-muted-foreground">
                    Projected recovery: <strong>{data.projectedRecoveryMonth}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* This month breakdown */}
            <div className="pt-4 border-t">
              <p className="text-sm font-semibold mb-3">This Month's Breakdown</p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Fees Collected</p>
                  <p className="font-bold text-emerald-600">{fmtUGX(data.thisMonthFees)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Platform Cost</p>
                  <p className="font-bold text-amber-600">{fmtUGX(data.thisMonthCost)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Surplus to Recovery</p>
                  <p className={cn('font-bold', data.thisMonthSurplus >= 0 ? 'text-blue-600' : 'text-rose-600')}>
                    {fmtUGX(data.thisMonthSurplus)}
                  </p>
                </div>
              </div>
            </div>

            {isRecovered && (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p className="font-semibold">Investment Fully Recovered!</p>
                    <p className="mt-1">
                      MobiPay's upfront investment has been fully recovered from transaction fees.
                      Your annual platform cost has dropped from {fmtUGX(Number(a.upfrontInvestment) / Number(a.recoveryPeriodMonths) * 12 + Number(a.recurringMonthlyCost) * 12)} to {fmtUGX(Number(a.recurringMonthlyCost) * 12)} (recurring costs only).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pending Invoices */}
      {invoices.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pending Invoices</CardTitle>
            <CardDescription>Pay your subscription invoices via Flutterwave (Mobile Money / Card)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {invoices.filter(i => i.status !== 'PAID').map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-sm">{inv.plan}</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {inv.currency} {(inv.total || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs">{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        'text-[10px]',
                        inv.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                        inv.status === 'OVERDUE' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' :
                        'bg-gray-100 text-gray-700'
                      )}>{inv.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handlePay(inv.id)}
                        disabled={paying === inv.id}
                      >
                        {paying === inv.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                        Pay Now
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Monthly Statements */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Monthly Statements</CardTitle>
          <CardDescription>Reconciliation statements are generated on the 1st of each month and emailed to your finance team.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No statements generated yet. The first statement will appear after the end of the current billing month.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RecoveryDashboard
