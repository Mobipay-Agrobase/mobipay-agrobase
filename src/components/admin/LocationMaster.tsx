'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  MapPin, ChevronRight, ChevronDown, Plus, Pencil, Trash2,
  Globe, Building2, Map, Trees, Home, Landmark, TreePine
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
  const [newEntity, setNewEntity] = useState<{ level: number; parentId: string; name: string }>({ level: 0, parentId: '', name: '' })
  const [deleteConfirm, setDeleteConfirm] = useState<{ level: number; entity: GeoEntity } | null>(null)

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
    setNewEntity({ level, parentId, name: '' })
    setDialogOpen(true)
  }

  const openEditDialog = (level: number, entity: GeoEntity) => {
    setEditingEntity({ level, entity })
    setNewEntity({ level, parentId: '', name: entity.name })
    setDialogOpen(true)
  }

  const saveEntity = async () => {
    if (!newEntity.name.trim()) {
      toast.error('Name is required')
      return
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
        if (levelConfig.parentField) {
          body[levelConfig.parentField] = newEntity.parentId
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
        if (!res.ok) throw new Error('Failed to create')
        toast.success(`${levelConfig.label} created`)
      }

      setDialogOpen(false)
      fetchRegions()
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
      fetchRegions()
    } catch {
      toast.error('Delete failed')
    }
  }

  const getChildEntities = (entity: GeoEntity, level: number): GeoEntity[] => {
    const childKeys = ['subRegions', 'districts', 'counties', 'subCounties', 'parishes', 'villages']
    return entity[childKeys[level]] || []
  }

  const renderTree = (entities: GeoEntity[], level: number, path: string[] = []) => {
    if (level >= LEVEL_CONFIG.length) return null
    const config = LEVEL_CONFIG[level]
    const Icon = config.icon
    const childKey = ['subRegions', 'districts', 'counties', 'subCounties', 'parishes', 'villages'][level]

    return (
      <div className={cn('ml-4', level > 0 && 'border-l-2 border-muted pl-4')}>
        {entities.map(entity => {
          const children = entity[childKey] || []
          const isExpanded = expandedIds.has(entity.id)
          const hasChildren = children.length > 0

          return (
            <div key={entity.id} className="py-1">
              <div className="flex items-center gap-2 group">
                <button
                  onClick={() => toggleExpand(entity.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-muted transition-colors',
                    !hasChildren && 'invisible'
                  )}
                >
                  {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium">{entity.name}</span>
                {level === 0 && entity.country && (
                  <Badge variant="outline" className="text-xs">{entity.country}</Badge>
                )}
                {hasChildren && (
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
              {isExpanded && hasChildren && renderTree(children, level + 1, [...path, entity.name])}
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
        <Button size="sm" onClick={() => openCreateDialog(0, '')}>
          <Plus className="w-4 h-4 mr-1" /> Add Region
        </Button>
      </CardHeader>
      <CardContent>
        {regions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No regions configured yet.</p>
            <Button className="mt-4" onClick={() => openCreateDialog(0, '')}>
              <Plus className="w-4 h-4 mr-1" /> Add First Region
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {renderTree(regions, 0)}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingEntity ? 'Edit' : 'Add'} {LEVEL_CONFIG[editingEntity?.level ?? newEntity.level].label}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={newEntity.name}
                  onChange={e => setNewEntity(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={`Enter ${LEVEL_CONFIG[editingEntity?.level ?? newEntity.level].label.toLowerCase()} name`}
                />
              </div>
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveEntity}>{editingEntity ? 'Update' : 'Create'}</Button>
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
