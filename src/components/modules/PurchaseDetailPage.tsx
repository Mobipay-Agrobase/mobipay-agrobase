'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import {
  ArrowLeft, Droplet, Scale, DollarSign, CheckCircle, XCircle, CreditCard,
  FileSearch, Layers, Receipt, Loader2, Pencil, Landmark, Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { EkbStepper, EkbTimelineRow, type StepDef } from '@/components/ui/ekb-stepper'
import { AttachmentsSection } from '@/components/attachments/AttachmentsSection'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const fmtUGX = (n: number) => `UGX ${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
const fmtKg = (n: number) => `${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} kg`

const statusColor: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  APPROVED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

export default function PurchaseDetailPage({
  purchaseId, onBack,
}: {
  purchaseId: string
  onBack: () => void
}) {
  const { setActiveModule, setE2eTraceQuery } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [ledger, setLedger] = useState<any[]>([])
  const [batch, setBatch] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [action, setAction] = useState<string | null>(null)
  const [transactionRef, setTransactionRef] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/purchases/${purchaseId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData(json.data); setLedger(json.ledger || []); setBatch(json.batch); setPayments(json.payments || [])
    } catch {
      toast.error('Failed to load purchase')
    } finally {
      setLoading(false)
    }
  }, [purchaseId])

  useEffect(() => { load() }, [load])

  const runAction = async (act: string, extra?: Record<string, unknown>) => {
    setAction(act)
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: act, ...extra }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Action failed')
      toast.success(act === 'approve' ? 'Purchase approved — ledger & traceability batch created'
        : act === 'pay' ? 'Payment recorded' : `Purchase ${act}ted`)
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setAction(null)
    }
  }

  if (loading) {
    return <div className="p-6 space-y-4 max-w-5xl">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded" />)}</div>
  }
  if (!data) return <div className="text-center p-8 text-muted-foreground">Purchase not found</div>

  const approvalStatus = data.approvalStatus || 'SUBMITTED'
  const rejected = approvalStatus === 'REJECTED'
  const paid = data.status === 'PAID'
  const approved = approvalStatus === 'APPROVED' || paid || approvalStatus === 'APPROVED'
  const steps: StepDef[] = [
    { key: 'recorded', label: 'Recorded', caption: new Date(data.createdAt).toLocaleDateString(), state: 'done' },
    rejected
      ? { key: 'rejected', label: 'Rejected', state: 'rejected' }
      : { key: 'submitted', label: 'Submitted', caption: 'Field officer', state: 'done' },
    ...(rejected ? [] : [
      {
        key: 'approved',
        label: 'Approved',
        caption: data.approvedAt ? new Date(data.approvedAt).toLocaleDateString() : undefined,
        state: approved || paid ? 'done' : 'current',
      } as StepDef,
      {
        key: 'paid',
        label: 'Farmer Paid',
        caption: payments[0]?.transactionRef,
        state: paid ? 'done' : 'pending',
      } as StepDef,
    ]),
  ]

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold truncate">
                Purchase — {data.farmer ? `${data.farmer.firstName} ${data.farmer.lastName}` : 'Unknown'}
              </h2>
              <p className="text-xs text-muted-foreground capitalize truncate">
                {data.commodity}{data.variety ? ` · ${data.variety}` : ''} · {new Date(data.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className={cn('text-xs', statusColor[data.status] || '')}>{data.status}</Badge>
            <Button size="sm" variant="outline" className="gap-1.5"
              onClick={() => { useAppStore.getState().setSelectedPurchaseId(purchaseId); setActiveModule('purchase-edit') }}>
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-5xl">
        {/* ── Payment lifecycle stepper ── */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Payment Timeline</CardTitle></CardHeader>
          <CardContent>
            <EkbStepper steps={steps} />
            <Separator className="my-4" />
            <div className="flex flex-wrap gap-2 items-center">
              {approvalStatus === 'DRAFT' && (
                <Button size="sm" className="gap-1.5" disabled={action === 'submit'} onClick={() => runAction('submit')}>
                  {action === 'submit' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Submit for Approval
                </Button>
              )}
              {(approvalStatus === 'SUBMITTED' || approvalStatus === 'PENDING') && (
                <>
                  <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" disabled={action === 'approve'} onClick={() => runAction('approve')}>
                    {action === 'approve' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Approve & Create Batch
                  </Button>
                  <Button size="sm" variant="destructive" className="gap-1.5" disabled={action === 'reject'} onClick={() => runAction('reject')}>
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </Button>
                </>
              )}
              {approvalStatus === 'APPROVED' && data.status !== 'PAID' && (
                <div className="flex gap-2 items-center flex-wrap">
                  <Input placeholder="Transaction ref (optional)" value={transactionRef} onChange={e => setTransactionRef(e.target.value)} className="h-8 w-52" />
                  <Button size="sm" className="gap-1.5" disabled={action === 'pay'} onClick={() => runAction('pay', { transactionRef: transactionRef || undefined })}>
                    {action === 'pay' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />} Record Farmer Payment
                  </Button>
                </div>
              )}
              {data.status === 'PAID' && (
                <p className="text-xs text-emerald-600 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Farmer paid — {fmtUGX(payments[0]?.amount ?? data.netPayment ?? 0)} ({payments[0]?.transactionRef || data.paymentRef})</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Weight & quality ── */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Scale className="w-4 h-4 text-primary" /> Weight & Quality</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total Weight</span><span className="font-medium">{fmtKg(Number(data.quantity))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><Droplet className="w-3 h-3" /> Moisture</span><span className="font-medium">{data.moistureReading != null ? `${data.moistureReading}% (std ${data.moistureThreshold ?? 13}%)` : '—'}</span></div>
              {data.moistureDeduction ? <div className="flex justify-between"><span className="text-muted-foreground">Moisture Deduction</span><span className="font-medium text-amber-600">− {fmtKg(data.moistureDeduction)}</span></div> : null}
              {data.qualityDeduction ? <div className="flex justify-between"><span className="text-muted-foreground">Quality Deduction</span><span className="font-medium text-amber-600">− {fmtKg(data.qualityDeduction)}</span></div> : null}
              {data.defectCount != null ? <div className="flex justify-between"><span className="text-muted-foreground">Defects (blacks)</span><span className="font-medium">{data.defectCount}</span></div> : null}
              <Separator />
              <div className="flex justify-between text-base"><span className="font-medium">Net Weight</span><span className="font-bold">{fmtKg(data.netWeight ?? Number(data.quantity))}</span></div>
            </CardContent>
          </Card>

          {/* ── Money breakdown ── */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" /> Payment Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Purchase Total</span><span className="font-medium">{fmtUGX(data.totalAmount ?? 0)}</span></div>
              {data.loanDeduction ? <div className="flex justify-between"><span className="text-muted-foreground">Loan Deduction</span><span className="text-red-600">− {fmtUGX(data.loanDeduction)}</span></div> : null}
              {data.inputDeduction ? <div className="flex justify-between"><span className="text-muted-foreground">Input Deduction</span><span className="text-red-600">− {fmtUGX(data.inputDeduction)}</span></div> : null}
              {data.momoCharges ? <div className="flex justify-between"><span className="text-muted-foreground">MoMo Charges</span><span className="text-amber-600">− {fmtUGX(data.momoCharges)}</span></div> : null}
              {data.momoTax ? <div className="flex justify-between"><span className="text-muted-foreground">MoMo Tax</span><span className="text-red-600">− {fmtUGX(data.momoTax)}</span></div> : null}
              <Separator />
              <div className="flex justify-between text-base"><span className="font-medium">Net Payment to Farmer</span><span className="font-bold text-emerald-700 dark:text-emerald-400">{fmtUGX(data.netPayment ?? data.totalAmount ?? 0)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Daily Price</span><span>{fmtUGX(data.dailyPrice ?? data.unitPrice ?? 0)}/kg</span></div>
            </CardContent>
          </Card>
        </div>

        {/* ── Evidence attachments (moisture photos, weighing slips, receipts) ── */}
        <AttachmentsSection
          relatedId={purchaseId}
          relatedType="purchase"
          description="Moisture photos, weighing slips, signed receipts and other purchase evidence"
        />

        {/* ── E2E traceability chain ── */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><FileSearch className="w-4 h-4 text-primary" /> E2E Traceability</CardTitle>
              <Button size="sm" variant="outline" className="gap-1.5"
                onClick={() => { setE2eTraceQuery(`purchaseId=${purchaseId}`); setActiveModule('e2e-trace') }}>
                <Layers className="w-3.5 h-3.5" /> Open Full Chain
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {batch ? (
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="outline" className="font-mono">Batch {batch.batchId}</Badge>
                <Badge variant="outline">Stage: {batch.currentStage}</Badge>
                <Badge variant="outline">{fmtKg(batch.quantityKg)} {batch.commodity}</Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Traceability batch is created automatically when the purchase is approved.</p>
            )}
            {payments.length > 0 && (
              <div className="mt-3 space-y-1 text-sm">
                {payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                    <span className="flex items-center gap-2"><CreditCard className="w-3.5 h-3.5 text-muted-foreground" /> {p.transactionRef}</span>
                    <span className="font-medium">{fmtUGX(p.amount)}</span>
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">{p.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Farmer ledger entries from this purchase ── */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Landmark className="w-4 h-4 text-primary" /> Farmer Ledger Impact</CardTitle></CardHeader>
          <CardContent>
            {ledger.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ledger entries appear after approval.</p>
            ) : (
              <div className="space-y-0">
                {ledger.map((l, i) => (
                  <EkbTimelineRow
                    key={l.id}
                    icon={l.amount >= 0 ? CheckCircle : Receipt}
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

        {batch && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Package className="w-4 h-4 text-primary" /> Inventory Position</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>{fmtKg(batch.quantityKg)} collected into batch <span className="font-mono text-foreground">{batch.batchId}</span> — sales against this batch reduce the remaining stock. Open the full chain for live sold/remaining figures.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
