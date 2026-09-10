'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  Search, Plus, Eye, X, MapPin, Ruler, Sprout, Layers, Table as TableIcon,
  ArrowLeft, Loader2, Map as MapIcon, Crosshair, Trash2, Save, Calendar,
  Leaf, Droplets, Users as UsersIcon, FlaskConical, ShieldCheck, Pencil
} from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { StatCard, StatCardGrid } from '@/components/ui/stat-card'
import dynamic from 'next/dynamic'
import { useAppStore } from '@/lib/store'

const PolygonMap = dynamic(() => import('@/components/farmers/PolygonMap'), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border bg-muted/30 flex items-center justify-center" style={{ height: 420 }}>
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  ),
})

// Lightweight farm map (read-only) for the map tab
const FarmMapReadOnly = dynamic(() => import('@/components/farmers/FarmMapReadOnly'), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border bg-muted/30 flex items-center justify-center" style={{ height: 500 }}>
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  ),
})

import { CatalogSelect } from '@/components/ui/catalog-select'

interface FarmLand {
  id: string
  farmerId: string
  name: string
  sizeHectares: number | null
  latitude: number | null
  longitude: number | null
  landOwnership: string | null
  soilFertility: string | null
  // Second review (G)
  neighbouringFeatures?: string[] | string | null
  accessMapLat?: number | null
  accessMapLng?: number | null
  irrigationType: string | null
  irrigationSource?: string | null
  certType: string | null
  conversionStatus: string | null
  conversionDate?: string | null
  inspectorName?: string | null
  conversionQualified?: boolean | null
  conversionRemarks?: string | null
  fullTimeWorkers: number | null
  partTimeWorkers: number | null
  seasonalWorkers: number | null
  familyWorkers: number | null
  lastChemicalApplicationDate?: string | null
  conventionalLands?: string | null
  fallowPastureLand?: string | null
  conventionalCrops?: string | null
  estYieldKg?: number | null
  soilCollectionDate?: string | null
  soilLabTestingDate?: string | null
  soilResultDate?: string | null
  soilReportUrl?: string | null
  soilSamplesInfo?: string | null
  createdAt: string
  farmer?: { id: string; firstName: string; lastName: string; farmerCode?: string | null }
  polygonPoints?: Array<{ id: string; latitude: number; longitude: number; pointOrder: number; altitude?: number | null }>
  _count?: { cultivations: number; polygonPoints?: number }
  cultivations?: Array<{ id: string; cropName: string; status: string; cultivationAreaHa: number | null }>
  soilAnalyses?: Array<SoilAnalysis>
}

interface SoilAnalysis {
  id?: string
  collectionDate?: string | null
  labTestingDate?: string | null
  resultDate?: string | null
  reportUrl?: string | null
  samplesInfo?: string | null
  criteria: string
  criteriaValue?: string | null
  minValue?: string | null
  maxValue?: string | null
}


export default function FarmLandsView() {
  const { selectedFarmerId, setSelectedFarmerId, setActiveModule } = useAppStore()
  const [farms, setFarms] = useState<FarmLand[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedFarm, setSelectedFarm] = useState<FarmLand | null>(null)
  const [activeTab, setActiveTab] = useState<'table' | 'map'>('table')
  const [filterFarmer, setFilterFarmer] = useState<string>(selectedFarmerId || '')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(20)
  // Second review (H): registry KPIs + plants breakdown dialog
  const [kpis, setKpis] = useState<{ totalPlots: number; totalAcreageHa: number; totalPlants: number; plants: Array<{ crop: string; count: number }>; plantsByVariety: Array<{ label: string; count: number }> } | null>(null)
  const [showPlantsDialog, setShowPlantsDialog] = useState(false)

  const fetchFarms = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterFarmer) params.set('farmerId', filterFarmer)
      if (search) params.set('search', search)
      params.set('page', String(page))
      // Second review (G): table groups plots per farmer → fetch a large page
      params.set('limit', String(Math.max(limit, 500)))
      // Second review (H): registry KPI aggregation (plots / acreage / plants)
      params.set('includeKpis', 'true')
      if (activeTab === 'map') params.set('includePolygons', 'true')
      const res = await fetch(`/api/farm-lands?${params}`)
      const data = await res.json()
      setFarms(data.farms || [])
      if (typeof data.total === 'number') setTotal(data.total)
      if (data.kpis) setKpis(data.kpis)
    } catch (e) {
      console.error(e)
      toast.error('Failed to load farm lands')
    } finally {
      setLoading(false)
    }
  }, [filterFarmer, search, page, limit, activeTab])

  useEffect(() => { fetchFarms() }, [fetchFarms])

  const handleDelete = useCallback(async (farm: FarmLand) => {
    if (!confirm(`Are you sure you want to delete "${farm.name}"? This action cannot be undone.`)) return
    try {
      const res = await fetch(`/api/farm-lands/${farm.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(`Farm land "${farm.name}" deleted`)
        fetchFarms()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete farm land')
      }
    } catch {
      toast.error('Network error')
    }
  }, [fetchFarms])

  const filtered = farms

  // Second review (G): organise the registry by farmer — one row per farmer
  // showing their plots (Plot 1, 2, 3…) and total farm area.
  const farmerGroups = useMemo(() => {
    const map = new Map<string, {
      farmerId: string
      farmerCode: string
      farmerName: string
      plots: Array<{ id: string; name: string; area: number }>
    }>()
    for (const f of filtered) {
      const key = f.farmer?.id || f.farmerId
      if (!key) continue
      let g = map.get(key)
      if (!g) {
        g = {
          farmerId: key,
          farmerCode: f.farmer?.farmerCode || '',
          farmerName: f.farmer ? `${f.farmer.firstName} ${f.farmer.lastName}` : 'Unknown',
          plots: [],
        }
        map.set(key, g)
      }
      g.plots.push({ id: f.id, name: f.name, area: f.sizeHectares || 0 })
    }
    return Array.from(map.values())
  }, [filtered])

  // Debounce search + reset to page 1 before refetching (server-side).
  useEffect(() => {
    const t = setTimeout(() => { setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const totalArea = farms.reduce((s, f) => s + (f.sizeHectares || 0), 0)
  const withPolygon = farms.filter(f => (f._count?.polygonPoints ?? f.polygonPoints?.length ?? 0) >= 3).length
  const withCultivations = farms.filter(f => (f._count?.cultivations || 0) > 0).length

  if (selectedFarm) {
    return <FarmLandDetail farm={selectedFarm} onBack={() => setSelectedFarm(null)} />
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Farm Land Registry</h3>
          <p className="text-sm text-muted-foreground">
            {farms.length} farm lands · {totalArea.toFixed(2)} ha total · {withPolygon} with GPS polygon
          </p>
        </div>
        <div className="flex gap-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'table' | 'map')}>
            <TabsList className="grid grid-cols-2 h-9">
              <TabsTrigger value="table" className="text-xs gap-1.5"><TableIcon className="w-3.5 h-3.5" /> Table</TabsTrigger>
              <TabsTrigger value="map" className="text-xs gap-1.5"><MapIcon className="w-3.5 h-3.5" /> Map</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => setActiveModule('farmland-create')} className="gap-2">
            <Plus className="w-4 h-4" /> Register Farm Land
          </Button>
        </div>
      </div>

      {/* Second review (H): Farm Land Registry KPI cards */}
      <StatCardGrid>
        <StatCard icon={<Layers />} label="Total Land Plots" value={kpis ? kpis.totalPlots : farms.length} tone="emerald" />
        <StatCard icon={<Ruler />} label="Total Acreage" value={`${(kpis ? kpis.totalAcreageHa : totalArea).toFixed(2)} ha`} tone="blue" />
        <Card
          className="cursor-pointer hover:ring-2 hover:ring-emerald-400/60 transition-all"
          onClick={() => setShowPlantsDialog(true)}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <Sprout className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Plants</p>
              <p className="text-xl font-bold">{(kpis?.totalPlants ?? 0).toLocaleString()}</p>
              <p className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium">View more details →</p>
            </div>
          </CardContent>
        </Card>
      </StatCardGrid>

      {/* Second review (H): Total Plants breakdown per crop type / variety */}
      <Dialog open={showPlantsDialog} onOpenChange={setShowPlantsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Total Plants — Breakdown per Crop Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(kpis?.plants ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No plant records yet (crop production / shade tree data).</p>
            ) : (
              <>
                <div className="space-y-2">
                  {(kpis?.plants ?? []).map(p => (
                    <div key={p.crop} className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20">
                      <span className="text-sm font-medium">{p.crop}</span>
                      <span className="text-sm font-bold">{p.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                {(kpis?.plantsByVariety ?? []).length > 0 && (
                  <>
                    <Separator />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Variety Detail</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {(kpis?.plantsByVariety ?? []).map(v => (
                        <div key={v.label} className="flex items-center justify-between text-xs p-2 rounded bg-muted/30">
                          <span className="text-muted-foreground truncate">{v.label}</span>
                          <span className="font-semibold ml-2">{v.count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by farm name, farmer, ownership..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {filterFarmer && (
          <Button variant="ghost" size="sm" onClick={() => setFilterFarmer('')} className="gap-1">
            <X className="w-3.5 h-3.5" /> Clear farmer filter
          </Button>
        )}
      </div>

      {/* Table or Map */}
      {activeTab === 'table' ? (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Layers className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No farm lands registered</p>
                <p className="text-sm mt-1">Click "Register Farm Land" to add the first one</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                  <TableRow>
                    {/* Second review (G): columns = Farmer Code, Farmer Name, Plots, Total Farm Area */}
                    <TableHead>Farmer Code</TableHead>
                    <TableHead>Farmer Name</TableHead>
                    <TableHead>Plots</TableHead>
                    <TableHead>Total Farm Area (ha)</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {farmerGroups.map(g => (
                    <TableRow key={g.farmerId} className="cursor-pointer hover:bg-muted/50 align-top" onClick={() => { useAppStore.getState().setSelectedFarmerId(g.farmerId); setActiveModule('farmer-detail') }}>
                      <TableCell className="text-sm font-mono text-xs">{g.farmerCode || '—'}</TableCell>
                      <TableCell className="text-sm font-medium">{g.farmerName}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {g.plots.map((p, i) => (
                            <button
                              key={p.id}
                              type="button"
                              className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border bg-muted/30 hover:bg-primary/10 transition-colors"
                              onClick={(e) => { e.stopPropagation(); useAppStore.getState().setSelectedFarmLandId(p.id); setActiveModule('farmland-detail') }}
                              title={`View ${p.name}`}
                            >
                              <span className="text-[10px] font-semibold text-muted-foreground">Plot {i + 1}</span>
                              <span className="font-medium">{p.name}</span>
                              <span className="text-muted-foreground">{p.area ? `${p.area.toFixed(2)} ha` : ''}</span>
                            </button>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-semibold">
                        {g.plots.reduce((s2, p) => s2 + p.area, 0).toFixed(2)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {g.plots.length === 1 && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit plot" onClick={() => { useAppStore.getState().setSelectedFarmLandId(g.plots[0].id); setActiveModule('farmland-edit') }}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete plot" onClick={() => { const farm = filtered.find(f => f.id === g.plots[0].id); if (farm) handleDelete(farm) }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {total > limit && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">{(page - 1) * limit + 1}</span>–{Math.min(page * limit, total)} of {total}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">Page {page} of {Math.ceil(total / limit)}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapIcon className="w-4 h-4" /> Farm Lands Map View
            </CardTitle>
            <CardDescription>{farms.length} farm lands · {withPolygon} with GPS polygons</CardDescription>
          </CardHeader>
          <CardContent>
            <FarmMapReadOnly farms={farms} onSelect={(id) => {
              const f = farms.find(x => x.id === id)
              if (f) setSelectedFarm(f)
            }} />
          </CardContent>
        </Card>
      )}

    </div>
  )
}

// Second review: inline create/edit form removed (dead code) — the
// dedicated FarmLandFormPage module handles create/edit.

function FarmLandDetail({ farm, onBack }: { farm: FarmLand; onBack: () => void }) {
  const [cultivations, setCultivations] = useState<any[]>([])
  const [loadingCult, setLoadingCult] = useState(false)
  const [soilAnalyses, setSoilAnalyses] = useState<SoilAnalysis[]>([])

  useEffect(() => {
    setLoadingCult(true)
    fetch(`/api/cultivations?farmId=${farm.id}`)
      .then(r => r.json())
      .then(data => setCultivations(data.cultivations || []))
      .catch(() => {})
      .finally(() => setLoadingCult(false))

    fetch(`/api/farm-lands/${farm.id}/soil-analyses`)
      .then(r => r.json())
      .then(data => setSoilAnalyses(data.analyses || []))
      .catch(() => {})
  }, [farm.id])

  const polygonPoints = farm.polygonPoints || []
  const hasPolygon = polygonPoints.length >= 3

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Farm Lands
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
              <Layers className="w-7 h-7 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{farm.name}</h2>
              <p className="text-sm text-muted-foreground">
                {farm.farmer ? `Farmer: ${farm.farmer.firstName} ${farm.farmer.lastName}` : 'Unassigned'} · Created {new Date(farm.createdAt).toLocaleDateString()}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {farm.landOwnership && <Badge variant="outline">{farm.landOwnership}</Badge>}
                {(Array.isArray(farm.neighbouringFeatures) ? farm.neighbouringFeatures : []).map((ft: string) => (
                  <Badge key={ft} variant="outline" className="bg-blue-50 dark:bg-blue-900/30">{ft}</Badge>
                ))}
                {farm.soilFertility && <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/30">Fertility: {farm.soilFertility}</Badge>}
                {farm.certType && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{farm.certType}</Badge>}
                {farm.conversionStatus && <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{farm.conversionStatus}</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><Ruler className="w-5 h-5 mx-auto text-blue-600 mb-1" /><p className="text-xs text-muted-foreground">Total Area</p><p className="text-lg font-bold">{farm.sizeHectares?.toFixed(2) ?? '—'} ha</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Sprout className="w-5 h-5 mx-auto text-emerald-600 mb-1" /><p className="text-xs text-muted-foreground">Cultivations</p><p className="text-lg font-bold">{cultivations.length}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><MapPin className="w-5 h-5 mx-auto text-purple-600 mb-1" /><p className="text-xs text-muted-foreground">GPS Polygon</p><p className="text-lg font-bold">{hasPolygon ? 'Mapped' : 'None'}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><UsersIcon className="w-5 h-5 mx-auto text-amber-600 mb-1" /><p className="text-xs text-muted-foreground">Total Workers</p><p className="text-lg font-bold">{(farm.fullTimeWorkers || 0) + (farm.partTimeWorkers || 0) + (farm.seasonalWorkers || 0) + (farm.familyWorkers || 0)}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Map */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><MapIcon className="w-4 h-4" /> Farm Boundary</CardTitle></CardHeader>
          <CardContent>
            {hasPolygon ? (
              <FarmMapReadOnly farms={[farm]} height="300px" />
            ) : (
              <div className="aspect-video rounded-lg bg-muted/30 border-2 border-dashed flex items-center justify-center text-sm text-muted-foreground">
                <div className="text-center"><MapPin className="w-8 h-8 mx-auto mb-2" />No GPS polygon defined</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Soil & Access (second review G: water/power/survey removed; access map added) */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><FlaskConical className="w-4 h-4" /> Soil &amp; Access</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Soil Fertility" value={farm.soilFertility} />
            <DetailRow label="Irrigation Type" value={farm.irrigationType} />
            <DetailRow label="Neighbouring Features" value={(Array.isArray(farm.neighbouringFeatures) ? farm.neighbouringFeatures : []).join(', ') || undefined} />
            <DetailRow label="Access Map (GPS)" value={farm.accessMapLat != null && farm.accessMapLng != null ? `${farm.accessMapLat.toFixed(5)}, ${farm.accessMapLng.toFixed(5)}` : undefined} />
          </CardContent>
        </Card>
      </div>

      {/* Soil Analysis Records */}
      {soilAnalyses.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FlaskConical className="w-4 h-4" /> Soil Analysis Records ({soilAnalyses.length} criteria)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Criteria</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Min Permissible</TableHead>
                  <TableHead>Max Permissible</TableHead>
                  <TableHead className="hidden md:table-cell">Collection Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {soilAnalyses.map((a, idx) => (
                  <TableRow key={a.id || idx}>
                    <TableCell className="font-medium text-sm">{a.criteria}</TableCell>
                    <TableCell className="text-sm">{a.criteriaValue || '—'}</TableCell>
                    <TableCell className="text-sm">{a.minValue || '—'}</TableCell>
                    <TableCell className="text-sm">{a.maxValue || '—'}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {a.collectionDate ? new Date(a.collectionDate).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Cultivations on this farm */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><Sprout className="w-4 h-4" /> Cultivations on this Farm ({cultivations.length})</CardTitle>
          <Button size="sm" className="gap-1.5" onClick={() => {
            useAppStore.getState().setSelectedFarmId(farm.id)
            useAppStore.getState().setActiveModule('cultivations')
          }}>
            <Plus className="w-3.5 h-3.5" /> Add Cultivation
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loadingCult ? (
            <div className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}</div>
          ) : cultivations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No cultivations registered on this farm yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Crop</TableHead>
                  <TableHead>Variety</TableHead>
                  <TableHead>Season</TableHead>
                  <TableHead>Area (ha)</TableHead>
                  <TableHead>Seed Cost</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cultivations.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-sm">{c.cropName}</TableCell>
                    <TableCell className="text-sm">{c.variety || '—'}</TableCell>
                    <TableCell className="text-sm">{c.season || '—'}</TableCell>
                    <TableCell className="text-sm">{c.cultivationAreaHa?.toFixed(2) ?? '—'}</TableCell>
                    <TableCell className="text-sm">{c.seedCost ? `UGX ${c.seedCost.toLocaleString()}` : '—'}</TableCell>
                    <TableCell><Badge variant="outline">{c.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DetailRow({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground flex items-center gap-1.5">{icon}{label}</span>
      <span className="font-medium">{value || '—'}</span>
    </div>
  )
}
