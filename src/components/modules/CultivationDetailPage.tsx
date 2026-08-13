'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Sprout, Pencil, Leaf } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'

interface CultivationDetail {
  id: string
  farmId: string
  cropCategory: string | null
  season: string | null
  cropName: string | null
  variety: string | null
  cultivationAreaHa: number | null
  sowingDate: string | null
  estimatedYield: number | null
  status: string | null
  seedSource: string | null
  isSeedTreated: boolean | null
  seedType: string | null
  seedQuantity: number | null
  seedPrice: number | null
  seedCost: number | null
  sowingType: string | null
  sowingChargesBy: string | null
  sowingCharges: number | null
  sowingCost: number | null
  farm?: { id: string; name: string }
}

interface Props {
  cultivationId: string
  onBack: () => void
}

export function CultivationDetailPage({ cultivationId, onBack }: Props) {
  const { setActiveModule, setSelectedCultivationId } = useAppStore()
  const [cultivation, setCultivation] = useState<CultivationDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/cultivations/${cultivationId}`)
      .then(r => r.json())
      .then(d => {
        setCultivation(d.data || d.cultivation || null)
        setLoading(false)
      })
      .catch(() => { toast.error('Failed to load cultivation'); setLoading(false) })
  }, [cultivationId])

  useEffect(() => { load() }, [load])

  const handleEdit = () => {
    setSelectedCultivationId(cultivationId)
    setActiveModule('cultivation-edit')
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

  if (!cultivation) return <div className="text-center p-8 text-muted-foreground">Cultivation not found</div>

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
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Sprout className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">{cultivation.cropName || 'Cultivation'}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {cultivation.variety && <span>{cultivation.variety}</span>}
                  {cultivation.farm && <span>· {cultivation.farm.name}</span>}
                </div>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleEdit} className="gap-1.5">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Section 1: Cultivation Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sprout className="w-4 h-4 text-emerald-600" /> Cultivation Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoField label="Farm / Plot" value={cultivation.farm?.name} />
              <InfoField label="Crop Category" value={cultivation.cropCategory} />
              <InfoField label="Season" value={cultivation.season} />
              <InfoField label="Crop" value={cultivation.cropName} />
              <InfoField label="Variety" value={cultivation.variety} />
              <InfoField label="Area (ha)" value={cultivation.cultivationAreaHa != null ? String(cultivation.cultivationAreaHa) : ''} />
              <InfoField label="Sowing Date" value={cultivation.sowingDate ? new Date(cultivation.sowingDate).toLocaleDateString() : ''} />
              <InfoField label="Est Yield" value={cultivation.estimatedYield != null ? `${cultivation.estimatedYield} kg` : ''} />
              <InfoField label="Status" value={cultivation.status} />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Seed Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Leaf className="w-4 h-4 text-amber-600" /> Seed Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoField label="Seed Source" value={cultivation.seedSource} />
              <div>
                <p className="text-xs text-muted-foreground">Is Seed Treated</p>
                <Badge variant={cultivation.isSeedTreated ? 'default' : 'secondary'} className="text-[10px] mt-0.5">
                  {cultivation.isSeedTreated ? 'Yes' : 'No'}
                </Badge>
              </div>
              <InfoField label="Seed Type" value={cultivation.seedType} />
              <InfoField label="Seed Quantity" value={cultivation.seedQuantity != null ? `${cultivation.seedQuantity} kg` : ''} />
              <InfoField label="Seed Price" value={cultivation.seedPrice != null ? `UGX ${cultivation.seedPrice.toLocaleString()}` : ''} />
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Seed Cost</p>
                <div className="p-2 rounded-md border text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                  {cultivation.seedCost != null ? `UGX ${cultivation.seedCost.toLocaleString()}` : '—'}
                </div>
              </div>
              <InfoField label="Sowing Type" value={cultivation.sowingType} />
              <InfoField label="Sowing Charges By" value={cultivation.sowingChargesBy} />
              <InfoField label="Sowing Charges" value={cultivation.sowingCharges != null ? `UGX ${cultivation.sowingCharges.toLocaleString()}` : ''} />
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Sowing Cost</p>
                <div className="p-2 rounded-md border text-xs font-semibold bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300">
                  {cultivation.sowingCost != null ? `UGX ${cultivation.sowingCost.toLocaleString()}` : '—'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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

export default CultivationDetailPage
