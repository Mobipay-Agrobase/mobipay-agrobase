'use client'

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Wallet, TrendingUp, TrendingDown, DollarSign, CreditCard, PiggyBank,
  Package, Shield, Loader2, ArrowUpDown
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState, exportToCSV } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'

interface LedgerEntry {
  id: string
  date: string
  type: string
  description: string
  amount: number
  balanceAfter: number | null
  referenceType: string | null
  approvalStatus: string | null
}

interface LedgerSummary {
  totalEarned: number
  totalDeducted: number
  totalPaid: number
  currentBalance: number
  outstandingLoans: number
  outstandingInputs: number
}

interface FarmerLedgerProps {
  farmerId: string
  farmerName: string
}

const typeColor: Record<string, string> = {
  PURCHASE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  SALE: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  LOAN_DISBURSE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  LOAN_REPAY: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  INPUT_DIST: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  INPUT_REPAY: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  TRAINING: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  INSURANCE: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  CHARGE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  PAYMENT: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  ADJUSTMENT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

const fmt = (n: number) => `UGX ${Math.abs(n).toLocaleString()}`

export function FarmerLedger({ farmerId, farmerName }: FarmerLedgerProps) {
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [summary, setSummary] = useState<LedgerSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/farmers/${farmerId}/ledger`)
      .then(r => r.json())
      .then(data => {
        setEntries(data.entries || [])
        setSummary(data.summary || null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [farmerId])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-muted-foreground">Total Earned</span>
              </div>
              <p className="text-lg font-bold text-emerald-600">{fmt(summary.totalEarned)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-xs text-muted-foreground">Total Deducted</span>
              </div>
              <p className="text-lg font-bold text-red-600">{fmt(summary.totalDeducted)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-muted-foreground">Total Paid</span>
              </div>
              <p className="text-lg font-bold text-blue-600">{fmt(summary.totalPaid)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-muted-foreground">Current Balance</span>
              </div>
              <p className={cn('text-lg font-bold', summary.currentBalance >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                {fmt(summary.currentBalance)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {summary && (summary.outstandingLoans > 0 || summary.outstandingInputs > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {summary.outstandingLoans > 0 && (
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PiggyBank className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Outstanding Loan Balance</p>
                    <p className="text-lg font-bold text-amber-600">{fmt(summary.outstandingLoans)}</p>
                  </div>
                </div>
                <Badge variant="outline">Active Loans</Badge>
              </CardContent>
            </Card>
          )}
          {summary.outstandingInputs > 0 && (
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Outstanding Input Balance</p>
                    <p className="text-lg font-bold text-purple-600">{fmt(summary.outstandingInputs)}</p>
                  </div>
                </div>
                <Badge variant="outline">Inputs Owed</Badge>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4" /> Transaction History — {farmerName}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={entries.length === 0}
            onClick={() => exportToCSV(entries.map(e => ({
              Date: new Date(e.date).toLocaleDateString(),
              Type: e.type,
              Description: e.description,
              Amount: e.amount,
              Balance: e.balanceAfter ?? '',
              Status: e.approvalStatus || '',
            })), `farmer-ledger-${farmerId}`)}
          >
            Export CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <EmptyState icon={Wallet} title="No ledger entries yet" description="Transactions will appear here when purchases, loans, or inputs are recorded for this farmer." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  <TableHead className="text-xs text-right">Balance</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-[10px]', typeColor[e.type] || '')}>{e.type.replace(/_/g, ' ')}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{e.description}</TableCell>
                    <TableCell className={cn('text-right text-xs font-medium', e.amount >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                      {e.amount >= 0 ? '+' : '-'}{fmt(e.amount)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-bold">
                      {e.balanceAfter != null ? fmt(e.balanceAfter) : '—'}
                    </TableCell>
                    <TableCell>
                      {e.approvalStatus && (
                        <Badge variant="outline" className="text-[10px]">{e.approvalStatus}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
