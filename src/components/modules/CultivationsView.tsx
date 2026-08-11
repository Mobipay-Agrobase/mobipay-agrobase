'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  Search, Plus, Eye, X, Sprout, Calendar, Ruler, DollarSign, ArrowLeft,
  Loader2, Save, FlaskConical, Leaf, Layers, MapPin, Pencil, Trash2
} from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { CatalogSelect } from '@/components/ui/catalog-select'
import { useAppStore } from '@/lib/store'
import { StatCard, StatCardGrid } from '@/components/ui/stat-card'

interface Cultivation {
  id: string
  farmId: string
  cropName: string
  variety?: string | null
  season?: string | null
  sowingDate?: string | null
  estimatedYield?: number | null
  actualYield?: number | null
  status: string
  cropCategory?: string | null
  cultivationAreaHa?: number | null
  seedSource?: string | null
  isSeedTreated?: boolean
  seedType?: string | null
  seedQuantity?: number | null
  seedPrice?: number | null
  seedCost?: number | null
  sowingType?: string | null
  sowingChargesBy?: string | null
  sowingCharges?: number | null
  sowingCost?: number | null
  createdAt: string
  farm?: { id: string; name: string; sizeHectares?: number | null; farmer?: { id: string; firstName: string; lastName: string; farmerCode?: string } }
}

const CROP_CATEGORIES = ['Main Crop', 'Inter Crop', 'Border Crop']
const SEASONS = ['Spring 2026', 'Summer 2026', 'Autumn 2026', 'Winter 2025', 'Wet 2026', 'Dry 2026']
const SOWING_TYPES = ['Row sowing', 'Hand sowing', 'Drone sowing', 'Transplanting', 'Re-planting']
const SEED_SOURCES = ['Seed Company', 'Agent', 'Self-save']
const SEED_TYPES = ['Certified 1', 'Certified 2', 'Self-save', 'Other']

const statusColor: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  HARVESTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

export default function CultivationsView() {
  const { setActiveModule } = useAppStore()
  const [cultivations, setCultivations] = useState<Cultivation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(20)
  const [stats, setStats] = useState({ total: 0, active: 0, harvested: 0, totalArea: 0, totalSeedCost: 0, totalSowingCost: 0 })
  const [showAdd, setShowAdd] = useState(false)
  const [editingCultivation, setEditingCultivation] = useState<Cultivation | null>(null)
  const [deletingCultivation, setDeletingCultivation] = useState<Cultivation | null>(null)
  const [selected, setSelected] = useState<Cultivation | null>(null)

  const fetchCultivations = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/cultivations?${params}`)
      const data = await res.json()
      setCultivations(data.cultivations || [])
      if (typeof data.total === 'number') setTotal(data.total)
      if (data.stats) setStats(data.stats)
    } catch (e) {
      console.error(e)
      toast.error('Failed to load cultivations')
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, statusFilter])

  useEffect(() => { fetchCultivations() }, [fetchCultivations])

  const handleDelete = async (c: Cultivation) => {
    try {
      const res = await fetch(`/api/cultivations/${c.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(`${c.cropName} deleted`)
        fetchCultivations()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete')
      }
    } catch {
      toast.error('Network error')
    }
    setDeletingCultivation(null)
  }

  if (selected) {
    return <CultivationDetail cultivation={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Cultivation Registry</h3>
          <p className="text-sm text-muted-foreground">{stats.total} cultivations · {stats.totalArea.toFixed(2)} ha · {stats.active} active</p>
        </div>
        <Button onClick={() => setActiveModule('cultivation-create')} className="gap-2"><Plus className="w-4 h-4" /> Add Cultivation</Button>
      </div>

      <StatCardGrid>
        <StatCard icon={<Sprout />} label="Total Cultivations" value={stats.total} tone="emerald" />
        <StatCard icon={<Ruler />} label="Cultivated Area" value={`${stats.totalArea.toFixed(2)} ha`} tone="blue" />
        <StatCard icon={<DollarSign />} label="Seed Cost Total" value={`UGX ${(stats.totalSeedCost / 1000).toFixed(0)}K`} tone="amber" />
        <StatCard icon={<Calendar />} label="Sowing Cost Total" value={`UGX ${(stats.totalSowingCost / 1000).toFixed(0)}K`} tone="purple" />
      </StatCardGrid>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by crop, variety, farm, or farmer..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="HARVESTED">Harvested</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
        {(search || statusFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter(''); setPage(1) }} className="gap-1"><X className="w-3.5 h-3.5" /> Clear</Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}</div>
          ) : cultivations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Sprout className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No cultivations found</p>
              <p className="text-sm mt-1">Add a cultivation to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Crop</TableHead>
                  <TableHead>Farm / Farmer</TableHead>
                  <TableHead className="hidden md:table-cell">Season</TableHead>
                  <TableHead className="hidden lg:table-cell">Area (ha)</TableHead>
                  <TableHead className="hidden xl:table-cell">Seed Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cultivations.map(c => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(c)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center"><Sprout className="w-3.5 h-3.5 text-emerald-600" /></div>
                        <div>
                          <p className="font-medium text-sm">{c.cropName}</p>
                          {c.variety && <p className="text-[10px] text-muted-foreground">{c.variety}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{c.farm?.name || '—'}</p>
                      <p className="text-[10px] text-muted-foreground">{c.farm?.farmer ? `${c.farm.farmer.firstName} ${c.farm.farmer.lastName}${c.farm.farmer.farmerCode ? ` (${c.farm.farmer.farmerCode})` : ''}` : ''}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{c.season || '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{c.cultivationAreaHa?.toFixed(2) ?? '—'}</TableCell>
                    <TableCell className="hidden xl:table-cell text-sm">{c.seedCost ? `UGX ${c.seedCost.toLocaleString()}` : '—'}</TableCell>
                    <TableCell><Badge className={cn('text-[10px]', statusColor[c.status] || '')}>{c.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); useAppStore.getState().setSelectedCultivationId(c.id); setActiveModule('cultivation-edit') }}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingCultivation(c)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); useAppStore.getState().setSelectedCultivationId(c.id); setActiveModule('cultivation-detail') }}><Eye className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {total} cultivations · page {page} of {Math.max(1, Math.ceil(total / limit))}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit)}>Next</Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCultivation} onOpenChange={v => { if (!v) setDeletingCultivation(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cultivation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingCultivation?.cropName}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deletingCultivation && handleDelete(deletingCultivation)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function CultivationCreateForm({ onSaved, cultivation }: { onSaved: () => void; cultivation?: Cultivation | null }) {
  const [saving, setSaving] = useState(false)
  const [farms, setFarms] = useState<Array<{ id: string; name: string; farmer?: { firstName: string; lastName: string } }>>([])
  const [form, setForm] = useState<Record<string, any>>({})
  const selectedFarmId = useAppStore(s => s.selectedFarmId)
  const isEdit = !!cultivation

  useEffect(() => {
    fetch('/api/farm-lands')
      .then(r => r.json())
      .then(data => {
        const farmList = data.farms || []
        setFarms(farmList)
        if (cultivation) {
          setForm({
            farmId: cultivation.farmId || cultivation.farm?.id || '',
            cropName: cultivation.cropName || '',
            variety: cultivation.variety || '',
            season: cultivation.season || '',
            sowingDate: cultivation.sowingDate ? cultivation.sowingDate.split('T')[0] : '',
            estimatedYield: cultivation.estimatedYield ?? '',
            cropCategory: cultivation.cropCategory || '',
            cultivationAreaHa: cultivation.cultivationAreaHa ?? '',
            seedSource: cultivation.seedSource || '',
            isSeedTreated: cultivation.isSeedTreated ?? false,
            seedType: cultivation.seedType || '',
            seedQuantity: cultivation.seedQuantity ?? '',
            seedPrice: cultivation.seedPrice ?? '',
            sowingType: cultivation.sowingType || '',
            sowingChargesBy: cultivation.sowingChargesBy || '',
            sowingCharges: cultivation.sowingCharges ?? '',
          })
        } else if (selectedFarmId) {
          setForm(prev => ({ ...prev, farmId: selectedFarmId }))
        }
      })
      .catch(() => {})
  }, [selectedFarmId, cultivation])

  const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  // Auto-calc seed cost preview
  const qty = parseFloat(form.seedQuantity) || 0
  const price = parseFloat(form.seedPrice) || 0
  const seedCostPreview = qty * price
  const areaHa = parseFloat(form.cultivationAreaHa) || 0
  const charges = parseFloat(form.sowingCharges) || 0
  const sowingCostPreview = form.sowingChargesBy === 'hectare' ? areaHa * charges : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.farmId) { toast.error('Select a farm land'); return }
    if (!form.cropName) { toast.error('Crop name is required'); return }
    setSaving(true)
    try {
      const url = isEdit ? `/api/cultivations/${cultivation.id}` : '/api/cultivations'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(isEdit ? `${form.cropName} updated!` : `Cultivation of ${form.cropName} created!`)
        onSaved()
      } else {
        toast.error(data.error || `Failed to ${isEdit ? 'update' : 'create'} cultivation`)
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Farm Land *</Label>
          <Select value={form.farmId || ''} onValueChange={v => update('farmId', v)}>
            <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
            <SelectContent className="max-h-72">
              {farms.map(f => <SelectItem key={f.id} value={f.id}>{f.name}{f.farmer ? ` — ${f.farmer.firstName} ${f.farmer.lastName}` : ''}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Crop Name *</Label><Input value={form.cropName || ''} onChange={e => update('cropName', e.target.value)} placeholder="e.g. Coffee Arabica" /></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1.5"><Label>Variety</Label><Input value={form.variety || ''} onChange={e => update('variety', e.target.value)} placeholder="e.g. SL28" /></div>
        <div className="space-y-1.5"><Label>Season</Label>
          <Select value={form.season || ''} onValueChange={v => update('season', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{SEASONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Category</Label>
          <Select value={form.cropCategory || ''} onValueChange={v => update('cropCategory', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{CROP_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Sowing Date</Label><Input type="date" value={form.sowingDate?.split('T')[0] || ''} onChange={e => update('sowingDate', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-1.5"><Label>Cultivation Area (ha)</Label><Input type="number" step="0.01" value={form.cultivationAreaHa ?? ''} onChange={e => update('cultivationAreaHa', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Estimated Yield (kg)</Label><Input type="number" value={form.estimatedYield ?? ''} onChange={e => update('estimatedYield', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Sowing Type</Label>
          <Select value={form.sowingType || ''} onValueChange={v => update('sowingType', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{SOWING_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <Separator />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Seed Information</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1.5"><Label>Seed Source</Label>
          <Select value={form.seedSource || ''} onValueChange={v => update('seedSource', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{SEED_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Seed Type</Label>
          <Select value={form.seedType || ''} onValueChange={v => update('seedType', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{SEED_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Seed Quantity (kg)</Label><Input type="number" step="0.01" value={form.seedQuantity ?? ''} onChange={e => update('seedQuantity', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Seed Price (per kg)</Label><Input type="number" step="0.01" value={form.seedPrice ?? ''} onChange={e => update('seedPrice', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <Label>Is Seed Treated?</Label>
          <Select value={form.isSeedTreated === true ? 'yes' : form.isSeedTreated === false ? 'no' : ''} onValueChange={v => update('isSeedTreated', v === 'yes')}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {seedCostPreview > 0 && (
        <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs">
          <span className="text-muted-foreground">Auto-calculated seed cost:</span>{' '}
          <strong className="text-emerald-700 dark:text-emerald-300">UGX {seedCostPreview.toLocaleString()}</strong>{' '}
          <span className="text-muted-foreground">({qty} kg × UGX {price})</span>
        </div>
      )}
      <Separator />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sowing Cost</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-1.5"><Label>Sowing Charges By</Label>
          <Select value={form.sowingChargesBy || ''} onValueChange={v => update('sowingChargesBy', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent><SelectItem value="hectare">Hectare</SelectItem><SelectItem value="hour">Hour</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Sowing Charges</Label><Input type="number" step="0.01" value={form.sowingCharges ?? ''} onChange={e => update('sowingCharges', e.target.value)} /></div>
        {form.sowingChargesBy === 'hour' && <div className="space-y-1.5"><Label>Sowing Hours</Label><Input type="number" step="0.01" value={form.sowingHours ?? ''} onChange={e => update('sowingHours', e.target.value)} /></div>}
      </div>
      {sowingCostPreview > 0 && (
        <div className="p-2 rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs">
          <span className="text-muted-foreground">Auto-calculated sowing cost:</span>{' '}
          <strong className="text-purple-700 dark:text-purple-300">UGX {sowingCostPreview.toLocaleString()}</strong>{' '}
          <span className="text-muted-foreground">({areaHa} ha × UGX {charges})</span>
        </div>
      )}
      <DialogFooter className="gap-2">
        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
        <Button type="submit" disabled={saving} className="gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {isEdit ? 'Update Cultivation' : 'Create Cultivation'}</Button>
      </DialogFooter>
    </form>
  )
}

function CultivationDetail({ cultivation, onBack }: { cultivation: Cultivation; onBack: () => void }) {
  const totalCost = (cultivation.seedCost || 0) + (cultivation.sowingCost || 0)

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back to Cultivations</Button>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0"><Sprout className="w-7 h-7 text-emerald-600" /></div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{cultivation.cropName}{cultivation.variety ? ` — ${cultivation.variety}` : ''}</h2>
              <p className="text-sm text-muted-foreground">
                {cultivation.farm?.name ? `Farm: ${cultivation.farm.name}` : ''}
                {cultivation.farm?.farmer ? ` · Farmer: ${cultivation.farm.farmer.firstName} ${cultivation.farm.farmer.lastName}` : ''}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">{cultivation.season || 'No season'}</Badge>
                {cultivation.cropCategory && <Badge variant="outline">{cultivation.cropCategory}</Badge>}
                <Badge className={cn('text-[10px]', statusColor[cultivation.status] || '')}>{cultivation.status}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><Ruler className="w-5 h-5 mx-auto text-blue-600 mb-1" /><p className="text-xs text-muted-foreground">Area</p><p className="text-lg font-bold">{cultivation.cultivationAreaHa?.toFixed(2) ?? '—'} ha</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Calendar className="w-5 h-5 mx-auto text-amber-600 mb-1" /><p className="text-xs text-muted-foreground">Sowing</p><p className="text-sm font-bold">{cultivation.sowingDate ? new Date(cultivation.sowingDate).toLocaleDateString() : '—'}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><DollarSign className="w-5 h-5 mx-auto text-emerald-600 mb-1" /><p className="text-xs text-muted-foreground">Seed Cost</p><p className="text-sm font-bold">{cultivation.seedCost ? `UGX ${cultivation.seedCost.toLocaleString()}` : '—'}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><DollarSign className="w-5 h-5 mx-auto text-purple-600 mb-1" /><p className="text-xs text-muted-foreground">Sowing Cost</p><p className="text-sm font-bold">{cultivation.sowingCost ? `UGX ${cultivation.sowingCost.toLocaleString()}` : '—'}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><FlaskConical className="w-4 h-4" /> Seed Information</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Seed Source" value={cultivation.seedSource} />
            <DetailRow label="Seed Type" value={cultivation.seedType} />
            <DetailRow label="Seed Treated" value={cultivation.isSeedTreated ? 'Yes' : 'No'} />
            <DetailRow label="Seed Quantity" value={cultivation.seedQuantity ? `${cultivation.seedQuantity} kg` : undefined} />
            <DetailRow label="Seed Price" value={cultivation.seedPrice ? `UGX ${cultivation.seedPrice}/kg` : undefined} />
            <DetailRow label="Seed Cost (auto)" value={cultivation.seedCost ? `UGX ${cultivation.seedCost.toLocaleString()}` : undefined} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4" /> Sowing Information</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Sowing Type" value={cultivation.sowingType} />
            <DetailRow label="Charges By" value={cultivation.sowingChargesBy} />
            <DetailRow label="Sowing Charges" value={cultivation.sowingCharges ? `UGX ${cultivation.sowingCharges}` : undefined} />
            <DetailRow label="Sowing Cost (auto)" value={cultivation.sowingCost ? `UGX ${cultivation.sowingCost.toLocaleString()}` : undefined} />
            <Separator />
            <DetailRow label="Estimated Yield" value={cultivation.estimatedYield ? `${cultivation.estimatedYield} kg` : undefined} />
            <DetailRow label="Actual Yield" value={cultivation.actualYield ? `${cultivation.actualYield} kg` : undefined} />
          </CardContent>
        </Card>
      </div>

      {/* Cost of Cultivation summary */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4" /> Cost of Cultivation Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs text-muted-foreground">Seed Cost</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">UGX {(cultivation.seedCost || 0).toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
              <p className="text-xs text-muted-foreground">Sowing Cost</p>
              <p className="text-lg font-bold text-purple-700 dark:text-purple-300">UGX {(cultivation.sowingCost || 0).toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-muted-foreground">Total Cost</p>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-300">UGX {totalCost.toLocaleString()}</p>
            </div>
          </div>
          {cultivation.cultivationAreaHa && (
            <p className="text-xs text-muted-foreground mt-3">
              Cost per hectare: <strong>UGX {(totalCost / cultivation.cultivationAreaHa).toFixed(0)}</strong>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || '—'}</span>
    </div>
  )
}
