'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { UserCog, RefreshCw, Search, Save, X, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

interface Officer { id: string; name: string }
interface Coop { id: string; name: string }
interface FarmerRow {
  id: string; firstName: string; lastName: string; farmerCode?: string
  extensionOfficer?: string | null; cooperativeId?: string | null; status?: string
}

export function FarmerMappingView() {
  const [farmers, setFarmers] = useState<FarmerRow[]>([])
  const [officers, setOfficers] = useState<Officer[]>([])
  const [coops, setCoops] = useState<Coop[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [drafts, setDrafts] = useState<Record<string, { extensionOfficer?: string; cooperativeId?: string }>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const limit = 20

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/field-staff?limit=5000').then(r => r.json()),
      fetch('/api/cooperatives?limit=5000').then(r => r.json()),
      fetch('/api/farmers?limit=5000&page=1').then(r => r.json()),
    ]).then(([o, c, f]) => {
      setOfficers((o.data || []).map((s: any) => ({ id: s.id, name: `${s.firstName} ${s.lastName}` })))
      setCoops((c.data || []).map((x: any) => ({ id: x.id, name: x.name })))
      const rows = (f.farmers || f.data || []) as FarmerRow[]
      setFarmers(rows.filter(x => !String(x.status).toUpperCase().startsWith('INACTIVE')))
      setDrafts({})
    }).catch(() => toast.error('Failed to load mapping data'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const draft = (id: string) => drafts[id] || {}
  const setDft = (id: string, k: 'extensionOfficer' | 'cooperativeId', v: string) =>
    setDrafts(p => ({ ...p, [id]: { ...p[id], [k]: v } }))

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return farmers
    return farmers.filter(f =>
      `${f.firstName} ${f.lastName}`.toLowerCase().includes(q) ||
      (f.farmerCode || '').toLowerCase().includes(q) ||
      (f.extensionOfficer || '').toLowerCase().includes(q)
    )
  }, [farmers, search])

  // Reset page when search changes
  useEffect(() => { setPage(1) }, [search])

  const totalPages = Math.ceil(filtered.length / limit)
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  const saveAssignment = async (f: FarmerRow) => {
    const d = draft(f.id)
    const officerVal = d.extensionOfficer !== undefined ? d.extensionOfficer : (f.extensionOfficer || '')
    const coopVal = d.cooperativeId !== undefined ? d.cooperativeId : (f.cooperativeId || '')
    setSaving(f.id)
    try {
      const res = await fetch(`/api/farmers/${f.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extensionOfficer: officerVal || null, cooperativeId: coopVal || null }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Assignment saved')
      setFarmers(rows => rows.map(r => r.id === f.id ? { ...r, extensionOfficer: officerVal || null, cooperativeId: coopVal || null } : r))
      setDrafts(p => { const n = { ...p }; delete n[f.id]; return n })
    } catch { toast.error('Could not save assignment') }
    finally { setSaving(null) }
  }

  const unassign = async (f: FarmerRow) => {
    setSaving(f.id)
    try {
      const res = await fetch(`/api/farmers/${f.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extensionOfficer: null, cooperativeId: null }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Unassigned')
      setFarmers(rows => rows.map(r => r.id === f.id ? { ...r, extensionOfficer: null, cooperativeId: null } : r))
    } catch { toast.error('Could not unassign') }
    finally { setSaving(null) }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UserCog className="w-6 h-6" /> Farmer–Officer–Cooperative Mapping
          </h1>
          <p className="text-sm text-muted-foreground">Assign or reassign the field officer and cooperative for each farmer.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input className="pl-8 h-9 max-w-md" placeholder="Search by name, code or officer..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Farmer</TableHead>
                  <TableHead className="w-[32%]">Field Officer</TableHead>
                  <TableHead className="w-[32%]">Cooperative</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No farmers to map.</TableCell></TableRow>
                )}
                {paginated.map(f => {
                  const d = draft(f.id)
                  const officerTouched = d.extensionOfficer !== undefined
                  const coopTouched = d.cooperativeId !== undefined
                  const dirty = officerTouched || coopTouched
                  const showOfficer = officerTouched ? d.extensionOfficer : (f.extensionOfficer || '')
                  const showCoop = coopTouched ? d.cooperativeId : (f.cooperativeId || '')
                  return (
                    <TableRow key={f.id}>
                      <TableCell>
                        <div className="font-medium">{f.firstName} {f.lastName}</div>
                        <div className="text-xs text-muted-foreground">{f.farmerCode || ''}</div>
                      </TableCell>
                      <TableCell>
                        <Select value={showOfficer || undefined} onValueChange={v => setDft(f.id, 'extensionOfficer', v)}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Select officer" /></SelectTrigger>
                          <SelectContent>
                            {officers.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">No field officers yet.</div>}
                            {officers.map(o => <SelectItem key={o.id} value={o.name}>{o.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={showCoop || undefined} onValueChange={v => setDft(f.id, 'cooperativeId', v)}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Select cooperative" /></SelectTrigger>
                          <SelectContent>
                            {coops.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">No cooperatives yet.</div>}
                            {coops.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1.5 justify-end">
                          {dirty && (
                            <Button size="sm" className="h-8" disabled={saving === f.id} onClick={() => saveAssignment(f)}>
                              {saving === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />} Save
                            </Button>
                          )}
                          {(dirty ? showOfficer || showCoop : (f.extensionOfficer || f.cooperativeId)) && (
                            <Button size="sm" variant="outline" className="h-8" disabled={saving === f.id} onClick={() => unassign(f)}>
                              <X className="w-3.5 h-3.5 mr-1" /> Unassign
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
          {filtered.length > limit && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default FarmerMappingView