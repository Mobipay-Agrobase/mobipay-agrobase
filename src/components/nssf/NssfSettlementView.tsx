'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Receipt, RefreshCw, Loader2, DollarSign, TrendingUp, Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  SENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  CONFIRMED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  FAILED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
}

export default function NssfSettlementView() {
  const [settlements, setSettlements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSettlements = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/nssf/settle')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setSettlements(data.data || [])
    } catch {
      toast.error('Failed to load settlements')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSettlements() }, [fetchSettlements])

  const totalSettled = settlements
    .filter(s => s.status === 'CONFIRMED')
    .reduce((sum, s) => sum + Number(s.totalAmount), 0)
  const totalCommission = settlements
    .filter(s => s.status === 'CONFIRMED')
    .reduce((sum, s) => sum + Number(s.commissionAmount || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="w-6 h-6 text-primary" />
            NSSF Settlements
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fund routing from MobiPay to Klimotrust — settlement batches + commission tracking
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSettlements}>
          <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Settled</p>
          <p className="text-xl font-bold">UGX {totalSettled.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Commission (30%)</p>
          <p className="text-xl font-bold text-emerald-600">UGX {totalCommission.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Pending Settlements</p>
          <p className="text-xl font-bold">{settlements.filter(s => s.status === 'PENDING').length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Confirmed</p>
          <p className="text-xl font-bold">{settlements.filter(s => s.status === 'CONFIRMED').length}</p>
        </CardContent></Card>
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : settlements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Receipt className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No settlements yet</p>
            <p className="text-sm mt-1">Settlements are created automatically every Monday or manually by the finance team.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Settlement #</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Commission (30%)</TableHead>
                  <TableHead className="text-right">MobiPay Share</TableHead>
                  <TableHead>Contributions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlements.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.settlementNumber}</TableCell>
                    <TableCell className="text-sm">{s.tenant?.name || '—'}</TableCell>
                    <TableCell className="text-right text-sm font-medium">UGX {Number(s.totalAmount).toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm text-emerald-600">UGX {Number(s.commissionAmount || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm">UGX {Number(s.mobipayShare || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-center text-sm">{s.contributionCount}</TableCell>
                    <TableCell>
                      <Badge className={cn('text-[10px]', STATUS_COLORS[s.status] || STATUS_COLORS.PENDING)}>
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(s.settlementDate).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
