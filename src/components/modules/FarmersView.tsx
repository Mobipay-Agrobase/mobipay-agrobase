'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  Search, Plus, Eye, Pencil, X, UserPlus, Phone, MapPin, Sprout, Calendar, CreditCard,
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
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { EmptyState, exportToCSV } from '@/components/ui/empty-state'

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
  extensionOfficer?: string | null
  group?: { id: string; name: string } | null
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
  const { setActiveModule } = useAppStore()
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
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

  const handleDeleteFarmer = async (f: Farmer) => {
    if (!window.confirm(`Are you sure you want to delete ${f.firstName} ${f.lastName}? This action cannot be undone.`)) return
    try {
      const res = await fetch(`/api/farmers/${f.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success(`Deleted ${f.firstName} ${f.lastName}`)
      fetchFarmers()
    } catch {
      toast.error('Failed to delete farmer')
    }
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
          <Button onClick={() => setActiveModule('farmer-create')} className="gap-2">
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
                  <TableHead className="hidden md:table-cell">Field Officer</TableHead>
                  <TableHead className="hidden xl:table-cell">Village</TableHead>
                  <TableHead className="hidden xl:table-cell">Cooperative</TableHead>
                  <TableHead className="hidden sm:table-cell">Gender</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {farmers.map(f => (
                  <TableRow key={f.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { useAppStore.getState().setSelectedFarmerId(f.id); setActiveModule('farmer-detail') }}>
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
                    <TableCell className="hidden md:table-cell text-sm">
                      {f.extensionOfficer || '—'}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-muted-foreground truncate max-w-[150px]">
                      {f.villageName || '—'}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-muted-foreground truncate max-w-[150px]">
                      {f.group?.name || '—'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {f.gender && <Badge className={cn('text-[10px]', genderColor[f.gender] || '')}>{f.gender}</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-[10px]', statusColor[f.status] || '')}>{f.status}</Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); useAppStore.getState().setSelectedFarmerId(f.id); setActiveModule('farmer-detail') }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); useAppStore.getState().setSelectedFarmerId(f.id); setActiveModule('farmer-edit') }}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteFarmer(f) }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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


