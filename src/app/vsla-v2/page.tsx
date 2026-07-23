'use client'

import { useState, useEffect } from 'react'
import {
  Users, Shield, Landmark, Wallet, TrendingUp, Calendar,
  RefreshCw, Plus, Check, X, Eye, EyeOff, Phone, MessageSquare,
  DollarSign, PiggyBank, Award, AlertCircle, ChevronRight
} from 'lucide-react'

// ─── Types ───
type Tab = 'dashboard' | 'groups' | 'members' | 'loans' | 'cycles' | 'cashbox'

// ─── API Helper ───
async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!!path)
  const [error, setError] = useState<string | null>(null)

  const refetch = async () => {
    if (!path) return
    setLoading(true)
    try {
      const result = await api(path)
      setData(result)
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refetch() }, [path])
  return { data, loading, error, refetch }
}

// ─── Formatters ───
function formatUGX(n: number | null | undefined) {
  if (!n) return 'UGX 0'
  return `UGX ${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function formatDate(d: string | Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function statusColor(s: string) {
  const positive = ['ACTIVE', 'COMPLETED', 'SUCCESS', 'SENT', 'DELIVERED', 'REPAID', 'PAID', 'ARCHIVED', 'SYSTEM_APPROVED', 'KEYHOLDER_APPROVED', 'DISBURSED']
  const pending = ['PENDING', 'SCHEDULED', 'PENDING_APPROVAL']
  const negative = ['FAILED', 'REJECTED', 'OVERDUE', 'DEFAULTED', 'CLOSED', 'REJECTED', 'EXITED', 'SUSPENDED']
  if (positive.includes(s?.toUpperCase())) return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  if (pending.includes(s?.toUpperCase())) return 'bg-amber-100 text-amber-800 border-amber-200'
  if (negative.includes(s?.toUpperCase())) return 'bg-red-100 text-red-800 border-red-200'
  return 'bg-slate-100 text-slate-700 border-slate-200'
}

function Badge({ status, children }: { status?: string; children: React.ReactNode }) {
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(status || (typeof children === 'string' ? children : ''))}`}>{children}</span>
}

// ─── Amount Masking (SRS: mask sensitive financial data) ───
function MaskedAmount({ amount, role }: { amount: number; role?: string }) {
  const [revealed, setRevealed] = useState(false)
  // Finance roles see amounts by default; others see masked
  const showByDefault = role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN' || role === 'MOBIPAY_FINANCE'
  const visible = revealed || showByDefault

  return (
    <span className="inline-flex items-center gap-1">
      <span className={visible ? '' : 'filter blur-sm select-none'}>
        {visible ? formatUGX(amount) : 'UGX ••••••'}
      </span>
      {!showByDefault && (
        <button onClick={() => setRevealed(!revealed)} className="text-slate-400 hover:text-slate-600">
          {revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        </button>
      )}
    </span>
  )
}

// ─── Main Page ───
export default function VslaV2Page() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  const tabs: Array<{ key: Tab; label: string; icon: any }> = [
    { key: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { key: 'groups', label: 'Groups', icon: Users },
    { key: 'members', label: 'Members', icon: Shield },
    { key: 'loans', label: 'Loans', icon: Wallet },
    { key: 'cycles', label: 'Cycles', icon: Calendar },
    { key: 'cashbox', label: 'Cashbox', icon: PiggyBank },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-emerald-700 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold">V2</div>
          <div>
            <h1 className="text-lg font-semibold">VSLA V2 — SRS Compliant</h1>
            <p className="text-xs text-emerald-100">Key holders · Unanimous approval · E-Teller · SMS OTP · Cycle freeze</p>
          </div>
        </div>
        <div className="text-xs text-emerald-100">MobiPay Agrobase · Multi-tenant</div>
      </header>

      <div className="flex border-b border-slate-200 bg-white px-6">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                tab === t.key ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          )
        })}
      </div>

      <main className="p-6 max-w-7xl mx-auto">
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'groups' && <GroupsTab selectedGroup={selectedGroup} setSelectedGroup={setSelectedGroup} />}
        {tab === 'members' && <MembersTab />}
        {tab === 'loans' && <LoansTab />}
        {tab === 'cycles' && <CyclesTab />}
        {tab === 'cashbox' && <CashboxTab />}
      </main>
    </div>
  )
}

// ─── Dashboard Tab ───
function DashboardTab() {
  const { data, loading } = useApi<{
    groups: any[]
  }>('/api/vsla-v2/groups')

  if (loading) return <div className="text-center py-12"><RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto" /></div>
  if (!data) return null

  const groups = data.groups || []
  const totalMembers = groups.reduce((s, g) => s + (g._count?.members ?? 0), 0)
  const totalKeyHolders = groups.reduce((s, g) => s + (g._count?.keyHolders ?? 0), 0)
  const totalCashbox = groups.reduce((s, g) => s + (g.cashboxBalance ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center"><Users className="w-5 h-5" /></div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{groups.length}</div>
              <div className="text-xs text-slate-500">VSLA Groups</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center"><Shield className="w-5 h-5" /></div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{totalKeyHolders}</div>
              <div className="text-xs text-slate-500">Key Holders</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center"><Users className="w-5 h-5" /></div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{totalMembers}</div>
              <div className="text-xs text-slate-500">Members</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center"><PiggyBank className="w-5 h-5" /></div>
            <div>
              <div className="text-2xl font-bold text-slate-900"><MaskedAmount amount={totalCashbox} /></div>
              <div className="text-xs text-slate-500">Total Cashbox</div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="px-5 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900 text-sm">Groups Overview</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {groups.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p>No VSLA V2 groups yet. Create one in the Groups tab.</p>
            </div>
          ) : (
            groups.map(g => (
              <div key={g.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <div className="font-medium text-slate-900">{g.name}</div>
                  <div className="text-xs text-slate-500">{g.code} · {g.district || '—'}</div>
                </div>
                <div className="flex items-center gap-6 text-xs">
                  <div className="text-center"><div className="font-bold text-slate-900">{g._count?.members ?? 0}</div><div className="text-slate-500">Members</div></div>
                  <div className="text-center"><div className="font-bold text-slate-900">{g._count?.keyHolders ?? 0}</div><div className="text-slate-500">Key Holders</div></div>
                  <div className="text-center"><div className="font-bold text-slate-900">{g._count?.loans ?? 0}</div><div className="text-slate-500">Loans</div></div>
                  <div><MaskedAmount amount={g.cashboxBalance} /></div>
                  <Badge status={g.status}>{g.status}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 text-sm mb-3">SRS V2 Compliance Checklist</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {[
            { label: '3 roles (MobiPay Admin, Company Admin, Key Holder, Member)', done: true },
            { label: 'Key holders 3-6 per group with unanimous approval', done: true },
            { label: 'Auto-eligibility check before human approval', done: true },
            { label: 'SMS OTP for member login', done: true },
            { label: 'E-Teller role (any member can record transactions)', done: true },
            { label: 'LOAN FREEZE 30 days before cycle end', done: true },
            { label: 'Cycle close = archive, no further edits', done: true },
            { label: 'Group cashbox concept', done: true },
            { label: 'Welcome SMS with PIN on registration', done: true },
            { label: 'Member KYC (photo + ID capture)', done: false },
            { label: 'USSD member access', done: false },
            { label: 'Amount masking on list/detail pages', done: true },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              {item.done ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
              <span className={item.done ? 'text-slate-700' : 'text-slate-400'}>{item.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── Groups Tab ───
function GroupsTab({ selectedGroup, setSelectedGroup }: { selectedGroup: string | null; setSelectedGroup: (id: string | null) => void }) {
  const { data, loading, refetch } = useApi<{ groups: any[] }>('/api/vsla-v2/groups')
  const [showCreate, setShowCreate] = useState(false)

  if (loading) return <Loading />
  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-600">{data.groups.length} VSLA V2 groups — each with key holders, cashbox, and cycle management</p>
        <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New Group
        </button>
      </div>

      {showCreate && <CreateGroupForm onClose={() => setShowCreate(false)} onCreated={() => { refetch(); setShowCreate(false) }} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.groups.map(g => (
          <Card key={g.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-slate-900">{g.name}</div>
                <div className="text-xs text-slate-500">{g.code} · {g.district || '—'}</div>
              </div>
              <Badge status={g.status}>{g.status}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div><div className="text-slate-500">Members</div><div className="font-semibold">{g._count?.members ?? 0}</div></div>
              <div><div className="text-slate-500">Key Holders</div><div className="font-semibold">{g._count?.keyHolders ?? 0}</div></div>
              <div><div className="text-slate-500">Loans</div><div className="font-semibold">{g._count?.loans ?? 0}</div></div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs">
              <span className="text-slate-500">Share Price: <span className="font-semibold">{formatUGX(g.sharePrice)}</span></span>
              <span className="text-slate-500">Multiplier: <span className="font-semibold">{g.loanMultiplier}×</span></span>
            </div>
            <div className="mt-2 text-xs">
              <span className="text-slate-500">Cashbox: </span>
              <MaskedAmount amount={g.cashboxBalance} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function CreateGroupForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '', region: '', district: '',
    sharePrice: 5000, loanMultiplier: 3, welfareContribution: 1000,
    lateAttendanceFine: 500, absenceFine: 2000, cycleLengthDays: 365,
    minKeyHolders: 3, maxKeyHolders: 6,
  })
  const [saving, setSaving] = useState(false)

  async function submit() {
    setSaving(true)
    try {
      await api('/api/vsla-v2/groups', { method: 'POST', body: JSON.stringify(form) })
      onCreated()
    } catch (e: any) {
      alert(`Failed: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="p-5 mb-4">
      <h3 className="font-semibold text-slate-900 mb-3">Create VSLA V2 Group</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <input className="px-3 py-2 border rounded-md" placeholder="Group name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input className="px-3 py-2 border rounded-md" placeholder="District" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} />
        <input type="number" className="px-3 py-2 border rounded-md" placeholder="Share price" value={form.sharePrice} onChange={e => setForm({ ...form, sharePrice: +e.target.value })} />
        <input type="number" className="px-3 py-2 border rounded-md" placeholder="Loan multiplier" value={form.loanMultiplier} onChange={e => setForm({ ...form, loanMultiplier: +e.target.value })} />
        <input type="number" className="px-3 py-2 border rounded-md" placeholder="Welfare contribution" value={form.welfareContribution} onChange={e => setForm({ ...form, welfareContribution: +e.target.value })} />
        <input type="number" className="px-3 py-2 border rounded-md" placeholder="Late fine" value={form.lateAttendanceFine} onChange={e => setForm({ ...form, lateAttendanceFine: +e.target.value })} />
        <input type="number" className="px-3 py-2 border rounded-md" placeholder="Absence fine" value={form.absenceFine} onChange={e => setForm({ ...form, absenceFine: +e.target.value })} />
        <input type="number" className="px-3 py-2 border rounded-md" placeholder="Cycle length (days)" value={form.cycleLengthDays} onChange={e => setForm({ ...form, cycleLengthDays: +e.target.value })} />
      </div>
      <div className="mt-3 flex gap-2 justify-end">
        <button onClick={onClose} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md">Cancel</button>
        <button onClick={submit} disabled={saving || !form.name} className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50">
          {saving ? 'Creating...' : 'Create Group'}
        </button>
      </div>
    </Card>
  )
}

// ─── Members Tab ───
function MembersTab() {
  const { data, loading, refetch } = useApi<{ members: any[] }>('/api/vsla-v2/members')
  const [showRegister, setShowRegister] = useState(false)

  if (loading) return <Loading />
  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-600">{data.members.length} members — SMS OTP login, welcome SMS with PIN</p>
        <button onClick={() => setShowRegister(true)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Register Member
        </button>
      </div>

      {showRegister && <RegisterMemberForm onClose={() => setShowRegister(false)} onCreated={() => { refetch(); setShowRegister(false) }} />}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Member ID</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Phone</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Group</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Shares</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Savings</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.members.map(m => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-mono text-xs">{m.memberId}</td>
                  <td className="px-4 py-2 font-medium text-slate-900">{m.fullName}</td>
                  <td className="px-4 py-2 text-slate-600"><span className="flex items-center gap-1"><Phone className="w-3 h-3" />{m.phone}</span></td>
                  <td className="px-4 py-2 text-slate-600">{m.group?.name || '—'}</td>
                  <td className="px-4 py-2 text-right">{m.totalShares}</td>
                  <td className="px-4 py-2 text-right"><MaskedAmount amount={m.totalSavings} /></td>
                  <td className="px-4 py-2 text-center"><Badge status={m.status}>{m.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function RegisterMemberForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ groupId: '', fullName: '', phone: '', nationalId: '', gender: 'MALE' })
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { data: groupsData } = useApi<{ groups: any[] }>('/api/vsla-v2/groups')

  async function submit() {
    setSaving(true)
    try {
      const res = await api('/api/vsla-v2/members', { method: 'POST', body: JSON.stringify(form) })
      setResult(res)
    } catch (e: any) {
      alert(`Failed: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (result) {
    return (
      <Card className="p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Check className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-slate-900">Member Registered!</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div><span className="text-slate-500">Member ID:</span> <span className="font-mono font-semibold">{result.member.memberId}</span></div>
          <div><span className="text-slate-500">Name:</span> {result.member.fullName}</div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-center gap-2 text-amber-800 font-semibold mb-1"><MessageSquare className="w-4 h-4" /> Welcome SMS sent with PIN</div>
            <div className="text-2xl font-bold text-amber-900 tracking-widest">{result.pin}</div>
            <p className="text-xs text-amber-700 mt-1">Share this PIN with the member. They'll use it with their member ID to log in via USSD or the app.</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2 justify-end">
          <button onClick={onCreated} className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700">Done</button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-5 mb-4">
      <h3 className="font-semibold text-slate-900 mb-3">Register Member</h3>
      <div className="space-y-3 text-sm">
        <select className="w-full px-3 py-2 border rounded-md" value={form.groupId} onChange={e => setForm({ ...form, groupId: e.target.value })}>
          <option value="">Select group...</option>
          {groupsData?.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <input className="w-full px-3 py-2 border rounded-md" placeholder="Full name" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
        <input className="w-full px-3 py-2 border rounded-md" placeholder="Phone (+256...)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <input className="w-full px-3 py-2 border rounded-md" placeholder="National ID (optional)" value={form.nationalId} onChange={e => setForm({ ...form, nationalId: e.target.value })} />
        <select className="w-full px-3 py-2 border rounded-md" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <div className="mt-3 flex gap-2 justify-end">
        <button onClick={onClose} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md">Cancel</button>
        <button onClick={submit} disabled={saving || !form.groupId || !form.fullName || !form.phone} className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50">
          {saving ? 'Registering...' : 'Register & Send SMS'}
        </button>
      </div>
    </Card>
  )
}

// ─── Loans Tab ───
function LoansTab() {
  const { data, loading } = useApi<{ groups: any[] }>('/api/vsla-v2/groups')
  const [eligibilityResult, setEligibilityResult] = useState<any>(null)
  const [eligibilityForm, setEligibilityForm] = useState({ groupId: '', memberId: '', amount: '' })

  if (loading) return <Loading />

  async function checkEligibility() {
    try {
      const res = await api('/api/vsla-v2/loan/eligibility-check', {
        method: 'POST',
        body: JSON.stringify({
          groupId: eligibilityForm.groupId,
          memberId: eligibilityForm.memberId,
          amount: parseFloat(eligibilityForm.amount),
        }),
      })
      setEligibilityResult(res)
    } catch (e: any) {
      setEligibilityResult({ eligible: false, error: e.message })
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-600" /> Auto-Eligibility Check (SRS 5.1)</h3>
        <p className="text-xs text-slate-500 mb-3">System enforces policy before human approval. Checks: active saver, no outstanding loan, within limit, no pending fines.</p>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <select className="px-3 py-2 border rounded-md" value={eligibilityForm.groupId} onChange={e => setEligibilityForm({ ...eligibilityForm, groupId: e.target.value })}>
            <option value="">Select group...</option>
            {data?.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <input className="px-3 py-2 border rounded-md" placeholder="Member ID" value={eligibilityForm.memberId} onChange={e => setEligibilityForm({ ...eligibilityForm, memberId: e.target.value })} />
          <input type="number" className="px-3 py-2 border rounded-md" placeholder="Amount (UGX)" value={eligibilityForm.amount} onChange={e => setEligibilityForm({ ...eligibilityForm, amount: e.target.value })} />
        </div>
        <button onClick={checkEligibility} disabled={!eligibilityForm.groupId || !eligibilityForm.memberId || !eligibilityForm.amount} className="mt-3 px-3 py-1.5 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50">
          Check Eligibility
        </button>

        {eligibilityResult && (
          <div className="mt-4 p-4 rounded-md border" style={{ borderColor: eligibilityResult.eligible ? '#10b981' : '#f59e0b', background: eligibilityResult.eligible ? '#ecfdf5' : '#fffbeb' }}>
            <div className="flex items-center gap-2 mb-2">
              {eligibilityResult.eligible ? <Check className="w-5 h-5 text-emerald-600" /> : <X className="w-5 h-5 text-amber-600" />}
              <span className="font-semibold" style={{ color: eligibilityResult.eligible ? '#065f46' : '#92400e' }}>
                {eligibilityResult.eligible ? 'ELIGIBLE — can proceed to loan application' : 'NOT ELIGIBLE'}
              </span>
            </div>
            {eligibilityResult.checks?.map((c: any) => (
              <div key={c.check} className="flex items-center gap-2 text-sm">
                {c.passed ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-red-600" />}
                <span className="text-slate-700">{c.check.replace(/_/g, ' ')}</span>
                {!c.passed && c.reason && <span className="text-red-600 text-xs">— {c.reason}</span>}
              </div>
            ))}
            {eligibilityResult.eligible && (
              <div className="mt-2 text-sm">
                <span className="text-slate-600">Max eligible: </span>
                <MaskedAmount amount={eligibilityResult.maxEligibleAmount} />
              </div>
            )}
          </div>
        )}
      </Card>

      <Card>
        <div className="px-5 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900 text-sm">Loan Lifecycle (SRS 5.1)</h3>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between text-xs">
            {['Member Applies', 'Auto-Eligibility', 'System Approved', 'Key Holder Approval (Unanimous)', 'Disbursed', 'Repaid'].map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">{i + 1}</div>
                  <span className="mt-1 text-center text-slate-600 max-w-[100px]">{step}</span>
                </div>
                {i < 5 && <div className="flex-1 h-0.5 bg-slate-200 mx-2" />}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

// ─── Cycles Tab ───
function CyclesTab() {
  return (
    <Card className="p-5">
      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-emerald-600" /> Cycle Management (SRS 5.3)</h3>
      <div className="space-y-3 text-sm text-slate-700">
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
          <div><strong>Setup:</strong> Set Cycle Start Date and Cycle End Date at company or group level. Freeze date auto-computed = endDate - 30 days.</div>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
          <div><strong>LOAN FREEZE:</strong> 30 days before cycle end, the system auto-enables LOAN FREEZE — blocks new loans and activates recovery mode.</div>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
          <div><strong>Cycle End:</strong> System auto-calculates each member's total savings, loans + interest, welfare, fines, and net share-out.</div>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
          <div><strong>Share-Out:</strong> Requires key-holder approval, then disburse. SMS sent to all members with their share-out amount.</div>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold flex-shrink-0">5</div>
          <div><strong>Archive:</strong> Cycle is archived — no further edits allowed. A new cycle may be opened; history is preserved.</div>
        </div>
      </div>
      <div className="mt-4 p-3 bg-slate-50 rounded-md text-xs text-slate-600">
        <strong>API:</strong> POST /api/vsla-v2/cycle/[id]/close — closes a cycle, auto-calculates share-out, archives data, sends SMS to all members.
      </div>
    </Card>
  )
}

// ─── Cashbox Tab ───
function CashboxTab() {
  const { data: groupsData } = useApi<{ groups: any[] }>('/api/vsla-v2/groups')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [entryForm, setEntryForm] = useState({ type: 'SAVING_IN', amount: '', memberId: '', description: '', recordedByName: 'Admin' })
  const [result, setResult] = useState<any>(null)

  async function recordEntry() {
    if (!selectedGroup || !entryForm.amount) return
    try {
      const res = await api(`/api/vsla-v2/cashbox/${selectedGroup}/entry`, {
        method: 'POST',
        body: JSON.stringify({
          ...entryForm,
          amount: parseFloat(entryForm.amount),
          memberId: entryForm.memberId || undefined,
        }),
      })
      setResult(res)
      setEntryForm({ ...entryForm, amount: '', description: '' })
    } catch (e: any) {
      alert(`Failed: ${e.message}`)
    }
  }

  const entryTypes = [
    { value: 'SAVING_IN', label: 'Saving Deposit (IN)', color: 'emerald' },
    { value: 'LOAN_OUT', label: 'Loan Disbursement (OUT)', color: 'amber' },
    { value: 'LOAN_REPAY_IN', label: 'Loan Repayment (IN)', color: 'blue' },
    { value: 'WELFARE_IN', label: 'Welfare Contribution (IN)', color: 'purple' },
    { value: 'FINE_IN', label: 'Fine Payment (IN)', color: 'red' },
    { value: 'WELFARE_OUT', label: 'Welfare Claim (OUT)', color: 'pink' },
  ]

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><PiggyBank className="w-4 h-4 text-emerald-600" /> E-Teller Cashbox Entry (SRS 5.2)</h3>
        <p className="text-xs text-slate-500 mb-3">E-Teller records Savings / Loans / Welfare / Fines → Updates Group Cashbox. Any member can be assigned as E-Teller per meeting.</p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <select className="px-3 py-2 border rounded-md" value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
            <option value="">Select group...</option>
            {groupsData?.groups.map(g => <option key={g.id} value={g.id}>{g.name} (Cashbox: {formatUGX(g.cashboxBalance)})</option>)}
          </select>
          <select className="px-3 py-2 border rounded-md" value={entryForm.type} onChange={e => setEntryForm({ ...entryForm, type: e.target.value })}>
            {entryTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input type="number" className="px-3 py-2 border rounded-md" placeholder="Amount (UGX)" value={entryForm.amount} onChange={e => setEntryForm({ ...entryForm, amount: e.target.value })} />
          <input className="px-3 py-2 border rounded-md" placeholder="Member ID (optional)" value={entryForm.memberId} onChange={e => setEntryForm({ ...entryForm, memberId: e.target.value })} />
          <input className="px-3 py-2 border rounded-md col-span-2" placeholder="Description (optional)" value={entryForm.description} onChange={e => setEntryForm({ ...entryForm, description: e.target.value })} />
        </div>
        <button onClick={recordEntry} disabled={!selectedGroup || !entryForm.amount} className="mt-3 px-3 py-1.5 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50">
          Record Entry
        </button>

        {result && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md text-sm">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold mb-1"><Check className="w-4 h-4" /> Entry Recorded</div>
            <div className="text-slate-700">New cashbox balance: <MaskedAmount amount={result.cashboxBalance} /></div>
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Reusable Components ───
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-lg border border-slate-200 ${className}`}>{children}</div>
}

function Loading() {
  return <div className="text-center py-12"><RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto" /></div>
}
