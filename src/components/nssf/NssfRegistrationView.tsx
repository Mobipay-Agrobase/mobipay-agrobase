'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { UserCheck, Plus, RefreshCw, Loader2, Search, CheckCircle, Clock, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  VERIFIED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  ACTIVATED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
}

export default function NssfRegistrationView() {
  const [registrations, setRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  // Form
  const [farmerId, setFarmerId] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('Male')
  const [district, setDistrict] = useState('')
  const [village, setVillage] = useState('')
  const [valueChain, setValueChain] = useState('Coffee')
  const [nssfNumber, setNssfNumber] = useState('')

  const fetchRegistrations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/nssf/register?limit=50')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setRegistrations(data.data || [])
    } catch {
      toast.error('Failed to load NSSF registrations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRegistrations() }, [fetchRegistrations])

  const handleCreate = async () => {
    if (!farmerId || !nationalId || !fullName || !phoneNumber) {
      toast.error('Please fill in all required fields')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/nssf/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId, nationalId, fullName, phoneNumber,
          dateOfBirth: dateOfBirth || undefined,
          gender, district: district || undefined,
          village: village || undefined, valueChain,
          nssfNumber: nssfNumber || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      toast.success('Farmer registered for NSSF')
      setShowCreate(false)
      setFarmerId(''); setNationalId(''); setFullName(''); setPhoneNumber('')
      setDateOfBirth(''); setDistrict(''); setVillage(''); setNssfNumber('')
      fetchRegistrations()
    } catch (e: any) {
      toast.error(e.message || 'Failed to register')
    } finally {
      setCreating(false)
    }
  }

  const filtered = registrations.filter(r =>
    r.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    r.nationalId?.includes(search) ||
    r.nssfNumber?.includes(search)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-primary" />
            NSSF Registration
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Register farmers for NSSF voluntary savings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchRegistrations}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> New Registration
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name, national ID, NSSF number..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No NSSF registrations yet</p>
            <p className="text-sm mt-1">Click "New Registration" to register a farmer.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Farmer</TableHead>
                  <TableHead>National ID</TableHead>
                  <TableHead>NSSF #</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Value Chain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-sm">
                      {r.farmer ? `${r.farmer.firstName} ${r.farmer.lastName}` : r.fullName}
                      {r.farmer?.farmerCode && (
                        <span className="text-xs text-muted-foreground block">{r.farmer.farmerCode}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-mono">{r.nationalId}</TableCell>
                    <TableCell className="text-sm font-mono">{r.nssfNumber || '—'}</TableCell>
                    <TableCell className="text-sm">{r.phoneNumber}</TableCell>
                    <TableCell className="text-sm">{r.valueChain || '—'}</TableCell>
                    <TableCell>
                      <Badge className={cn('text-[10px]', STATUS_COLORS[r.activationStatus] || STATUS_COLORS.PENDING)}>
                        {r.activationStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New NSSF Registration</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Farmer ID *</Label>
                <Input value={farmerId} onChange={(e) => setFarmerId(e.target.value)} placeholder="Farmer profile ID" />
              </div>
              <div className="space-y-2">
                <Label>National ID *</Label>
                <Input value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="e.g. CF12345678" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Full Name (as per ID) *</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+256..." />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value Chain</Label>
                <Select value={valueChain} onValueChange={setValueChain}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Coffee">Coffee</SelectItem>
                    <SelectItem value="Cocoa">Cocoa</SelectItem>
                    <SelectItem value="Vanilla">Vanilla</SelectItem>
                    <SelectItem value="Cassava">Cassava</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>District</Label>
                <Input value={district} onChange={(e) => setDistrict(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Village</Label>
                <Input value={village} onChange={(e) => setVillage(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>NSSF Number (if known)</Label>
                <Input value={nssfNumber} onChange={(e) => setNssfNumber(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
              Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
