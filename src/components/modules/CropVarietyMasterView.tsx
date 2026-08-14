'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Pencil, Trash2, Save, Loader2, Sprout } from 'lucide-react'
import { toast } from 'sonner'

interface CropVariety {
  id: string
  cropId: string
  name: string
  cropCycleDays: number | null
  initialHarvestDays: number | null
  crop?: { id: string; name: string }
}

interface Crop {
  id: string
  name: string
}

export default function CropVarietyMasterView() {
  const [varieties, setVarieties] = useState<CropVariety[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCropId, setFilterCropId] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CropVariety | null>(null)
  const [form, setForm] = useState({ cropId: '', name: '', cropCycleDays: '', initialHarvestDays: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const params = filterCropId ? `?cropId=${filterCropId}` : ''
    Promise.all([
      fetch('/api/crop-varieties' + params).then(r => r.json()),
      fetch('/api/master?type=crop&limit=500').then(r => r.json()),
    ])
      .then(([vData, cData]) => {
        setVarieties(vData.data || [])
        setCrops(cData.data || [])
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [filterCropId])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ cropId: '', name: '', cropCycleDays: '', initialHarvestDays: '' })
    setShowForm(true)
  }

  const openEdit = (v: CropVariety) => {
    setEditing(v)
    setForm({
      cropId: v.cropId,
      name: v.name,
      cropCycleDays: v.cropCycleDays?.toString() || '',
      initialHarvestDays: v.initialHarvestDays?.toString() || '',
    })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.cropId || !form.name.trim()) {
      toast.error('Crop and variety name are required')
      return
    }
    setSaving(true)
    try {
      const url = editing ? `/api/crop-varieties?id=${editing.id}` : '/api/crop-varieties'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success(editing ? 'Variety updated' : 'Variety created')
      setShowForm(false)
      load()
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this variety?')) return
    try {
      const res = await fetch(`/api/crop-varieties?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Variety deleted')
      load()
    } catch {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2"><Sprout className="w-5 h-5" /> Crop Variety Master</h3>
          <p className="text-sm text-muted-foreground">Map varieties to crops (e.g. Coffee → Robusta / Arabica)</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Variety</Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Filter by Crop</Label>
          <Select value={filterCropId} onValueChange={v => setFilterCropId(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-64"><SelectValue placeholder="All crops" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All crops</SelectItem>
              {crops.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : varieties.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Sprout className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p>No varieties configured yet.</p>
              <Button className="mt-4" onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Add First Variety</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Crop</TableHead>
                  <TableHead>Variety</TableHead>
                  <TableHead>Crop Cycle (days)</TableHead>
                  <TableHead>Initial Harvest (days)</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {varieties.map(v => (
                  <TableRow key={v.id}>
                    <TableCell><Badge variant="outline">{v.crop?.name || '—'}</Badge></TableCell>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell>{v.cropCycleDays || '—'}</TableCell>
                    <TableCell>{v.initialHarvestDays || '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(v)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => remove(v.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Add'} Crop Variety</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Crop *</Label>
              <Select value={form.cropId} onValueChange={v => setForm(p => ({ ...p, cropId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select crop" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {crops.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Variety Name *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Robusta, Arabica, SL28" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Crop Cycle (days)</Label>
                <Input type="number" value={form.cropCycleDays} onChange={e => setForm(p => ({ ...p, cropCycleDays: e.target.value }))} placeholder="e.g. 270" />
              </div>
              <div className="space-y-2">
                <Label>Initial Harvest (days)</Label>
                <Input type="number" value={form.initialHarvestDays} onChange={e => setForm(p => ({ ...p, initialHarvestDays: e.target.value }))} placeholder="e.g. 180" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
