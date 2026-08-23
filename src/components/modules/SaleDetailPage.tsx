'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import {
  ArrowLeft, CheckCircle, XCircle, CreditCard, Receipt, Truck, FileText,
  Loader2, Pencil, FileSearch, Package, Printer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { EkbStepper, type StepDef } from '@/components/ui/ekb-stepper'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const fmtUGX = (n: number) => `UGX ${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`

const statusColor: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  APPROVED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  INVOICED: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  DELIVERED: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

export default function SaleDetailPage({
  saleId, onBack,
}: {
  saleId: string
  onBack: () => void
}) {
  const { setActiveModule, setE2eTraceQuery } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [sale, setSale] = useState<any>(null)
  const [chain, setChain] = useState<any>(null)
  const [action, setAction] = useState<string | null>(null)
  const [transactionRef, setTransactionRef] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/sales/${saleId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setSale(json.data || json)
      const trace = await fetch(`/api/e2e-trace?saleId=${saleId}`).then(r => r.json()).catch(() => null)
      setChain(trace)
    } catch {
      toast.error('Failed to load sale')
    } finally {
      setLoading(false)
    }
  }, [saleId])

  useEffect(() => { load() }, [load])

  const runAction = async (act: string, extra?: Record<string, unknown>) => {
    setAction(act)
    try {
      const res = await fetch(`/api/sales/${saleId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: act, ...extra }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Action failed')
      toast.success(`Sale ${act === 'invoice' ? 'invoiced' : act + 'ed'} successfully`)
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
  if (!sale) return <div className="text-center p-8 text-muted-foreground">Sale not found</div>

  const status = sale.status || 'PENDING'
  const cancelled = status === 'CANCELLED'
  const invoice = chain?.invoices?.[0]
  const salePayments = chain?.salePayments || []
  const batch = chain?.batch

  const flow = ['PENDING', 'APPROVED', 'INVOICED', 'PAID', 'DELIVERED', 'COMPLETED']
  const idx = flow.indexOf(status)
  const steps: StepDef[] = flow.map((s, i) => ({
    key: s,
    label: s.charAt(0) + s.slice(1).toLowerCase(),
    caption: s === 'APPROVED' && sale.approvedAt ? new Date(sale.approvedAt).toLocaleDateString()
      : s === 'PAID' && sale.paidAt ? new Date(sale.paidAt).toLocaleDateString()
      : s === 'DELIVERED' && sale.deliveredAt ? new Date(sale.deliveredAt).toLocaleDateString()
      : undefined,
    state: cancelled ? 'pending' : i < idx ? 'done' : i === idx ? (i === flow.length - 1 ? 'done' : 'current') : 'pending',
  }))
  if (cancelled) steps[0] = { key: 'cancelled', label: 'Cancelled', state: 'rejected' }

  const qty = parseFloat(sale.quantity) || 0
  const totalAmount = sale.totalAmount ?? qty * (sale.unitPrice || 0)
  const netAmount = sale.netAmount ?? totalAmount - (sale.charges || 0) - (sale.taxAmount || 0)

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold truncate">Sale — {sale.customerName || 'Buyer'}</h2>
              <p className="text-xs text-muted-foreground truncate">{sale.product} · {qty}kg · {new Date(sale.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className={cn('text-xs', statusColor[status] || '')}>{status}</Badge>
            <Button size="sm" variant="outline" className="gap-1.5"
              onClick={() => { useAppStore.getState().setSelectedSaleId(saleId); setActiveModule('sale-edit') }}>
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-5xl">
        {/* ── Order lifecycle stepper ── */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Order & Payment Timeline</CardTitle></CardHeader>
          <CardContent>
            <EkbStepper steps={steps} />
            <Separator className="my-4" />
            <div className="flex flex-wrap gap-2 items-center">
              {status === 'PENDING' && (
                <>
                  <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" disabled={action === 'approve'} onClick={() => runAction('approve')}>
                    {action === 'approve' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Approve
                  </Button>
                  <Button size="sm" variant="destructive" className="gap-1.5" disabled={action === 'cancel'} onClick={() => runAction('cancel')}><XCircle className="w-3.5 h-3.5" /> Cancel</Button>
                </>
              )}
              {status === 'APPROVED' && (
                <Button size="sm" variant="outline" className="gap-1.5" disabled={action === 'invoice'} onClick={() => runAction('invoice')}>
                  <FileText className="w-3.5 h-3.5" /> Generate Invoice
                </Button>
              )}
              {(status === 'APPROVED' || status === 'INVOICED') && (
                <div className="flex gap-2 items-center">
                  <Input placeholder="Transaction ref (optional)" value={transactionRef} onChange={e => setTransactionRef(e.target.value)} className="h-8 w-52" />
                  <Button size="sm" className="gap-1.5" disabled={action === 'pay'} onClick={() => runAction('pay', { transactionRef: transactionRef || undefined })}>
                    {action === 'pay' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />} Record Payment
                  </Button>
                </div>
              )}
              {(status === 'PAID' || status === 'INVOICED') && (
                <Button size="sm" variant="outline" className="gap-1.5" disabled={action === 'deliver'} onClick={() => runAction('deliver')}>
                  <Truck className="w-3.5 h-3.5" /> Mark Delivered
                </Button>
              )}
              {status === 'DELIVERED' && (
                <Button size="sm" className="gap-1.5" disabled={action === 'complete'} onClick={() => runAction('complete')}>
                  <CheckCircle className="w-3.5 h-3.5" /> Complete Sale
                </Button>
              )}
            </div>
            {salePayments.length > 0 && (
              <div className="mt-3 space-y-1">
                {salePayments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
                    <span className="flex items-center gap-2"><CreditCard className="w-3.5 h-3.5 text-muted-foreground" /> {p.transactionRef} · {p.description}</span>
                    <span className="font-medium">{fmtUGX(p.amount)}</span>
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">{p.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Sale summary ── */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Sale Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Buyer</span><span className="font-medium">{sale.customerName || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Product</span><span className="font-medium">{sale.product} ({sale.category === 'INPUT' ? 'Inputs' : 'Produce'})</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Quantity</span><span className="font-medium">{qty} kg</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Unit Price</span><span>{fmtUGX(sale.unitPrice || 0)}/kg</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Payment Method</span><span>{(sale.paymentMethod || '—').replace(/_/g, ' ')}</span></div>
              {sale.farmer && <div className="flex justify-between"><span className="text-muted-foreground">Source Farmer</span><span className="font-medium">{sale.farmer.firstName} {sale.farmer.lastName}</span></div>}
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">Gross Amount</span><span className="font-medium">{fmtUGX(totalAmount)}</span></div>
              {sale.charges ? <div className="flex justify-between"><span className="text-muted-foreground">Charges</span><span className="text-amber-600">− {fmtUGX(sale.charges)}</span></div> : null}
              {sale.taxAmount ? <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="text-red-600">− {fmtUGX(sale.taxAmount)}</span></div> : null}
              {sale.loanDeducted ? <div className="flex justify-between"><span className="text-muted-foreground">Loan Deducted</span><span className="text-red-600">− {fmtUGX(sale.loanDeducted)}</span></div> : null}
              <Separator />
              <div className="flex justify-between text-base"><span className="font-medium">Net Proceeds</span><span className="font-bold text-emerald-700 dark:text-emerald-400">{fmtUGX(netAmount)}</span></div>
            </CardContent>
          </Card>

          {/* ── Invoice (computed commercial invoice) ── */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Receipt className="w-4 h-4 text-primary" /> Invoice</CardTitle>
                {invoice && (
                  <Button size="sm" variant="ghost" className="gap-1.5 h-7" onClick={() => window.print()}>
                    <Printer className="w-3.5 h-3.5" /> Print
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {invoice ? (
                <div className="border rounded-lg p-4 text-sm space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono font-semibold">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">Issued {new Date(invoice.issuedAt).toLocaleDateString()}</p>
                    </div>
                    <Badge className={cn('text-[10px]', statusColor[invoice.status] || '')}>{invoice.status}</Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between"><span className="text-muted-foreground">Billed to</span><span className="font-medium">{invoice.customer}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{invoice.product} × {invoice.quantity}kg</span><span>{fmtUGX(invoice.subtotal)}</span></div>
                  {invoice.charges ? <div className="flex justify-between"><span className="text-muted-foreground">Charges</span><span>− {fmtUGX(invoice.charges)}</span></div> : null}
                  {invoice.tax ? <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>− {fmtUGX(invoice.tax)}</span></div> : null}
                  <Separator />
                  <div className="flex justify-between font-bold"><span>Total Due</span><span className="text-emerald-700 dark:text-emerald-400">{fmtUGX(invoice.total)}</span></div>
                  <p className="text-[10px] text-muted-foreground">Payment due by {new Date(invoice.dueDate).toLocaleDateString()} (net 30)</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Approve the sale, then generate the invoice to produce a commercial invoice.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Traceability & inventory ── */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><FileSearch className="w-4 h-4 text-primary" /> Traceability & Inventory</CardTitle>
              <Button size="sm" variant="outline" className="gap-1.5"
                onClick={() => { setE2eTraceQuery(`saleId=${saleId}`); setActiveModule('e2e-trace') }}>
                <FileSearch className="w-3.5 h-3.5" /> Open Full Chain
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {batch ? (
              <>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="outline" className="font-mono">Batch {batch.batchId}</Badge>
                  <Badge variant="outline">Stage: {batch.currentStage}</Badge>
                  {chain?.inventory && (
                    <>
                      <Badge variant="outline">Collected: {chain.inventory.collectedKg}kg</Badge>
                      <Badge variant="outline" className="text-amber-700">Sold: {chain.inventory.soldKg}kg</Badge>
                      <Badge variant="outline" className="text-emerald-700">Remaining: {chain.inventory.remainingKg}kg</Badge>
                    </>
                  )}
                </div>
                {chain?.purchase && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    Traced back to purchase from <span className="text-foreground font-medium">{chain.purchase.farmer?.firstName} {chain.purchase.farmer?.lastName}</span> ({chain.purchase.farmer?.farmerCode})
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No traceability batch linked — link one when creating/editing the sale for end-to-end chain visibility.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
