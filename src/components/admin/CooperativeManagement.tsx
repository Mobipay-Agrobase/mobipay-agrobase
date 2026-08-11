'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Building2, Plus, Pencil, Trash2, Search, Users, MapPin, Phone, Mail, Calendar, CheckCircle, XCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface Cooperative {
  id: string
  name: string
  cooperativeCode?: string
  dateOfFormation?: string
  address?: string
  services: string[]
  allowFarmerSell: boolean
  isActive: boolean
  contactPerson?: string
  phone?: string
  email?: string
  farmerCount: number
  groupCount: number
  createdAt: string
}

const AVAILABLE_SERVICES = [
  'fertilizer', 'harvester', 'soil preparation', 'seeds',
  'plant protection products', 'compost'
]

export function CooperativeManagement() {
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Cooperative | null>(null)
  const [form, setForm] = useState({
    name: '',
    cooperativeCode: '',
    dateOfFormation: '',
    address: '',
    services: [] as string[],
    allowFarmerSell: false,
    contactPerson: '',
    phone: '',
    email: '',
  })
  const [deleteConfirm, setDeleteConfirm] = useState<Cooperative | null>(null)

  const fetchCooperatives = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await fetch(`/api/cooperatives?${params}`)
      const data = await res.json()
      setCooperatives(data.data || [])
    } catch {
      toast.error('Failed to load cooperatives')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchCooperatives() }, [fetchCooperatives])

  const openCreateDialog = () => {
    setEditing(null)
    setForm({
      name: '',
      cooperativeCode: '',
      dateOfFormation: '',
      address: '',
      services: [],
      allowFarmerSell: false,
      contactPerson: '',
      phone: '',
      email: '',
    })
    setDialogOpen(true)
  }

  const openEditDialog = (c: Cooperative) => {
    setEditing(c)
    setForm({
      name: c.name,
      cooperativeCode: c.cooperativeCode || '',
      dateOfFormation: c.dateOfFormation?.split('T')[0] || '',
      address: c.address || '',
      services: c.services || [],
      allowFarmerSell: c.allowFarmerSell,
      contactPerson: c.contactPerson || '',
      phone: c.phone || '',
      email: c.email || '',
    })
    setDialogOpen(true)
  }

  const saveCooperative = async () => {
    if (!form.name) {
      toast.error('Cooperative name is required')
      return
    }

    try {
      const url = editing ? `/api/cooperatives/${editing.id}` : '/api/cooperatives'
      const method = editing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to save')
        return
      }
      toast.success(editing ? 'Cooperative updated' : 'Cooperative created')
      setDialogOpen(false)
      fetchCooperatives()
    } catch {
      toast.error('Network error')
    }
  }

  const deleteCooperative = async () => {
    if (!deleteConfirm) return
    try {
      const res = await fetch(`/api/cooperatives/${deleteConfirm.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete')
        return
      }
      toast.success('Cooperative deactivated')
      setDeleteConfirm(null)
      fetchCooperatives()
    } catch {
      toast.error('Delete failed')
    }
  }

  const toggleService = (service: string) => {
    setForm(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service],
    }))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Cooperative Management
        </CardTitle>
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-1" /> Add Cooperative
        </Button>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Cooperative List */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : cooperatives.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No cooperatives found</p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-1" /> Add First Cooperative
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {cooperatives.map(c => (
              <div key={c.id} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.name}</span>
                      <Badge variant={c.isActive ? 'default' : 'secondary'}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {c.cooperativeCode && (
                      <span className="text-xs text-muted-foreground">Code: {c.cooperativeCode}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditDialog(c)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(c)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {c.dateOfFormation && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Formed: {new Date(c.dateOfFormation).toLocaleDateString()}
                    </div>
                  )}
                  {c.address && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {c.address}
                    </div>
                  )}
                  {c.contactPerson && <div>Contact: {c.contactPerson}</div>}
                  {c.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</div>}
                  {c.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</div>}
                </div>

                <div className="mt-3 flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" /> {c.farmerCount} farmers
                  </span>
                  <span className="flex items-center gap-1">
                    {c.allowFarmerSell ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                    {c.allowFarmerSell ? 'Can sell' : 'Cannot sell'}
                  </span>
                </div>

                {c.services.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {c.services.map(s => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit' : 'Add'} Cooperative</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Cooperative Name *</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cooperative Code</Label>
                  <Input value={form.cooperativeCode} onChange={e => setForm(p => ({ ...p, cooperativeCode: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Date of Formation</Label>
                  <Input type="date" value={form.dateOfFormation} onChange={e => setForm(p => ({ ...p, dateOfFormation: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Person</Label>
                  <Input value={form.contactPerson} onChange={e => setForm(p => ({ ...p, contactPerson: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Services Offered</Label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SERVICES.map(s => (
                    <Badge
                      key={s}
                      variant={form.services.includes(s) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleService(s)}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Allow Farmers to Sell Produce?</Label>
                <RadioGroup
                  value={form.allowFarmerSell ? 'yes' : 'no'}
                  onValueChange={v => setForm(p => ({ ...p, allowFarmerSell: v === 'yes' }))}
                >
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="yes" id="sell-yes" />
                      <Label htmlFor="sell-yes">Yes</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="no" id="sell-no" />
                      <Label htmlFor="sell-no">No</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveCooperative}>{editing ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deactivation</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to deactivate <strong>{deleteConfirm?.name}</strong>?
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={deleteCooperative}>Deactivate</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
