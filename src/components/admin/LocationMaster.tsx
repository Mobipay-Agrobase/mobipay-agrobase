'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  MapPin, ChevronRight, ChevronDown, Plus, Pencil, Trash2,
  Globe, Building2, Map, Trees, Home, Landmark, TreePine, Loader2,
  Search, X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'

interface GeoEntity {
  id: string
  name: string
  country?: string
  subRegions?: GeoEntity[]
  districts?: GeoEntity[]
  counties?: GeoEntity[]
  subCounties?: GeoEntity[]
  parishes?: GeoEntity[]
  villages?: GeoEntity[]
}

const LEVEL_CONFIG = [
  { key: 'region', label: 'Region', icon: Globe, parentField: null },
  { key: 'subRegion', label: 'Sub-Region', icon: Map, parentField: 'regionId' },
  { key: 'district', label: 'District', icon: Building2, parentField: 'subRegionId' },
  { key: 'county', label: 'County', icon: Trees, parentField: 'districtId' },
  { key: 'subCounty', label: 'Sub-County', icon: Landmark, parentField: 'countyId' },
  { key: 'parish', label: 'Parish', icon: TreePine, parentField: 'subCountyId' },
  { key: 'village', label: 'Village', icon: Home, parentField: 'parishId' },
]

export function LocationMaster() {
  const [regions, setRegions] = useState<GeoEntity[]>([])
  const [childrenCache, setChildrenCache] = useState<Record<string, GeoEntity[]>>({})
  const [loadingLevel, setLoadingLevel] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEntity, setEditingEntity] = useState<{ level: number; entity: GeoEntity } | null>(null)
  const [newEntity, setNewEntity] = useState<{ level: number; parentId: string; name: string; parents: Record<string, string> }>({ level: 0, parentId: '', name: '', parents: {} })
  const [deleteConfirm, setDeleteConfirm] = useState<{ level: number; entity: GeoEntity } | null>(null)
  // Parent options for the create dialog — keyed by level so we can lazy-load
  // each level's options only when the user picks that level's parent.
  const [parentOptions, setParentOptions] = useState<Record<number, GeoEntity[]>>({})

  // ─── Search state ──────────────────────────────────────────────────────
  // Cross-hierarchy search via /api/settings/geo/search?q=...&level=...
  // Lets users find any village/district/etc. by name without manually
  // expanding 7 levels of the tree.
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLevel, setSearchLevel] = useState<string>('all') // 'all' | 'region' | 'subRegion' | ... | 'village'
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [searchActive, setSearchActive] = useState(false)

  // child endpoint + parent query param per level
  const childEndpoint = (level: number) => {
    const map: Record<number, { path: string; param: string }> = {
      1: { path: '/sub-regions', param: 'regionId' },
      2: { path: '/districts', param: 'subRegionId' },
      3: { path: '/counties', param: 'districtId' },
      4: { path: '/sub-counties', param: 'countyId' },
      5: { path: '/parishes', param: 'subCountyId' },
      6: { path: '/villages', param: 'parishId' },
    }
    return map[level]
  }

  const cacheKey = (level: number, parentId: string) => `${LEVEL_CONFIG[level].key}_${parentId}`

  // Load parent options for a given level (1=subRegions of selected region, etc.)
  const loadParentOptions = useCallback(async (level: number, parentId: string) => {
    if (!parentId) {
      setParentOptions(prev => ({ ...prev, [level]: [] }))
      return
    }
    const ep = childEndpoint(level)
    if (!ep) return
    try {
      const res = await fetch(`/api/settings/geo${ep.path}?${ep.param}=${encodeURIComponent(parentId)}`)
      if (!res.ok) return
      const d = await res.json()
      setParentOptions(prev => ({ ...prev, [level]: d.data || [] }))
    } catch {
      setParentOptions(prev => ({ ...prev, [level]: [] }))
    }
  }, [])

  const loadChildren = useCallback(async (level: number, parentId: string) => {
    const ep = childEndpoint(level)
    if (!ep) return
    const key = cacheKey(level, parentId)
    if (childrenCache[key]) return
    setLoadingLevel(key)
    try {
      const res = await fetch(`/api/settings/geo${ep.path}?${ep.param}=${encodeURIComponent(parentId)}`)
      if (!res.ok) return
      const d = await res.json()
      setChildrenCache(p => ({ ...p, [key]: d.data || [] }))
    } catch {
      toast.error('Failed to load children')
    } finally {
      setLoadingLevel(prev => (prev === key ? null : prev))
    }
  }, [childrenCache])

  const fetchRegions = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/geo/regions')
      const data = await res.json()
      setRegions(data.data || [])
    } catch {
      toast.error('Failed to load locations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRegions() }, [fetchRegions])

  const reload = () => {
    setChildrenCache({})
    setExpandedIds(new Set())
    setLoading(true)
    fetchRegions()
  }

  // ─── Cross-hierarchy search ─────────────────────────────────────────────
  // Debounced: waits 350ms after the user stops typing, then hits
  // /api/settings/geo/search?q=...&level=...
  useEffect(() => {
    const q = searchQuery.trim()
    // If the query is too short, clear search results and show the tree
    if (q.length < 2) {
      setSearchResults([])
      setSearchActive(false)
      return
    }
    setSearchActive(true)
    setSearching(true)
    const handle = setTimeout(() => {
      const params = new URLSearchParams({ q, limit: '100' })
      if (searchLevel !== 'all') params.set('level', searchLevel)
      fetch(`/api/settings/geo/search?${params.toString()}`)
        .then(r => r.ok ? r.json() : { data: [] })
        .then(d => setSearchResults(d.data || []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false))
    }, 350)
    return () => clearTimeout(handle)
  }, [searchQuery, searchLevel])

  const clearSearch = () => {
    setSearchQuery('')
    setSearchLevel('all')
    setSearchResults([])
    setSearchActive(false)
  }

  const toggleExpand = (level: number, entity: GeoEntity) => {
    const id = entity.id
    const isLeaf = level === LEVEL_CONFIG.length - 1
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else {
        next.add(id)
        if (!isLeaf) loadChildren(level + 1, id)
      }
      return next
    })
  }

  const openCreateDialog = (level: number, parentId: string) => {
    setEditingEntity(null)
    // Pre-populate the parent chain so the dialog shows the right selectors
    const parents: Record<string, string> = {}
    if (level > 0 && parentId) {
      parents[LEVEL_CONFIG[level].parentField as string] = parentId
    }
    setNewEntity({ level, parentId, name: '', parents })
    setDialogOpen(true)
  }

  // Open a generic "Add any level" dialog — user picks the level + parent chain
  const openAddAnyDialog = () => {
    setEditingEntity(null)
    setNewEntity({ level: 0, parentId: '', name: '', parents: {} })
    setDialogOpen(true)
  }

  const openEditDialog = (level: number, entity: GeoEntity) => {
    setEditingEntity({ level, entity })
    setNewEntity({ level, parentId: '', name: entity.name, parents: {} })
    setDialogOpen(true)
  }

  const saveEntity = async () => {
    if (!newEntity.name.trim()) {
      toast.error('Name is required')
      return
    }
    // For non-region levels, require the immediate parent to be selected
    if (!editingEntity && newEntity.level > 0) {
      const parentField = LEVEL_CONFIG[newEntity.level].parentField
      if (parentField && !newEntity.parents[parentField]) {
        toast.error(`Please select the parent ${LEVEL_CONFIG[newEntity.level - 1].label} first`)
        return
      }
    }

    try {
      if (editingEntity) {
        // Update
        const levelKey = LEVEL_CONFIG[editingEntity.level].key
        const endpoints: Record<string, string> = {
          region: `/api/settings/geo/regions/${editingEntity.entity.id}`,
          subRegion: `/api/settings/geo/sub-regions?id=${editingEntity.entity.id}`,
          district: `/api/settings/geo/districts?id=${editingEntity.entity.id}`,
          county: `/api/settings/geo/counties?id=${editingEntity.entity.id}`,
          subCounty: `/api/settings/geo/sub-counties?id=${editingEntity.entity.id}`,
          parish: `/api/settings/geo/parishes?id=${editingEntity.entity.id}`,
          village: `/api/settings/geo/villages?id=${editingEntity.entity.id}`,
        }
        const method = levelKey === 'region' ? 'PUT' : 'PUT'
        const url = levelKey === 'region' ? `/api/settings/geo/regions/${editingEntity.entity.id}` : endpoints[levelKey]
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newEntity.name }),
        })
        if (!res.ok) throw new Error('Failed to update')
        toast.success(`${LEVEL_CONFIG[editingEntity.level].label} updated`)
      } else {
        // Create
        const levelConfig = LEVEL_CONFIG[newEntity.level]
        const body: Record<string, string> = { name: newEntity.name }
        // Include all selected parents from the cascading dialog
        if (levelConfig.parentField && newEntity.parents[levelConfig.parentField]) {
          body[levelConfig.parentField] = newEntity.parents[levelConfig.parentField]
        }
        if (newEntity.level === 0) {
          body.country = 'Uganda'
        }

        const endpoints = [
          '/api/settings/geo/regions',
          '/api/settings/geo/sub-regions',
          '/api/settings/geo/districts',
          '/api/settings/geo/counties',
          '/api/settings/geo/sub-counties',
          '/api/settings/geo/parishes',
          '/api/settings/geo/villages',
        ]

        const res = await fetch(endpoints[newEntity.level], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to create')
        }
        toast.success(`${levelConfig.label} created`)
      }

      setDialogOpen(false)
      reload()
    } catch {
      toast.error('Operation failed')
    }
  }

  const deleteEntity = async () => {
    if (!deleteConfirm) return
    const { level, entity } = deleteConfirm

    try {
      const endpoints: Record<number, string> = {
        0: `/api/settings/geo/regions?id=${entity.id}`,
        1: `/api/settings/geo/sub-regions?id=${entity.id}`,
        2: `/api/settings/geo/districts?id=${entity.id}`,
        3: `/api/settings/geo/counties?id=${entity.id}`,
        4: `/api/settings/geo/sub-counties?id=${entity.id}`,
        5: `/api/settings/geo/parishes?id=${entity.id}`,
        6: `/api/settings/geo/villages?id=${entity.id}`,
      }

      const res = await fetch(endpoints[level], { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete')
        return
      }
      toast.success(`${LEVEL_CONFIG[level].label} deleted`)
      setDeleteConfirm(null)
      reload()
    } catch {
      toast.error('Delete failed')
    }
  }

  // Lazy children: for a node at `level`, its children live at `level+1`
  // and are cached under key `${LEVEL_CONFIG[level+1].key}_${entity.id}`.
  const getChildren = (level: number, entity: GeoEntity): GeoEntity[] => {
    if (level >= LEVEL_CONFIG.length - 1) return []  // leaf
    const childLevel = level + 1
    const key = `${LEVEL_CONFIG[childLevel].key}_${entity.id}`
    return childrenCache[key] || []
  }

  const renderTree = (entities: GeoEntity[], level: number, path: string[] = []) => {
    if (level >= LEVEL_CONFIG.length) return null
    const config = LEVEL_CONFIG[level]
    const Icon = config.icon
    const isLeaf = level === LEVEL_CONFIG.length - 1

    return (
      <div className={cn('ml-4', level > 0 && 'border-l-2 border-muted pl-4')}>
        {entities.map(entity => {
          const children = getChildren(level, entity)
          const isExpanded = expandedIds.has(entity.id)
          const childCacheKey = `${LEVEL_CONFIG[level + 1]?.key}_${entity.id}`
          const isLoadingChildren = loadingLevel === childCacheKey
          // For non-leaf levels, always show the chevron (children may exist on the server)
          const hasChildren = !isLeaf

          return (
            <div key={entity.id} className="py-1">
              <div className="flex items-center gap-2 group">
                <button
                  onClick={() => toggleExpand(level, entity)}
                  className={cn(
                    'flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-muted transition-colors',
                    !hasChildren && 'invisible'
                  )}
                >
                  {isLoadingChildren
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium">{entity.name}</span>
                {level === 0 && entity.country && (
                  <Badge variant="outline" className="text-xs">{entity.country}</Badge>
                )}
                {isExpanded && children.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{children.length}</Badge>
                )}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                  {level < LEVEL_CONFIG.length - 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => { e.stopPropagation(); openCreateDialog(level + 1, entity.id) }}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => { e.stopPropagation(); openEditDialog(level, entity) }}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ level, entity }) }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              {isExpanded && !isLeaf && (
                isLoadingChildren
                  ? <div className="ml-8 py-1 text-xs text-muted-foreground">Loading…</div>
                  : children.length === 0
                    ? <div className="ml-8 py-1 text-xs text-muted-foreground italic">No child entries.</div>
                    : renderTree(children, level + 1, [...path, entity.name])
              )}
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return <Card><CardContent className="p-6"><div className="text-center text-muted-foreground">Loading locations...</div></CardContent></Card>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location Master
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={reload} title="Refresh">
            <Loader2 className={cn('w-4 h-4', !loading && 'hidden')} />
            {!loading && <MapPin className="w-4 h-4" />}
            <span className="ml-1 hidden sm:inline">Refresh</span>
          </Button>
          <Button size="sm" onClick={openAddAnyDialog}>
            <Plus className="w-4 h-4 mr-1" /> Add Location
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* ─── Search Bar + Level Filter ─── */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name (e.g. village, district, parish)…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Select value={searchLevel} onValueChange={setSearchLevel}>
              <SelectTrigger className="w-[160px] shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                <SelectItem value="region">Region</SelectItem>
                <SelectItem value="subRegion">Sub-Region</SelectItem>
                <SelectItem value="district">District</SelectItem>
                <SelectItem value="county">County</SelectItem>
                <SelectItem value="subCounty">Sub-County</SelectItem>
                <SelectItem value="parish">Parish</SelectItem>
                <SelectItem value="village">Village</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {searchActive && (
            <p className="text-xs text-muted-foreground">
              {searching ? 'Searching…' : `${searchResults.length} ${searchResults.length === 1 ? 'result' : 'results'}${searchLevel !== 'all' ? ` in ${LEVEL_CONFIG.find(c => c.key === searchLevel)?.label || searchLevel}` : ''} for "${searchQuery}"`}
            </p>
          )}
        </div>

        {/* ─── Search Results (when searching) OR Tree (default) ─── */}
        {searchActive ? (
          <div className="space-y-1">
            {searching ? (
              <div className="text-center py-8 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-sm">Searching locations…</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No locations found matching "{searchQuery}".</p>
                <p className="text-xs mt-1">Try a different name or clear the search to browse the tree.</p>
              </div>
            ) : (
              searchResults.map((r) => <SearchResultRow key={`${r.level}-${r.id}`} result={r} />)
            )}
          </div>
        ) : regions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No regions configured yet.</p>
            <Button className="mt-4" onClick={openAddAnyDialog}>
              <Plus className="w-4 h-4 mr-1" /> Add First Region
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {renderTree(regions, 0)}
          </div>
        )}

        {/* Create/Edit Dialog — with cascading parent selectors */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingEntity ? 'Edit' : 'Add'} {LEVEL_CONFIG[editingEntity?.level ?? newEntity.level].label}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              {/* Level picker — only show when creating (not editing) */}
              {!editingEntity && (
                <div className="space-y-2">
                  <Label>Level *</Label>
                  <Select
                    value={String(newEntity.level)}
                    onValueChange={v => {
                      const level = parseInt(v)
                      setNewEntity(prev => ({ ...prev, level, parents: {}, name: '' }))
                      setParentOptions({})
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEVEL_CONFIG.map((cfg, i) => (
                        <SelectItem key={cfg.key} value={String(i)}>{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Pick the level you want to add. Parent selectors will appear below for any level above region.
                  </p>
                </div>
              )}

              {/* Cascading parent selectors — for each level above the target, show a dropdown */}
              {!editingEntity && newEntity.level > 0 && (() => {
                const levelsToShow: React.ReactElement[] = []
                for (let i = 0; i < newEntity.level; i++) {
                  const cfg = LEVEL_CONFIG[i]
                  const nextCfg = LEVEL_CONFIG[i + 1]
                  const parentField = nextCfg.parentField
                  const optionsList = i === 0 ? regions : (parentOptions[i] || [])
                  const currentValue = parentField ? (newEntity.parents[parentField] || '') : ''
                  levelsToShow.push(
                    <div key={i} className="space-y-2">
                      <Label>{cfg.label} *</Label>
                      <Select
                        value={currentValue}
                        onValueChange={v => {
                          // Set this parent, clear all deeper parents, load next level's options
                          setNewEntity(prev => {
                            const newParents: Record<string, string> = {}
                            // Keep parents up to and including this level's parent field
                            for (let j = 0; j <= i; j++) {
                              const pf = LEVEL_CONFIG[j + 1].parentField
                              if (pf && prev.parents[pf]) newParents[pf] = prev.parents[pf]
                            }
                            if (parentField) newParents[parentField] = v
                            return { ...prev, parents: newParents, name: '' }
                          })
                          // Load the next level's options (i+1's children of this selected parent)
                          if (i + 1 < newEntity.level) {
                            loadParentOptions(i + 1, v)
                          }
                          setParentOptions(prev => {
                            const cleared = { ...prev }
                            for (let j = i + 1; j < LEVEL_CONFIG.length; j++) delete cleared[j]
                            return cleared
                          })
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder={`Select ${cfg.label.toLowerCase()}`} /></SelectTrigger>
                        <SelectContent className="max-h-60">
                          {optionsList.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-muted-foreground">No {cfg.label.toLowerCase()}s available. Add one first.</div>
                          ) : (
                            optionsList.map(opt => (
                              <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )
                }
                return <>{levelsToShow}</>
              })()}

              {/* Name field */}
              <div className="space-y-2">
                <Label>{editingEntity ? 'Name *' : `${LEVEL_CONFIG[newEntity.level].label} Name *`}</Label>
                <Input
                  value={newEntity.name}
                  onChange={e => setNewEntity(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={`Enter ${LEVEL_CONFIG[editingEntity?.level ?? newEntity.level].label.toLowerCase()} name`}
                />
              </div>

              {/* Country picker — only when editing a region (level 0) */}
              {editingEntity?.level === 0 && (
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select
                    value={editingEntity.entity.country || 'Uganda'}
                    onValueChange={v => setEditingEntity(prev => prev ? { ...prev, entity: { ...prev.entity, country: v } } : null)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Uganda">Uganda</SelectItem>
                      <SelectItem value="Ghana">Ghana</SelectItem>
                      <SelectItem value="Kenya">Kenya</SelectItem>
                      <SelectItem value="Rwanda">Rwanda</SelectItem>
                      <SelectItem value="Tanzania">Tanzania</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Validation hint */}
              {!editingEntity && newEntity.level > 0 && (() => {
                const parentField = LEVEL_CONFIG[newEntity.level].parentField
                const parentSelected = parentField ? !!newEntity.parents[parentField] : false
                if (!parentSelected) {
                  return (
                    <p className="text-xs text-amber-600">
                      Select all parent levels above before creating this {LEVEL_CONFIG[newEntity.level].label.toLowerCase()}.
                    </p>
                  )
                }
                return null
              })()}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveEntity} disabled={!newEntity.name.trim()}>
                {editingEntity ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <strong>{deleteConfirm?.entity.name}</strong>?
              {deleteConfirm && deleteConfirm.level < LEVEL_CONFIG.length - 1 && (
                <span className="block mt-1 text-destructive">
                  This will fail if there are child {LEVEL_CONFIG[deleteConfirm.level + 1].label.toLowerCase()}s.
                </span>
              )}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={deleteEntity}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

/**
 * SearchResultRow — renders a single search hit with its full parent chain
 * as breadcrumbs. Each breadcrumb is a small Badge so the hierarchy is
 * scannable at a glance. The matched level is highlighted.
 */
function SearchResultRow({ result }: { result: any }) {
  const LEVEL_LABELS: Record<string, string> = {
    region: "Region", subRegion: "Sub-Region", district: "District",
    county: "County", subCounty: "Sub-County", parish: "Parish", village: "Village",
  }
  const LEVEL_ICONS: Record<string, any> = {
    region: Globe, subRegion: Map, district: Building2, county: Trees,
    subCounty: Landmark, parish: TreePine, village: Home,
  }
  const Icon = LEVEL_ICONS[result.level] || MapPin

  // Build the breadcrumb chain in order: region > subRegion > ... > matched level
  const chain: Array<{ level: string; name: string }> = []
  const order = ["region", "subRegion", "district", "county", "subCounty", "parish", "village"]
  for (const lvl of order) {
    const node = result[lvl]
    if (node && node.name) chain.push({ level: lvl, name: node.name })
    if (lvl === result.level) break
  }

  return (
    <div className="flex items-start gap-2 py-2 px-3 rounded-lg border hover:bg-muted/40 transition-colors">
      <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{result.name}</span>
          <Badge variant="secondary" className="text-[10px]">{LEVEL_LABELS[result.level] || result.level}</Badge>
        </div>
        {chain.length > 1 && (
          <div className="flex items-center gap-1 mt-1 flex-wrap text-[11px] text-muted-foreground">
            {chain.slice(0, -1).map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                <span>{c.name}</span>
                <ChevronRight className="w-2.5 h-2.5" />
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
