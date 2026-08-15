'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Pencil, Trash2, Save, Loader2, UsersRound, MapPin, User } from 'lucide-react'
import { toast } from 'sonner'

interface FarmerGroup {
  id: string
  name: string
  contactPerson: string | null
  location: string | null
  isVsla: boolean
  isActive: boolean
  company?: { id: string; name: string } | null
  _count?: { farmers: number }
}

export default function FarmerGroupsView() {
  const [groups, setGroups] = useState<FarmerGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<FarmerGroup | null>(null)
  const [form, setForm] = useState({ name: '', contactPerson: '', location: '', isVsla: false })
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    fetch(`/api/farmer-groups${params}`)
      .then(r => r.json())
      .then(d => setGroups(d.data || []))
      .catch(() => toast.error('Failed to load farmer groups'))
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', contactPerson: '', location: '', isVsla: false })
    setShowForm(true)
  }

  const openEdit = (g: FarmerGroup) => {
    setEditing(g)
    setForm({
      name: g.name,
      contactPerson: g.contactPerson || '',
      location: g.location || '',
      isVsla: g.isVsla,
    })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.name.trim()) { toast.error('Group name is required'); return }
    setSaving(true)
    try {
      const url = editing ? `/api/farmer-groups/${editing.id}` : '/api/farmer-groups'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success(editing ? 'Group updated' : 'Group created')
      setShowForm(false)
      load()
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this farmer group? Farmers assigned to it will not be deleted.')) return
    try {
      const res = await fetch(`/api/farmer-groups/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Group deleted')
      load()
    } catch (e: any) {
      toast.error(e.message || 'Delete failed')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2"><UsersRound className="w-5 h-5" /> Farmer Group Management</h3>
          <p className="text-sm text-muted-foreground">Manage farmer groups and their coordinators</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Group</Button>
      </div>

      <Input placeholder="Search by name, contact, or location..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : groups.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <UsersRound className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p>No farmer groups yet.</p>
              <Button className="mt-4" onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Add First Group</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Farmers</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map(g => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{g.contactPerson || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{g.location || '—'}</TableCell>
                    <TableCell className="text-center"><Badge variant="secondary">{g._count?.farmers || 0}</Badge></TableCell>
                    <TableCell>
                      {g.isVsla
                        ? <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[10px]">VSLA</Badge>
                        : <Badge variant="outline" className="text-[10px]">Group</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(g)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => remove(g.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Add'} Farmer Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="form-label-base">Group Name <span className="form-required">*</span></Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Kayunga Coffee Farmers" />
            </div>
            <div className="space-y-2">
              <Label className="form-label-base">Contact Person</Label>
              <Input value={form.contactPerson} onChange={e => setForm(p => ({ ...p, contactPerson: e.target.value }))} placeholder="e.g. John Mukasa" />
            </div>
            <div className="space-y-2">
              <Label className="form-label-base">Location</Label>
              <Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Kayunga District" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isVsla"
                checked={form.isVsla}
                onChange={e => setForm(p => ({ ...p, isVsla: e.target.checked }))}
                className="h-4 w-4 accent-primary"
              />
              <Label htmlFor="isVsla" className="text-sm cursor-pointer">This is a VSLA group</Label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={save} disabled={saving} className="gap-2 btn-hover-lift min-w-[80px]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
