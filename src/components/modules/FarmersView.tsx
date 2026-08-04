'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  Search, Plus, Eye, X, UserPlus, Phone, MapPin, Sprout, Calendar, CreditCard,
  ChevronLeft, ChevronRight, Filter, Loader2, Users, ArrowLeft, Star, AlertCircle,
  Layers, DollarSign, GraduationCap, PiggyBank, Leaf, Activity, QrCode, Download,
  Shield, Banknote, Award, Upload, FileSpreadsheet, CheckCircle, XCircle, FileDown,
  Wallet,
  Trash2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { EmptyState, exportToCSV } from '@/components/ui/empty-state'
import { CatalogSelect } from '@/components/ui/catalog-select'

interface Farmer {
  id: string; firstName: string; lastName: string; phone: string
  gender?: string; status: string; farmerCode?: string
  education?: string; dateOfBirth?: string; maritalStatus?: string
  nationalIdType?: string; nationalIdNo?: string; memberType: string
  farmSize?: number; farmOwnership?: string; mainCrops?: string
  villageId?: string; gpsLatitude?: number; gpsLongitude?: number
  bankName?: string; bankAccountNo?: string
  familyMembers?: number; childrenUnder18?: number
  groupId?: string; createdAt: string
  email?: string; villageName?: string; country?: string; district?: string
  housingOwnership?: string; houseType?: string
  loanTakenLastYear?: boolean
  spouseName?: string; schoolGoingChildren?: number; livestockTypes?: string
  loanTakenFrom?: string; loanAmount?: number; loanPurpose?: string
  loanInterestPct?: number; loanInterestPeriod?: string
}

const genderColor: Record<string, string> = {
  Male: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Female: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
}
const statusColor: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  INACTIVE: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

function initials(f: string, l: string) {
  return ((f?.[0] || '') + (l?.[0] || '')).toUpperCase()
}

export default function FarmersView() {
  const { setSelectedFarmerId, setActiveModule } = useAppStore()
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const limit = 12

  const fetchFarmers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set('search', search)
      if (genderFilter) params.set('gender', genderFilter)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/farmers?${params}`)
      const data = await res.json()
      setFarmers(data.farmers || data.data || [])
      setTotal(data.total || data.farmers?.length || 0)
    } catch (e) {
      console.error(e)
      toast.error('Failed to load farmers')
    } finally {
      setLoading(false)
    }
  }, [page, search, genderFilter, statusFilter])

  useEffect(() => { fetchFarmers() }, [fetchFarmers])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      if (prev.size === farmers.length && farmers.length > 0) return new Set()
      return new Set(farmers.map(f => f.id))
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    const count = selectedIds.size
    if (!window.confirm(`Are you sure you want to delete ${count} farmer${count === 1 ? '' : 's'}? This action cannot be undone.`)) return
    setBulkDeleting(true)
    let success = 0
    let failure = 0
    await Promise.all(Array.from(selectedIds).map(async id => {
      try {
        const res = await fetch(`/api/farmers/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed')
        success++
      } catch {
        failure++
      }
    }))
    setBulkDeleting(false)
    clearSelection()
    if (failure === 0) {
      toast.success(`Successfully deleted ${success} farmer${success === 1 ? '' : 's'}`)
    } else if (success === 0) {
      toast.error(`Failed to delete all ${failure} farmer${failure === 1 ? '' : 's'}`)
    } else {
      toast.warning(`${success} deleted, ${failure} failed`)
    }
    setPage(1)
    fetchFarmers()
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Farmer Registry</h3>
          <p className="text-sm text-muted-foreground">{total} farmers registered</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImport(true)} className="gap-2">
            <Upload className="w-4 h-4" /> Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportToCSV(farmers, 'farmers')} disabled={farmers.length === 0} className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button onClick={() => setShowAdd(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Farmer
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or code..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={genderFilter} onValueChange={(v) => { setGenderFilter(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-[130px]"><SelectValue placeholder="Gender" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
        {(genderFilter || statusFilter || search) && (
          <Button variant="ghost" size="sm" onClick={() => { setGenderFilter(''); setStatusFilter(''); setSearch(''); setPage(1) }} className="gap-1">
            <X className="w-3.5 h-3.5" /> Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}
            </div>
          ) : farmers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No farmers found"
              description="Try adjusting your search or filters"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      aria-label="Select all farmers"
                      checked={farmers.length > 0 && selectedIds.size === farmers.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Farmer</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="hidden sm:table-cell">Gender</TableHead>
                  <TableHead className="hidden lg:table-cell">Crops</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {farmers.map(f => (
                  <TableRow key={f.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedFarmerId(f.id); setActiveModule('farmer-detail') }}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        aria-label={`Select ${f.firstName} ${f.lastName}`}
                        checked={selectedIds.has(f.id)}
                        onCheckedChange={() => toggleSelect(f.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {initials(f.firstName, f.lastName)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{f.firstName} {f.lastName}</p>
                          {f.farmerCode && <p className="text-[10px] text-muted-foreground font-mono">{f.farmerCode}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{f.phone}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {f.gender && <Badge className={cn('text-[10px]', genderColor[f.gender] || '')}>{f.gender}</Badge>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground truncate max-w-[150px]">
                      {f.mainCrops || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-[10px]', statusColor[f.status] || '')}>{f.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelectedFarmerId(f.id); setActiveModule('farmer-detail') }}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {/* Pagination */}
        {!loading && farmers.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" /> Prev
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add Farmer Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register New Farmer</DialogTitle>
          </DialogHeader>
          <AddFarmerForm onClose={() => { setShowAdd(false); fetchFarmers() }} />
        </DialogContent>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Import Farmers from CSV</DialogTitle>
            <CardDescription>Upload a CSV file to import multiple farmers at once.</CardDescription>
          </DialogHeader>
          <CsvImportForm onClose={() => setShowImport(false)} onSaved={() => { setShowImport(false); fetchFarmers() }} />
        </DialogContent>
      </Dialog>

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-background border rounded-xl shadow-lg px-4 py-3">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="h-5 w-px bg-border" />
          <Button
            size="sm"
            variant="destructive"
            className="gap-1.5"
            disabled={bulkDeleting}
            onClick={handleBulkDelete}
          >
            {bulkDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Bulk Delete
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5"
            disabled={bulkDeleting}
            onClick={clearSelection}
          >
            <X className="w-3.5 h-3.5" />
            Clear selection
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Add Farmer Form (6-section tabbed form, 70+ fields, catalog-driven dropdowns) ─────

function AddFarmerForm({ onClose }: { onClose: () => void }) {
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('demographics')
  const [form, setForm] = useState<Record<string, any>>({
    firstName: '',
    lastName: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    education: '',
    maritalStatus: '',
    nationalIdType: '',
    nationalIdNo: '',
    email: '',
    guardianName: '',
    memberType: 'General',
    isCertified: false,
    certificationType: '',
    enrollmentPlace: '',

    // Location
    country: '',
    province: '',
    district: '',
    commune: '',
    villageName: '',
    zipCode: '',
    gpsLatitude: '',
    gpsLongitude: '',

    // Family
    spouseName: '',
    familyMembers: '',
    childrenUnder18: '',
    schoolGoingChildren: '',
    childrenMaleUnder18: '',
    childrenFemaleUnder18: '',
    schoolGoingMale: '',
    schoolGoingFemale: '',
    housingOwnership: '',
    houseType: '',

    // Finance
    loanTakenLastYear: false,
    loanTakenFrom: '',
    loanAmount: '',
    loanPurpose: '',
    loanInterestPct: '',
    loanInterestPeriod: '',
    loanHasSecurity: false,
    monthlyHouseholdIncome: '',
    annualHouseholdIncome: '',
    primaryIncomeSource: '',
    secondaryIncomeSource: '',

    // Farm
    farmSize: '',
    farmOwnership: '',
    mainCrops: '',
    livestockTypes: '',
    extensionOfficer: '',
    livingConditions: '',
    fuelType: '',
    mealsPerDay: '',
  })

  const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName || !form.lastName || !form.phone) {
      toast.error('First name, last name, and phone are required')
      setActiveTab('demographics')
      return
    }
    setSaving(true)
    try {
      // Numeric coercion — empty strings stay undefined so Prisma doesn't choke
      const num = (v: any) => (v === '' || v == null ? undefined : Number(v))
      const bool = (v: any) => v === true || v === 'true' || v === true
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email || undefined,
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        education: form.education || undefined,
        maritalStatus: form.maritalStatus || undefined,
        nationalIdType: form.nationalIdType || undefined,
        nationalIdNo: form.nationalIdNo || undefined,
        guardianName: form.guardianName || undefined,
        memberType: form.memberType || 'General',
        isCertified: bool(form.isCertified),
        certificationType: form.certificationType || undefined,
        enrollmentPlace: form.enrollmentPlace || undefined,

        country: form.country || undefined,
        province: form.province || undefined,
        district: form.district || undefined,
        commune: form.commune || undefined,
        villageName: form.villageName || undefined,
        zipCode: form.zipCode || undefined,
        gpsLatitude: num(form.gpsLatitude),
        gpsLongitude: num(form.gpsLongitude),

        spouseName: form.spouseName || undefined,
        familyMembers: num(form.familyMembers),
        childrenUnder18: num(form.childrenUnder18),
        schoolGoingChildren: num(form.schoolGoingChildren),
        childrenMaleUnder18: num(form.childrenMaleUnder18),
        childrenFemaleUnder18: num(form.childrenFemaleUnder18),
        schoolGoingMale: num(form.schoolGoingMale),
        schoolGoingFemale: num(form.schoolGoingFemale),
        housingOwnership: form.housingOwnership || undefined,
        houseType: form.houseType || undefined,

        loanTakenLastYear: bool(form.loanTakenLastYear),
        loanTakenFrom: form.loanTakenFrom || undefined,
        loanAmount: num(form.loanAmount),
        loanPurpose: form.loanPurpose || undefined,
        loanInterestPct: num(form.loanInterestPct),
        loanInterestPeriod: form.loanInterestPeriod || undefined,
        loanHasSecurity: bool(form.loanHasSecurity),
        monthlyHouseholdIncome: num(form.monthlyHouseholdIncome),
        annualHouseholdIncome: num(form.annualHouseholdIncome),
        primaryIncomeSource: form.primaryIncomeSource || undefined,
        secondaryIncomeSource: form.secondaryIncomeSource || undefined,

        farmSize: num(form.farmSize),
        farmOwnership: form.farmOwnership || undefined,
        mainCrops: form.mainCrops || undefined,
        livestockTypes: form.livestockTypes || undefined,
        extensionOfficer: form.extensionOfficer || undefined,
        livingConditions: form.livingConditions || undefined,
        fuelType: form.fuelType || undefined,
        mealsPerDay: form.mealsPerDay || undefined,
      }
      const res = await fetch('/api/farmers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || err.detail || 'Failed to create farmer')
      }
      toast.success('Farmer registered successfully')
      onClose()
    } catch (e: any) {
      toast.error(e.message || 'Failed to register farmer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="demographics" className="text-xs gap-1.5"><Users className="w-3.5 h-3.5" /> Demographics</TabsTrigger>
          <TabsTrigger value="location" className="text-xs gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location</TabsTrigger>
          <TabsTrigger value="family" className="text-xs gap-1.5"><Users className="w-3.5 h-3.5" /> Family</TabsTrigger>
          <TabsTrigger value="finance" className="text-xs gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Finance</TabsTrigger>
          <TabsTrigger value="farm" className="text-xs gap-1.5"><Sprout className="w-3.5 h-3.5" /> Farm</TabsTrigger>
        </TabsList>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="First Name *" required>
              <Input value={form.firstName} onChange={e => update('firstName', e.target.value)} required />
            </FormField>
            <FormField label="Last Name *">
              <Input value={form.lastName} onChange={e => update('lastName', e.target.value)} required />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Phone *"><Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+256..." required /></FormField>
            <FormField label="Email"><Input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="optional" /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Gender">
              <CatalogSelect category="gender" value={form.gender} onValueChange={v => update('gender', v)} placeholder="Select" />
            </FormField>
            <FormField label="Date of Birth"><Input type="date" value={form.dateOfBirth} onChange={e => update('dateOfBirth', e.target.value)} /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Education">
              <CatalogSelect category="education_level" value={form.education} onValueChange={v => update('education', v)} placeholder="Select" />
            </FormField>
            <FormField label="Marital Status">
              <CatalogSelect category="marital_status" value={form.maritalStatus} onValueChange={v => update('maritalStatus', v)} placeholder="Select" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="National ID Type">
              <CatalogSelect category="national_id_type" value={form.nationalIdType} onValueChange={v => update('nationalIdType', v)} placeholder="Select" />
            </FormField>
            <FormField label="National ID No"><Input value={form.nationalIdNo} onChange={e => update('nationalIdNo', e.target.value)} /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Guardian Name"><Input value={form.guardianName} onChange={e => update('guardianName', e.target.value)} /></FormField>
            <FormField label="Enrollment Place">
              <CatalogSelect category="enrollment_place" value={form.enrollmentPlace} onValueChange={v => update('enrollmentPlace', v)} placeholder="Select" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Member Type">
              <Select value={form.memberType} onValueChange={v => update('memberType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Contract Farmer">Contract Farmer</SelectItem>
                  <SelectItem value="Out-grower">Out-grower</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Certified?">
              <Select value={form.isCertified ? 'yes' : 'no'} onValueChange={v => update('isCertified', v === 'yes')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
          {form.isCertified && (
            <FormField label="Certification Type">
              <CatalogSelect category="certification_type" value={form.certificationType} onValueChange={v => update('certificationType', v)} placeholder="Select" />
            </FormField>
          )}
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Country"><Input value={form.country} onChange={e => update('country', e.target.value)} placeholder="Uganda" /></FormField>
            <FormField label="Province/Region"><Input value={form.province} onChange={e => update('province', e.target.value)} /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="District"><Input value={form.district} onChange={e => update('district', e.target.value)} /></FormField>
            <FormField label="Sub-county / Commune"><Input value={form.commune} onChange={e => update('commune', e.target.value)} /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Village"><Input value={form.villageName} onChange={e => update('villageName', e.target.value)} /></FormField>
            <FormField label="ZIP Code"><Input value={form.zipCode} onChange={e => update('zipCode', e.target.value)} /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="GPS Latitude"><Input type="number" step="0.000001" value={form.gpsLatitude} onChange={e => update('gpsLatitude', e.target.value)} /></FormField>
            <FormField label="GPS Longitude"><Input type="number" step="0.000001" value={form.gpsLongitude} onChange={e => update('gpsLongitude', e.target.value)} /></FormField>
          </div>
        </TabsContent>

        {/* Family Tab */}
        <TabsContent value="family" className="mt-4 space-y-4">
          <FormField label="Spouse Name"><Input value={form.spouseName} onChange={e => update('spouseName', e.target.value)} /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Total Family Members"><Input type="number" value={form.familyMembers} onChange={e => update('familyMembers', e.target.value)} /></FormField>
            <FormField label="Children Under 18"><Input type="number" value={form.childrenUnder18} onChange={e => update('childrenUnder18', e.target.value)} /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Male Children (<18)"><Input type="number" value={form.childrenMaleUnder18} onChange={e => update('childrenMaleUnder18', e.target.value)} /></FormField>
            <FormField label="Female Children (<18)"><Input type="number" value={form.childrenFemaleUnder18} onChange={e => update('childrenFemaleUnder18', e.target.value)} /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="School-going Children"><Input type="number" value={form.schoolGoingChildren} onChange={e => update('schoolGoingChildren', e.target.value)} /></FormField>
            <FormField label="School-going Male"><Input type="number" value={form.schoolGoingMale} onChange={e => update('schoolGoingMale', e.target.value)} /></FormField>
          </div>
          <FormField label="School-going Female"><Input type="number" value={form.schoolGoingFemale} onChange={e => update('schoolGoingFemale', e.target.value)} /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Housing Ownership">
              <CatalogSelect category="housing_ownership" value={form.housingOwnership} onValueChange={v => update('housingOwnership', v)} placeholder="Select" />
            </FormField>
            <FormField label="House Type">
              <CatalogSelect category="house_type" value={form.houseType} onValueChange={v => update('houseType', v)} placeholder="Select" />
            </FormField>
          </div>
        </TabsContent>

        {/* Finance Tab */}
        <TabsContent value="finance" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Monthly Household Income (UGX)"><Input type="number" value={form.monthlyHouseholdIncome} onChange={e => update('monthlyHouseholdIncome', e.target.value)} /></FormField>
            <FormField label="Annual Household Income (UGX)"><Input type="number" value={form.annualHouseholdIncome} onChange={e => update('annualHouseholdIncome', e.target.value)} /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Primary Income Source">
              <CatalogSelect category="income_source" value={form.primaryIncomeSource} onValueChange={v => update('primaryIncomeSource', v)} placeholder="Select" />
            </FormField>
            <FormField label="Secondary Income Source"><Input value={form.secondaryIncomeSource} onChange={e => update('secondaryIncomeSource', e.target.value)} /></FormField>
          </div>
          <Separator />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Loan History (last 12 months)</p>
          <FormField label="Loan Taken Last Year?">
            <Select value={form.loanTakenLastYear ? 'yes' : 'no'} onValueChange={v => update('loanTakenLastYear', v === 'yes')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          {form.loanTakenLastYear && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Loan From">
                  <CatalogSelect category="loan_source" value={form.loanTakenFrom} onValueChange={v => update('loanTakenFrom', v)} placeholder="Select" />
                </FormField>
                <FormField label="Loan Amount (UGX)"><Input type="number" value={form.loanAmount} onChange={e => update('loanAmount', e.target.value)} /></FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Loan Purpose">
                  <CatalogSelect category="loan_purpose" value={form.loanPurpose} onValueChange={v => update('loanPurpose', v)} placeholder="Select" />
                </FormField>
                <FormField label="Interest Rate (%)"><Input type="number" step="0.1" value={form.loanInterestPct} onChange={e => update('loanInterestPct', e.target.value)} /></FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Interest Period">
                  <Select value={form.loanInterestPeriod} onValueChange={v => update('loanInterestPeriod', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Has Security/Collateral?">
                  <Select value={form.loanHasSecurity ? 'yes' : 'no'} onValueChange={v => update('loanHasSecurity', v === 'yes')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </>
          )}
        </TabsContent>

        {/* Farm Tab */}
        <TabsContent value="farm" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Farm Size (ha)"><Input type="number" step="0.01" value={form.farmSize} onChange={e => update('farmSize', e.target.value)} /></FormField>
            <FormField label="Farm Ownership">
              <CatalogSelect category="land_ownership" value={form.farmOwnership} onValueChange={v => update('farmOwnership', v)} placeholder="Select" />
            </FormField>
          </div>
          <FormField label="Main Crops"><Input value={form.mainCrops} onChange={e => update('mainCrops', e.target.value)} placeholder="Coffee, Beans, Maize..." /></FormField>
          <FormField label="Livestock Types"><Input value={form.livestockTypes} onChange={e => update('livestockTypes', e.target.value)} placeholder="Cattle, Goats, Poultry..." /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Extension Officer"><Input value={form.extensionOfficer} onChange={e => update('extensionOfficer', e.target.value)} /></FormField>
            <FormField label="Living Conditions"><Input value={form.livingConditions} onChange={e => update('livingConditions', e.target.value)} /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Fuel Type">
              <CatalogSelect category="fuel_type" value={form.fuelType} onValueChange={v => update('fuelType', v)} placeholder="Select" />
            </FormField>
            <FormField label="Meals Per Day">
              <Select value={form.mealsPerDay} onValueChange={v => update('mealsPerDay', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4+">4+</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <p className="text-xs text-muted-foreground italic">
            Bank accounts, insurances, livestock, and equipment can be added after registration from the farmer detail page (multi-entry sections).
          </p>
        </TabsContent>
      </Tabs>

      <DialogFooter className="gap-2">
        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
        <Button type="submit" disabled={saving} className="gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Register Farmer
        </Button>
      </DialogFooter>
    </form>
  )
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}{required && ' *'}</Label>
      {children}
    </div>
  )
}

// ─── Enhanced Farmer Detail with Tabs ─────────────────────────────


// ─── CSV Import Form ───────────────────────────────────────────────

const CSV_TEMPLATE = `firstName,lastName,phone,gender,email,memberType,mainCrops,villageName,district,country,farmSize,familyMembers,childrenUnder18
John,Mugisha,+256700000020,Male,john@example.com,General,Coffee,Kibale,Mukono,Uganda,1.5,5,3
Sarah,Achieng,+256700000021,Female,sarah@example.com,General,Maize;Beans,Wakiso,Wakiso,Uganda,2.0,6,4
Kwame,Mensah,+233200000020,Male,kwame@example.com,Commercial,Cocoa,Kumasi,Ashanti,Ghana,3.5,8,5`

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Simple CSV parser (handles quoted values with commas)
    const values: string[] = []
    let current = ''
    let inQuotes = false
    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())

    const row: Record<string, string> = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx] || ''
    })
    rows.push(row)
  }

  return rows
}

function CsvImportForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: number; failed: number; total: number; errors: Array<{ row: number; error: string }> } | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      toast.error('Please upload a CSV file')
      return
    }
    setFileName(file.name)
    const text = await file.text()
    const parsed = parseCSV(text)
    setParsedData(parsed)
    setResult(null)
    if (parsed.length === 0) {
      toast.error('No data rows found in CSV')
    } else {
      toast.success(`Parsed ${parsed.length} rows from CSV`)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'farmer-import-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error('No data to import')
      return
    }
    setImporting(true)
    try {
      const res = await fetch('/api/farmers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmers: parsedData }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult(data)
        if (data.success > 0) {
          toast.success(`Imported ${data.success} farmers successfully`)
        }
        if (data.failed > 0) {
          toast.warning(`${data.failed} rows failed — see details below`)
        }
      } else {
        toast.error(data.error || 'Import failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setImporting(false)
    }
  }

  const validRows = parsedData.filter(r => (r.firstName || r.first_name) && (r.lastName || r.last_name) && (r.phone || r.Phone))
  const invalidRows = parsedData.length - validRows.length

  return (
    <div className="space-y-4">
      {/* Template download */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span className="text-sm">Need a template?</span>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5">
          <FileDown className="w-3.5 h-3.5" /> Download CSV Template
        </Button>
      </div>

      {/* File upload area */}
      {!result && (
        <>
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer',
              dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50'
            )}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('csv-file-input')?.click()}
          >
            <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            {fileName ? (
              <>
                <p className="text-sm font-medium">{fileName}</p>
                <p className="text-xs text-muted-foreground mt-1">{parsedData.length} rows parsed · Click to choose another file</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">Drop CSV file here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">Max 1000 rows · Supported: .csv</p>
              </>
            )}
            <input
              id="csv-file-input"
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>

          {/* Preview table */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Preview ({parsedData.length} rows)</p>
                <div className="flex gap-2 text-xs">
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <CheckCircle className="w-3 h-3 mr-1" /> {validRows.length} valid
                  </Badge>
                  {invalidRows > 0 && (
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                      <XCircle className="w-3 h-3 mr-1" /> {invalidRows} invalid
                    </Badge>
                  )}
                </div>
              </div>
              <div className="max-h-64 overflow-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">#</TableHead>
                      <TableHead className="text-xs">First Name</TableHead>
                      <TableHead className="text-xs">Last Name</TableHead>
                      <TableHead className="text-xs">Phone</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Gender</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Village</TableHead>
                      <TableHead className="text-xs hidden lg:table-cell">District</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 50).map((row, i) => {
                      const fn = row.firstName || row.first_name || ''
                      const ln = row.lastName || row.last_name || ''
                      const ph = row.phone || row.Phone || ''
                      const isValid = fn && ln && ph
                      return (
                        <TableRow key={i} className={cn(!isValid && 'bg-red-50 dark:bg-red-950/20')}>
                          <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="text-xs font-medium">{fn || <span className="text-red-500">—</span>}</TableCell>
                          <TableCell className="text-xs">{ln || <span className="text-red-500">—</span>}</TableCell>
                          <TableCell className="text-xs font-mono">{ph || <span className="text-red-500">—</span>}</TableCell>
                          <TableCell className="text-xs hidden md:table-cell">{row.gender || row.Gender || '—'}</TableCell>
                          <TableCell className="text-xs hidden md:table-cell">{row.villageName || row.village_name || row.village || '—'}</TableCell>
                          <TableCell className="text-xs hidden lg:table-cell">{row.district || row.District || '—'}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              {parsedData.length > 50 && (
                <p className="text-xs text-muted-foreground text-center">Showing first 50 of {parsedData.length} rows</p>
              )}
            </div>
          )}

          {/* Actions */}
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleImport} disabled={importing || parsedData.length === 0} className="gap-2">
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Import {parsedData.length > 0 ? `${validRows.length} Farmers` : ''}
            </Button>
          </DialogFooter>
        </>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
              <p className="text-2xl font-bold text-emerald-600">{result.success}</p>
              <p className="text-xs text-muted-foreground">Successfully Imported</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <XCircle className="w-8 h-8 mx-auto text-red-600 mb-2" />
              <p className="text-2xl font-bold text-red-600">{result.failed}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold text-blue-600">{result.total}</p>
              <p className="text-xs text-muted-foreground">Total Processed</p>
            </CardContent></Card>
          </div>

          {result.errors.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-600">Errors ({result.errors.length})</p>
              <div className="max-h-48 overflow-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Row</TableHead>
                      <TableHead className="text-xs">Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.errors.map((err, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-mono">{err.row}</TableCell>
                        <TableCell className="text-xs text-red-600">{err.error}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setParsedData([]); setFileName(''); setResult(null) }} className="gap-2">
              <Upload className="w-4 h-4" /> Import Another File
            </Button>
            <Button onClick={onSaved} className="gap-2">
              <CheckCircle className="w-4 h-4" /> Done
            </Button>
          </DialogFooter>
        </div>
      )}

      {/* Field reference */}
      {!result && parsedData.length === 0 && (
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">Expected CSV columns (minimum required marked with *):</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1 text-[11px] text-blue-600 dark:text-blue-400">
            <span><strong>firstName*</strong></span>
            <span><strong>lastName*</strong></span>
            <span><strong>phone*</strong></span>
            <span>gender</span>
            <span>email</span>
            <span>memberType</span>
            <span>mainCrops</span>
            <span>villageName</span>
            <span>district</span>
            <span>country</span>
            <span>farmSize</span>
            <span>familyMembers</span>
            <span>childrenUnder18</span>
            <span>education</span>
            <span>maritalStatus</span>
            <span>nationalIdNo</span>
            <span>farmerCode</span>
            <span>&nbsp;</span>
          </div>
        </div>
      )}
    </div>
  )
}


