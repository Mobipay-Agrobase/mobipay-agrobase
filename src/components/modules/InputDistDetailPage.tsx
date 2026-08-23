'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import {
  ArrowLeft, Pencil, Wallet, CheckCircle, Loader2, Landmark, Boxes, Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { EkbStepper, EkbTimelineRow, type StepDef } from '@/components/ui/ekb-stepper'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const fmtUGX = (n: number) => `UGX ${(Number(n) || 0).toLocaleString()}`

const statusColor: Record<string, string> = {
  DISTRIBUTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  PARTIALLY_REPAID: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  FULLY_REPAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

export default function InputDistDetailPage({
  distributionId, onBack,
}: {
  distributionId: string
  onBack: () => void
}) {
  const { setActiveModule } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [dist, setDist] = useState<any>(null)
  const [ledger, setLedger] = useState<any[]>([])
  const [repayAmount, setRepayAmount] = useState('')
  const [repaying, setRepaying] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await fetch('/api/input-distribution').then(r => r.json())
      const found = (list.data || []).find((x: any) => x.id === distributionId)
      if (!found) throw new Error('Not found')
      setDist(found)
      if (found.farmerId) {
        const led = await fetch(`/api/farmers/${found.farmerId}/ledger`).then(r => r.json()).catch(() => null)
        const entries = (led?.data || led?.entries || []).filter((l: any) => l.referenceId === distributionId)
        setLedger(entries)
      }
    } catch {
      toast.error('Failed to load distribution')
    } finally {
      setLoading(false)
    }
  }, [distributionId])

  useEffect(() => { load() }, [load])

  const recordRepayment = async () => {
    const amount = Number(repayAmount)
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return }
    setRepaying(true)
    try {
      const res = await fetch(`/api/input-distribution/${distributionId}/repay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Repayment failed')
      toast.success(`Repayment of ${fmtUGX(json.applied)} recorded`)
      setRepayAmount('')
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setRepaying(false)
    }
  }

  if (loading) {
    return <div className="p-6 space-y-4 max-w-5xl">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded" />)}</div>
  }
  if (!dist) return <div className="text-center p-8 text-muted-foreground">Distribution not found</div>

  const totalCost = dist.totalCost || 0
  const paid = dist.amountPaid || 0
  const balance = dist.balanceRemaining ?? Math.max(0, totalCost - paid)
  const progressPct = totalCost > 0 ? Math.min(100, Math.round((paid / totalCost) * 100)) : 0

  const steps: StepDef[] = [
    { key: 'distributed', label: 'Distributed', caption: dist.distributionDate ? new Date(dist.distributionDate).toLocaleDateString() : undefined, state: 'done' },
    {
      key: 'repaying', label: 'Partial Repayments',
      caption: paid > 0 && balance > 0 ? `${progressPct}% paid` : undefined,
      state: balance <= 0 ? 'done' : paid > 0 ? 'current' : 'pending',
    },
    { key: 'fully', label: 'Fully Repaid', state: balance <= 0 ? 'done' : 'pending' },
  ]

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold truncate">
                Input Distribution — {dist.farmer ? `${dist.farmer.firstName} ${dist.farmer.lastName}` : 'Farmer'}
              </h2>
              <p className="text-xs text-muted-foreground truncate capitalize">
                {String(dist.inputType || '').replace(/_/g, ' ')}{dist.inputName ? ` · ${dist.inputName}` : ''} · {dist.quantity} {dist.unit}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className={cn('text-xs', statusColor[dist.status] || '')}>{(dist.status || 'DISTRIBUTED').replace(/_/g, ' ')}</Badge>
            <Button size="sm" variant="outline" className="gap-1.5"
              onClick={() => { useAppStore.getState().setSelectedInputDistId(distributionId); setActiveModule('input-dist-edit') }}>
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-5xl">
        {/* ── Repayment timeline ── */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Repayment Timeline (Cash Installments)</CardTitle></CardHeader>
          <CardContent>
            <EkbStepper steps={steps} />
            <Separator className="my-4" />
            {/* progress bar */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Paid {fmtUGX(paid)} of {fmtUGX(totalCost)}</span>
                <span className="font-medium">{progressPct}%</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
            {balance > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 items-center">
                <Input type="number" step="any" min="0" placeholder={`Installment amount (max ${fmtUGX(balance)})`}
                  value={repayAmount} onChange={e => setRepayAmount(e.target.value)} className="h-9 w-64" />
                <Button size="sm" className="gap-1.5" disabled={repaying} onClick={recordRepayment}>
                  {repaying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />} Record Installment
                </Button>
              </div>
            )}
            {balance <= 0 && (
              <p className="text-sm text-emerald-600 flex items-center gap-1.5 mt-3"><CheckCircle className="w-4 h-4" /> Fully repaid — no outstanding balance.</p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Boxes className="w-4 h-4 text-primary" /> Distribution Details</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Farmer</span><span className="font-medium">{dist.farmer ? `${dist.farmer.firstName} ${dist.farmer.lastName}` : '—'} {dist.farmer?.farmerCode && <span className="font-mono text-xs text-muted-foreground">({dist.farmer.farmerCode})</span>}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Input</span><span className="font-medium capitalize">{String(dist.inputType || '').replace(/_/g, ' ')}{dist.inputName ? ` — ${dist.inputName}` : ''}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Quantity</span><span>{Number(dist.quantity).toLocaleString()} {dist.unit}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Unit Cost</span><span>{fmtUGX(dist.unitCost)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Distributed On</span><span>{dist.distributionDate ? new Date(dist.distributionDate).toLocaleDateString() : '—'}</span></div>
              {dist.paymentMode && <div className="flex justify-between"><span className="text-muted-foreground">Payment Mode</span><span className="capitalize">{dist.paymentMode.replace(/_/g, ' ').toLowerCase()}</span></div>}
              {dist.notes && <p className="text-xs text-muted-foreground pt-1 border-t pt-2">{dist.notes}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Package className="w-4 h-4 text-primary" /> Financial Position</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total Cost</span><span className="font-medium">{fmtUGX(totalCost)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-medium text-blue-600">{fmtUGX(paid)}</span></div>
              <Separator />
              <div className="flex justify-between text-base"><span className="font-medium">Balance Outstanding</span><span className="font-bold text-amber-600">{fmtUGX(balance)}</span></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Landmark className="w-4 h-4 text-primary" /> Ledger History</CardTitle></CardHeader>
          <CardContent>
            {ledger.length === 0 ? (
              <p className="text-sm text-muted-foreground">No ledger entries for this distribution yet.</p>
            ) : (
              <div>
                {ledger.map((l, i) => (
                  <EkbTimelineRow
                    key={l.id}
                    icon={l.type === 'PAYMENT' ? CheckCircle : Boxes}
                    title={l.description}
                    subtitle={`${l.type} · balance after: ${fmtUGX(l.balanceAfter ?? 0)}`}
                    right={<span className={cn('font-medium', l.amount >= 0 ? 'text-emerald-600' : 'text-red-600')}>{l.amount >= 0 ? '+' : ''}{fmtUGX(l.amount)}</span>}
                    last={i === ledger.length - 1}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
