'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Users, Receipt, Store, DollarSign, Target, BarChart3, Plus, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react'

function formatUGX(n: number) { return `UGX ${(n || 0).toLocaleString()}` }
function formatDate(d: any) { return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' }

function MaskedAmount({ amount }: { amount: number }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <span className="inline-flex items-center gap-1">
      <span className={revealed ? '' : 'filter blur-sm select-none'}>{revealed ? formatUGX(amount) : 'UGX ••••••'}</span>
      <button onClick={() => setRevealed(!revealed)} className="text-muted-foreground hover:text-foreground">{revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}</button>
    </span>
  )
}

const SETTLEMENTS = ['Kiryandongo', 'Kyangwali', 'Nakivale', 'Kyaka II']
const PARTNERS = ['Swiss Contact', 'CARE', 'SCI']
const PARTNER_KEYS = ['SWISS_CONTACT', 'CARE', 'SCI']

function moduleToTab(moduleKey: string): string {
  if (moduleKey.startsWith('reset-')) {
    const tab = moduleKey.replace('reset-', '')
    if (['dashboard', 'beneficiaries', 'vouchers', 'merchants', 'cash', 'reports'].includes(tab)) {
      return tab
    }
  }
  return 'dashboard'
}

export function ResetView() {
  const { activeModule } = useAppStore()
  const [activeTab, setActiveTab] = useState(moduleToTab(activeModule))

  // Sync tab when sidebar menu changes
  useEffect(() => {
    setActiveTab(moduleToTab(activeModule))
  }, [activeModule])

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="beneficiaries">Beneficiaries</TabsTrigger>
          <TabsTrigger value="vouchers">Vouchers</TabsTrigger>
          <TabsTrigger value="merchants">Merchants</TabsTrigger>
          <TabsTrigger value="cash">Cash</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4"><DashboardTab /></TabsContent>
        <TabsContent value="beneficiaries" className="mt-4"><BeneficiariesTab /></TabsContent>
        <TabsContent value="vouchers" className="mt-4"><VouchersTab /></TabsContent>
        <TabsContent value="merchants" className="mt-4"><MerchantsTab /></TabsContent>
        <TabsContent value="cash" className="mt-4"><CashTab /></TabsContent>
        <TabsContent value="reports" className="mt-4"><ReportsTab /></TabsContent>
      </Tabs>
    </div>
  )
}

function DashboardTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reset/dashboard').then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton className="h-64 rounded-xl" />
  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Users className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-xs text-muted-foreground">Beneficiaries</p><p className="text-xl font-bold">{data.counts?.beneficiaries ?? 0}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><Receipt className="w-5 h-5 text-amber-600" /></div>
          <div><p className="text-xs text-muted-foreground">Vouchers Issued</p><p className="text-xl font-bold">{data.counts?.vouchers ?? 0}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Store className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-xs text-muted-foreground">Merchants</p><p className="text-xl font-bold">{data.counts?.merchants ?? 0}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center"><DollarSign className="w-5 h-5 text-purple-600" /></div>
          <div><p className="text-xs text-muted-foreground">Cash Disbursed</p><p className="text-lg font-bold"><MaskedAmount amount={data.financials?.cashDisbursed ?? 0} /></p></div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">By Settlement</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.breakdowns?.bySettlement?.map((s: any) => (
              <div key={s.name} className="flex justify-between text-sm"><span>{s.name}</span><span className="font-bold">{s._count ?? s.count}</span></div>
            )) || <p className="text-sm text-muted-foreground">No data yet</p>}
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle className="text-sm">By Partner</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.breakdowns?.byPartner?.map((p: any) => {
              const partnerName = p.enrolledBy === 'SWISS_CONTACT' ? 'Swiss Contact' : p.enrolledBy === 'CARE' ? 'CARE' : p.enrolledBy === 'SCI' ? 'SCI' : p.enrolledBy
              return <div key={p.enrolledBy} className="flex justify-between text-sm"><span>{partnerName}</span><span className="font-bold">{p._count ?? p.count}</span></div>
            }) || <p className="text-sm text-muted-foreground">No data yet</p>}
          </CardContent>
        </Card>
      </div>

      <Card><CardHeader><CardTitle className="text-sm">Voucher Status</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-4 gap-3">
          {data.breakdowns?.voucherStatus?.map((v: any) => (
            <div key={v.status} className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-lg font-bold">{v._count ?? v.count}</p>
              <p className="text-xs text-muted-foreground">{v.status}</p>
            </div>
          )) || <p className="text-sm text-muted-foreground">No voucher data</p>}
        </CardContent>
      </Card>
    </div>
  )
}

function BeneficiariesTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/reset/beneficiaries?page=1&limit=20')
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <Skeleton className="h-64 rounded-xl" />

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{data?.pagination?.total ?? 0} beneficiaries enrolled</p>
        <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> Enroll Beneficiary</Button>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="text-xs">Beneficiary ID</TableHead><TableHead className="text-xs">Name</TableHead>
            <TableHead className="text-xs">Phone</TableHead><TableHead className="text-xs">Settlement</TableHead>
            <TableHead className="text-xs">Enrolled By</TableHead><TableHead className="text-xs text-right">Wallet</TableHead>
            <TableHead className="text-xs text-right">Vouchers</TableHead><TableHead className="text-xs">Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {data?.beneficiaries?.length > 0 ? data.beneficiaries.map((b: any) => (
              <TableRow key={b.id}>
                <TableCell className="text-xs font-mono">{b.beneficiaryId}</TableCell>
                <TableCell className="text-xs font-medium">{b.fullName}</TableCell>
                <TableCell className="text-xs">{b.phone}</TableCell>
                <TableCell className="text-xs">{b.settlement}</TableCell>
                <TableCell className="text-xs">{b.enrolledBy === 'SWISS_CONTACT' ? 'Swiss Contact' : b.enrolledBy === 'CARE' ? 'CARE' : b.enrolledBy === 'SCI' ? 'SCI' : b.enrolledBy}</TableCell>
                <TableCell className="text-xs text-right"><MaskedAmount amount={b.walletBalance} /></TableCell>
                <TableCell className="text-xs text-right"><MaskedAmount amount={b.voucherBalance} /></TableCell>
                <TableCell><Badge className="bg-emerald-100 text-emerald-700">{b.status}</Badge></TableCell>
              </TableRow>
            )) : <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No beneficiaries enrolled yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>

      {showCreate && <EnrollBeneficiaryDialog onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); load() }} />}
    </div>
  )
}

function EnrollBeneficiaryDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ fullName: '', phone: '', nationalId: '', refugeeId: '', gender: 'MALE', settlement: 'Nakivale', village: '', enrolledBy: 'SWISS_CONTACT' })
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/reset/beneficiaries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (res.ok) { setResult(data) } else { toast.error(data.error || 'Failed to enroll') }
    } catch { toast.error('Network error') } finally { setSaving(false) }
  }

  if (result) {
    return (
      <Dialog open onOpenChange={onClose}><DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Beneficiary Enrolled!</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-sm font-medium">Beneficiary ID: {result.beneficiary.beneficiaryId}</p>
            <p className="text-sm">Name: {result.beneficiary.fullName}</p>
            <p className="text-sm">Settlement: {result.beneficiary.settlement}</p>
            <p className="text-2xl font-bold mt-2 tracking-widest">PIN: {result.pin}</p>
            <p className="text-xs text-muted-foreground">Share this PIN with the beneficiary for USSD access.</p>
          </div>
        </div>
        <DialogFooter><Button onClick={onSaved}>Done</Button></DialogFooter>
      </DialogContent></Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}><DialogContent className="max-w-md">
      <DialogHeader><DialogTitle>Enroll Beneficiary</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Full Name</Label><Input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></div>
        <div><Label>Phone</Label><Input placeholder="+256..." value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>National ID</Label><Input value={form.nationalId} onChange={e => setForm({ ...form, nationalId: e.target.value })} /></div>
          <div><Label>Refugee ID</Label><Input value={form.refugeeId} onChange={e => setForm({ ...form, refugeeId: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Gender</Label><Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MALE">Male</SelectItem><SelectItem value="FEMALE">Female</SelectItem><SelectItem value="OTHER">Other</SelectItem></SelectContent></Select></div>
          <div><Label>Settlement</Label><Select value={form.settlement} onValueChange={v => setForm({ ...form, settlement: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SETTLEMENTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div><Label>Enrolled By</Label><Select value={form.enrolledBy} onValueChange={v => setForm({ ...form, enrolledBy: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PARTNERS.map((p, i) => <SelectItem key={PARTNER_KEYS[i]} value={PARTNER_KEYS[i]}>{p}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <DialogFooter>
        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
        <Button onClick={handleSave} disabled={saving || !form.fullName || !form.phone}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Enroll</Button>
      </DialogFooter>
    </DialogContent></Dialog>
  )
}

function VouchersTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/reset/vouchers?page=1&limit=20')
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <Skeleton className="h-64 rounded-xl" />

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{data?.pagination?.total ?? 0} vouchers issued</p>
        <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> Issue Voucher</Button>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="text-xs">Voucher Code</TableHead><TableHead className="text-xs">Beneficiary</TableHead>
            <TableHead className="text-xs">Type</TableHead><TableHead className="text-xs text-right">Amount</TableHead>
            <TableHead className="text-xs">Issued By</TableHead><TableHead className="text-xs">Expiry</TableHead>
            <TableHead className="text-xs">Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {data?.vouchers?.length > 0 ? data.vouchers.map((v: any) => (
              <TableRow key={v.id}>
                <TableCell className="text-xs font-mono">{v.voucherCode}</TableCell>
                <TableCell className="text-xs">{v.beneficiary?.fullName}</TableCell>
                <TableCell className="text-xs">{v.type.charAt(0) + v.type.slice(1).toLowerCase()}</TableCell>
                <TableCell className="text-xs text-right"><MaskedAmount amount={v.amount} /></TableCell>
                <TableCell className="text-xs">{v.issuedBy === 'SWISS_CONTACT' ? 'Swiss Contact' : v.issuedBy === 'CARE' ? 'CARE' : v.issuedBy === 'SCI' ? 'SCI' : v.issuedBy}</TableCell>
                <TableCell className="text-xs">{formatDate(v.expiryDate)}</TableCell>
                <TableCell><Badge className={v.status === 'Issued' || v.status === 'ISSUED' ? 'bg-amber-100 text-amber-700' : v.status === 'Redeemed' || v.status === 'REDEEMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>{v.status.charAt(0) + v.status.slice(1).toLowerCase()}</Badge></TableCell>
              </TableRow>
            )) : <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No vouchers issued yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>

      {showCreate && <IssueVoucherDialog onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); load() }} />}
    </div>
  )
}

function IssueVoucherDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ beneficiaryId: '', type: 'ASSET', amount: '', issuedBy: 'SWISS_CONTACT', expiryDays: '90' })
  const [saving, setSaving] = useState(false)
  const [beneficiaries, setBeneficiaries] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/reset/beneficiaries?limit=100').then(r => r.json()).then(d => setBeneficiaries(d.beneficiaries || [])).catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/reset/vouchers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, amount: parseFloat(form.amount), expiryDays: parseInt(form.expiryDays) }) })
      if (res.ok) { toast.success('Voucher issued successfully'); onSaved() } else { const d = await res.json(); toast.error(d.error || 'Failed to issue voucher') }
    } catch { toast.error('Network error') } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={onClose}><DialogContent className="max-w-md">
      <DialogHeader><DialogTitle>Issue Voucher</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Beneficiary</Label><Select value={form.beneficiaryId} onValueChange={v => setForm({ ...form, beneficiaryId: v })}><SelectTrigger><SelectValue placeholder="Select beneficiary..." /></SelectTrigger><SelectContent>{beneficiaries.map(b => <SelectItem key={b.id} value={b.id}>{b.fullName} ({b.beneficiaryId})</SelectItem>)}</SelectContent></Select></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Type</Label><Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ASSET">Asset</SelectItem><SelectItem value="CASH">Cash</SelectItem><SelectItem value="FOOD">Food</SelectItem><SelectItem value="INPUT">Input</SelectItem></SelectContent></Select></div>
          <div><Label>Amount (UGX)</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Issued By</Label><Select value={form.issuedBy} onValueChange={v => setForm({ ...form, issuedBy: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PARTNERS.map((p, i) => <SelectItem key={PARTNER_KEYS[i]} value={PARTNER_KEYS[i]}>{p}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Expiry (Days)</Label><Input type="number" value={form.expiryDays} onChange={e => setForm({ ...form, expiryDays: e.target.value })} /></div>
        </div>
      </div>
      <DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button onClick={handleSave} disabled={saving || !form.beneficiaryId || !form.amount}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Issue Voucher</Button></DialogFooter>
    </DialogContent></Dialog>
  )
}

function MerchantsTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/reset/merchants?page=1&limit=20')
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <Skeleton className="h-64 rounded-xl" />

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{data?.pagination?.total ?? 0} merchants onboarded</p>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="text-xs">Code</TableHead><TableHead className="text-xs">Business Name</TableHead>
            <TableHead className="text-xs">Owner</TableHead><TableHead className="text-xs">Phone</TableHead>
            <TableHead className="text-xs">Settlement</TableHead><TableHead className="text-xs">Type</TableHead>
            <TableHead className="text-xs text-right">Pending Payout</TableHead><TableHead className="text-xs">Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {data?.merchants?.length > 0 ? data.merchants.map((m: any) => (
              <TableRow key={m.id}>
                <TableCell className="text-xs font-mono">{m.merchantCode}</TableCell>
                <TableCell className="text-xs font-medium">{m.businessName}</TableCell>
                <TableCell className="text-xs">{m.ownerName}</TableCell>
                <TableCell className="text-xs">{m.phone}</TableCell>
                <TableCell className="text-xs">{m.settlement}</TableCell>
                <TableCell className="text-xs">{m.businessType.charAt(0) + m.businessType.slice(1).toLowerCase()}</TableCell>
                <TableCell className="text-xs text-right"><MaskedAmount amount={m.payoutAmount} /></TableCell>
                <TableCell><Badge className={m.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>{m.status.charAt(0) + m.status.slice(1).toLowerCase()}</Badge></TableCell>
              </TableRow>
            )) : <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No merchants onboarded yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  )
}

function CashTab() {
  return (
    <Card><CardContent className="p-6 text-center">
      <DollarSign className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
      <p className="font-medium">Cash Disbursement</p>
      <p className="text-sm text-muted-foreground mt-1">Upload a CSV with beneficiary phones and amounts to send bulk MTN/Airtel MoMo payments.</p>
      <p className="text-sm text-muted-foreground mt-2">Feature ready — CSV upload and bulk disbursement API pending integration with MTN/Airtel merchant credentials.</p>
    </CardContent></Card>
  )
}

function ReportsTab() {
  return (
    <Card><CardContent className="p-6 text-center">
      <BarChart3 className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
      <p className="font-medium">Consortium Reports</p>
      <p className="text-sm text-muted-foreground mt-1">FCDO-format consolidated reports across all consortium partners.</p>
      <p className="text-sm text-muted-foreground mt-2">Reports will include: beneficiary demographics, voucher redemption rates, cash disbursement status, merchant performance, and settlement-level breakdowns.</p>
    </CardContent></Card>
  )
}

export default ResetView
