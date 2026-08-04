'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings, Save, Globe, RefreshCw, Loader2, CheckCircle2, Layers } from 'lucide-react'
import { toast } from 'sonner'

/**
 * SuperAdminConfigView
 *
 * The previous version of this view sent a body shape `{defaultCurrency,
 * defaultLanguage, smsGateway, ...}` to PATCH /api/admin/config, but the
 * actual API contract is `{tenantId, moduleCode, isEnabled}` — i.e. it
 * toggles a specific module entitlement for a specific tenant. The GET
 * endpoint returns `{tenants, entitlements, moduleCoverage, allModules,
 * brandingConfigs}`. This rewrite matches the real API contract: it lists
 * every tenant × every module and lets the SUPER_ADMIN flip each one on/off.
 */

interface EntitlementRow {
  id: string
  tenantId: string
  tenantName: string
  tenantCountry: string | null
  tenantType: string
  moduleCode: string
  isEnabled: boolean
  updatedAt: string
}

interface Tenant {
  id: string
  name: string
  country: string | null
  type: string
  defaultCurrency: string
}

interface ModuleCoverage {
  moduleCode: string
  enabled: number
  disabled: number
  total: number
  adoptionRate: number
}

interface ConfigData {
  tenants: Tenant[]
  entitlements: EntitlementRow[]
  moduleCoverage: ModuleCoverage[]
  allModules: string[]
  brandingConfigs: Array<{ id: string; tenantId: string; tenantName: string; primaryColor?: string }>
}

export default function SuperAdminConfigView() {
  const [data, setData] = useState<ConfigData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterTenant, setFilterTenant] = useState<string>('all')
  const [filterModule, setFilterModule] = useState<string>('all')
  const [search, setSearch] = useState('')
  // Optimistic UI: pending toggles keyed by `${tenantId}:${moduleCode}`
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [togglingKey, setTogglingKey] = useState<string | null>(null)

  const load = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/config')
      if (res.ok) {
        const d: ConfigData = await res.json()
        setData(d)
      } else {
        toast.error('Failed to load platform configuration')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const toggleEntitlement = async (row: EntitlementRow, newValue: boolean) => {
    const key = `${row.tenantId}:${row.moduleCode}`
    setPending(p => ({ ...p, [key]: newValue }))
    setTogglingKey(key)
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: row.tenantId,
          moduleCode: row.moduleCode,
          isEnabled: newValue,
        }),
      })
      if (res.ok) {
        toast.success(`${row.moduleCode} ${newValue ? 'enabled' : 'disabled'} for ${row.tenantName}`, {
          duration: 2500,
        })
        // Update local state without re-fetching
        setData(prev => prev ? {
          ...prev,
          entitlements: prev.entitlements.map(e =>
            e.tenantId === row.tenantId && e.moduleCode === row.moduleCode
              ? { ...e, isEnabled: newValue, updatedAt: new Date().toISOString() }
              : e,
          ),
        } : prev)
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to update entitlement')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setTogglingKey(null)
      setPending(p => { const n = { ...p }; delete n[key]; return n })
    }
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-96" /></div>

  if (!data) {
    return <div className="text-center text-muted-foreground p-8">No configuration data available</div>
  }

  // Build a dense map: tenantId → moduleCode → EntitlementRow (or "missing")
  const entitlementMap = new Map<string, EntitlementRow>()
  for (const e of data.entitlements) {
    entitlementMap.set(`${e.tenantId}:${e.moduleCode}`, e)
  }

  // Apply filters
  const filteredTenants = data.tenants.filter(t => {
    if (filterTenant !== 'all' && t.id !== filterTenant) return false
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })
  const filteredModules = filterModule === 'all' ? data.allModules : [filterModule]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Configuration</h1>
          <p className="text-sm text-muted-foreground">
            Toggle module access per tenant · {data.tenants.length} tenants · {data.allModules.length} modules
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={refreshing} className="gap-2">
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </Button>
      </div>

      {/* Module Coverage Summary */}
      <div>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4" /> Module Adoption Across Tenants
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.moduleCoverage
            .sort((a, b) => b.adoptionRate - a.adoptionRate)
            .map(c => (
              <Card key={c.moduleCode} className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide">{c.moduleCode}</span>
                  <Badge variant="outline" className="text-[10px]">{c.adoptionRate}%</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {c.enabled}/{c.total} tenants
                </div>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${c.adoptionRate}%` }}
                  />
                </div>
              </Card>
            ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Input
            placeholder="Search tenants..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9"
          />
        </div>
        <Select value={filterTenant} onValueChange={setFilterTenant}>
          <SelectTrigger className="h-9 w-[200px]"><SelectValue placeholder="Filter by tenant" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tenants</SelectItem>
            {data.tenants.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterModule} onValueChange={setFilterModule}>
          <SelectTrigger className="h-9 w-[200px]"><SelectValue placeholder="Filter by module" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modules</SelectItem>
            {data.allModules.map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Entitlement Matrix */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 py-3">
          <CardTitle className="text-sm">Module Entitlement Matrix</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 sticky top-0">
                <tr>
                  <th className="text-left py-2 px-3 font-semibold uppercase text-muted-foreground">Tenant</th>
                  {filteredModules.map(m => (
                    <th key={m} className="text-center py-2 px-2 font-semibold uppercase text-muted-foreground" title={m}>
                      {m.length > 8 ? m.slice(0, 7) + '…' : m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map(t => (
                  <tr key={t.id} className="border-b hover:bg-muted/20">
                    <td className="py-2 px-3">
                      <div className="font-medium">{t.name}</div>
                      <div className="text-[10px] text-muted-foreground">{t.type} · {t.country || '—'}</div>
                    </td>
                    {filteredModules.map(m => {
                      const key = `${t.id}:${m}`
                      const row = entitlementMap.get(key)
                      // Default to enabled=true when no row exists (matches /api/admin/config POST behavior)
                      const isEnabled = row ? row.isEnabled : true
                      const optimisticValue = pending[key] ?? isEnabled
                      const isToggling = togglingKey === key
                      return (
                        <td key={m} className="text-center py-2 px-2">
                          <Switch
                            checked={optimisticValue}
                            onCheckedChange={(v) => toggleEntitlement(row ?? {
                              id: '', tenantId: t.id, tenantName: t.name,
                              tenantCountry: t.country, tenantType: t.type,
                              moduleCode: m, isEnabled: !v, updatedAt: new Date().toISOString(),
                            }, v)}
                            disabled={isToggling}
                            className="scale-90 inline-flex"
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
                {filteredTenants.length === 0 && (
                  <tr>
                    <td colSpan={filteredModules.length + 1} className="py-8 text-center text-muted-foreground">
                      No tenants match the current filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Branding configs */}
      {data.brandingConfigs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Globe className="w-4 h-4" /> Tenant Branding</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {data.brandingConfigs.map(b => (
                <div key={b.id} className="flex items-center gap-2 p-2 rounded-lg border">
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: b.primaryColor || '#16a34a' }}
                  />
                  <span className="text-sm">{b.tenantName}</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 ml-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
