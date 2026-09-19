'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft, MapPin, Sprout, Droplets, Users, FlaskConical,
  ShieldCheck, Loader2, Pencil, LandPlot, TreePine, Tractor,
  Cable, Navigation, XCircle, Plus, Trash2, Save,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'

interface FarmLandDetail {
  id: string
  farmerId: string
  name: string
  sizeHectares: number | null
  latitude: number | null
  longitude: number | null
  landOwnership: string | null
  landSurveyNo?: string | null
  waterSource: string | null
  soilFertility: string | null
  landTopology: string | null
  powerSource: string | null
  irrigationType: string | null
  irrigationSource?: string | null
  landGradient?: string | null
  approachRoad?: string | null
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
  // EKiBBO Sheet-3: simplified into "Crops per Plot" — captures plant count per crop type
  // (per Issac's clarification — keeps the Farm Land KPI breakdown working without the
  // full Cultivation module).
  cultivations?: Array<{
    id: string
    cropName: string
    variety: string | null
    season: string | null
    cultivationAreaHa: number | null
    seedlingCount?: number | null
    bambooVariety?: string | null
  }>
  polygonPoints?: Array<{ id: string; latitude: number; longitude: number; pointOrder: number; altitude?: number | null }>
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
  // EKiBBO Sheet-3: renamed from 'Cultivations' to 'Crops per Plot' (per Issac's
  // clarification — the standalone Cultivation module is hidden for EKiBBO,
  // but plant counts per crop type are still captured inline here).
  { value: 'crops', label: 'Crops per Plot', icon: Sprout },
]

export function FarmLandDetailPage({ farmLandId, onBack }: Props) {
  const { setActiveModule, setSelectedFarmLandId } = useAppStore()
  const [farmLand, setFarmLand] = useState<FarmLandDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // EKiBBO Sheet-3 — inline "Crops per Plot" add form state.
  // Replaces the broken "Add Cultivation" button that redirected to dashboard
  // (because the Cultivation module is hidden for EKiBBO).
  const [showCropForm, setShowCropForm] = useState(false)
  const [cropForm, setCropForm] = useState({
    cropName: '',
    variety: '',
    season: '',
    cultivationAreaHa: '',
    seedlingCount: '',
    bambooVariety: '',
  })
  const [savingCrop, setSavingCrop] = useState(false)
  const [deletingCropId, setDeletingCropId] = useState<string | null>(null)

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

  const handleEdit = () => {
    setSelectedFarmLandId(farmLandId)
    setActiveModule('farmland-edit')
  }

  // EKiBBO Sheet-3 — inline "Add Crop" handler (creates a Cultivation row
  // linked to this farm land, with cropName + seedlingCount + area + variety).
  // This replaces the old "Add Cultivation" button that navigated to a
  // hidden module and bounced the user to the dashboard.
  const handleAddCrop = async () => {
    if (!cropForm.cropName.trim()) {
      toast.error('Crop name is required')
      return
    }
    setSavingCrop(true)
    try {
      const payload: Record<string, any> = {
        farmId: farmLandId,
        cropName: cropForm.cropName.trim(),
        variety: cropForm.variety.trim() || null,
        season: cropForm.season || null,
        cultivationAreaHa: cropForm.cultivationAreaHa ? parseFloat(cropForm.cultivationAreaHa) : null,
        cropCategory: 'Main Crop', // default — full categorization moved off this form
        seedlingCount: cropForm.seedlingCount ? parseInt(cropForm.seedlingCount) : null,
        bambooVariety: cropForm.bambooVariety || null,
      }
      const res = await fetch('/api/cultivations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `Failed (HTTP ${res.status})`)
      }
      toast.success(`Added "${cropForm.cropName}" to this plot`)
      setCropForm({ cropName: '', variety: '', season: '', cultivationAreaHa: '', seedlingCount: '', bambooVariety: '' })
      setShowCropForm(false)
      load() // refresh
    } catch (e: any) {
      toast.error(e.message || 'Failed to add crop')
    } finally {
      setSavingCrop(false)
    }
  }

  const handleDeleteCrop = async (cultivationId: string, cropName: string) => {
    if (!confirm(`Remove "${cropName}" from this plot?`)) return
    setDeletingCropId(cultivationId)
    try {
      const res = await fetch(`/api/cultivations/${cultivationId}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `Failed (HTTP ${res.status})`)
      }
      toast.success(`Removed "${cropName}"`)
      load() // refresh
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete crop')
    } finally {
      setDeletingCropId(null)
    }
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
                if (tab.value === 'crops') count = cultivationCount
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* landTopology now stores physical features (JSON array) */}
                    <InfoField label="Physical Features" value={Array.isArray(farmLand.landTopology) ? (farmLand.landTopology as any).join(', ') : farmLand.landTopology} />
                    {/* approachRoad now stores access map (text/URL) */}
                    <InfoField label="Access Map" value={farmLand.approachRoad} />
                    <InfoField label="Soil Fertility" value={farmLand.soilFertility} />
                  </div>
                </CardContent>
              </Card>

              {/* Farm Boundary Map */}
              {farmLand.polygonPoints && farmLand.polygonPoints.length >= 3 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" /> Farm Boundary ({farmLand.polygonPoints.length} points)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FarmPolygonOSM polygonPoints={farmLand.polygonPoints} farmName={farmLand.name} />
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

            {/* EKiBBO Sheet-3 — Crops per Plot Tab (replaces old Cultivations tab)
                The standalone Cultivation module is hidden for EKiBBO, but plant
                counts per crop type are still captured here so the Farm Land KPI
                breakdown (total plants, plant count by crop) on the dashboard keeps
                working. Per Issac's clarification on Q1. */}
            <TabsContent value="crops" className="mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sprout className="w-4 h-4 text-primary" /> Crops per Plot ({cultivationCount})
                    </CardTitle>
                    {!showCropForm && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setShowCropForm(true)}
                        className="gap-1.5 h-7"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Crop
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Inline Add Crop Form */}
                  {showCropForm && (
                    <div className="border rounded-lg p-3 bg-muted/20 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Crop Name *</Label>
                          <Input
                            value={cropForm.cropName}
                            onChange={e => setCropForm(p => ({ ...p, cropName: e.target.value }))}
                            placeholder="e.g. Coffee, Cocoa, Shade tree"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Variety</Label>
                          <Input
                            value={cropForm.variety}
                            onChange={e => setCropForm(p => ({ ...p, variety: e.target.value }))}
                            placeholder="e.g. Robusta, Arabica, Bamboo"
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Plant Count</Label>
                          <Input
                            type="number"
                            value={cropForm.seedlingCount}
                            onChange={e => setCropForm(p => ({ ...p, seedlingCount: e.target.value }))}
                            placeholder="e.g. 250"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Area (ha)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={cropForm.cultivationAreaHa}
                            onChange={e => setCropForm(p => ({ ...p, cultivationAreaHa: e.target.value }))}
                            placeholder="e.g. 0.5"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Season</Label>
                          <Select
                            value={cropForm.season}
                            onValueChange={v => setCropForm(p => ({ ...p, season: v }))}
                          >
                            <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">—</SelectItem>
                              <SelectItem value="Season A">Season A</SelectItem>
                              <SelectItem value="Season B">Season B</SelectItem>
                              <SelectItem value="Annual">Annual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowCropForm(false)
                            setCropForm({ cropName: '', variety: '', season: '', cultivationAreaHa: '', seedlingCount: '', bambooVariety: '' })
                          }}
                          className="h-8"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddCrop}
                          disabled={savingCrop || !cropForm.cropName.trim()}
                          className="gap-1.5 h-8"
                        >
                          {savingCrop ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          {savingCrop ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Existing crops list */}
                  {farmLand.cultivations && farmLand.cultivations.length > 0 ? (
                    <div className="space-y-2">
                      {farmLand.cultivations.map(c => (
                        <div key={c.id} className="p-3 rounded-lg border bg-card flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium truncate">{c.cropName}</p>
                              {c.variety && <Badge variant="outline" className="text-[10px]">{c.variety}</Badge>}
                              {c.season && <Badge variant="secondary" className="text-[10px]">{c.season}</Badge>}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {c.seedlingCount != null && (
                                <span className="flex items-center gap-1">
                                  <TreePine className="w-3 h-3" /> {c.seedlingCount.toLocaleString()} plants
                                </span>
                              )}
                              {c.cultivationAreaHa != null && (
                                <span>{c.cultivationAreaHa} ha</span>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                            disabled={deletingCropId === c.id}
                            onClick={() => handleDeleteCrop(c.id, c.cropName)}
                            title="Remove crop"
                          >
                            {deletingCropId === c.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    !showCropForm && (
                      <div className="text-center py-8 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                        <Sprout className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm text-muted-foreground">No crops added to this plot yet.</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Click "Add Crop" above to capture crop type + plant count (used for the Farm Land KPI breakdown).
                        </p>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
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
 * FarmPolygonOSM — renders a farm's polygon on an embedded OpenStreetMap.
 * Calculates a bounding box from the polygon points and shows all markers.
 */
function FarmPolygonOSM({ polygonPoints, farmName }: { polygonPoints: Array<{ latitude: number; longitude: number; pointOrder: number }>; farmName: string }) {
  if (!polygonPoints || polygonPoints.length < 3) {
    return <div className="text-center py-8 text-muted-foreground text-sm">No polygon data</div>
  }

  const sorted = [...polygonPoints].sort((a, b) => a.pointOrder - b.pointOrder)
  const lats = sorted.map(p => p.latitude)
  const lngs = sorted.map(p => p.longitude)
  const minLat = Math.min(...lats) - 0.002
  const maxLat = Math.max(...lats) + 0.002
  const minLng = Math.min(...lngs) - 0.002
  const maxLng = Math.max(...lngs) + 0.002
  const centerLat = (minLat + maxLat) / 2
  const centerLng = (minLng + maxLng) / 2

  const markerParams = sorted.map(p => `marker=${p.latitude},${p.longitude}`).join('&')
  const bbox = `${minLng},${minLat},${maxLng},${maxLat}`
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&${markerParams}`

  return (
    <div className="space-y-3">
      <div className="rounded-lg overflow-hidden border border-border/40">
        <iframe
          src={osmUrl}
          className="w-full h-[350px] border-0"
          loading="lazy"
          title={`Farm Boundary — ${farmName}`}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{sorted.length} GPS points · auto-calculated boundary</span>
        <a
          href={`https://www.openstreetmap.org/?mlat=${centerLat}&mlon=${centerLng}#map=16/${centerLat}/${centerLng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center gap-1"
        >
          <MapPin className="w-3 h-3" /> Open in OpenStreetMap
        </a>
      </div>
    </div>
  )
}

export default FarmLandDetailPage
