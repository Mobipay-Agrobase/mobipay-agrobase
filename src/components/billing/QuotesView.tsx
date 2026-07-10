'use client'

/**
 * Quotes View — SUPER_ADMIN + MOBIPAY_FINANCE only
 * Create and track quotes for prospects.
 */

import React, { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  FileText, Plus, RefreshCw, Loader2, TrendingUp, DollarSign
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  ACCEPTED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  EXPIRED: 'bg-gray-100 text-gray-500',
}

export default function QuotesView() {
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form
  const [prospectName, setProspectName] = useState('')
  const [prospectEmail, setProspectEmail] = useState('')
  const [prospectPhone, setProspectPhone] = useState('')
  const [prospectCountry, setProspectCountry] = useState('Uganda')
  const [billingModel, setBillingModel] = useState('VENDOR_FINANCING')
  const [feeType, setFeeType] = useState('PERCENTAGE')
  const [feeRate, setFeeRate] = useState('0.02')
  const [upfrontInvestment, setUpfrontInvestment] = useState('28000000')
  const [recurringMonthlyCost, setRecurringMonthlyCost] = useState('3400000')
  const [notes, setNotes] = useState('')

  const fetchQuotes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/quotes')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setQuotes(data.quotes || [])
    } catch {
      toast.error('Failed to load quotes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchQuotes() }, [fetchQuotes])

  const handleCreate = async () => {
    if (!prospectName) { toast.error('Prospect name is required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectName, prospectEmail, prospectPhone, prospectCountry,
          billingModel, feeType, feeRate: parseFloat(feeRate),
          upfrontInvestment: parseFloat(upfrontInvestment),
          recurringMonthlyCost: parseFloat(recurringMonthlyCost),
          notes,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Quote created')
      setShowCreate(false)
      setProspectName(''); setNotes('')
      fetchQuotes()
    } catch {
      toast.error('Failed to create quote')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> Quotes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and track quotes for prospective tenants
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchQuotes}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> New Quote
          </Button>
        </div>
      </div>

      {quotes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No quotes yet</p>
            <p className="text-sm mt-1">Create a quote for a prospective tenant.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quotes.map((q) => (
            <Card key={q.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{q.prospectName}</p>
                    <p className="text-xs text-muted-foreground">{q.prospectCountry}</p>
                  </div>
                  <Badge className={cn('text-[10px]', STATUS_COLORS[q.status] || STATUS_COLORS.DRAFT)}>
                    {q.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Model</span>
                    <span className="font-medium">{q.billingModel}</span>
                  </div>
                  {q.feeType && (
                    <div className="flex justify-between">
                      <span>Fee</span>
                      <span className="font-medium">
                        {q.feeType === 'PERCENTAGE' ? `${Number(q.feeRate) * 100}%` : `UGX ${q.feeRate}`}
                      </span>
                    </div>
                  )}
                  {q.upfrontInvestment && (
                    <div className="flex justify-between">
                      <span>Investment</span>
                      <span className="font-medium">UGX {Number(q.upfrontInvestment).toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                  Created {new Date(q.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Quote</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Prospect Name *</Label>
                <Input value={prospectName} onChange={(e) => setProspectName(e.target.value)} placeholder="e.g. Arc Dev Ltd" />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Select value={prospectCountry} onValueChange={setProspectCountry}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Uganda">Uganda</SelectItem>
                    <SelectItem value="Kenya">Kenya</SelectItem>
                    <SelectItem value="Ghana">Ghana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={prospectEmail} onChange={(e) => setProspectEmail(e.target.value)} placeholder="contact@prospect.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={prospectPhone} onChange={(e) => setProspectPhone(e.target.value)} placeholder="+256..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Billing Model</Label>
                <Select value={billingModel} onValueChange={setBillingModel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VENDOR_FINANCING">Vendor Financing</SelectItem>
                    <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                    <SelectItem value="HYBRID">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fee Type</Label>
                <Select value={feeType} onValueChange={setFeeType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="PER_KG">Per Kg</SelectItem>
                    <SelectItem value="FLAT_PER_TXN">Flat per Txn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Fee Rate</Label>
                <Input type="number" step="0.001" value={feeRate} onChange={(e) => setFeeRate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Investment (UGX)</Label>
                <Input type="number" value={upfrontInvestment} onChange={(e) => setUpfrontInvestment(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Monthly Cost (UGX)</Label>
                <Input type="number" value={recurringMonthlyCost} onChange={(e) => setRecurringMonthlyCost(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Special terms, negotiation notes..." />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
              Create Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
