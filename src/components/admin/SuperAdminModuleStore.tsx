'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Boxes, Building2, Check, Loader2 } from 'lucide-react'

export function SuperAdminModuleStore() {
  const [tenants, setTenants] = useState<any[]>([])
  const [modules, setModules] = useState<any[]>([])
  const [selectedTenant, setSelectedTenant] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  const loadTenants = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/module-store')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setTenants(data.tenants || [])
      setModules(data.modules || [])
      if (data.tenants?.length > 0 && !selectedTenant) {
        setSelectedTenant(data.tenants[0].id)
      }
    } catch {
      toast.error('Failed to load tenants')
    } finally {
      setLoading(false)
    }
  }, [selectedTenant])

  const loadTenantModules = useCallback(async () => {
    if (!selectedTenant) return
    try {
      const res = await fetch(`/api/admin/module-store?tenantId=${selectedTenant}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setModules(data.modules || [])
    } catch {
      toast.error('Failed to load modules')
    }
  }, [selectedTenant])

  useEffect(() => { loadTenants() }, [loadTenants])
  useEffect(() => { if (selectedTenant) loadTenantModules() }, [selectedTenant, loadTenantModules])

  const toggleModule = async (moduleCode: string, isEnabled: boolean) => {
    setToggling(moduleCode)
    try {
      const res = await fetch('/api/admin/module-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: selectedTenant, moduleCode, isEnabled }),
      })
      if (res.ok) {
        setModules(modules.map(m => m.code === moduleCode ? { ...m, isEnabled } : m))
        toast.success(`${moduleCode} ${isEnabled ? 'enabled' : 'disabled'}`)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setToggling(null)
    }
  }

  if (loading) return <Skeleton className="h-96 rounded-xl" />

  const categories = [...new Set(modules.map(m => m.category))]

  return (
    <div className="space-y-4">
      {/* Tenant selector */}
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <Building2 className="w-5 h-5 text-muted-foreground" />
          <Select value={selectedTenant} onValueChange={setSelectedTenant}>
            <SelectTrigger className="w-72"><SelectValue placeholder="Select tenant..." /></SelectTrigger>
            <SelectContent>
              {tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.enabledModules} modules)</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Module grid by category */}
      {categories.map(cat => (
        <Card key={cat}>
          <CardHeader>
            <CardTitle className="text-sm">{cat}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {modules.filter(m => m.category === cat).map(m => (
              <div key={m.code} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{m.name}</span>
                    {m.isCore && <Badge className="bg-emerald-100 text-emerald-700 text-xs">Core</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{m.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {toggling === m.code && <Loader2 className="w-3 h-3 animate-spin" />}
                  <Switch
                    checked={m.isEnabled}
                    onCheckedChange={(checked) => toggleModule(m.code, checked)}
                    disabled={m.isCore || toggling === m.code}
                  />
                  {m.isEnabled ? <Check className="w-3 h-3 text-emerald-600" /> : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
export default SuperAdminModuleStore
