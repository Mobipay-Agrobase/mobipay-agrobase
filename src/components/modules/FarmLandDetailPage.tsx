'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  ArrowLeft, MapPin, Sprout, Droplets, Users, FlaskConical,
  ShieldCheck, Loader2, Pencil, LandPlot, TreePine, Tractor,
  Cable, Navigation, XCircle, Plus, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { useAppStore } from '@/lib/store'
import { FARM_PLANT_CATEGORIES, varietiesForCategory } from '@/lib/farm-plants-catalog'

// Satellite (Esri World Imagery) Leaflet map — same basemap as every other map
// in the project. Client-only: Leaflet touches window at import time.
const FarmMapReadOnly = dynamic(() => import('@/components/farmers/FarmMapReadOnly'), {
  ssr: false,
  loading: () => <div className="h-[350px] rounded-lg overflow-hidden border bg-muted/30 animate-pulse" />,
})

interface FarmLandDetail {
  id: string
  farmerId: string
  name: string
  sizeHectares: number | null
  latitude: number | null
  longitude: number | null
  landOwnership: string | null
  soilFertility: string | null
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
  fullTimeWorkers: number | null
  partTimeWorkers: number | null
  seasonalWorkers: number | null
  familyWorkers: number | null
  lastChemicalApplicationDate?: string | null
  conventionalLands?: string | null
  soilAnalyses?: Array<{
    id?: string
    collectionDate?: string | null
    labTestingDate?: string | null
    resultDate?: string | null
    samplesInfo?: string | null
    criteria: string
    criteriaValue?: string | null
    uom?: string | null
  }>
  farmer?: { id: string; firstName: string; lastName: string }
  cultivations?: Array<{
    id: string
    cropName: string
    variety: string
    season: string
    cultivationAreaHa: number | null
  }>
  polygonPoints?: Array<{ id: string; latitude: number; longitude: number; pointOrder: number; altitude?: number | null }>
}

interface FarmPlantRow {
  id: string
  cropCategory: string
  // Optional Crop Master link (null = review-catalog-only category)
  cropMasterName?: string | null
  variety: string | null
  plantCount: number
  notes: string | null
  createdAt?: string
}

interface Props {
  farmLandId: string
  onBack: () => void
}

const TAB_CONFIG = [
  { value: 'overview', label: 'Overview', icon: LandPlot },
  { value: 'soil', label: 'Soil & Irrigation', icon: Droplets },
  { value: 'labour', label: 'Labour', icon: Users },
  { value: 'conversion', label: 'Conversion', icon: ShieldCheck },
  // Second review (H): per-farm plant inventory — data entry for the
  // "Total Plants" registry KPI (Coffee–Robusta, Cocoa varieties, Vanilla,
  // Bamboo seedlings, Shade Trees, Bananas, Jackfruit, Avocado, Cassava).
  { value: 'plants', label: 'Plants', icon: TreePine },
  { value: 'cultivations', label: 'Cultivations', icon: Sprout },
]

export function FarmLandDetailPage({ farmLandId, onBack }: Props) {
  const { setActiveModule, setSelectedFarmLandId } = useAppStore()
  const [farmLand, setFarmLand] = useState<FarmLandDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Second review (H): plant inventory state
  const [plants, setPlants] = useState<FarmPlantRow[]>([])
  const [plantsLoading, setPlantsLoading] = useState(false)
  const [plantDialogOpen, setPlantDialogOpen] = useState(false)
  const [editingPlant, setEditingPlant] = useState<FarmPlantRow | null>(null)
  const [plantForm, setPlantForm] = useState<{ cropCategory: string; variety: string; plantCount: string; notes: string }>({ cropCategory: '', variety: '', plantCount: '', notes: '' })
  const [savingPlant, setSavingPlant] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/farm-lands/${farmLandId}`)
      .then(r => r.json())
      .then(d => {
        setFarmLand(d.farm || d.data || d.farmLand || null)
        setLoading(false)
      })
      .catch(() => { toast.error('Failed to load farm land'); setLoading(false) })
  }, [farmLandId])

  useEffect(() => { load() }, [load])

  const loadPlants = useCallback(() => {
    setPlantsLoading(true)
    fetch(`/api/farm-plants?farmId=${farmLandId}`)
      .then(r => r.json())
      .then(d => { setPlants(d.plants || []); setPlantsLoading(false) })
      .catch(() => { setPlantsLoading(false) })
  }, [farmLandId])

  useEffect(() => { loadPlants() }, [loadPlants])

  const openAddPlant = () => {
    setEditingPlant(null)
    setPlantForm({ cropCategory: '', variety: '', plantCount: '', notes: '' })
    setPlantDialogOpen(true)
  }

  const openEditPlant = (p: FarmPlantRow) => {
    setEditingPlant(p)
    setPlantForm({ cropCategory: p.cropCategory, variety: p.variety || '', plantCount: String(p.plantCount), notes: p.notes || '' })
    setPlantDialogOpen(true)
  }

  const savePlant = async () => {
    const plantCount = parseInt(plantForm.plantCount, 10)
    if (!plantForm.cropCategory) { toast.error('Select a crop category'); return }
    if (Number.isNaN(plantCount) || plantCount < 0) { toast.error('Plant count must be a non-negative number'); return }
    setSavingPlant(true)
    try {
      const res = await fetch(editingPlant ? `/api/farm-plants/${editingPlant.id}` : '/api/farm-plants', {
        method: editingPlant ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId: farmLandId,
          cropCategory: plantForm.cropCategory,
          variety: plantForm.variety || null,
          plantCount,
          notes: plantForm.notes || null,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success(editingPlant ? 'Plant record updated' : 'Plant record added')
      setPlantDialogOpen(false)
      loadPlants()
    } catch {
      toast.error('Failed to save plant record')
    } finally {
      setSavingPlant(false)
    }
  }

  const deletePlant = async (p: FarmPlantRow) => {
    if (!confirm(`Delete ${p.cropCategory}${p.variety ? ` — ${p.variety}` : ''} (${p.plantCount} plants)?`)) return
    try {
      const res = await fetch(`/api/farm-plants/${p.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Plant record deleted')
      loadPlants()
    } catch {
      toast.error('Failed to delete plant record')
    }
  }

  const handleEdit = () => {
    setSelectedFarmLandId(farmLandId)
    setActiveModule('farmland-edit')
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b bg-card px-6 py-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!farmLand) return <div className="text-center p-8 text-muted-foreground">Farm land not found</div>

  const cultivationCount = farmLand.cultivations?.length || 0
  const totalPlantsOnFarm = plants.reduce((s, p) => s + (p.plantCount || 0), 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">{farmLand.name}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {farmLand.farmer && <span>{farmLand.farmer.firstName} {farmLand.farmer.lastName}</span>}
                  {farmLand.sizeHectares && <span>· {farmLand.sizeHectares} ha</span>}
                </div>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleEdit} className="gap-1.5">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b bg-card/50 px-6 shrink-0">
            <TabsList className="h-auto gap-0 bg-transparent p-0 -mb-px">
              {TAB_CONFIG.map(tab => {
                const Icon = tab.icon
                let count: number | undefined
                if (tab.value === 'cultivations') count = cultivationCount
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="relative rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none gap-1.5"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {count !== undefined && count > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{count}</Badge>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <LandPlot className="w-4 h-4 text-primary" /> Farm Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoField label="Farm Name" value={farmLand.name} />
                    <InfoField label="Farmer" value={farmLand.farmer ? `${farmLand.farmer.firstName} ${farmLand.farmer.lastName}` : ''} />
                    <InfoField label="Area (ha)" value={farmLand.sizeHectares ? String(farmLand.sizeHectares) : ''} />
                    <InfoField label="Ownership" value={farmLand.landOwnership} />
                    <InfoField label="GPS Coordinates" value={farmLand.latitude && farmLand.longitude ? `${farmLand.latitude.toFixed(6)}, ${farmLand.longitude.toFixed(6)}` : ''} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" /> Location Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Second review (G): typology/gradient/water/power/road removed */}
                    <InfoField label="Neighbouring Features" value={(Array.isArray(farmLand.neighbouringFeatures) ? farmLand.neighbouringFeatures : []).join(', ')} />
                    <InfoField label="Access Map (GPS)" value={farmLand.accessMapLat != null && farmLand.accessMapLng != null ? `${farmLand.accessMapLat.toFixed(5)}, ${farmLand.accessMapLng.toFixed(5)}` : undefined} />
                    <InfoField label="Soil Fertility" value={farmLand.soilFertility} />
                  </div>
                </CardContent>
              </Card>

              {/* Farm Boundary Map — SATELLITE view (Esri World Imagery),
                  consistent with every other map in the project. */}
              {farmLand.polygonPoints && farmLand.polygonPoints.length >= 3 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" /> Farm Boundary ({farmLand.polygonPoints.length} points)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FarmBoundarySatellite polygonPoints={farmLand.polygonPoints} farmLand={farmLand} />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Soil & Irrigation Tab */}
            <TabsContent value="soil" className="mt-0 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-primary" /> Irrigation Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoField label="Irrigation Source" value={farmLand.irrigationSource} />
                    <InfoField label="Irrigation Type" value={farmLand.irrigationType} />
                    <InfoField label="Soil Fertility" value={farmLand.soilFertility} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-primary" /> Soil Analysis Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {farmLand.soilAnalyses && farmLand.soilAnalyses.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Criteria</th>
                            <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Value</th>
                            <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">UOM</th>
                          </tr>
                        </thead>
                        <tbody>
                          {farmLand.soilAnalyses.map((a, i) => (
                            <tr key={a.id || i} className="border-b hover:bg-muted/30">
                              <td className="py-2 px-3">{a.criteria || '—'}</td>
                              <td className="py-2 px-3">{a.criteriaValue || '—'}</td>
                              <td className="py-2 px-3">{a.uom || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No soil analysis data available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Labour Tab */}
            <TabsContent value="labour" className="mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> Worker Counts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoField label="Full-Time Workers" value={farmLand.fullTimeWorkers != null ? String(farmLand.fullTimeWorkers) : ''} />
                    <InfoField label="Part-Time Workers" value={farmLand.partTimeWorkers != null ? String(farmLand.partTimeWorkers) : ''} />
                    <InfoField label="Seasonal Workers" value={farmLand.seasonalWorkers != null ? String(farmLand.seasonalWorkers) : ''} />
                    <InfoField label="Family Workers" value={farmLand.familyWorkers != null ? String(farmLand.familyWorkers) : ''} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Conversion Tab */}
            <TabsContent value="conversion" className="mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" /> Conversion Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoField label="Chemical Application Date" value={farmLand.lastChemicalApplicationDate} />
                    <InfoField label="Conventional Lands" value={farmLand.conventionalLands} />
                    <InfoField label="Certification Type" value={farmLand.certType} />
                    <InfoField label="Conversion Status" value={farmLand.conversionStatus} />
                    <InfoField label="Inspector Name" value={farmLand.inspectorName} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Plants Tab — Second review (H): per-farm plant inventory */}
            <TabsContent value="plants" className="mt-0 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <TreePine className="w-4 h-4 text-primary" /> Plant Inventory ({totalPlantsOnFarm.toLocaleString()} plants)
                    </span>
                    <Button size="sm" onClick={openAddPlant} className="gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Add Plants
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {plantsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : plants.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No plants recorded yet. Click "Add Plants" to record the crop inventory for this farm
                      (Coffee, Cocoa, Vanilla, Bamboo seedlings, Shade Trees, Bananas, Jackfruit, Avocado, Cassava).
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Crop Type</TableHead>
                            <TableHead>Variety</TableHead>
                            <TableHead>Crop Master</TableHead>
                            <TableHead className="text-right">Plant Count</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {plants.map(p => (
                            <TableRow key={p.id}>
                              <TableCell className="text-sm font-medium">
                                {p.cropCategory}
                              </TableCell>
                              <TableCell className="text-sm">{p.variety || '—'}</TableCell>
                              <TableCell className="text-sm">
                                {p.cropMasterName ? (
                                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-[10px] gap-1" title="Linked to the Crop Master registry">
                                    {p.cropMasterName}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-xs" title="Review catalog entry — no Crop Master counterpart">catalog only</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-right font-semibold">{p.plantCount.toLocaleString()}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{p.notes || '—'}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEditPlant(p)}>
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete" onClick={() => deletePlant(p)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cultivations Tab */}
            <TabsContent value="cultivations" className="mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-primary" /> Cultivations ({cultivationCount})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {farmLand.cultivations && farmLand.cultivations.length > 0 ? (
                    <div className="space-y-3">
                      {farmLand.cultivations.map(c => (
                        <div key={c.id} className="p-3 rounded-lg border bg-muted/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{c.cropName}</p>
                              <p className="text-xs text-muted-foreground">{c.variety}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-[10px]">{c.season}</Badge>
                              {c.cultivationAreaHa && <Badge variant="outline" className="text-[10px]">{c.cultivationAreaHa} ha</Badge>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No cultivations on this farm land</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Second review (H): Add / Edit plant inventory record */}
      <Dialog open={plantDialogOpen} onOpenChange={setPlantDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPlant ? 'Edit Plant Record' : 'Add Plants'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Crop Type</Label>
              <Select
                value={plantForm.cropCategory}
                onValueChange={(v) => setPlantForm(f => ({ ...f, cropCategory: v, variety: '' }))}
              >
                <SelectTrigger><SelectValue placeholder="Select crop type" /></SelectTrigger>
                <SelectContent>
                  {FARM_PLANT_CATEGORIES.map(c => (
                    <SelectItem key={c.category} value={c.category}>{c.category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Crop types are auto-linked to the Crop Master registry when a matching crop exists there; review-only categories (Shade Trees, Bamboo seedlings…) stay catalog-managed.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Variety {varietiesForCategory(plantForm.cropCategory).length === 0 && <span className="text-muted-foreground font-normal">(none for this crop)</span>}</Label>
              <Select
                value={plantForm.variety}
                onValueChange={(v) => setPlantForm(f => ({ ...f, variety: v }))}
                disabled={varietiesForCategory(plantForm.cropCategory).length === 0}
              >
                <SelectTrigger><SelectValue placeholder={varietiesForCategory(plantForm.cropCategory).length === 0 ? '—' : 'Select variety'} /></SelectTrigger>
                <SelectContent>
                  {varietiesForCategory(plantForm.cropCategory).map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plant Count</Label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 250"
                value={plantForm.plantCount}
                onChange={(e) => setPlantForm(f => ({ ...f, plantCount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                placeholder="e.g. planted 2024 season A"
                value={plantForm.notes}
                onChange={(e) => setPlantForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlantDialogOpen(false)}>Cancel</Button>
            <Button onClick={savePlant} disabled={savingPlant}>
              {savingPlant && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingPlant ? 'Save Changes' : 'Add Plants'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value || '—'}</p>
    </div>
  )
}

/**
 * FarmBoundarySatellite — renders the farm polygon on the project-wide
 * SATELLITE basemap (Esri World Imagery via FarmMapReadOnly) with a
 * "Open in Google Maps (satellite)" deep link for full-screen viewing.
 * Replaces the old OpenStreetMap street-map iframe.
 */
function FarmBoundarySatellite({
  polygonPoints,
  farmLand,
}: {
  polygonPoints: Array<{ latitude: number; longitude: number; pointOrder: number; altitude?: number | null }>
  farmLand: FarmLandDetail
}) {
  const sorted = [...polygonPoints].sort((a, b) => a.pointOrder - b.pointOrder)
  const centerLat = sorted.reduce((s, p) => s + p.latitude, 0) / sorted.length
  const centerLng = sorted.reduce((s, p) => s + p.longitude, 0) / sorted.length

  return (
    <div className="space-y-3">
      <FarmMapReadOnly
        farms={[{
          id: farmLand.id,
          name: farmLand.name,
          sizeHectares: farmLand.sizeHectares,
          latitude: farmLand.latitude,
          longitude: farmLand.longitude,
          landOwnership: farmLand.landOwnership,
          polygonPoints: sorted,
        }]}
        height="350px"
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{sorted.length} GPS points · satellite view</span>
        <a
          href={`https://maps.google.com/maps?q=${centerLat},${centerLng}&t=k&z=17`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center gap-1"
        >
          <MapPin className="w-3 h-3" /> Open in Google Maps (satellite)
        </a>
      </div>
    </div>
  )
}

export default FarmLandDetailPage
