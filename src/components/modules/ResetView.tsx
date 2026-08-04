'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
import { Users, Receipt, Store, DollarSign, Target, BarChart3, Plus, CheckCircle, Loader2, Eye, EyeOff, Download, Filter, TrendingUp, FileText } from 'lucide-react'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, PieChart, Pie, LineChart, Line, Legend, ResponsiveContainer } from 'recharts'
import { exportToCSV } from '@/components/ui/empty-state'

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
  const [batches, setBatches] = useState<any[]>([])
  const [disbursements, setDisbursements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [selectedPartner, setSelectedPartner] = useState('CARE')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [batchRes, disbRes] = await Promise.all([
        fetch('/api/reset/cash/batch'),
        fetch('/api/reset/beneficiaries?limit=5'),
      ])
      if (batchRes.ok) {
        const batchData = await batchRes.json()
        setBatches(batchData.batches || [])
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('partner', selectedPartner)

      const res = await fetch('/api/reset/cash/batch', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (res.ok) {
        setUploadResult(data)
        toast.success(`Batch processed: ${data.summary.created} successful, ${data.summary.failed} failed`)
        load()
      } else {
        toast.error(data.error || 'Upload failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const downloadTemplate = () => {
    window.open('/api/reset/cash/template', '_blank')
  }

  if (loading) return <Skeleton className="h-64 rounded-xl" />

  return (
    <div className="space-y-4">
      {/* Upload Card */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4 text-purple-600" /> Bulk Cash Disbursement</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Instructions */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">How to upload:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-blue-700 dark:text-blue-300">
              <li>Download the CSV template below</li>
              <li>Fill in beneficiary ID, phone, amount, partner, and payment method</li>
              <li>Select the partner (CARE, SCI, or Swiss Contact)</li>
              <li>Upload the filled CSV — system creates disbursements + sends SMS</li>
              <li>Beneficiaries receive money via MTN MoMo or Airtel Money</li>
            </ol>
          </div>

          {/* Template download */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
              <Download className="w-3.5 h-3.5" /> Download CSV Template
            </Button>
            <span className="text-xs text-muted-foreground">Sample file with correct column headers</span>
          </div>

          {/* Partner selection */}
          <div className="flex items-center gap-3">
            <Label className="text-xs">Partner:</Label>
            <Select value={selectedPartner} onValueChange={setSelectedPartner}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PARTNER_KEYS.map((p, i) => <SelectItem key={p} value={p}>{PARTNERS[i]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* File upload */}
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {uploading ? 'Processing...' : 'Upload CSV'}
            </Button>
            <span className="text-xs text-muted-foreground">Max 10,000 rows per batch</span>
          </div>

          {/* Upload result */}
          {uploadResult && (
            <div className="p-4 rounded-lg border" style={{
              borderColor: uploadResult.summary.failed > 0 ? '#f59e0b' : '#10b981',
              background: uploadResult.summary.failed > 0 ? '#fffbeb' : '#ecfdf5',
            }}>
              <p className="text-sm font-medium mb-2">Batch: {uploadResult.batch.batchCode}</p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><span className="text-muted-foreground">Total:</span> <span className="font-bold">{uploadResult.summary.total}</span></div>
                <div><span className="text-muted-foreground">Created:</span> <span className="font-bold text-emerald-600">{uploadResult.summary.created}</span></div>
                <div><span className="text-muted-foreground">Failed:</span> <span className="font-bold text-red-600">{uploadResult.summary.failed}</span></div>
              </div>
              <div className="mt-2 text-sm">
                <span className="text-muted-foreground">Total Amount:</span> <MaskedAmount amount={uploadResult.summary.totalAmount} />
              </div>
              {uploadResult.errors?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-amber-700 mb-1">Errors ({uploadResult.errors.length}):</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {uploadResult.errors.slice(0, 20).map((e: any, i: number) => (
                      <p key={i} className="text-xs text-red-600">
                        {e.row ? `Row ${e.row}: ` : ''}{e.beneficiaryId ? `${e.beneficiaryId}: ` : ''}{e.error}
                      </p>
                    ))}
                    {uploadResult.errors.length > 20 && <p className="text-xs text-muted-foreground">...and {uploadResult.errors.length - 20} more</p>}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch History */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Batch History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Batch Code</TableHead>
              <TableHead className="text-xs">Partner</TableHead>
              <TableHead className="text-xs text-right">Beneficiaries</TableHead>
              <TableHead className="text-xs text-right">Total Amount</TableHead>
              <TableHead className="text-xs">Uploaded</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {batches.length > 0 ? batches.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell className="text-xs font-mono">{b.batchCode}</TableCell>
                  <TableCell className="text-xs">{b.partner === 'SWISS_CONTACT' ? 'Swiss Contact' : b.partner === 'CARE' ? 'CARE' : b.partner === 'SCI' ? 'SCI' : b.partner}</TableCell>
                  <TableCell className="text-xs text-right">{b.totalBeneficiaries}</TableCell>
                  <TableCell className="text-xs text-right"><MaskedAmount amount={b.totalAmount} /></TableCell>
                  <TableCell className="text-xs">{formatDate(b.uploadedAt)}</TableCell>
                  <TableCell><Badge className={b.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : b.status === 'PROCESSING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>{b.status.charAt(0) + b.status.slice(1).toLowerCase()}</Badge></TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">No batches yet. Upload a CSV to get started.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function ReportsTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ settlement: '', partner: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.settlement) params.set('settlement', filters.settlement)
    if (filters.partner) params.set('partner', filters.partner)
    const res = await fetch(`/api/reset/reports?${params.toString()}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [filters])

  useEffect(() => { load() }, [load])

  if (loading) return <Skeleton className="h-96 rounded-xl" />
  if (!data) return <Card><CardContent className="p-6 text-center text-muted-foreground">Failed to load report data</CardContent></Card>

  const m = data.unitMetrics
  const COLORS = ['#059669', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']
  const chartConfig: ChartConfig = {
    count: { label: 'Count', color: '#059669' },
    amount: { label: 'Amount (UGX)', color: '#3b82f6' },
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex items-end gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-medium"><Filter className="w-4 h-4" /> Filters:</div>
          <div>
            <Label className="text-xs">Settlement</Label>
            <Select value={filters.settlement} onValueChange={v => setFilters({ ...filters, settlement: v === 'ALL' ? '' : v })}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Settlements</SelectItem>
                {SETTLEMENTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Partner</Label>
            <Select value={filters.partner} onValueChange={v => setFilters({ ...filters, partner: v === 'ALL' ? '' : v })}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Partners</SelectItem>
                {PARTNER_KEYS.map((p, i) => <SelectItem key={p} value={p}>{PARTNERS[i]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => {
            const csvData = [
              { Metric: 'Total Beneficiaries', Value: m.totalBeneficiaries },
              { Metric: 'Total Households', Value: m.totalHouseholds },
              { Metric: 'Total Vouchers', Value: m.totalVouchers },
              { Metric: 'Total Voucher Amount', Value: m.totalVoucherAmount },
              { Metric: 'Redeemed Vouchers', Value: m.redeemedVouchers },
              { Metric: 'Redeemed Amount', Value: m.redeemedAmount },
              { Metric: 'Redemption Rate (%)', Value: m.redemptionRate },
              { Metric: 'Total Cash Disbursed', Value: m.totalCashDisbursed },
              { Metric: 'Total Cash Confirmed', Value: m.totalCashConfirmed },
              { Metric: 'Confirmation Rate (%)', Value: m.confirmationRate },
              { Metric: 'Total Merchants', Value: m.totalMerchants },
              { Metric: 'Approved Merchants', Value: m.approvedMerchants },
              { Metric: 'Pending Merchants', Value: m.pendingMerchants },
              { Metric: 'Pending Payouts', Value: m.totalPendingPayouts },
              { Metric: 'Total Agents', Value: m.totalAgents },
              { Metric: 'Avg Beneficiaries per Agent', Value: m.avgBeneficiariesPerAgent },
            ]
            exportToCSV(csvData, 'reset-consortium-report')
          }}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </CardContent>
      </Card>

      {/* Unit Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card><CardContent className="p-3 text-center">
          <Users className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
          <p className="text-lg font-bold">{m.totalBeneficiaries}</p>
          <p className="text-xs text-muted-foreground">Beneficiaries</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Users className="w-4 h-4 mx-auto text-blue-600 mb-1" />
          <p className="text-lg font-bold">{m.totalHouseholds}</p>
          <p className="text-xs text-muted-foreground">Households</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Receipt className="w-4 h-4 mx-auto text-amber-600 mb-1" />
          <p className="text-lg font-bold">{m.totalVouchers}</p>
          <p className="text-xs text-muted-foreground">Vouchers</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <TrendingUp className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
          <p className="text-lg font-bold">{m.redemptionRate}%</p>
          <p className="text-xs text-muted-foreground">Redemption Rate</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <DollarSign className="w-4 h-4 mx-auto text-purple-600 mb-1" />
          <p className="text-lg font-bold">{m.confirmationRate}%</p>
          <p className="text-xs text-muted-foreground">Cash Confirmed</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Store className="w-4 h-4 mx-auto text-cyan-600 mb-1" />
          <p className="text-lg font-bold">{m.totalMerchants}</p>
          <p className="text-xs text-muted-foreground">Merchants</p>
        </CardContent></Card>
      </div>

      {/* Charts Row 1: Beneficiaries by Settlement + by Partner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Beneficiaries by Settlement</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={data.demographics.bySettlement}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Beneficiaries by Partner</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <PieChart>
                <Pie data={data.demographics.byPartner.map((p: any) => ({ name: p.name === 'SWISS_CONTACT' ? 'Swiss Contact' : p.name, value: p.count }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(e: any) => `${e.name}: ${e.value}`}>
                  {data.demographics.byPartner.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Voucher Status + Voucher Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Voucher Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <PieChart>
                <Pie data={data.vouchers.byStatus.map((v: any) => ({ name: v.name.charAt(0) + v.name.slice(1).toLowerCase(), value: v.count, amount: v.amount }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(e: any) => `${e.name}: ${e.value}`}>
                  {data.vouchers.byStatus.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Vouchers by Type</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={data.vouchers.byType.map((v: any) => ({ name: v.name.charAt(0) + v.name.slice(1).toLowerCase(), count: v.count, amount: v.amount }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3: Cash by Status + Cash by Partner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Cash Disbursement by Status</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={data.cash.byStatus.map((c: any) => ({ name: c.name.charAt(0) + c.name.slice(1).toLowerCase(), count: c.count, amount: c.amount }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Cash by Partner</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <PieChart>
                <Pie data={data.cash.byPartner.map((c: any) => ({ name: c.name === 'SWISS_CONTACT' ? 'Swiss Contact' : c.name, value: c.count, amount: c.amount }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(e: any) => `${e.name}: ${e.value}`}>
                  {data.cash.byPartner.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 4: Merchants by Settlement + by Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Merchants by Settlement</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={data.merchants.bySettlement.map((m: any) => ({ name: m.name, count: m.count, payout: m.payout }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Merchants by Business Type</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <PieChart>
                <Pie data={data.merchants.byType.map((m: any) => ({ name: m.name.charAt(0) + m.name.slice(1).toLowerCase(), value: m.count }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(e: any) => `${e.name}: ${e.value}`}>
                  {data.merchants.byType.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance Table */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4 text-emerald-600" /> Field Agent Performance</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Agent</TableHead><TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Settlement</TableHead>
              <TableHead className="text-xs text-right">Beneficiaries Enrolled</TableHead>
              <TableHead className="text-xs text-right">Merchants Onboarded</TableHead>
              <TableHead className="text-xs text-right">Vouchers Distributed</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data.agents.length > 0 ? data.agents.map((a: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-medium">{a.fullName}</TableCell>
                  <TableCell className="text-xs">{a.agentType === 'SWISS_CONTACT' ? 'Swiss Contact' : a.agentType === 'MOBIPAY' ? 'MobiPay' : 'E-Teller'}</TableCell>
                  <TableCell className="text-xs">{a.settlement}</TableCell>
                  <TableCell className="text-xs text-right font-bold">{a.beneficiariesEnrolled}</TableCell>
                  <TableCell className="text-xs text-right">{a.merchantsOnboarded}</TableCell>
                  <TableCell className="text-xs text-right">{a.vouchersDistributed}</TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={6} className="text-center py-4 text-muted-foreground text-sm">No agent data</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed Metrics Table with Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-600" /> Unit Metrics Summary
            <Button variant="outline" size="sm" className="ml-auto gap-2 text-xs" onClick={() => {
              const csvData = [
                { Metric: 'Total Beneficiaries', Value: m.totalBeneficiaries },
                { Metric: 'Total Households', Value: m.totalHouseholds },
                { Metric: 'Total Vouchers Issued', Value: m.totalVouchers },
                { Metric: 'Total Voucher Amount (UGX)', Value: m.totalVoucherAmount },
                { Metric: 'Vouchers Redeemed', Value: m.redeemedVouchers },
                { Metric: 'Redeemed Amount (UGX)', Value: m.redeemedAmount },
                { Metric: 'Redemption Rate (%)', Value: m.redemptionRate },
                { Metric: 'Total Cash Disbursed (UGX)', Value: m.totalCashDisbursed },
                { Metric: 'Total Cash Confirmed (UGX)', Value: m.totalCashConfirmed },
                { Metric: 'Cash Confirmation Rate (%)', Value: m.confirmationRate },
                { Metric: 'Total Merchants', Value: m.totalMerchants },
                { Metric: 'Approved Merchants', Value: m.approvedMerchants },
                { Metric: 'Pending Merchants', Value: m.pendingMerchants },
                { Metric: 'Pending Merchant Payouts (UGX)', Value: m.totalPendingPayouts },
                { Metric: 'Total Field Agents', Value: m.totalAgents },
                { Metric: 'Avg Beneficiaries per Agent', Value: m.avgBeneficiariesPerAgent },
              ]
              exportToCSV(csvData, 'reset-unit-metrics')
            }}>
              <Download className="w-3 h-3" /> Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Metric</TableHead>
              <TableHead className="text-xs text-right">Value</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              <TableRow><TableCell className="text-xs">Total Beneficiaries</TableCell><TableCell className="text-xs text-right font-bold">{m.totalBeneficiaries}</TableCell></TableRow>
              <TableRow><TableCell className="text-xs">Total Households</TableCell><TableCell className="text-xs text-right font-bold">{m.totalHouseholds}</TableCell></TableRow>
              <TableRow><TableCell className="text-xs">Total Vouchers Issued</TableCell><TableCell className="text-xs text-right font-bold">{m.totalVouchers}</TableCell></TableRow>
              <TableRow><TableCell className="text-xs">Total Voucher Amount</TableCell><TableCell className="text-xs text-right"><MaskedAmount amount={m.totalVoucherAmount} /></TableCell></TableRow>
              <TableRow><TableCell className="text-xs">Vouchers Redeemed</TableCell><TableCell className="text-xs text-right font-bold">{m.redeemedVouchers}</TableCell></TableRow>
              <TableRow><TableCell className="text-xs">Redeemed Amount</TableCell><TableCell className="text-xs text-right"><MaskedAmount amount={m.redeemedAmount} /></TableCell></TableRow>
              <TableRow><TableCell className="text-xs">Redemption Rate</TableCell><TableCell className="text-xs text-right font-bold text-emerald-600">{m.redemptionRate}%</TableCell></TableRow>
              <TableRow><TableCell className="text-xs">Total Cash Disbursed</TableCell><TableCell className="text-xs text-right"><MaskedAmount amount={m.totalCashDisbursed} /></TableCell></TableRow>
              <TableRow><TableCell className="text-xs">Total Cash Confirmed</TableCell><TableCell className="text-xs text-right"><MaskedAmount amount={m.totalCashConfirmed} /></TableCell></TableRow>
              <TableRow><TableCell className="text-xs">Cash Confirmation Rate</TableCell><TableCell className="text-xs text-right font-bold text-purple-600">{m.confirmationRate}%</TableCell></TableRow>
              <TableRow><TableCell className="text-xs">Total Merchants</TableCell><TableCell className="text-xs text-right font-bold">{m.totalMerchants}</TableCell></TableRow>
              <TableRow><TableCell className="text-xs">Approved Merchants</TableCell><TableCell className="text-xs text-right font-bold text-emerald-600">{m.approvedMerchants}</TableCell></TableRow>
              <TableRow><TableCell className="text-xs">Pending Merchants</TableCell><TableCell className="text-xs text-right font-bold text-amber-600">{m.pendingMerchants}</TableCell></TableRow>
              <TableRow><TableCell className="text-xs">Pending Merchant Payouts</TableCell><TableCell className="text-xs text-right"><MaskedAmount amount={m.totalPendingPayouts} /></TableCell></TableRow>
              <TableRow><TableCell className="text-xs">Total Field Agents</TableCell><TableCell className="text-xs text-right font-bold">{m.totalAgents}</TableCell></TableRow>
              <TableRow><TableCell className="text-xs">Avg Beneficiaries per Agent</TableCell><TableCell className="text-xs text-right font-bold">{m.avgBeneficiariesPerAgent}</TableCell></TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default ResetView
