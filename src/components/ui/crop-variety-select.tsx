'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface Crop { id: string; name: string }
interface Variety { id: string; name: string; cropId: string }

// Cache crops across all instances
let cropCache: Crop[] | null = null
const varietyCache = new Map<string, Variety[]>()

/**
 * Two-level dropdown: select a crop from Crop Master, then select a variety
 * from Crop Variety Master (filtered by the selected crop).
 *
 * If the current crop/variety values aren't in the masters (legacy data),
 * they're still shown as the selected label.
 */
export function CropVarietySelect({
  cropValue,
  onCropChange,
  varietyValue,
  onVarietyChange,
}: {
  cropValue: string
  onCropChange: (v: string) => void
  varietyValue: string
  onVarietyChange: (v: string) => void
}) {
  const [crops, setCrops] = useState<Crop[]>(cropCache || [])
  const [varieties, setVarieties] = useState<Variety[]>([])
  const [loadingCrops, setLoadingCrops] = useState(!cropCache)
  const [loadingVarieties, setLoadingVarieties] = useState(false)

  // Load crops on mount
  useEffect(() => {
    if (cropCache) return
    let mounted = true
    fetch('/api/master?type=crop&limit=500')
      .then(r => r.json())
      .then(d => {
        if (!mounted) return
        const list = (d.data || []).map((c: any) => ({ id: c.id, name: c.name }))
        cropCache = list
        setCrops(list)
        setLoadingCrops(false)
      })
      .catch(() => { if (mounted) { setCrops([]); setLoadingCrops(false) } })
    return () => { mounted = false }
  }, [])

  // Find the cropId for the selected crop name
  const selectedCropId = crops.find(c => c.name === cropValue)?.id

  // Load varieties when crop changes
  useEffect(() => {
    if (!selectedCropId) {
      setVarieties([])
      return
    }
    // Check cache
    if (varietyCache.has(selectedCropId)) {
      setVarieties(varietyCache.get(selectedCropId)!)
      return
    }
    let mounted = true
    setLoadingVarieties(true)
    fetch(`/api/crop-varieties?cropId=${selectedCropId}`)
      .then(r => r.json())
      .then(d => {
        if (!mounted) return
        const list = (d.data || []).map((v: any) => ({ id: v.id, name: v.name, cropId: v.cropId }))
        varietyCache.set(selectedCropId, list)
        setVarieties(list)
        setLoadingVarieties(false)
      })
      .catch(() => { if (mounted) { setVarieties([]); setLoadingVarieties(false) } })
    return () => { mounted = false }
  }, [selectedCropId])

  // Include current value even if not in the list (legacy data)
  const cropOptions = cropValue && !crops.find(c => c.name === cropValue)
    ? [{ id: '_legacy', name: cropValue }, ...crops]
    : crops

  const varietyOptions = varietyValue && !varieties.find(v => v.name === varietyValue)
    ? [{ id: '_legacy', name: varietyValue, cropId: '' }, ...varieties]
    : varieties

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Crop dropdown */}
      <div className="space-y-1.5">
        <Select
          value={cropValue}
          onValueChange={(v) => {
            onCropChange(v)
            // Clear variety when crop changes
            onVarietyChange('')
          }}
          disabled={loadingCrops}
        >
          <SelectTrigger>
            {loadingCrops
              ? <span className="flex items-center gap-1.5 text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" /> Loading...</span>
              : <SelectValue placeholder="Select crop" />
            }
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {cropOptions.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Variety dropdown (filtered by selected crop) */}
      <div className="space-y-1.5">
        <Select
          value={varietyValue}
          onValueChange={onVarietyChange}
          disabled={!cropValue || loadingVarieties}
        >
          <SelectTrigger>
            {loadingVarieties
              ? <span className="flex items-center gap-1.5 text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" /> Loading...</span>
              : <SelectValue placeholder={!cropValue ? 'Select crop first' : 'Select variety'} />
            }
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {varietyOptions.length === 0
              ? <div className="px-3 py-2 text-xs text-muted-foreground">No varieties configured for this crop. Add them in Crop Variety Master.</div>
              : varietyOptions.map(v => <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>)
            }
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default CropVarietySelect
