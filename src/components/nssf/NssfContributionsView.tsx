'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { PiggyBank, RefreshCw, Loader2, Search, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  FAILED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  REFUNDED: 'bg-gray-100 text-gray-700',
}

export default function NssfContributionsView() {
  const [contributions, setContributions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showContribute, setShowContribute] = useState(false)
  const [contributing, setContributing] = useState(false)

  // Form
  const [registrationId, setRegistrationId] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('MTN_MOMO')

  const fetchContributions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/nssf/contributions?limit=50')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setContributions(data.data || [])
    } catch {
      toast.error('Failed to load contributions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchContributions() }, [fetchContributions])

  const handleContribute = async () => {
    if (!registrationId || !amount) {
      toast.error('Please fill in all fields')
      return
    }
    setContributing(true)
    try {
      const res = await fetch('/api/nssf/contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          amount: parseFloat(amount),
          paymentMethod,
          channel: 'WEB',
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      toast.success('Contribution initiated')
      setShowContribute(false)
      setRegistrationId(''); setAmount('')
      fetchContributions()
    } catch (e: any) {
      toast.error(e.message || 'Failed to contribute')
    } finally {
      setContributing(false)
    }
  }

  const totalAmount = contributions
    .filter(c => c.status === 'COMPLETED')
    .reduce((sum, c) => sum + Number(c.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PiggyBank className="w-6 h-6 text-primary" />
            NSSF Contributions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Voluntary savings contributions to NSSF
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchContributions}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowContribute(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> New Contribution
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Contributions</p>
          <p className="text-xl font-bold">UGX {totalAmount.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Completed</p>
          <p className="text-xl font-bold">{contributions.filter(c => c.status === 'COMPLETED').length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Pending</p>
          <p className="text-xl font-bold">{contributions.filter(c => c.status === 'PENDING').length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Failed</p>
          <p className="text-xl font-bold">{contributions.filter(c => c.status === 'FAILED').length}</p>
        </CardContent></Card>
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : contributions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <PiggyBank className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No contributions yet</p>
            <p className="text-sm mt-1">Click "New Contribution" to make a voluntary savings contribution.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Settled?</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contributions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-sm">
                      {c.farmer ? `${c.farmer.firstName} ${c.farmer.lastName}` : '—'}
                    </TableCell>
                    <TableCell className="text-sm font-medium">UGX {Number(c.amount).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{c.paymentMethod}</TableCell>
                    <TableCell className="text-sm">{c.channel}</TableCell>
                    <TableCell>
                      <Badge className={cn('text-[10px]', STATUS_COLORS[c.status] || STATUS_COLORS.PENDING)}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {c.settlementStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Contribute Dialog */}
      <Dialog open={showContribute} onOpenChange={setShowContribute}>
        <DialogContent>
          <DialogHeader><DialogTitle>New NSSF Contribution</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>NSSF Registration ID *</Label>
              <Input value={registrationId} onChange={(e) => setRegistrationId(e.target.value)} placeholder="Registration ID from NSSF Registration" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Amount (UGX) *</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 50000" />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MTN_MOMO">MTN MoMo</SelectItem>
                    <SelectItem value="AIRTEL_MONEY">Airtel Money</SelectItem>
                    <SelectItem value="CARD">Card (Visa/Mastercard)</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CASH">Cash (field officer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleContribute} disabled={contributing}>
              {contributing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
              Contribute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
