'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog'
import { Building2, Plus, Search, MoreVertical, Power, Eye, ArrowRightLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Tenant {
  id: string; name: string; type: string; country: string; isActive: boolean
  defaultCurrency: string; createdAt: string
  _count: { users: number; farmerProfiles: number; vslaGroups: number; plots: number }
  subscription: {
    plan: string; amount: number; billingCycle: string; status?: string
    trialStartsAt?: string | null; trialEndsAt?: string | null
  } | null
  mrr: number
}

export default function SuperAdminTenantsView() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [simulatingId, setSimulatingId] = useState<string | null>(null)
  const [migrating, setMigrating] = useState(false)
  const [migrationPreview, setMigrationPreview] = useState<{
    targetTenant: { id: string; name: string } | null
    sourceTenants: Array<{ id: string; name: string; type: string; groupCount: number }>
    counts: { groups: number; loans: number; repayments: number; meetings: number; attendance: number }
  } | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/tenants')
      .then(r => r.json())
      .then(d => setTenants(d.tenants || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = tenants.filter(t => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterType && t.type !== filterType) return false
    return true
  })

  const toggleActive = async (t: Tenant) => {
    const res = await fetch(`/api/admin/tenants/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !t.isActive }),
    })
    if (res.ok) {
      toast.success(`${t.name} ${t.isActive ? 'suspended' : 'activated'}`)
      load()
    } else {
      toast.error('Failed to update tenant')
    }
  }

  const simulateTenant = async (t: Tenant) => {
    if (t.type === 'SUPER_ADMIN') {
      toast.error('Cannot simulate the platform root tenant')
      return
    }
    if (!t.isActive) {
      toast.error('Cannot simulate a suspended tenant')
      return
    }
    setSimulatingId(t.id)
    try {
      const res = await fetch('/api/admin/simulate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: t.id }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`Now viewing platform as ${t.name}`)
        // Reload the page so the SimulationBanner appears at the top and the
        // middleware picks up the new cookie on every subsequent request.
        setTimeout(() => window.location.reload(), 400)
      } else {
        toast.error(data.error || 'Failed to start simulation')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSimulatingId(null)
    }
  }

  const previewMigration = async () => {
    setMigrating(true)
    try {
      const res = await fetch('/api/admin/migrate-vsla')
      const data = await res.json()
      if (res.ok && data.success) {
        setMigrationPreview(data.data)
        if (data.data.counts.groups === 0) {
          toast.info('No VSLA groups need migration — all groups are already on a VSLA_PROVIDER tenant.')
        } else if (!data.data.targetTenant) {
          toast.info('No VSLA_PROVIDER tenant exists yet. Click "Migrate VSLA" to auto-create one and run the migration.')
        } else {
          toast.info(`Preview ready: ${data.data.counts.groups} group(s) across ${data.data.sourceTenants.length} source tenant(s).`)
        }
      } else {
        toast.error(data.error || 'Failed to preview migration')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setMigrating(false)
    }
  }

  const executeMigration = async () => {
    if (!migrationPreview) {
      toast.error('Load the preview first')
      return
    }
    const totalRecords = migrationPreview.counts.groups +
      migrationPreview.counts.loans + migrationPreview.counts.repayments +
      migrationPreview.counts.meetings + migrationPreview.counts.attendance
    const confirmed = window.confirm(
      `Migrate ${migrationPreview.counts.groups} VSLA group(s) ` +
      `(${totalRecords} total records across groups/loans/repayments/meetings/attendance) ` +
      `to ${migrationPreview.targetTenant?.name || 'a new VSLA_PROVIDER tenant'}?\n\n` +
      `This action is irreversible and audit-logged.`,
    )
    if (!confirmed) return

    setMigrating(true)
    try {
      const res = await fetch('/api/admin/migrate-vsla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        const c = data.data.counts
        toast.success(
          `Migrated ${c.groups} group(s), ${c.loans} loan(s), ${c.repayments} repayment(s), ${c.meetings} meeting(s), ${c.attendance} attendance record(s)`,
        )
        setMigrationPreview(null)
        load()
      } else {
        toast.error(data.error || 'Migration failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setMigrating(false)
    }
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-96" /></div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenant Management</h1>
          <p className="text-sm text-muted-foreground">{tenants.length} tenants · {tenants.filter(t => t.isActive).length} active</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={previewMigration}
            disabled={migrating}
            className="gap-2"
            title="Preview VSLA → standalone tenant migration"
          >
            {migrating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
            Migrate VSLA
          </Button>
          <CreateTenantDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={load} />
        </div>
      </div>

      {/* Migration Preview Card */}
      {migrationPreview && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  VSLA Migration Preview
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Target: {migrationPreview.targetTenant?.name || 'NEW VSLA_PROVIDER tenant (will be auto-created)'}
                  {migrationPreview.targetTenant && ` (${migrationPreview.targetTenant.id})`}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900 dark:bg-amber-900/60 dark:hover:bg-amber-900 dark:border-amber-800 dark:text-amber-100"
                onClick={() => setMigrationPreview(null)}
              >
                Dismiss
              </Button>
            </div>
            {migrationPreview.counts.groups === 0 ? (
              <p className="text-xs text-amber-800 dark:text-amber-200">
                No VSLA groups need migration — every group is already on a VSLA_PROVIDER tenant (or no groups exist).
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                  <div className="p-2 rounded bg-white/60 dark:bg-amber-900/30">
                    <div className="text-muted-foreground">Groups</div>
                    <div className="text-lg font-semibold">{migrationPreview.counts.groups}</div>
                  </div>
                  <div className="p-2 rounded bg-white/60 dark:bg-amber-900/30">
                    <div className="text-muted-foreground">Loans</div>
                    <div className="text-lg font-semibold">{migrationPreview.counts.loans}</div>
                  </div>
                  <div className="p-2 rounded bg-white/60 dark:bg-amber-900/30">
                    <div className="text-muted-foreground">Repayments</div>
                    <div className="text-lg font-semibold">{migrationPreview.counts.repayments}</div>
                  </div>
                  <div className="p-2 rounded bg-white/60 dark:bg-amber-900/30">
                    <div className="text-muted-foreground">Meetings</div>
                    <div className="text-lg font-semibold">{migrationPreview.counts.meetings}</div>
                  </div>
                  <div className="p-2 rounded bg-white/60 dark:bg-amber-900/30">
                    <div className="text-muted-foreground">Attendance</div>
                    <div className="text-lg font-semibold">{migrationPreview.counts.attendance}</div>
                  </div>
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Source tenants: </span>
                  {migrationPreview.sourceTenants.length === 0 ? (
                    <span className="text-muted-foreground">none</span>
                  ) : (
                    migrationPreview.sourceTenants.map(s => (
                      <span key={s.id} className="inline-block mr-2 mb-1 px-2 py-0.5 rounded bg-white/60 dark:bg-amber-900/40">
                        {s.name} ({s.type}) — {s.groupCount} group(s)
                      </span>
                    ))
                  )}
                </div>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={executeMigration}
                    disabled={migrating}
                    className="gap-2"
                  >
                    {migrating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
                    Execute Migration
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tenants..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 text-sm border rounded-md bg-background"
        >
          <option value="">All types</option>
          <option value="VSLA_PROVIDER">VSLA Provider</option>
          <option value="COOPERATIVE">Cooperative</option>
          <option value="EXPORTER">Exporter</option>
          <option value="NGO">NGO</option>
          <option value="MFI">MFI</option>
          <option value="AGRIBUSINESS">Agribusiness</option>
          <option value="COUNTRY">Country</option>
        </select>
      </div>

      {/* Tenants Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-3 px-4 text-xs uppercase text-muted-foreground font-semibold">Tenant</th>
                <th className="text-left py-3 px-4 text-xs uppercase text-muted-foreground font-semibold">Type</th>
                <th className="text-left py-3 px-4 text-xs uppercase text-muted-foreground font-semibold">Country</th>
                <th className="text-center py-3 px-4 text-xs uppercase text-muted-foreground font-semibold">Farmers</th>
                <th className="text-center py-3 px-4 text-xs uppercase text-muted-foreground font-semibold">Users</th>
                <th className="text-center py-3 px-4 text-xs uppercase text-muted-foreground font-semibold">Plots</th>
                <th className="text-left py-3 px-4 text-xs uppercase text-muted-foreground font-semibold">Plan</th>
                <th className="text-right py-3 px-4 text-xs uppercase text-muted-foreground font-semibold">MRR</th>
                <th className="text-center py-3 px-4 text-xs uppercase text-muted-foreground font-semibold">Status</th>
                <th className="text-right py-3 px-4 text-xs uppercase text-muted-foreground font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="border-b hover:bg-muted/30">
                  <td className="py-3 px-4">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.defaultCurrency}</div>
                  </td>
                  <td className="py-3 px-4"><Badge variant="outline" className="text-[10px]">{t.type}</Badge></td>
                  <td className="py-3 px-4">{t.country || '—'}</td>
                  <td className="py-3 px-4 text-center">{t._count.farmerProfiles}</td>
                  <td className="py-3 px-4 text-center">{t._count.users}</td>
                  <td className="py-3 px-4 text-center">{t._count.plots}</td>
                  <td className="py-3 px-4">
                    {t.subscription?.status === 'TRIAL' && t.subscription?.trialEndsAt ? (
                      <div>
                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                          TRIAL · {Math.max(0, Math.ceil((new Date(t.subscription.trialEndsAt).getTime() - Date.now()) / 86400000))}d left
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-0.5">{t.subscription?.plan || '—'}</div>
                      </div>
                    ) : (
                      <>
                        <div>{t.subscription?.plan || '—'}</div>
                        <div className="text-[10px] text-muted-foreground">{t.subscription?.status?.toLowerCase() || ''}</div>
                      </>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-medium">{t.mrr > 0 ? `$${t.mrr.toFixed(0)}` : '—'}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={t.isActive ? 'default' : 'secondary'} className="text-[10px]">
                      {t.isActive ? 'Active' : 'Suspended'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => simulateTenant(t)}
                        disabled={simulatingId === t.id || t.type === 'SUPER_ADMIN' || !t.isActive}
                        title={t.type === 'SUPER_ADMIN' ? 'Cannot simulate the platform root tenant' :
                               !t.isActive ? 'Cannot simulate a suspended tenant' :
                               'View platform as this tenant'}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View as
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleActive(t)}
                        title={t.isActive ? 'Suspend' : 'Activate'}
                      >
                        <Power className={`w-4 h-4 ${t.isActive ? 'text-red-500' : 'text-green-500'}`} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function CreateTenantDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('COOPERATIVE')
  const [country, setCountry] = useState('Uganda')
  const [trialDays, setTrialDays] = useState(14)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    const res = await fetch('/api/admin/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, country, trialDays }),
    })
    setSubmitting(false)
    if (res.ok) {
      toast.success(`Tenant created · ${trialDays}-day trial`)
      setName('')
      setTrialDays(14)
      onOpenChange(false)
      onCreated()
    } else {
      toast.error('Failed to create tenant')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 mr-2" /> New Tenant</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Tenant</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mt. Elgon Coffee Coop" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
              <option value="VSLA_PROVIDER">VSLA Provider (standalone VSLA tenant)</option>
              <option value="COOPERATIVE">Cooperative</option>
              <option value="EXPORTER">Exporter</option>
              <option value="NGO">NGO</option>
              <option value="MFI">MFI</option>
              <option value="AGRIBUSINESS">Agribusiness</option>
              <option value="COUNTRY">Country</option>
              <option value="BANK">Bank</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Country</label>
            <select value={country} onChange={e => setCountry(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
              <option value="Uganda">🇺🇬 Uganda (UGX)</option>
              <option value="Ghana">🇬🇭 Ghana (GHS)</option>
              <option value="Kenya">🇰🇪 Kenya (KES)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Trial Period (days)</label>
            <Input
              type="number"
              min={0}
              max={365}
              value={trialDays}
              onChange={e => setTrialDays(Math.max(0, Math.min(365, Number(e.target.value) || 0)))}
              placeholder="14"
            />
            <p className="text-xs text-muted-foreground">
              Subscription is created with status <code className="text-[10px] bg-muted px-1 rounded">TRIAL</code>.
              A daily Vercel cron will auto-suspend when the trial ends. Set to 0 to disable the trial.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !name}>
            {submitting ? 'Creating...' : 'Create Tenant'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
