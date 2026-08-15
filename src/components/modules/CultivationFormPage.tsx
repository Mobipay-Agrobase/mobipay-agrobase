'use client'

import React, { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import {
  ArrowLeft, Loader2, Sprout, Save
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { CatalogSelect } from '@/components/ui/catalog-select'
import { CropVarietySelect } from '@/components/ui/crop-variety-select'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CultivationFormPageProps {
  mode: 'create' | 'edit'
  cultivationId?: string
  farmId?: string
}

interface FarmLand {
  id: string
  name: string
  farmer?: { firstName: string; lastName: string }
}

export default function CultivationFormPage({ mode, cultivationId, farmId }: CultivationFormPageProps) {
  const { setActiveModule, setSelectedFarmLandId } = useAppStore()
  const [loadingData, setLoadingData] = useState(mode === 'edit')
  const [initialData, setInitialData] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [farms, setFarms] = useState<FarmLand[]>([])

  const [form, setForm] = useState<Record<string, any>>({
    farmId: farmId || '',
    cropCategory: 'Main Crop',
    harvestSeason: '',
    cultivatedCrop: '',
    cropVariety: '',
    cultivationAreaHa: '',
    sowingDate: '',
    cropCalendar: '',
    estYield: '',
    photo: null,
    seedSource: '',
    isSeedTreated: 'No',
    seedType: '',
    seedQuantityUsed: '',
    seedPrice: '',
    seedCost: 0,
    typeOfSowing: '',
    sowingChargesBy: '',
    sowingCharges: '',
    sowingCost: 0,
    sowingHours: '',
  })

  const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  // Auto-calc
  const qty = parseFloat(form.seedQuantityUsed) || 0
  const price = parseFloat(form.seedPrice) || 0
  const seedCost = qty * price

  const areaHa = parseFloat(form.cultivationAreaHa) || 0
  const charges = parseFloat(form.sowingCharges) || 0
  const hours = parseFloat(form.sowingHours) || 0
  const sowingCost = form.sowingChargesBy === 'hectare' ? areaHa * charges : hours * charges

  useEffect(() => {
    fetch('/api/farm-lands')
      .then(r => r.json())
      .then(data => {
        const farmList = data.farms || data.data || []
        setFarms(farmList)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (mode === 'edit' && cultivationId) {
      setLoadingData(true)
      fetch(`/api/cultivations/${cultivationId}`)
        .then(r => r.json())
        .then(data => {
          setInitialData(data)
          setForm({
            farmId: data.farmId || data.farm?.id || '',
            cropCategory: data.cropCategory || 'Main Crop',
            harvestSeason: data.season || '',
            cultivatedCrop: data.cropName || '',
            cropVariety: data.variety || '',
            cultivationAreaHa: data.cultivationAreaHa ?? '',
            sowingDate: data.sowingDate ? data.sowingDate.split('T')[0] : '',
            cropCalendar: data.cropCalendar || '',
            estYield: data.estimatedYield ?? '',
            photo: null,
            seedSource: data.seedSource || '',
            isSeedTreated: data.isSeedTreated === true ? 'Yes' : 'No',
            seedType: data.seedType || '',
            seedQuantityUsed: data.seedQuantity ?? '',
            seedPrice: data.seedPrice ?? '',
            seedCost: 0,
            typeOfSowing: data.sowingType || '',
            sowingChargesBy: data.sowingChargesBy || '',
            sowingCharges: data.sowingCharges ?? '',
            sowingCost: 0,
            sowingHours: data.sowingHours ?? '',
          })
        })
        .catch(() => toast.error('Failed to load cultivation data'))
        .finally(() => setLoadingData(false))
    }
  }, [mode, cultivationId])

  useEffect(() => {
    if (mode === 'create' && farmId) {
      setForm(p => ({ ...p, farmId }))
    }
  }, [mode, farmId])

  const handleBack = () => {
    setSelectedFarmLandId(null)
    setActiveModule('cultivations')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.farmId) { toast.error('Farm / Plot is required'); return }
    if (!form.harvestSeason) { toast.error('Harvest Season is required'); return }
    if (!form.cultivatedCrop) { toast.error('Cultivated Crop is required'); return }
    if (!form.cropVariety) { toast.error('Crop Variety is required'); return }
    if (!form.cultivationAreaHa) { toast.error('Cultivation Area is required'); return }
    if (!form.sowingDate) { toast.error('Sowing Date is required'); return }
    if (!form.seedSource) { toast.error('Seed Source is required'); return }
    if (!form.seedQuantityUsed) { toast.error('Seed Quantity is required'); return }
    if (!form.seedPrice) { toast.error('Seed Price is required'); return }
    if (!form.typeOfSowing) { toast.error('Type of Sowing is required'); return }
    if (!form.sowingChargesBy) { toast.error('Sowing Charges By is required'); return }
    if (!form.sowingCharges) { toast.error('Sowing Charges is required'); return }

    setSaving(true)
    try {
      const num = (v: any) => (v === '' || v == null ? undefined : Number(v))
      const str = (v: any) => (v === '' || v == null ? undefined : v)

      const payload: Record<string, any> = {
        farmId: form.farmId,
        cropCategory: str(form.cropCategory),
        season: str(form.harvestSeason),
        cropName: str(form.cultivatedCrop),
        variety: str(form.cropVariety),
        cultivationAreaHa: num(form.cultivationAreaHa),
        sowingDate: str(form.sowingDate),
        cropCalendar: str(form.cropCalendar),
        estimatedYield: num(form.estYield),
        seedSource: str(form.seedSource),
        isSeedTreated: form.isSeedTreated === 'Yes',
        seedType: str(form.seedType),
        seedQuantity: num(form.seedQuantityUsed),
        seedPrice: num(form.seedPrice),
        seedCost: seedCost || undefined,
        sowingType: str(form.typeOfSowing),
        sowingChargesBy: str(form.sowingChargesBy),
        sowingCharges: num(form.sowingCharges),
        sowingCost: sowingCost || undefined,
        sowingHours: num(form.sowingHours),
      }

      const url = mode === 'edit' ? `/api/cultivations/${cultivationId}` : '/api/cultivations'
      const method = mode === 'edit' ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || err.detail || `Failed to ${mode === 'edit' ? 'update' : 'create'} cultivation`)
      }
      toast.success(mode === 'edit' ? 'Cultivation updated successfully' : 'Cultivation created successfully')
      handleBack()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save cultivation')
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
                {mode === 'edit' ? `Edit Cultivation — ${initialData?.cropName ?? ''}` : 'Create New Cultivation'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {mode === 'edit' ? 'Update cultivation information' : 'Fill in the details to register a new cultivation'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleBack}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving} className="gap-2" form="cultivation-form">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" /> Save
            </Button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto">
        {loadingData ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 w-full rounded bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="p-4 md:p-6">
            <form id="cultivation-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: Cultivation Information */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-emerald-600" />
                    Cultivation Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Farm / Plot Name" required>
                      <Select value={form.farmId} onValueChange={v => update('farmId', v)}>
                        <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
                        <SelectContent className="max-h-72">
                          {farms.map(f => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name}{f.farmer ? ` — ${f.farmer.firstName} ${f.farmer.lastName}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label="Crop Category" required>
                      <RadioGroup value={form.cropCategory} onValueChange={v => update('cropCategory', v)} className="flex gap-4 pt-2">
                        {['Main Crop', 'Inter Crop', 'Border Crop'].map(cat => (
                          <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer">
                            <RadioGroupItem value={cat} />
                            {cat}
                          </label>
                        ))}
                      </RadioGroup>
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Harvest Season" required>
                      <CatalogSelect category="rice_crop_season" value={form.harvestSeason} onValueChange={v => update('harvestSeason', v)} placeholder="Select season" />
                    </FormField>
                  </div>

                  {/* Crop + Variety cascade dropdown — crop from Crop Master, variety from Crop Variety Master */}
                  <FormField label="Cultivated Crop &amp; Variety *" required>
                    <CropVarietySelect
                      cropValue={form.cultivatedCrop}
                      onCropChange={v => update('cultivatedCrop', v)}
                      varietyValue={form.cropVariety}
                      onVarietyChange={v => update('cropVariety', v)}
                    />
                  </FormField>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Cultivation Area (Ha)" required>
                      <Input type="number" step="0.01" value={form.cultivationAreaHa} onChange={e => update('cultivationAreaHa', e.target.value)} placeholder="0.00" />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Sowing Date" required>
                      <Input type="date" value={form.sowingDate} onChange={e => update('sowingDate', e.target.value)} />
                    </FormField>

                    <FormField label="Crop Calendar">
                      <Select value={form.cropCalendar} onValueChange={v => update('cropCalendar', v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="early">Early</SelectItem>
                          <SelectItem value="late">Late</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Est Yield">
                      <Input type="number" step="0.01" value={form.estYield} onChange={e => update('estYield', e.target.value)} placeholder="kg" />
                    </FormField>

                    <FormField label="Photo">
                      <Input type="file" accept="image/*" onChange={e => update('photo', e.target.files?.[0] || null)} />
                    </FormField>
                  </div>
                </CardContent>
              </Card>

              {/* Section 2: Seed Information */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-amber-600" />
                    Seed Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Seed Source" required>
                      <CatalogSelect category="seed_source" value={form.seedSource} onValueChange={v => update('seedSource', v)} placeholder="Select source" />
                    </FormField>

                    <FormField label="Is Seed Treated">
                      <RadioGroup value={form.isSeedTreated} onValueChange={v => update('isSeedTreated', v)} className="flex gap-4 pt-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <RadioGroupItem value="Yes" />
                          Yes
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <RadioGroupItem value="No" />
                          No
                        </label>
                      </RadioGroup>
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Seed Type">
                      <CatalogSelect category="seed_type" value={form.seedType} onValueChange={v => update('seedType', v)} placeholder="Select type" />
                    </FormField>

                    <FormField label="Seed Quantity Used" required>
                      <Input type="number" step="0.01" value={form.seedQuantityUsed} onChange={e => update('seedQuantityUsed', e.target.value)} placeholder="kg" />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Price of Seed" required>
                      <Input type="number" step="0.01" value={form.seedPrice} onChange={e => update('seedPrice', e.target.value)} placeholder="per kg" />
                    </FormField>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Seed Cost (auto-calculated)</Label>
                      <div className={cn(
                        'p-2 rounded-md border text-xs font-semibold',
                        seedCost > 0
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                          : 'bg-muted border-border text-muted-foreground'
                      )}>
                        {seedCost > 0 ? `UGX ${seedCost.toLocaleString()}` : '—'}
                        {seedCost > 0 && (
                          <span className="ml-2 font-normal text-muted-foreground">
                            ({qty} × {price})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Type of Sowing" required>
                      <CatalogSelect category="sowing_type" value={form.typeOfSowing} onValueChange={v => update('typeOfSowing', v)} placeholder="Select type" />
                    </FormField>

                    <FormField label="Sowing Charges By" required>
                      <CatalogSelect category="sowing_charges_by" value={form.sowingChargesBy} onValueChange={v => update('sowingChargesBy', v)} placeholder="Select" />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Sowing Charges" required>
                      <Input type="number" step="0.01" value={form.sowingCharges} onChange={e => update('sowingCharges', e.target.value)} placeholder="UGX" />
                    </FormField>

                    {form.sowingChargesBy === 'hour' && (
                      <FormField label="Sowing Hours" required>
                        <Input type="number" step="0.01" value={form.sowingHours} onChange={e => update('sowingHours', e.target.value)} placeholder="hours" />
                      </FormField>
                    )}

                    <div className="space-y-1.5">
                      <Label className="text-xs">Sowing Cost (auto-calculated)</Label>
                      <div className={cn(
                        'p-2 rounded-md border text-xs font-semibold',
                        sowingCost > 0
                          ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300'
                          : 'bg-muted border-border text-muted-foreground'
                      )}>
                        {sowingCost > 0 ? `UGX ${sowingCost.toLocaleString()}` : '—'}
                        {sowingCost > 0 && (
                          <span className="ml-2 font-normal text-muted-foreground">
                            ({form.sowingChargesBy === 'hectare' ? `${areaHa} ha × ${charges}` : `${hours} hrs × ${charges}`})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}{required && ' *'}</Label>
      {children}
    </div>
  )
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}
