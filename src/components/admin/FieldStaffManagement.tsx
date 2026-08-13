'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Users, Plus, Pencil, Trash2, Search, Shield, Phone, Mail, MapPin
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface FieldStaff {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone: string
  role: string
  isActive: boolean
  lastLogin?: string
  createdAt: string
  farmerCount: number
  cooperatives: { id: string; name: string }[]
}

interface Cooperative {
  id: string
  name: string
  cooperativeCode?: string
}

const ROLES = [
  { value: 'EXTENSION_OFFICER', label: 'Extension Officer' },
  { value: 'AGENT', label: 'Agent' },
  { value: 'CBT', label: 'CBT' },
]

export function FieldStaffManagement() {
  const [staff, setStaff] = useState<FieldStaff[]>([])
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FieldStaff | null>(null)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'EXTENSION_OFFICER',
    cooperativeIds: [] as string[],
  })
  const [deleteConfirm, setDeleteConfirm] = useState<FieldStaff | null>(null)

  const fetchStaff = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await fetch(`/api/field-staff?${params}`)
      const data = await res.json()
      setStaff(data.data || [])
    } catch {
      toast.error('Failed to load field staff')
    } finally {
      setLoading(false)
    }
  }, [search])

  const fetchCooperatives = useCallback(async () => {
    try {
      const res = await fetch('/api/catalog?category=cooperative')
      // Also try direct company listing
      const coopRes = await fetch('/api/cooperative/list')
      if (coopRes.ok) {
        const data = await coopRes.json()
        setCooperatives(data.data || [])
      }
    } catch {
      // Cooperatives may not have a list endpoint yet
    }
  }, [])

  useEffect(() => { fetchStaff() }, [fetchStaff])
  useEffect(() => { fetchCooperatives() }, [fetchCooperatives])

  const openCreateDialog = () => {
    setEditing(null)
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: 'EXTENSION_OFFICER',
      cooperativeIds: [],
    })
    setDialogOpen(true)
  }

  const openEditDialog = (s: FieldStaff) => {
    setEditing(s)
    setForm({
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email || '',
      phone: s.phone,
      password: '',
      role: s.role,
      cooperativeIds: s.cooperatives.map(c => c.id),
    })
    setDialogOpen(true)
  }

  const saveStaff = async () => {
    if (!form.firstName || !form.lastName || !form.phone) {
      toast.error('First name, last name, and phone are required')
      return
    }
    if (!editing && !form.password) {
      toast.error('Password is required for new staff')
      return
    }

    try {
      const url = editing ? `/api/field-staff/${editing.id}` : '/api/field-staff'
      const method = editing ? 'PUT' : 'POST'
      const body = { ...form }
      if (editing && !body.password) delete (body as any).password

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to save')
        return
      }
      toast.success(editing ? 'Staff updated' : 'Staff created')
      setDialogOpen(false)
      fetchStaff()
    } catch {
      toast.error('Network error')
    }
  }

  const deleteStaff = async () => {
    if (!deleteConfirm) return
    try {
      const res = await fetch(`/api/field-staff/${deleteConfirm.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Staff deactivated')
      setDeleteConfirm(null)
      fetchStaff()
    } catch {
      toast.error('Delete failed')
    }
  }

  const toggleCooperative = (coopId: string) => {
    setForm(prev => ({
      ...prev,
      cooperativeIds: prev.cooperativeIds.includes(coopId)
        ? prev.cooperativeIds.filter(id => id !== coopId)
        : [...prev.cooperativeIds, coopId],
    }))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Field Staff Management
        </CardTitle>
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-1" /> Add Staff
        </Button>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Staff List */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : staff.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No field staff found</p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-1" /> Add First Staff Member
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {staff.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {s.firstName[0]}{s.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{s.firstName} {s.lastName}</span>
                      <Badge variant={s.isActive ? 'default' : 'secondary'} className="text-xs">
                        {s.role.replace('_', ' ')}
                      </Badge>
                      {!s.isActive && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {s.phone}</span>
                      {s.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {s.email}</span>}
                      <span><MapPin className="w-3 h-3 inline mr-1" />{s.farmerCount} farmers</span>
                    </div>
                    {s.cooperatives.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {s.cooperatives.map(c => (
                          <Badge key={c.id} variant="outline" className="text-xs">{c.name}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditDialog(s)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(s)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit' : 'Add'} Field Staff</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+256..." />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{editing ? 'New Password (leave blank to keep)' : 'Password *'}</Label>
                  <Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cooperative Assignment</Label>
                <div className="flex flex-wrap gap-2 p-3 rounded-lg border min-h-[60px]">
                  {cooperatives.length === 0 ? (
                    <span className="text-sm text-muted-foreground">No cooperatives available</span>
                  ) : (
                    cooperatives.map(c => (
                      <Badge
                        key={c.id}
                        variant={form.cooperativeIds.includes(c.id) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleCooperative(c.id)}
                      >
                        {c.name}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveStaff}>{editing ? 'Update' : 'Create'}</Button>
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
              Are you sure you want to deactivate <strong>{deleteConfirm?.firstName} {deleteConfirm?.lastName}</strong>?
              They will no longer be able to log in.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={deleteStaff}>Deactivate</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
