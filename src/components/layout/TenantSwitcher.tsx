'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Building2, ArrowLeftRight, Loader2, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

interface Tenant {
  id: string
  name: string
  type: string
  country: string | null
  defaultCurrency: string
  isActive: boolean
  _count?: { users: number; farmerProfiles: number; vslaGroups: number }
}

/**
 * TenantSwitcher — dropdown for SUPER_ADMIN to pick a tenant and start simulation.
 *
 * Props:
 *   - onStarted: callback after simulation starts (parent should refresh status + reload page)
 *   - disabled: when simulating, the switcher is hidden by the parent
 */
export function TenantSwitcher({ onStarted }: { onStarted: () => void }) {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string>('')
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    fetch('/api/admin/tenants?status=active')
      .then(r => r.json())
      .then(d => {
        // Exclude the platform root tenant (type === 'SUPER_ADMIN')
        const list: Tenant[] = (d.tenants || []).filter((t: Tenant) => t.type !== 'SUPER_ADMIN')
        setTenants(list)
        if (list.length > 0) setSelectedId(list[0].id)
      })
      .catch(() => { /* non-blocking */ })
      .finally(() => setLoading(false))
  }, [])

  const start = async () => {
    if (!selectedId) {
      toast.error('Select a tenant first')
      return
    }
    setStarting(true)
    try {
      const res = await fetch('/api/admin/simulate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: selectedId }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`Now viewing as ${data.data.tenantName}`)
        onStarted()
      } else {
        toast.error(data.error || 'Failed to start simulation')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return <Skeleton className="h-9 w-48" />
  }

  if (tenants.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedId} onValueChange={setSelectedId} disabled={starting}>
        <SelectTrigger className="h-9 w-[220px] text-xs">
          <Building2 className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
          <SelectValue placeholder="Switch tenant..." />
        </SelectTrigger>
        <SelectContent>
          {tenants.map(t => (
            <SelectItem key={t.id} value={t.id} className="text-xs">
              <span className="font-medium">{t.name}</span>
              <span className="ml-2 text-muted-foreground">· {t.type}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="outline"
        className="h-9 gap-1.5"
        onClick={start}
        disabled={starting || !selectedId}
        title="Start viewing the platform as this tenant"
      >
        {starting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowLeftRight className="w-3.5 h-3.5" />}
        Simulate
      </Button>
    </div>
  )
}
