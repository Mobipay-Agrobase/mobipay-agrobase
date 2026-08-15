'use client'

import React, { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import {
  ArrowLeft, Loader2, Save, MapPin, Sprout, Droplets, Users,
  FlaskConical, ShieldCheck, Crosshair
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { CatalogSelect } from '@/components/ui/catalog-select'

const PolygonMap = dynamic(() => import('@/components/farmers/PolygonMap'), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border bg-muted/30 flex items-center justify-center" style={{ height: 420 }}>
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  ),
})

interface FarmLandFormPageProps {
  mode: 'create' | 'edit'
  farmLandId?: string
  farmerId?: string
}

interface FarmLand {
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
  farmPhotoUrl?: string | null
  landDocumentUrl?: string | null
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
  uom?: string | null
}

const LAND_OWNERSHIP = ['Owned', 'Rent', 'Lease']
const TOPOLOGY = ['Valley', 'Plains', 'Plateaus']
const WATER_SOURCES = ['Well', 'Bore Well', 'Pump']
const POWER_SOURCES = ['Solar', 'Electricity', 'Fuel']
const FERTILITY = ['Good', 'Normal', 'Poor']
const IRRIGATION_TYPES = ['Drip', 'Canal', 'Others']
const CONV_STATUS = ['IC-1', 'IC-2', 'IC-3', 'Organic', 'SRP']
const CERT_TYPES = ['NPOP', 'NOP']
const APPROACH_ROAD = ['close main road', 'inner field', 'close main canal']
const LAND_GRADIENT = ['Up Land', 'Low Land']
const IRRIGATION_SOURCE = ['Rainfed', 'Irrigated']

export default function FarmLandFormPage({ mode, farmLandId, farmerId }: FarmLandFormPageProps) {
  const { setActiveModule } = useAppStore()
  const [loadingFarm, setLoadingFarm] = useState(mode === 'edit')
  const [farmers, setFarmers] = useState<Array<{ id: string; firstName: string; lastName: string; farmerCode?: string | null }>>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({})
  const [polygonPoints, setPolygonPoints] = useState<Array<{ lat: number; lng: number }>>([])
  const [polygonArea, setPolygonArea] = useState(0)
  const [soilAnalyses, setSoilAnalyses] = useState<Array<SoilAnalysis>>([
    { criteria: '', criteriaValue: '', uom: '' }
  ])
  const [approachRoadValues, setApproachRoadValues] = useState<string[]>([])
  const [landGradientValues, setLandGradientValues] = useState<string[]>([])
  const [irrigationSourceValues, setIrrigationSourceValues] = useState<string[]>([])
  const isEditing = mode === 'edit'

  useEffect(() => {
    fetch('/api/farmers?limit=100&status=all')
      .then(r => r.json())
      .then(data => setFarmers(data.farmers || data.data || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (mode === 'edit' && farmLandId) {
      setLoadingFarm(true)
      fetch(`/api/farm-lands/${farmLandId}`)
        .then(r => r.json())
        .then((raw: any) => {
          const data: FarmLand = raw.farm || raw.data || raw
          setForm({
            farmerId: data.farmerId || '',
            name: data.name || '',
            sizeHectares: data.sizeHectares ?? '',
            latitude: data.latitude ?? '',
            longitude: data.longitude ?? '',
            landOwnership: data.landOwnership || '',
            landSurveyNo: data.landSurveyNo || '',
            waterSource: data.waterSource || '',
            soilFertility: data.soilFertility || '',
            landTopology: data.landTopology || '',
            powerSource: data.powerSource || '',
            farmPhotoUrl: data.farmPhotoUrl || '',
            landDocumentUrl: data.landDocumentUrl || '',
            irrigationType: data.irrigationType || '',
            certType: data.certType || '',
            conversionStatus: data.conversionStatus || '',
            conversionDate: data.conversionDate || '',
            inspectorName: data.inspectorName || '',
            conversionQualified: data.conversionQualified ?? false,
            conversionRemarks: data.conversionRemarks || '',
            fullTimeWorkers: data.fullTimeWorkers ?? '',
            partTimeWorkers: data.partTimeWorkers ?? '',
            seasonalWorkers: data.seasonalWorkers ?? '',
            familyWorkers: data.familyWorkers ?? '',
            lastChemicalApplicationDate: data.lastChemicalApplicationDate || '',
            conventionalLands: data.conventionalLands || '',
            fallowPastureLand: data.fallowPastureLand || '',
            conventionalCrops: data.conventionalCrops || '',
            estYieldKg: data.estYieldKg ?? '',
            soilCollectionDate: data.soilCollectionDate || '',
            soilLabTestingDate: data.soilLabTestingDate || '',
            soilResultDate: data.soilResultDate || '',
            soilReportUrl: data.soilReportUrl || '',
            soilSamplesInfo: data.soilSamplesInfo || '',
            approachRoad: data.approachRoad || '',
            landGradient: data.landGradient || '',
            irrigationSource: data.irrigationSource || '',
          })
          if (data.polygonPoints && data.polygonPoints.length > 0) {
            setPolygonPoints(data.polygonPoints.map(p => ({ lat: p.latitude, lng: p.longitude })))
          }
          if (data.soilAnalyses && data.soilAnalyses.length > 0) {
            setSoilAnalyses(data.soilAnalyses.map(a => ({
              id: a.id,
              criteria: a.criteria || '',
              criteriaValue: a.criteriaValue || '',
              uom: a.uom || '',
            })))
          }
          if (data.approachRoad) {
            setApproachRoadValues(data.approachRoad.split(',').map(v => v.trim()).filter(Boolean))
          }
          if (data.landGradient) {
            setLandGradientValues(data.landGradient.split(',').map(v => v.trim()).filter(Boolean))
          }
          if (data.irrigationSource) {
            setIrrigationSourceValues(data.irrigationSource.split(',').map(v => v.trim()).filter(Boolean))
          }
        })
        .catch(() => toast.error('Failed to load farm land data'))
        .finally(() => setLoadingFarm(false))
    }
  }, [mode, farmLandId])

  const handleBack = () => setActiveModule('farm-lands')

  const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const toggleMultiSelect = (field: string, value: string, current: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
    setter(next)
    update(field, next.join(', '))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.farmerId) { toast.error('Please select a farmer'); return }
    if (!form.name) { toast.error('Farm/Plot name is required'); return }
    setSaving(true)
    try {
      // Build a clean payload with ONLY known fields — avoid spreading ...form
      // which can include UI-only state (approachRoadValues etc.) that Prisma rejects.
      const payload: Record<string, any> = {
        farmerId: form.farmerId,
        name: form.name,
        sizeHectares: form.sizeHectares || (polygonArea > 0 ? polygonArea : undefined),
        latitude: form.latitude || undefined,
        longitude: form.longitude || undefined,
        landOwnership: form.landOwnership || undefined,
        landSurveyNo: form.landSurveyNo || undefined,
        waterSource: form.waterSource || undefined,
        soilFertility: form.soilFertility || undefined,
        landTopology: form.landTopology || undefined,
        powerSource: form.powerSource || undefined,
        farmPhotoUrl: form.farmPhotoUrl || undefined,
        landDocumentUrl: form.landDocumentUrl || undefined,
        irrigationType: form.irrigationType || undefined,
        irrigationSource: form.irrigationSource || undefined,
        approachRoad: form.approachRoad || undefined,
        landGradient: form.landGradient || undefined,
        certType: form.certType || undefined,
        conversionStatus: form.conversionStatus || undefined,
        conversionDate: form.conversionDate || undefined,
        inspectorName: form.inspectorName || undefined,
        conversionQualified: form.conversionQualified ?? false,
        conversionRemarks: form.conversionRemarks || undefined,
        fullTimeWorkers: form.fullTimeWorkers || undefined,
        partTimeWorkers: form.partTimeWorkers || undefined,
        seasonalWorkers: form.seasonalWorkers || undefined,
        familyWorkers: form.familyWorkers || undefined,
        lastChemicalApplicationDate: form.lastChemicalApplicationDate || undefined,
        conventionalLands: form.conventionalLands || undefined,
        fallowPastureLand: form.fallowPastureLand || undefined,
        conventionalCrops: form.conventionalCrops || undefined,
        estYieldKg: form.estYieldKg || undefined,
        soilCollectionDate: form.soilCollectionDate || undefined,
        soilLabTestingDate: form.soilLabTestingDate || undefined,
        soilResultDate: form.soilResultDate || undefined,
        soilReportUrl: form.soilReportUrl || undefined,
        soilSamplesInfo: form.soilSamplesInfo || undefined,
        polygonPoints: polygonPoints.length >= 3 ? polygonPoints : undefined,
      }
      const url = isEditing ? `/api/farm-lands/${farmLandId}` : '/api/farm-lands'
      const method = isEditing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        const id = isEditing ? farmLandId : data.farm?.id
        if (id && soilAnalyses.filter(a => a.criteria).length > 0) {
          await fetch(`/api/farm-lands/${id}/soil-analyses`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analyses: soilAnalyses.filter(a => a.criteria) }),
          })
        }
        toast.success(`Farm land "${form.name}" ${isEditing ? 'updated' : 'created'} successfully!`)
        handleBack()
      } else {
        console.error('[FarmLandForm] save failed:', res.status, data)
        toast.error(data.error || `Failed to ${isEditing ? 'update' : 'create'} farm land: ${data.detail || res.status}`)
      }
    } catch (err: any) {
      console.error('[FarmLandForm] network error:', err)
      toast.error(`Network error: ${err.message || 'unknown'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">
                {isEditing
                  ? `Edit Farm Land — ${form.name || 'Loading...'}`
                  : 'Register New Farm Land'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isEditing ? 'Update farm land information' : 'Fill in the details to register a new farm land'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleBack} className="btn-hover-lift">Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={saving} className="gap-2 btn-hover-lift min-w-[100px]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto">
        {loadingFarm ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded" />)}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">
            <Tabs defaultValue="field">
              <TabsList className="h-auto flex-wrap p-1 rounded-xl bg-muted/50 border border-border/40">
                <TabsTrigger value="field" className="text-xs gap-1.5"><Sprout className="w-3.5 h-3.5" /> Field/Farm Info</TabsTrigger>
                <TabsTrigger value="soil" className="text-xs gap-1.5"><Droplets className="w-3.5 h-3.5" /> Soil &amp; Irrigation</TabsTrigger>
                <TabsTrigger value="labour" className="text-xs gap-1.5"><Users className="w-3.5 h-3.5" /> Labour</TabsTrigger>
                <TabsTrigger value="conversion" className="text-xs gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Conversion</TabsTrigger>
                <TabsTrigger value="soil-analysis" className="text-xs gap-1.5"><FlaskConical className="w-3.5 h-3.5" /> Soil Analysis</TabsTrigger>
                <TabsTrigger value="polygon" className="text-xs gap-1.5"><MapPin className="w-3.5 h-3.5" /> GPS Polygon</TabsTrigger>
              </TabsList>

              {/* Section 1: Field/Farm Information */}
              <TabsContent value="field" className="mt-4 space-y-4 form-tab-content">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sprout className="w-4 h-4" /> Field / Farm Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Farmer *</Label>
                        <Select value={form.farmerId || farmerId || ''} onValueChange={v => update('farmerId', v)}>
                          <SelectTrigger><SelectValue placeholder="Select farmer" /></SelectTrigger>
                          <SelectContent className="max-h-72">
                            {farmers.map(f => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.firstName} {f.lastName} {f.farmerCode ? `(${f.farmerCode})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Field/Plot/Farm Name *</Label>
                        <Input value={form.name || ''} onChange={e => update('name', e.target.value)} placeholder="e.g. Kibale Plot 1" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label>Total Land Holding (ha) *</Label>
                        <Input type="number" step="0.01" value={form.sizeHectares ?? ''} onChange={e => update('sizeHectares', e.target.value)} placeholder={polygonArea ? `Auto: ${polygonArea}` : 'Enter area'} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Land Survey No</Label>
                        <Input value={form.landSurveyNo || ''} onChange={e => update('landSurveyNo', e.target.value)} placeholder="Survey number" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Land Ownership *</Label>
                        <CatalogSelect category="land_ownership" value={form.landOwnership || ''} onValueChange={v => update('landOwnership', v)} placeholder="Select" fallbackOptions={LAND_OWNERSHIP} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Pin Farm Location (GPS)</Label>
                        <div className="flex gap-2">
                          <Input type="number" step="any" value={form.latitude ?? ''} onChange={e => update('latitude', e.target.value)} placeholder="Latitude" />
                          <Input type="number" step="any" value={form.longitude ?? ''} onChange={e => update('longitude', e.target.value)} placeholder="Longitude" />
                          <Button type="button" variant="outline" size="icon" className="shrink-0" title="Use current location">
                            <Crosshair className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Land Topology</Label>
                        <CatalogSelect category="land_topology" value={form.landTopology || ''} onValueChange={v => update('landTopology', v)} placeholder="Select" fallbackOptions={TOPOLOGY} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Approach Road (Multi-select)</Label>
                      <div className="flex flex-wrap gap-2">
                        {APPROACH_ROAD.map(opt => (
                          <Button
                            key={opt}
                            type="button"
                            variant={approachRoadValues.includes(opt) ? 'default' : 'outline'}
                            size="sm"
                            className="text-xs"
                            onClick={() => toggleMultiSelect('approachRoad', opt, approachRoadValues, setApproachRoadValues)}
                          >
                            {opt}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Land Gradient (Multi-select)</Label>
                        <div className="flex flex-wrap gap-2">
                          {LAND_GRADIENT.map(opt => (
                            <Button
                              key={opt}
                              type="button"
                              variant={landGradientValues.includes(opt) ? 'default' : 'outline'}
                              size="sm"
                              className="text-xs"
                              onClick={() => toggleMultiSelect('landGradient', opt, landGradientValues, setLandGradientValues)}
                            >
                              {opt}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Farm Photo</Label>
                        <Input value={form.farmPhotoUrl || ''} onChange={e => update('farmPhotoUrl', e.target.value)} placeholder="Photo URL" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Land Document</Label>
                      <Input value={form.landDocumentUrl || ''} onChange={e => update('landDocumentUrl', e.target.value)} placeholder="Document URL" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Water Source</Label>
                        <CatalogSelect category="water_source" value={form.waterSource || ''} onValueChange={v => update('waterSource', v)} placeholder="Select" fallbackOptions={WATER_SOURCES} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Power Source</Label>
                        <CatalogSelect category="power_source" value={form.powerSource || ''} onValueChange={v => update('powerSource', v)} placeholder="Select" fallbackOptions={POWER_SOURCES} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Section 2: Soil and Irrigation Information */}
              <TabsContent value="soil" className="mt-4 space-y-4 form-tab-content">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Droplets className="w-4 h-4" /> Soil and Irrigation Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Fertility Status</Label>
                        <CatalogSelect category="soil_fertility" value={form.soilFertility || ''} onValueChange={v => update('soilFertility', v)} placeholder="Select" fallbackOptions={FERTILITY} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Irrigation Type</Label>
                        <CatalogSelect category="irrigation_type" value={form.irrigationType || ''} onValueChange={v => update('irrigationType', v)} placeholder="Select" fallbackOptions={IRRIGATION_TYPES} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Irrigation Source (Multi-select)</Label>
                      <div className="flex flex-wrap gap-2">
                        {IRRIGATION_SOURCE.map(opt => (
                          <Button
                            key={opt}
                            type="button"
                            variant={irrigationSourceValues.includes(opt) ? 'default' : 'outline'}
                            size="sm"
                            className="text-xs"
                            onClick={() => toggleMultiSelect('irrigationSource', opt, irrigationSourceValues, setIrrigationSourceValues)}
                          >
                            {opt}
                          </Button>
                        ))}
                      </div>
                      {irrigationSourceValues.includes('Irrigated') && (
                        <p className="text-xs text-muted-foreground mt-1">Irrigation type field is shown in the basic section above.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Section 3: Farm Labour Information */}
              <TabsContent value="labour" className="mt-4 space-y-4 form-tab-content">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="w-4 h-4" /> Farm Labour Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <Label>Full-time Workers</Label>
                        <Input type="number" min={0} value={form.fullTimeWorkers ?? ''} onChange={e => update('fullTimeWorkers', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Part-time Workers</Label>
                        <Input type="number" min={0} value={form.partTimeWorkers ?? ''} onChange={e => update('partTimeWorkers', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Seasonal Workers</Label>
                        <Input type="number" min={0} value={form.seasonalWorkers ?? ''} onChange={e => update('seasonalWorkers', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Family Workers</Label>
                        <Input type="number" min={0} value={form.familyWorkers ?? ''} onChange={e => update('familyWorkers', e.target.value)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Section 4 & 5: Conversion Information & Status */}
              <TabsContent value="conversion" className="mt-4 space-y-4 form-tab-content">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Conversion Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Last Date of Chemical Application</Label>
                        <Input type="date" value={form.lastChemicalApplicationDate?.split('T')[0] || ''} onChange={e => update('lastChemicalApplicationDate', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Est Yield (Kg)</Label>
                        <Input type="number" step="0.01" value={form.estYieldKg ?? ''} onChange={e => update('estYieldKg', e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Conventional Lands</Label>
                        <Input value={form.conventionalLands || ''} onChange={e => update('conventionalLands', e.target.value)} placeholder="e.g. Adjacent conventional plots" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Fallow/Pasture Land</Label>
                        <Input value={form.fallowPastureLand || ''} onChange={e => update('fallowPastureLand', e.target.value)} placeholder="e.g. 2 ha fallow" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Conventional Crops</Label>
                      <Input value={form.conventionalCrops || ''} onChange={e => update('conventionalCrops', e.target.value)} placeholder="e.g. Maize, Beans" />
                    </div>
                  </CardContent>
                </Card>

                {/* Section 5: Conversion Status */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Conversion Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Certification Type</Label>
                        <CatalogSelect category="certification_type" value={form.certType || ''} onValueChange={v => update('certType', v)} placeholder="Select" fallbackOptions={CERT_TYPES} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Current Conversion Status</Label>
                        <CatalogSelect category="conversion_status" value={form.conversionStatus || ''} onValueChange={v => update('conversionStatus', v)} placeholder="Select" fallbackOptions={CONV_STATUS} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Date</Label>
                        <Input type="date" value={form.conversionDate?.split('T')[0] || ''} onChange={e => update('conversionDate', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Inspector Name</Label>
                        <Input value={form.inspectorName || ''} onChange={e => update('inspectorName', e.target.value)} placeholder="Inspector name" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Qualified</Label>
                        <Select value={form.conversionQualified ? 'Yes' : 'No'} onValueChange={v => update('conversionQualified', v === 'Yes')}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {!form.conversionQualified && (
                        <div className="space-y-1.5">
                          <Label>Remarks</Label>
                          <Textarea value={form.conversionRemarks || ''} onChange={e => update('conversionRemarks', e.target.value)} placeholder="Reason / notes" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Section 6: Soil Analysis Information */}
              <TabsContent value="soil-analysis" className="mt-4 space-y-4 form-tab-content">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FlaskConical className="w-4 h-4" /> Soil Analysis Information
                      </CardTitle>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSoilAnalyses(prev => [...prev, { criteria: '', criteriaValue: '', uom: '' }])}
                        className="gap-1.5"
                      >
                        <span className="text-lg leading-none">+</span> Add Criteria
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label>Collection Date</Label>
                        <Input type="date" value={form.soilCollectionDate?.split('T')[0] || ''} onChange={e => update('soilCollectionDate', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Lab Testing Date</Label>
                        <Input type="date" value={form.soilLabTestingDate?.split('T')[0] || ''} onChange={e => update('soilLabTestingDate', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Result Date</Label>
                        <Input type="date" value={form.soilResultDate?.split('T')[0] || ''} onChange={e => update('soilResultDate', e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>No of Samples Collected and Area</Label>
                        <Input value={form.soilSamplesInfo || ''} onChange={e => update('soilSamplesInfo', e.target.value)} placeholder="e.g. 3 samples from 2 hectares" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Report Upload</Label>
                        <Input value={form.soilReportUrl || ''} onChange={e => update('soilReportUrl', e.target.value)} placeholder="Report URL" />
                      </div>
                    </div>

                    {soilAnalyses.map((analysis, idx) => (
                      <div key={idx} className="border rounded-lg p-4 space-y-3 relative">
                        {soilAnalyses.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6"
                            onClick={() => setSoilAnalyses(prev => prev.filter((_, i) => i !== idx))}
                          >
                            <span className="text-destructive text-lg leading-none">&times;</span>
                          </Button>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label>Criteria *</Label>
                            <CatalogSelect
                              category="soil_criteria"
                              value={analysis.criteria || ''}
                              onValueChange={v => {
                                const updated = [...soilAnalyses]
                                updated[idx] = { ...updated[idx], criteria: v }
                                setSoilAnalyses(updated)
                              }}
                              placeholder="Select criteria"
                              fallbackOptions={['pH', 'Sulphur(S)', 'Nitrogen(N)', 'Phosphorus(P)', 'Potassium(K)']}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Criteria Value</Label>
                            <Input
                              value={analysis.criteriaValue || ''}
                              onChange={e => {
                                const updated = [...soilAnalyses]
                                updated[idx] = { ...updated[idx], criteriaValue: e.target.value }
                                setSoilAnalyses(updated)
                              }}
                              placeholder="e.g. 6.5"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>UOM</Label>
                            <Input
                              value={analysis.uom || ''}
                              onChange={e => {
                                const updated = [...soilAnalyses]
                                updated[idx] = { ...updated[idx], uom: e.target.value }
                                setSoilAnalyses(updated)
                              }}
                              placeholder="e.g. ppm, mg/kg"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* GPS Polygon Mapping */}
              <TabsContent value="polygon" className="mt-4 space-y-4 form-tab-content">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Farm Land Plotting
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PolygonMap
                      initialPoints={isEditing ? polygonPoints : []}
                      onChange={(pts, a) => { setPolygonPoints(pts); setPolygonArea(a) }}
                    />
                    {polygonArea > 0 && (
                      <div className="mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                          Auto-calculated area: <strong>{polygonArea} hectares</strong> from {polygonPoints.length} polygon points
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </form>
        )}
      </div>
    </div>
  )
}
