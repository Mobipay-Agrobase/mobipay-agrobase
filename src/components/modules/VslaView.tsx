'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { safeFetch, extractArray } from '@/lib/safe-fetch'
import {
  PiggyBank, Users, DollarSign, Calendar, CheckCircle, Clock, XCircle,
  Plus, Eye, EyeOff, ChevronLeft, ChevronRight, Search, Filter, X, Loader2,
  AlertCircle, TrendingUp, CircleDollarSign, Save, Trash2, Pencil, Download,
  Shield, Handshake, PiggyBankIcon
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, PieChart, Pie } from 'recharts'
import { exportToCSV } from '@/components/ui/empty-state'

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#f59e0b']

const loanStatusColor: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  SYSTEM_APPROVED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  KEYHOLDER_APPROVED: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  DISBURSED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  REPAID: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

// Amount masking component
function MaskedAmount({ amount, role }: { amount: number; role?: string }) {
  const [revealed, setRevealed] = useState(false)
  const showByDefault = role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN' || role === 'MOBIPAY_FINANCE'
  const visible = revealed || showByDefault
  return (
    <span className="inline-flex items-center gap-1">
      <span className={visible ? '' : 'filter blur-sm select-none'}>
        {visible ? `UGX ${(amount || 0).toLocaleString()}` : 'UGX ••••••'}
      </span>
      {!showByDefault && (
        <button onClick={() => setRevealed(!revealed)} className="text-muted-foreground hover:text-foreground">
          {revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        </button>
      )}
    </span>
  )
}

export default function VslaView() {
  const { activeSubTab, setActiveSubTab } = useAppStore()
  const [groups, setGroups] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loans, setLoans] = useState<any[]>([])
  const [meetings, setMeetings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(activeSubTab || 'groups')
  const [showCreate, setShowCreate] = useState<string | null>(null)
  const [editing, setEditing] = useState<any | null>(null)

  const fetchGroups = useCallback(async () => {
    const data = await safeFetch('/api/vsla-v2/groups')
    if (data) setGroups(extractArray(data, 'groups', 'data'))
  }, [])

  const fetchMembers = useCallback(async () => {
    const data = await safeFetch('/api/vsla-v2/members')
    if (data) setMembers(extractArray(data, 'members', 'data'))
  }, [])

  const fetchLoans = useCallback(async () => {
    // V2 doesn't have a dedicated loans list endpoint yet — derive from groups
    // For now, we'll fetch loans via a simple query
    const data = await safeFetch('/api/vsla-v2/groups')
    if (data && data.groups) {
      // We could add a /api/vsla-v2/loans endpoint, but for now use the group data
      setLoans([])
    }
  }, [])

  const fetchMeetings = useCallback(async () => {
    // Meetings are part of V2 — would need a list endpoint
    setMeetings([])
  }, [])

  const loadTab = useCallback((tab: string) => {
    setActiveTab(tab)
    setActiveSubTab(tab)
  }, [setActiveSubTab])

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchGroups(), fetchMembers(), fetchLoans(), fetchMeetings()])
  }, [fetchGroups, fetchMembers, fetchLoans, fetchMeetings])

  useEffect(() => {
    refreshAll().finally(() => setLoading(false))
  }, [refreshAll])

  if (loading) return <VslaSkeleton />

  const totalSavings = members.reduce((s: number, v: any) => s + (v.totalSavings || 0), 0)
  const totalCashbox = groups.reduce((s: number, g: any) => s + (g.cashboxBalance || 0), 0)
  const totalMembers = groups.reduce((s: number, g: any) => s + (g._count?.members || 0), 0)
  const totalKeyHolders = groups.reduce((s: number, g: any) => s + (g._count?.keyHolders || 0), 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center"><PiggyBank className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-xs text-muted-foreground">VSLA Groups</p><p className="text-xl font-bold">{groups.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-xs text-muted-foreground">Total Members</p><p className="text-xl font-bold">{totalMembers}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center"><CircleDollarSign className="w-5 h-5 text-amber-600" /></div>
          <div><p className="text-xs text-muted-foreground">Total Savings</p><p className="text-lg font-bold"><MaskedAmount amount={totalSavings} /></p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center"><Shield className="w-5 h-5 text-purple-600" /></div>
          <div><p className="text-xs text-muted-foreground">Key Holders</p><p className="text-xl font-bold">{totalKeyHolders}</p></div>
        </CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={loadTab}>
        <div className="flex items-center justify-between">
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="loans">Loans</TabsTrigger>
            <TabsTrigger value="cashbox">Cashbox</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
          </TabsList>
          {activeTab === 'groups' && <Button onClick={() => { setEditing(null); setShowCreate('group') }} className="gap-2"><Plus className="w-4 h-4" /> New Group</Button>}
          {activeTab === 'members' && <Button onClick={() => { setEditing(null); setShowCreate('member') }} className="gap-2"><Plus className="w-4 h-4" /> Register Member</Button>}
          {activeTab === 'loans' && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => exportToCSV(loans, 'vsla-loans')} disabled={loans.length === 0} className="gap-2">
                <Download className="w-4 h-4" /> Export CSV
              </Button>
              <Button onClick={() => { setEditing(null); setShowCreate('loan') }} className="gap-2"><Plus className="w-4 h-4" /> Apply for Loan</Button>
            </div>
          )}
          {activeTab === 'cashbox' && <Button onClick={() => { setEditing(null); setShowCreate('cashbox') }} className="gap-2"><Plus className="w-4 h-4" /> Record Entry</Button>}
          {activeTab === 'meetings' && <Button onClick={() => { setEditing(null); setShowCreate('meeting') }} className="gap-2"><Plus className="w-4 h-4" /> Schedule Meeting</Button>}
        </div>

        {/* GROUPS TAB */}
        <TabsContent value="groups" className="mt-4">
          {groups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <PiggyBank className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No VSLA groups yet</p>
              <p className="text-sm mt-1">Click "New Group" to create the first one</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {groups.map((g: any) => (
                <Card key={g.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-sm">{g.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{g._count?.members || 0} members · {g._count?.keyHolders || 0} key holders</p>
                      </div>
                      <Badge className={g.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-600'}>{g.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><p className="text-muted-foreground">Share Price</p><p className="font-semibold">UGX {g.sharePrice?.toLocaleString()}</p></div>
                      <div><p className="text-muted-foreground">Loan Multiplier</p><p className="font-semibold">{g.loanMultiplier}×</p></div>
                      <div><p className="text-muted-foreground">Welfare</p><p className="font-semibold">UGX {g.welfareContribution?.toLocaleString()}</p></div>
                      <div><p className="text-muted-foreground">Cashbox</p><p className="font-semibold"><MaskedAmount amount={g.cashboxBalance} /></p></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* MEMBERS TAB */}
        <TabsContent value="members" className="mt-4">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Member ID</TableHead><TableHead>Name</TableHead><TableHead>Phone</TableHead>
                <TableHead>Group</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Savings</TableHead>
                <TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No members registered yet</TableCell></TableRow>
                ) : members.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs">{m.memberId}</TableCell>
                    <TableCell className="font-medium">{m.fullName}</TableCell>
                    <TableCell>{m.phone}</TableCell>
                    <TableCell>{m.group?.name || '—'}</TableCell>
                    <TableCell className="text-right">{m.totalShares}</TableCell>
                    <TableCell className="text-right"><MaskedAmount amount={m.totalSavings} /></TableCell>
                    <TableCell><Badge className={m.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>{m.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* LOANS TAB */}
        <TabsContent value="loans" className="mt-4">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Member</TableHead><TableHead>Amount</TableHead><TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead><TableHead>Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loans.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No loans yet</TableCell></TableRow>
                ) : loans.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.member?.fullName || '—'}</TableCell>
                    <TableCell><MaskedAmount amount={l.amount} /></TableCell>
                    <TableCell className="max-w-xs truncate">{l.purpose}</TableCell>
                    <TableCell><Badge className={loanStatusColor[l.status] || 'bg-gray-100'}>{l.status.replace(/_/g, ' ')}</Badge></TableCell>
                    <TableCell>{l.status === 'SYSTEM_APPROVED' && <span className="text-xs text-amber-600">Pending key holder approval</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* CASHBOX TAB */}
        <TabsContent value="cashbox" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-emerald-600" /> Group Cashbox
              </CardTitle>
              <CardDescription>Record savings, loans, welfare, and fines — updates the group cashbox balance</CardDescription>
            </CardHeader>
            <CardContent>
              {groups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Create a group first to manage the cashbox</div>
              ) : (
                <div className="space-y-4">
                  {groups.map((g: any) => (
                    <div key={g.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{g.name}</div>
                        <div className="text-sm text-muted-foreground">{g._count?.members || 0} members</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Cashbox Balance</div>
                        <div className="text-lg font-bold"><MaskedAmount amount={g.cashboxBalance} /></div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => { setEditing({ groupId: g.id, groupName: g.name }); setShowCreate('cashbox') }}>
                        Record Entry
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* MEETINGS TAB */}
        <TabsContent value="meetings" className="mt-4">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Meeting</TableHead><TableHead>Date</TableHead><TableHead>Location</TableHead>
                <TableHead>Attendance</TableHead><TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {meetings.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No meetings scheduled</TableCell></TableRow>
                ) : meetings.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.title}</TableCell>
                    <TableCell>{new Date(m.meetingDate).toLocaleDateString()}</TableCell>
                    <TableCell>{m.location || '—'}</TableCell>
                    <TableCell>{m.attendanceCount}/{m.totalMembers}</TableCell>
                    <TableCell><Badge className={m.status === 'CONCLUDED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>{m.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* CREATE DIALOGS */}
      {showCreate === 'group' && <CreateGroupDialog editing={editing} onClose={() => setShowCreate(null)} onSaved={() => { setShowCreate(null); refreshAll() }} />}
      {showCreate === 'member' && <RegisterMemberDialog groups={groups} onClose={() => setShowCreate(null)} onSaved={() => { setShowCreate(null); refreshAll() }} />}
      {showCreate === 'loan' && <ApplyLoanDialog groups={groups} members={members} onClose={() => setShowCreate(null)} onSaved={() => { setShowCreate(null); refreshAll() }} />}
      {showCreate === 'cashbox' && <CashboxEntryDialog group={editing} onClose={() => setShowCreate(null)} onSaved={() => { setShowCreate(null); refreshAll() }} />}
    </div>
  )
}

// ─── Create Group Dialog ───
function CreateGroupDialog({ editing, onClose, onSaved }: { editing: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(editing || {
    name: '', district: '', region: '', sharePrice: 5000, loanMultiplier: 3,
    welfareContribution: 1000, lateAttendanceFine: 500, absenceFine: 2000, cycleLengthDays: 365,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/vsla-v2/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Group created successfully')
        onSaved()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to create group')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{editing ? 'Edit Group' : 'New VSLA Group'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Group Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>District</Label><Input value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} /></div>
            <div><Label>Region</Label><Input value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Share Price (UGX)</Label><Input type="number" value={form.sharePrice} onChange={e => setForm({ ...form, sharePrice: +e.target.value })} /></div>
            <div><Label>Loan Multiplier</Label><Input type="number" value={form.loanMultiplier} onChange={e => setForm({ ...form, loanMultiplier: +e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Welfare Contribution</Label><Input type="number" value={form.welfareContribution} onChange={e => setForm({ ...form, welfareContribution: +e.target.value })} /></div>
            <div><Label>Late Attendance Fine</Label><Input type="number" value={form.lateAttendanceFine} onChange={e => setForm({ ...form, lateAttendanceFine: +e.target.value })} /></div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSave} disabled={saving || !form.name}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Register Member Dialog ───
function RegisterMemberDialog({ groups, onClose, onSaved }: { groups: any[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ groupId: '', fullName: '', phone: '', nationalId: '', gender: 'MALE' })
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/vsla-v2/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setResult(data)
      } else {
        toast.error(data.error || 'Failed to register member')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  if (result) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Member Registered!</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-1">Member ID: {result.member?.memberId}</p>
              <p className="text-sm text-amber-800 dark:text-amber-200">PIN: <span className="font-bold text-lg tracking-widest">{result.pin}</span></p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Welcome SMS sent to {result.member?.phone}</p>
            </div>
            <p className="text-xs text-muted-foreground">Share the member ID and PIN with the member. They'll use these to log in via the mobile app or USSD.</p>
          </div>
          <DialogFooter>
            <Button onClick={onSaved}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Register Member</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Group</Label>
            <Select value={form.groupId} onValueChange={v => setForm({ ...form, groupId: v })}>
              <SelectTrigger><SelectValue placeholder="Select group..." /></SelectTrigger>
              <SelectContent>{groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Full Name</Label><Input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></div>
          <div><Label>Phone</Label><Input placeholder="+256..." value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>National ID</Label><Input value={form.nationalId} onChange={e => setForm({ ...form, nationalId: e.target.value })} /></div>
          <div>
            <Label>Gender</Label>
            <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSave} disabled={saving || !form.groupId || !form.fullName || !form.phone}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Register & Send SMS</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Apply Loan Dialog ───
function ApplyLoanDialog({ groups, members, onClose, onSaved }: { groups: any[]; members: any[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ groupId: '', memberId: '', amount: '', purpose: '', termDays: 90 })
  const [saving, setSaving] = useState(false)
  const [eligibility, setEligibility] = useState<any>(null)

  const checkEligibility = async () => {
    try {
      const res = await fetch('/api/vsla-v2/loan/eligibility-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: form.groupId, memberId: form.memberId, amount: parseFloat(form.amount) }),
      })
      const data = await res.json()
      setEligibility(data)
    } catch {
      toast.error('Failed to check eligibility')
    }
  }

  const handleApply = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/vsla-v2/loan/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Loan application submitted — ${data.keyHolderCount} key holders notified`)
        onSaved()
      } else {
        toast.error(data.error || data.reason || 'Failed to apply')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Apply for Loan</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Group</Label>
            <Select value={form.groupId} onValueChange={v => setForm({ ...form, groupId: v })}>
              <SelectTrigger><SelectValue placeholder="Select group..." /></SelectTrigger>
              <SelectContent>{groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Member</Label>
            <Select value={form.memberId} onValueChange={v => setForm({ ...form, memberId: v })}>
              <SelectTrigger><SelectValue placeholder="Select member..." /></SelectTrigger>
              <SelectContent>{members.filter(m => !form.groupId || m.groupId === form.groupId).map(m => <SelectItem key={m.id} value={m.id}>{m.fullName} ({m.memberId})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Amount (UGX)</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
          <div><Label>Purpose</Label><Textarea value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} /></div>
          <Button variant="outline" size="sm" onClick={checkEligibility} disabled={!form.groupId || !form.memberId || !form.amount}>Check Eligibility</Button>
          {eligibility && (
            <div className={eligibility.eligible ? 'p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg' : 'p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg'}>
              {eligibility.checks?.map((c: any) => (
                <div key={c.check} className="flex items-center gap-2 text-sm">
                  {c.passed ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-red-600" />}
                  <span>{c.check.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleApply} disabled={saving || !form.groupId || !form.memberId || !form.amount || !form.purpose}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Cashbox Entry Dialog ───
function CashboxEntryDialog({ group, onClose, onSaved }: { group: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ type: 'SAVING_IN', amount: '', memberId: '', description: '', recordedByName: 'Admin' })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/vsla-v2/cashbox/${group.groupId}/entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Entry recorded — new cashbox balance: UGX ${data.cashboxBalance?.toLocaleString()}`)
        onSaved()
      } else {
        toast.error(data.error || 'Failed to record entry')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const entryTypes = [
    { value: 'SAVING_IN', label: 'Saving Deposit' },
    { value: 'LOAN_OUT', label: 'Loan Disbursement' },
    { value: 'LOAN_REPAY_IN', label: 'Loan Repayment' },
    { value: 'WELFARE_IN', label: 'Welfare Contribution' },
    { value: 'FINE_IN', label: 'Fine Payment' },
    { value: 'WELFARE_OUT', label: 'Welfare Claim' },
  ]

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Cashbox Entry — {group?.groupName}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Transaction Type</Label>
            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{entryTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Amount (UGX)</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
          <div><Label>Member ID (optional)</Label><Input value={form.memberId} onChange={e => setForm({ ...form, memberId: e.target.value })} /></div>
          <div><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSave} disabled={saving || !form.amount}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Record</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Skeleton ───
function VslaSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <Skeleton className="h-10 rounded-lg" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}
