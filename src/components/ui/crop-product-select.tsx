'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

// Cache crop names across all instances
let cropCache: string[] | null = null

/**
 * Dropdown that fetches crop names from /api/master?type=crop.
 * Used in delivery + consignment forms so the user selects from the Crop Master
 * instead of typing free text.
 *
 * If the current value isn't in the crop list (e.g. legacy data), it's still
 * shown as the selected label.
 */
export function CropProductSelect({ value, onChange, required }: {
  value: string
  onChange: (v: string) => void
  required?: boolean
}) {
  const [crops, setCrops] = useState<string[]>(cropCache || [])
  const [loading, setLoading] = useState(!cropCache)

  useEffect(() => {
    if (cropCache) return
    let mounted = true
    fetch('/api/master?type=crop&limit=500')
      .then(r => r.json())
      .then(d => {
        if (!mounted) return
        const names = (d.data || []).map((c: any) => c.name).filter(Boolean)
        cropCache = names
        setCrops(names)
        setLoading(false)
      })
      .catch(() => { if (mounted) { setCrops([]); setLoading(false) } })
    return () => { mounted = false }
  }, [])

  // Include the current value even if not in the crop list (for legacy data)
  const options = value && !crops.includes(value) ? [value, ...crops] : crops

  if (loading) {
    return (
      <Select disabled value="" onValueChange={() => {}}>
        <SelectTrigger><SelectValue><span className="flex items-center gap-1.5 text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" /> Loading...</span></SelectValue></SelectTrigger>
        <SelectContent />
      </Select>
    )
  }

  return (
    <Select value={value || ''} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
      <SelectContent className="max-h-60">
        {options.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

export default CropProductSelect
