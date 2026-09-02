'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export interface LocNode { id: string; name: string }

export interface LocSelection {
  country: string
  regionId?: string
  region?: string
  subRegionId?: string
  subRegion?: string
  districtId?: string
  district?: string
  countyId?: string
  county?: string
  subCountyId?: string
  subCounty?: string
  parishId?: string
  parish?: string
  villageId?: string
  village?: string
}

type LevelKey = 'regionId' | 'subRegionId' | 'districtId' | 'countyId' | 'subCountyId' | 'parishId' | 'villageId'

const LEVELS: { key: LevelKey; label: string; parent: LevelKey | null }[] = [
  { key: 'regionId', label: 'Region', parent: null },
  { key: 'subRegionId', label: 'Sub Region', parent: 'regionId' },
  { key: 'districtId', label: 'District', parent: 'subRegionId' },
  { key: 'countyId', label: 'County', parent: 'districtId' },
  { key: 'subCountyId', label: 'Sub County', parent: 'countyId' },
  { key: 'parishId', label: 'Parish', parent: 'subCountyId' },
  { key: 'villageId', label: 'Village', parent: 'parishId' },
]

// child endpoint + parent query param for each level (region loads from the shallow regions endpoint)
const CHILD: Record<LevelKey, { path: string; param: string }> = {
  regionId: { path: '/regions', param: 'regionId' },
  subRegionId: { path: '/sub-regions', param: 'regionId' },
  districtId: { path: '/districts', param: 'subRegionId' },
  countyId: { path: '/counties', param: 'districtId' },
  subCountyId: { path: '/sub-counties', param: 'countyId' },
  parishId: { path: '/parishes', param: 'subCountyId' },
  villageId: { path: '/villages', param: 'parishId' },
}

export function LocationPicker({
  value,
  onChange,
}: {
  value?: LocSelection
  onChange: (sel: LocSelection) => void
}) {
  const [sel, setSel] = useState<LocSelection>({ country: 'Uganda' })
  const [options, setOptions] = useState<Record<string, LocNode[]>>({}) // key `${levelKey}_${parentId}`
  const [loadingLevel, setLoadingLevel] = useState<LevelKey | null>(null)
  const [prefilling, setPrefilling] = useState(false)

  const load = useCallback(async (key: LevelKey, parentId: string) => {
    const cfg = CHILD[key]
    const cacheKey = `${key}_${parentId}`
    if (options[cacheKey]) return options[cacheKey]
    setLoadingLevel(key)
    try {
      const res = await fetch(`/api/settings/geo/${cfg.path}?${cfg.param}=${encodeURIComponent(parentId)}`)
      if (!res.ok) return []
      const d = await res.json()
      setOptions(p => ({ ...p, [cacheKey]: (d.data || []).map((x: any) => ({ id: x.id, name: x.name })) }))
      return (d.data || []) as LocNode[]
    } catch {
      return []
    } finally {
      setLoadingLevel(prev => (prev === key ? null : prev))
    }
  }, [options])

  // Load top-level regions on mount
  useEffect(() => {
    fetch('/api/settings/geo/regions')
      .then(r => r.json())
      .then(d => setOptions(p => ({ ...p, regionId_all: (d.data || []).map((x: any) => ({ id: x.id, name: x.name })) })))
      .catch(() => {})
  }, [])

  // Prefill on edit: full chain by villageId, or region/district by name
  useEffect(() => {
    if (!value) return
    if (value.villageId) {
      setPrefilling(true)
      fetch(`/api/settings/geo/ancestors?villageId=${encodeURIComponent(value.villageId)}`)
        .then(r => r.json())
        .then(d => {
          const chain = d.data as LocSelection | null
          if (!chain) return
          setSel({ ...chain, country: chain.country || 'Uganda' })
          // Ensure each ancestor's children are available so selects show the selected item
          const pairs: [LevelKey, string][] = [
            ['subRegionId', chain.regionId as string],
            ['districtId', chain.subRegionId as string],
            ['countyId', chain.districtId as string],
            ['subCountyId', chain.countyId as string],
            ['parishId', chain.subCountyId as string],
            ['villageId', chain.parishId as string],
          ]
          pairs.filter(p => p[1]).forEach(([k, p]) => { load(k, p) })
        })
        .catch(() => {})
        .finally(() => setPrefilling(false))
      return
    }
    // Match by names (VSLA-like)
    const region = (options.regionId_all || []).find(r => r.name === value.region || r.name === value.regionId || r.name.toLowerCase() === (value.region || '').toLowerCase())
    if (region) {
      setSel(p => ({ ...p, regionId: region.id, region: region.name }))
      if (value.district) {
        load('subRegionId', region.id).then(srs => {
          const match = (srs as LocNode[] || []).find(s => s.name === value.subRegion || s.name === value.subRegionId)
          if (match) setSel(p => ({ ...p, subRegionId: match.id, subRegion: match.name }))
          else {
            const dist = (srs.find(s => s.id === region.id) ? [] : srs) as LocNode[]
            // find any sub-region then match district below later (best-effort)
          }
        })
      }
    }
     
  }, [value?.villageId, value?.regionId, value?.districtId, value?.region, value?.district])

  const parentIdOf = (key: LevelKey) => {
    if (key === 'regionId') return undefined
    const parentLvl = LEVELS.find(l => l.key === key)!.parent!
    return (sel as any)[parentLvl]
  }

  const levelOptions = (key: LevelKey): { list: LocNode[]; loading: boolean } => {
    if (key === 'regionId') return { list: options.regionId_all || [], loading: false }
    const pid = parentIdOf(key) as string | undefined
    if (!pid) return { list: [], loading: false }
    return { list: options[`${key}_${pid}`] || [], loading: loadingLevel === key }
  }

  const levelOptionsFor = (key: LevelKey, s: LocSelection): LocNode[] => {
    if (key === 'regionId') return options.regionId_all || []
    const parentLvl = LEVELS.find(l => l.key === key)!.parent!
    const pid = (s as any)[parentLvl]
    return pid ? options[`${key}_${pid}`] || [] : []
  }

  const emit = (next: LocSelection) => {
    const base: LocSelection = { country: next.country || 'Uganda' }
    LEVELS.forEach(l => {
      const id = (next as any)[l.key]
      const name = (next as any)[l.key.replace('Id', '')]
      const list = levelOptionsFor(l.key, next)
      const found = list.find(o => o.id === id)
      if (id) { (base as any)[l.key] = id; (base as any)[l.key.replace('Id', '')] = found?.name || name }
    })
    setSel(base)
    onChange(base)
  }

  const setLevel = (key: LevelKey, id: string) => {
    const thisIdx = LEVELS.findIndex(l => l.key === key)
    const clear = LEVELS.slice(thisIdx + 1).map(l => l.key) as LevelKey[]
    const next: LocSelection = { ...sel, country: 'Uganda', [key]: id }
    for (const k of clear) { delete next[k]; delete next[k.replace('Id', '') as keyof LocSelection] }
    const cur = levelOptions(key).list.find(o => o.id === id)
    if (cur) (next as any)[key.replace('Id', '')] = cur.name
    setSel(next)
    const nextLevel = LEVELS[thisIdx + 1]
    if (nextLevel) load(nextLevel.key, id)
    emit(next)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <p className="text-sm font-medium">Location (Government Admin Units)</p>
        {(prefilling || loadingLevel) && <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading…</span>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {LEVELS.map(level => {
          const key = level.key
          const parentId = parentIdOf(key)
          if (key !== 'regionId' && !parentId) return null
          const { list, loading } = levelOptions(key)
          const selId = (sel as any)[key]
          return (
            <div key={key}>
              <Label className="text-xs text-muted-foreground">{level.label}</Label>
              <Select value={selId || undefined} onValueChange={v => setLevel(key, v)}>
                <SelectTrigger className="mt-1 h-9 bg-background">
                  <SelectValue placeholder={loading ? 'Loading…' : `Select ${level.label}`} />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {loading && <div className="px-3 py-2 text-xs text-muted-foreground">Loading…</div>}
                  {list.length === 0 && !loading && <div className="px-3 py-2 text-xs text-muted-foreground">No {level.label.toLowerCase()} available.</div>}
                  {list.slice().sort((a, b) => a.name.localeCompare(b.name)).map(o => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default LocationPicker