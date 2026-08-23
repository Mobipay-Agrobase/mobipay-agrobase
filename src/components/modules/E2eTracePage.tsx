'use client'

import React, { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import {
  ArrowLeft, ShoppingCart, Layers, Receipt, CreditCard, Truck, Package,
  FileSearch, Landmark, Scale, CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const fmtUGX = (n: number) => `UGX ${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
const fmtKg = (n: number) => `${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} kg`

const stageColor: Record<string, string> = {
  FARM: 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300',
  COLLECTION: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  PROCESSING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  SALES: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  EXPORT: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
}

/** A numbered chain node: icon bubble + connector + card content. */
function ChainNode({
  n, icon: Icon, title, badge, done, children,
}: {
  n: number
  icon: React.ElementType
  title: string
  badge?: React.ReactNode
  done?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0',
          done ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-muted border-border text-muted-foreground',
        )}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div className="w-0.5 flex-1 bg-border min-h-[24px]" />
      </div>
      <div className="flex-1 pb-8 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs font-bold text-muted-foreground">STEP {n}</span>
          <h3 className="text-sm font-semibold">{title}</h3>
          {badge}
        </div>
        {children}
      </div>
    </div>
  )
}

export default function E2eTracePage() {
  const { setActiveModule, e2eTraceQuery } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [chain, setChain] = useState<any>(null)

  useEffect(() => {
    const q = e2eTraceQuery || ''
    if (!q) { setLoading(false); return }
    setLoading(true)
    fetch(`/api/e2e-trace?${q}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setChain(d) })
      .catch(() => setChain(null))
      .finally(() => setLoading(false))
  }, [e2eTraceQuery])

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="space-y-4 max-w-3xl">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded" />)}</div>
      </div>
    )
  }

  if (!chain) {
    return (
      <div className="flex flex-col h-full bg-background">
        <Header onBack={() => setActiveModule('purchases')} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FileSearch className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-medium">No trace selected</p>
            <p className="text-sm text-muted-foreground mt-1">Open a purchase or sale detail page and click "Open Full Chain"</p>
          </div>
        </div>
      </div>
    )
  }

  const { purchase, batch, events, sales, purchasePayments, salePayments, deliveries, inventory, invoices } = chain

  return (
    <div className="flex flex-col h-full bg-background">
      <Header onBack={() => setActiveModule(purchase ? 'purchases' : 'sales')} subtitle={batch ? `Batch ${batch.batchId}` : undefined} />
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          {/* KPI strip */}
          {inventory && (
            <div className="grid grid-cols-3 gap-3 mb-8">
              <Card><CardContent className="p-3 text-center">
                <p className="text-[11px] text-muted-foreground">Collected</p>
                <p className="text-lg font-bold">{fmtKg(inventory.collectedKg)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3 text-center">
                <p className="text-[11px] text-muted-foreground">Sold</p>
                <p className="text-lg font-bold text-violet-700 dark:text-violet-400">{fmtKg(inventory.soldKg)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3 text-center">
                <p className="text-[11px] text-muted-foreground">In Stock</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{fmtKg(inventory.remainingKg)}</p>
              </CardContent></Card>
            </div>
          )}

          {/* STEP 1 — Purchase */}
          {purchase && (
            <ChainNode n={1} icon={ShoppingCart} title="Procurement (Purchase)" done badge={<Badge className="text-[10px] bg-emerald-100 text-emerald-700">{purchase.status}</Badge>}>
              <Card><CardContent className="p-3 text-sm space-y-1.5">
                <div className="flex justify-between"><span className="text-muted-foreground">Farmer</span><span className="font-medium">{purchase.farmer ? `${purchase.farmer.firstName} ${purchase.farmer.lastName}` : '—'} <span className="font-mono text-xs text-muted-foreground">{purchase.farmer?.farmerCode}</span></span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Produce</span><span className="capitalize">{purchase.commodity}{purchase.variety ? ` · ${purchase.variety}` : ''}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><Scale className="w-3 h-3" /> Net Weight</span><span>{fmtKg(purchase.netWeight ?? Number(purchase.quantity))}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Net Payment</span><span className="font-medium">{fmtUGX(purchase.netPayment ?? purchase.totalAmount ?? 0)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Recorded</span><span>{new Date(purchase.createdAt).toLocaleString()}</span></div>
              </CardContent></Card>
            </ChainNode>
          )}

          {/* STEP 2 — Batch / inventory */}
          {batch && (
            <ChainNode n={2} icon={Layers} title="Traceability Batch" done badge={<Badge className={cn('text-[10px]', stageColor[batch.currentStage] || '')}>{batch.currentStage}</Badge>}>
              <Card><CardContent className="p-3 text-sm space-y-1.5">
                <div className="flex justify-between"><span className="text-muted-foreground">Batch Code</span><span className="font-mono">{batch.batchId}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Quantity</span><span>{fmtKg(batch.quantityKg)} {batch.commodity}</span></div>
                {batch.qualityGrade && <div className="flex justify-between"><span className="text-muted-foreground">Grade</span><span>{batch.qualityGrade}</span></div>}
                {events?.length > 0 && (
                  <div className="pt-2 border-t space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Trace events ({events.length})</p>
                    {events.slice(-4).map((ev: any) => (
                      <div key={ev.id} className="flex justify-between text-xs">
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> {ev.eventType.replace(/_/g, ' ')}</span>
                        <span className="text-muted-foreground">{new Date(ev.timestamp || ev.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent></Card>
            </ChainNode>
          )}

          {/* STEP 3 — Sales */}
          {(sales?.length > 0 || !batch) && (
            <ChainNode n={batch ? 3 : 2} icon={Receipt} title="Sale(s) to Buyer" done={sales?.length > 0}>
              {sales?.length > 0 ? sales.map((s: any) => (
                <Card key={s.id} className="mb-2"><CardContent className="p-3 text-sm space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{s.customerName || 'Buyer'}</span>
                    <Badge className="text-[10px] bg-violet-100 text-violet-700">{s.status}</Badge>
                  </div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{s.product} × {s.quantity}kg</span><span>{fmtUGX(s.totalAmount ?? 0)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Sold</span><span>{new Date(s.createdAt).toLocaleString()}</span></div>
                </CardContent></Card>
              )) : (
                <p className="text-sm text-muted-foreground">No sales recorded against this chain yet.</p>
              )}
            </ChainNode>
          )}

          {/* STEP 4 — Invoice */}
          {invoices?.length > 0 && (
            <ChainNode n={4} icon={FileSearch} title="Commercial Invoice(s)" done>
              {invoices.map((inv: any) => (
                <Card key={inv.invoiceNumber} className="mb-2"><CardContent className="p-3 text-sm space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-medium">{inv.invoiceNumber}</span>
                    <Badge className="text-[10px] bg-violet-100 text-violet-700">{inv.status}</Badge>
                  </div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Billed to</span><span>{inv.customer}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold">{fmtUGX(inv.total)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Due</span><span>{new Date(inv.dueDate).toLocaleDateString()}</span></div>
                </CardContent></Card>
              ))}
            </ChainNode>
          )}

          {/* STEP 5 — Payments */}
          <ChainNode n={invoices?.length ? 5 : 4} icon={CreditCard} title="Payment Settlement" done={purchasePayments?.length > 0 || salePayments?.length > 0}>
            {(purchasePayments?.length > 0 || salePayments?.length > 0) ? (
              <>
                {purchasePayments?.map((p: any) => (
                  <Card key={p.id} className="mb-2"><CardContent className="p-3 text-sm space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2"><ShoppingCart className="w-3.5 h-3.5 text-muted-foreground" /> Farmer payment · {p.recipientName}</span>
                      <Badge className="text-[10px] bg-emerald-100 text-emerald-700">{p.status}</Badge>
                    </div>
                    <div className="flex justify-between"><span className="text-mono text-xs">{p.transactionRef}</span><span className="font-bold text-emerald-700">{fmtUGX(p.amount)}</span></div>
                  </CardContent></Card>
                ))}
                {salePayments?.map((p: any) => (
                  <Card key={p.id} className="mb-2"><CardContent className="p-3 text-sm space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2"><Receipt className="w-3.5 h-3.5 text-muted-foreground" /> Buyer payment · {p.recipientName}</span>
                      <Badge className="text-[10px] bg-emerald-100 text-emerald-700">{p.status}</Badge>
                    </div>
                    <div className="flex justify-between"><span className="font-mono text-xs">{p.transactionRef}</span><span className="font-bold text-emerald-700">{fmtUGX(p.amount)}</span></div>
                  </CardContent></Card>
                ))}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No payments recorded in this chain yet.</p>
            )}
          </ChainNode>

          {/* STEP 6 — Delivery */}
          <ChainNode n={deliveries?.length ? 6 : 5} icon={Truck} title="Delivery / Logistics" done={deliveries?.length > 0}>
            {deliveries?.length > 0 ? deliveries.map((d: any) => (
              <Card key={d.id} className="mb-2"><CardContent className="p-3 text-sm space-y-1.5">
                <div className="flex justify-between items-center">
                  <span>{d.driverName || 'Driver'} · {d.vehicleReg || '—'}</span>
                  <Badge className="text-[10px] bg-cyan-100 text-cyan-700">{d.status}</Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Dispatched</span>
                  <span>{d.dispatchedAt ? new Date(d.dispatchedAt).toLocaleString() : '—'}</span>
                </div>
                {d.deliveredAt && <div className="flex justify-between text-xs"><span className="text-muted-foreground">Delivered</span><span className="text-emerald-600">{new Date(d.deliveredAt).toLocaleString()}</span></div>}
              </CardContent></Card>
            )) : (
              <p className="text-sm text-muted-foreground">No deliveries linked to this chain.</p>
            )}
          </ChainNode>

          {/* Final node */}
          <div className="flex gap-4">
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0',
              inventory && inventory.remainingKg <= 0 ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-muted border-border text-muted-foreground')}>
              <Landmark className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">FINAL</span>
                <h3 className="text-sm font-semibold">Chain Complete</h3>
                {inventory && <Badge variant="outline" className={cn('text-[10px]', inventory.remainingKg <= 0 ? 'text-emerald-700' : 'text-amber-700')}>
                  {inventory.remainingKg <= 0 ? 'Fully sold & settled' : `${fmtKg(inventory.remainingKg)} still in stock`}
                </Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5"><Package className="w-3 h-3" /> Every step above is tenant-scoped and linked via explicit record references.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Header({ onBack, subtitle }: { onBack: () => void; subtitle?: string }) {
  return (
    <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h2 className="text-lg font-semibold">E2E Traceability Chain</h2>
          <p className="text-xs text-muted-foreground">
            {subtitle ? subtitle : 'Purchase → Batch → Sale → Invoice → Payment → Delivery'}
          </p>
        </div>
      </div>
    </div>
  )
}
