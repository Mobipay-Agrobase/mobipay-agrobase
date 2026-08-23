'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  Search, Plus, Eye, Pencil, X, UserPlus, Phone, MapPin, Sprout, Calendar, CreditCard,
  ChevronLeft, ChevronRight, Filter, Loader2, Users, ArrowLeft, Star, AlertCircle,
  Layers, DollarSign, GraduationCap, PiggyBank, Leaf, Activity, QrCode, Download,
  Shield, Banknote, Award, Upload, FileSpreadsheet, CheckCircle, XCircle, FileDown,
  Wallet, Trash2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { CatalogSelect } from '@/components/ui/catalog-select'
import { AssetMultiSelect } from '@/components/ui/asset-multi-select'
import { LocationPicker } from '@/components/ui/location-picker'
import { FormField as DSFormField, FormActions } from '@/components/ui/form-design-system'

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

interface FarmerFormPageProps {
  mode: 'create' | 'edit'
  farmerId?: string
}

export default function FarmerFormPage({ mode, farmerId }: FarmerFormPageProps) {
  const { setActiveModule } = useAppStore()
  const [loadingFarmer, setLoadingFarmer] = useState(mode === 'edit')
  const [initialData, setInitialData] = useState<Farmer | null>(null)

  useEffect(() => {
    if (mode === 'edit' && farmerId) {
      setLoadingFarmer(true)
      fetch(`/api/farmers/${farmerId}`)
        .then(r => r.json())
        .then(data => setInitialData(data.data || data || null))
        .catch(() => toast.error('Failed to load farmer data'))
        .finally(() => setLoadingFarmer(false))
    }
  }, [mode, farmerId])

  const handleBack = () => setActiveModule('farmers')

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">
                {mode === 'edit' ? `Edit Farmer — ${initialData?.firstName ?? ''} ${initialData?.lastName ?? ''}` : 'Register New Farmer'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {mode === 'edit' ? 'Update farmer information' : 'Fill in the details to register a new farmer'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto">
        {loadingFarmer ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded" />)}
          </div>
        ) : (
          <div className="p-4 md:p-6">
            <AddFarmerForm
              initialData={initialData}
              farmerId={farmerId}
              onClose={handleBack}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Add Farmer Form (9-section tabbed form matching Excel spec) ─────

function AddFarmerForm({ onClose, initialData, farmerId }: { onClose: () => void; initialData?: Farmer | null; farmerId?: string }) {
  const isEdit = !!farmerId
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('enrollment')
  // Ekibbo feedback: "Lets change cooperative to Farmer group" — groups now come
  // from /api/farmer-groups instead of /api/cooperatives.
  const [groupOptions, setGroupOptions] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetch('/api/farmer-groups?limit=1000')
      .then(r => r.json())
      .then(d => setGroupOptions((d.data || []).map((g: any) => ({ id: g.id, name: g.name }))))
      .catch(() => {})
  }, [])
  const [form, setForm] = useState<Record<string, any>>(() => {
    const defaults: Record<string, any> = {
      // Tab 1: Enrollment
      enrollmentDate: new Date().toISOString().slice(0, 10),
      enrollmentPlace: '',
      farmerCode: '',
      isCertified: false,
      certificationType: '',
      icsYear: '',
      farmerRegistrationUnder: '',
      groupId: '',
      groupName: '',

      // Tab 2: Personal Information
      firstName: '',
      lastName: '',
      phone: '',
      gender: '',
      dateOfBirth: '',
      age: '',
      education: '',
      maritalStatus: '',
      guardianName: '',
      email: '',
      nationalIdType: '',
      nationalIdNo: '',

      // Tab 3: Contact Information
      country: '',
      province: '',
      district: '',
      commune: '',
      villageName: '',
      villageId: '',
      zipCode: '',
      gpsLatitude: '',
      gpsLongitude: '',

      // Tab 4: Family Information
      spouseName: '',
      familyMembers: '',
      childrenUnder18: '',
      schoolGoingChildren: '',

      // Tab 5: Asset Information
      housingOwnership: '',
      houseType: '',
      consumerElectronics: [] as string[],
      vehicles: [] as string[],
      assets: [] as string[],  // catalog-driven multi-select (asset_type)

      // Tab 6: Finance Information
      bankAccounts: [] as Array<{ accountType: string; accountNo: string; bankName: string; branchDetails: string; sortCode: string }>,
      loanTakenLastYear: false,
      loanTakenFrom: '',
      loanAmount: '',
      loanPurpose: '',
      loanInterestPct: '',
      loanInterestPeriod: '',
      loanHasSecurity: false,
      loanRepaymentAmount: '',
      loanRepaymentDate: '',

      // Tab 7: Insurance Information
      insurances: [] as Array<{ insuranceType: string; provider: string; insuranceAmount: string; enrolledDate: string; endDate: string; otherInfo: string }>,

      // Tab 8: Farm Equipment
      farmEquipments: [] as Array<{ equipmentItem: string; equipmentCount: string; yearOfManufacture: string; yearOfPurchase: string }>,

      // Tab 9: Animal Husbandry
      animals: [] as Array<{ farmAnimal: string; animalCount: string; fodder: string; animalHousing: string; revenue: string; breedName: string; animalForGrowth: string }>,
    }
    if (initialData) {
      Object.keys(defaults).forEach(k => {
        if (initialData[k as keyof Farmer] !== undefined && initialData[k as keyof Farmer] !== null) {
          defaults[k] = initialData[k as keyof Farmer]
        }
      })
      // Defensive coercion: ensure all array-typed fields are actually arrays.
      // The detail API (/api/farmers/[id]) historically returned JSON-stored
      // fields as raw strings, which crashed form.bankAccounts.map() with
      // "R.bankAccounts.map is not a function". Even with the API now fixed,
      // we coerce here as defense-in-depth so a future API regression can't
      // take down the edit form.
      const arrayFields: (keyof typeof defaults)[] = [
        'bankAccounts', 'insurances', 'farmEquipments', 'animals',
        'consumerElectronics', 'vehicles', 'assets',
        'mainCrops', 'livestockTypes',
      ]
      arrayFields.forEach(k => {
        const v = defaults[k]
        if (Array.isArray(v)) return
        if (typeof v === 'string') {
          try { defaults[k] = JSON.parse(v) } catch { defaults[k] = [] }
          if (!Array.isArray(defaults[k])) defaults[k] = []
        } else if (v == null) {
          defaults[k] = []
        } else {
          // object or other — wrap in array only if it's not already iterable
          defaults[k] = []
        }
      })
      // Normalize date inputs to yyyy-MM-dd (the DB returns full ISO timestamps,
      // which <input type="date"> rejects).
      const dateFields: (keyof typeof defaults)[] = ['dateOfBirth', 'enrollmentDate', 'loanRepaymentDate']
      dateFields.forEach(k => {
        const raw = defaults[k]
        if (typeof raw === 'string' && raw.length > 10) {
          defaults[k] = raw.slice(0, 10)
        }
      })
      if (Array.isArray(defaults.insurances)) {
        defaults.insurances = (defaults.insurances as any[]).map(i => ({
          ...i,
          enrolledDate: i.enrolledDate ? String(i.enrolledDate).slice(0, 10) : '',
          endDate: i.endDate ? String(i.endDate).slice(0, 10) : '',
        }))
      }
      if (typeof defaults.dateOfBirth === 'string' && defaults.dateOfBirth) {
        const birth = new Date(defaults.dateOfBirth)
        const today = new Date()
        let age = today.getFullYear() - birth.getFullYear()
        const m = today.getMonth() - birth.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
        defaults.age = age >= 0 ? String(age) : ''
      }
    }
    return defaults
  })

  const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const computeAge = (dob: string) => {
    if (!dob) return ''
    const birth = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age >= 0 ? String(age) : ''
  }

  const handleDobChange = (dob: string) => {
    update('dateOfBirth', dob)
    update('age', computeAge(dob))
  }

  // Multi-entry helpers
  const addBankAccount = () => update('bankAccounts', [...form.bankAccounts, { accountType: '', accountNo: '', bankName: '', branchDetails: '', sortCode: '' }])
  const removeBankAccount = (i: number) => update('bankAccounts', form.bankAccounts.filter((_: any, idx: number) => idx !== i))
  const updateBankAccount = (i: number, k: string, v: string) => {
    const next = [...form.bankAccounts]
    next[i] = { ...next[i], [k]: v }
    update('bankAccounts', next)
  }

  const addInsurance = () => update('insurances', [...form.insurances, { insuranceType: '', provider: '', insuranceAmount: '', enrolledDate: '', endDate: '', otherInfo: '' }])
  const removeInsurance = (i: number) => update('insurances', form.insurances.filter((_: any, idx: number) => idx !== i))
  const updateInsurance = (i: number, k: string, v: string) => {
    const next = [...form.insurances]
    next[i] = { ...next[i], [k]: v }
    update('insurances', next)
  }

  const addEquipment = () => update('farmEquipments', [...form.farmEquipments, { equipmentItem: '', equipmentCount: '', yearOfManufacture: '', yearOfPurchase: '' }])
  const removeEquipment = (i: number) => update('farmEquipments', form.farmEquipments.filter((_: any, idx: number) => idx !== i))
  const updateEquipment = (i: number, k: string, v: string) => {
    const next = [...form.farmEquipments]
    next[i] = { ...next[i], [k]: v }
    update('farmEquipments', next)
  }

  const addAnimal = () => update('animals', [...form.animals, { farmAnimal: '', animalCount: '', fodder: '', animalHousing: '', revenue: '', breedName: '', animalForGrowth: '' }])
  const removeAnimal = (i: number) => update('animals', form.animals.filter((_: any, idx: number) => idx !== i))
  const updateAnimal = (i: number, k: string, v: string) => {
    const next = [...form.animals]
    next[i] = { ...next[i], [k]: v }
    update('animals', next)
  }

  const toggleBadge = (field: string, value: string) => {
    const current: string[] = form[field] || []
    update(field, current.includes(value) ? current.filter((v: string) => v !== value) : [...current, value])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName || !form.lastName || !form.phone) {
      toast.error('First name, last name, and phone are required')
      setActiveTab('personal')
      return
    }
    if (!form.farmerRegistrationUnder) {
      toast.error('Farmer Registration Under (Agri/Aqua) is required')
      setActiveTab('enrollment')
      return
    }
    if (!form.groupId) {
      toast.error('Please select a Farmer Group')
      setActiveTab('enrollment')
      return
    }
    if (!form.district || !form.commune || !form.villageName) {
      toast.error('Please select District, Subcounty and Village (used for the farmer code)')
      setActiveTab('enrollment')
      return
    }
    setSaving(true)
    try {
      const num = (v: any) => (v === '' || v == null ? undefined : Number(v))
      const bool = (v: any) => v === true || v === 'true'
      const str = (v: any) => (v === '' || v == null ? undefined : v)
      const payload = {
        // Tab 1: Enrollment
        enrollmentDate: str(form.enrollmentDate),
        enrollmentPlace: str(form.enrollmentPlace),
        farmerCode: str(form.farmerCode),
        isCertified: bool(form.isCertified),
        certificationType: str(form.certificationType),
        icsYear: str(form.icsYear),
        farmerRegistrationUnder: str(form.farmerRegistrationUnder),
        groupId: str(form.groupId),

        // Tab 2: Personal Information
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        gender: str(form.gender),
        dateOfBirth: str(form.dateOfBirth),
        age: num(form.age),
        education: str(form.education),
        maritalStatus: str(form.maritalStatus),
        guardianName: str(form.guardianName),
        email: str(form.email),
        nationalIdType: str(form.nationalIdType),
        nationalIdNo: str(form.nationalIdNo),

        // Tab 3: Contact Information
        country: str(form.country),
        province: str(form.province),
        district: str(form.district),
        commune: str(form.commune),
        villageName: str(form.villageName),
        villageId: str(form.villageId),
        zipCode: str(form.zipCode),
        gpsLatitude: num(form.gpsLatitude),
        gpsLongitude: num(form.gpsLongitude),

        // Tab 4: Family Information
        spouseName: str(form.spouseName),
        familyMembers: num(form.familyMembers),
        childrenUnder18: num(form.childrenUnder18),
        schoolGoingChildren: num(form.schoolGoingChildren),

        // Tab 5: Asset Information
        housingOwnership: str(form.housingOwnership),
        houseType: str(form.houseType),
        consumerElectronics: form.consumerElectronics.length > 0 ? form.consumerElectronics : undefined,
        vehicles: form.vehicles.length > 0 ? form.vehicles : undefined,
        assets: form.assets.length > 0 ? form.assets : undefined,

        // Tab 6: Finance Information
        bankAccounts: form.bankAccounts.length > 0 ? form.bankAccounts.map((a: any) => ({
          accountType: str(a.accountType),
          accountNo: str(a.accountNo),
          bankName: str(a.bankName),
          branchDetails: str(a.branchDetails),
          sortCode: str(a.sortCode),
        })) : undefined,
        loanTakenLastYear: bool(form.loanTakenLastYear),
        loanTakenFrom: str(form.loanTakenFrom),
        loanAmount: num(form.loanAmount),
        loanPurpose: str(form.loanPurpose),
        loanInterestPct: num(form.loanInterestPct),
        loanInterestPeriod: str(form.loanInterestPeriod),
        loanHasSecurity: bool(form.loanHasSecurity),
        loanRepaymentAmount: num(form.loanRepaymentAmount),
        loanRepaymentDate: str(form.loanRepaymentDate),

        // Tab 7: Insurance Information
        insurances: form.insurances.length > 0 ? form.insurances.map((ins: any) => ({
          insuranceType: str(ins.insuranceType),
          provider: str(ins.provider),
          insuranceAmount: num(ins.insuranceAmount),
          enrolledDate: str(ins.enrolledDate),
          endDate: str(ins.endDate),
          otherInfo: str(ins.otherInfo),
        })) : undefined,

        // Tab 8: Farm Equipment
        farmEquipments: form.farmEquipments.length > 0 ? form.farmEquipments.map((eq: any) => ({
          equipmentItem: str(eq.equipmentItem),
          equipmentCount: num(eq.equipmentCount),
          yearOfManufacture: str(eq.yearOfManufacture),
          yearOfPurchase: str(eq.yearOfPurchase),
        })) : undefined,

        // Tab 9: Animal Husbandry
        animals: form.animals.length > 0 ? form.animals.map((an: any) => ({
          farmAnimal: str(an.farmAnimal),
          animalCount: num(an.animalCount),
          fodder: str(an.fodder),
          animalHousing: str(an.animalHousing),
          revenue: num(an.revenue),
          breedName: str(an.breedName),
          animalForGrowth: str(an.animalForGrowth),
        })) : undefined,
      }
      const res = await fetch(isEdit ? `/api/farmers/${farmerId}` : '/api/farmers', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || err.detail || `Failed to ${isEdit ? 'update' : 'create'} farmer`)
      }
      toast.success(isEdit ? 'Farmer updated successfully' : 'Farmer registered successfully')
      onClose()
    } catch (e: any) {
      toast.error(e.message || 'Failed to register farmer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-form-fade-in">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1 p-1 rounded-xl bg-muted/50 border border-border/40">
          <TabsTrigger value="enrollment" className="text-xs gap-1.5 rounded-lg"><FileSpreadsheet className="w-3.5 h-3.5" /> Enrollment</TabsTrigger>
          <TabsTrigger value="personal" className="text-xs gap-1.5 rounded-lg"><Users className="w-3.5 h-3.5" /> Personal</TabsTrigger>
          <TabsTrigger value="contact" className="text-xs gap-1.5 rounded-lg"><Phone className="w-3.5 h-3.5" /> Contact</TabsTrigger>
          <TabsTrigger value="family" className="text-xs gap-1.5 rounded-lg"><Users className="w-3.5 h-3.5" /> Family</TabsTrigger>
          <TabsTrigger value="assets" className="text-xs gap-1.5 rounded-lg"><Star className="w-3.5 h-3.5" /> Assets</TabsTrigger>
          <TabsTrigger value="finance" className="text-xs gap-1.5 rounded-lg"><DollarSign className="w-3.5 h-3.5" /> Finance</TabsTrigger>
          <TabsTrigger value="insurance" className="text-xs gap-1.5 rounded-lg"><Shield className="w-3.5 h-3.5" /> Insurance</TabsTrigger>
          <TabsTrigger value="equipment" className="text-xs gap-1.5 rounded-lg"><Sprout className="w-3.5 h-3.5" /> Equipment</TabsTrigger>
          <TabsTrigger value="animals" className="text-xs gap-1.5 rounded-lg"><Activity className="w-3.5 h-3.5" /> Animals</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Enrollment ── */}
        <TabsContent value="enrollment" className="mt-4 space-y-4 form-tab-content">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Enrollment Date">
              <Input type="date" value={form.enrollmentDate} readOnly />
            </FormField>
            <FormField label="Enrollment Place">
              <CatalogSelect category="enrollment_place" value={form.enrollmentPlace} onValueChange={v => update('enrollmentPlace', v)} placeholder="Select" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Farmer Code">
              <Input value={form.farmerCode || 'Auto-generated on save'} readOnly className="text-muted-foreground" />
            </FormField>
            <FormField label="Is Certified Farmer">
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="isCertified" checked={form.isCertified === true} onChange={() => update('isCertified', true)} className="accent-primary" />
                  YES
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="isCertified" checked={form.isCertified === false} onChange={() => update('isCertified', false)} className="accent-primary" />
                  NO
                </label>
              </div>
            </FormField>
          </div>
          {form.isCertified && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Certification Type">
                <Select value={form.certificationType} onValueChange={v => update('certificationType', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Group">Group</SelectItem>
                    <SelectItem value="RFA">RFA (Rainforest Alliance)</SelectItem>
                    <SelectItem value="Rainforest Alliance">Rainforest Alliance</SelectItem>
                    <SelectItem value="Organic">Organic</SelectItem>
                    <SelectItem value="UTZ">UTZ</SelectItem>
                    <SelectItem value="Fairtrade">Fairtrade</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Year of ICS">
                <Select value={form.icsYear} onValueChange={v => update('icsYear', v)}>
                  <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i).map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          )}
          <FormField label="Farmer Registration Under *" required>
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="regUnder" checked={form.farmerRegistrationUnder === 'Agri'} onChange={() => update('farmerRegistrationUnder', 'Agri')} className="accent-primary" />
                Agri
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="regUnder" checked={form.farmerRegistrationUnder === 'Aqua'} onChange={() => update('farmerRegistrationUnder', 'Aqua')} className="accent-primary" />
                Aqua
              </label>
            </div>
          </FormField>

          {/* ── Farmer Group (Ekibbo: replaced Cooperative) ── */}
          <div className="space-y-1.5">
            <Label>Farmer Group *</Label>
            <Select value={form.groupId || undefined}
              onValueChange={v => {
                const g = groupOptions.find(o => o.id === v)
                update('groupId', v)
                update('groupName', g?.name ?? '')
              }}>
              <SelectTrigger><SelectValue placeholder={form.groupName || 'Select farmer group'} /></SelectTrigger>
              <SelectContent>
                {groupOptions.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">No farmer groups yet — add one under Master Data.</div>}
                {groupOptions.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* ── Location (Ekibbo: District / Subcounty / Village drive the farmer code) ── */}
          <div className="space-y-2">
            <Label>District / Subcounty / Village *</Label>
            <LocationPicker
              value={{
                country: 'Uganda',
                villageId: form.villageId,
              }}
              onChange={sel => {
                update('country', sel.country || 'Uganda')
                update('province', sel.region || '')
                update('district', sel.district || '')
                update('commune', sel.subCounty || '')
                update('villageName', sel.village || '')
                update('villageId', sel.villageId || '')
              }}
            />
            {/* Live farmer-code preview in Ekibbo MN0001L format */}
            <div className="flex items-center gap-2 flex-wrap">
              {(form.district || form.commune || form.villageName) ? (
                <>
                  <Badge variant="outline" className="font-mono text-xs">
                    Farmer code: {(form.district?.[0] || '•').toUpperCase()}
                    {(form.commune?.[0] || '•').toUpperCase()}####
                    {(form.villageName?.[0] || '•').toUpperCase()}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    e.g. M = {form.district || 'District'}, N = {form.commune || 'Subcounty'}, L = {form.villageName || 'Village'} — final number assigned on save
                  </span>
                </>
              ) : (
                <span className="text-[10px] text-muted-foreground">Select District → Subcounty → Village to build the farmer code (e.g. MN0001L).</span>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 2: Personal Information ── */}
        <TabsContent value="personal" className="mt-4 space-y-4 form-tab-content">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Full Name *" required>
              <Input value={form.firstName} onChange={e => update('firstName', e.target.value)} required />
            </FormField>
            <FormField label="Last Name *" required>
              <Input value={form.lastName} onChange={e => update('lastName', e.target.value)} required />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Contact Number *" required>
              <Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+256..." required />
            </FormField>
            <FormField label="Gender">
              <CatalogSelect category="gender" value={form.gender} onValueChange={v => update('gender', v)} placeholder="Select" fallbackOptions={['Male', 'Female', 'Other']} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Date of Birth">
              <Input type="date" value={form.dateOfBirth} onChange={e => handleDobChange(e.target.value)} />
            </FormField>
            <FormField label="Age">
              <Input type="number" value={form.age} readOnly className="text-muted-foreground" placeholder="Auto-calculated" />
            </FormField>
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
            <FormField label="Guardian/Parent Name">
              <Input value={form.guardianName} onChange={e => update('guardianName', e.target.value)} />
            </FormField>
            <FormField label="Email">
              <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="optional" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="National ID Type">
              <CatalogSelect category="national_id_type" value={form.nationalIdType} onValueChange={v => update('nationalIdType', v)} placeholder="Select" />
            </FormField>
            {form.nationalIdType && (
              <FormField label="ID Proof No">
                <Input value={form.nationalIdNo} onChange={e => update('nationalIdNo', e.target.value)} />
              </FormField>
            )}
          </div>
        </TabsContent>

        {/* ── Tab 3: Contact Information ── */}
        <TabsContent value="contact" className="mt-4 space-y-4 form-tab-content">
          <p className="text-xs text-muted-foreground">District / Subcounty / Village are captured on the Enrollment tab (they build the farmer code).</p>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="District (from enrollment)">
              <Input value={form.district || ''} disabled placeholder="Set on Enrollment tab" />
            </FormField>
            <FormField label="Subcounty (from enrollment)">
              <Input value={form.commune || ''} disabled placeholder="Set on Enrollment tab" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Village (from enrollment)">
              <Input value={form.villageName || ''} disabled placeholder="Set on Enrollment tab" />
            </FormField>
            <FormField label="Zip Code">
              <Input value={form.zipCode} onChange={e => update('zipCode', e.target.value)} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Country">
              <Input value={form.country || 'Uganda'} disabled placeholder="Uganda" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="GPS Latitude">
              <Input type="number" step="0.000001" value={form.gpsLatitude} onChange={e => update('gpsLatitude', e.target.value)} />
            </FormField>
            <FormField label="GPS Longitude">
              <Input type="number" step="0.000001" value={form.gpsLongitude} onChange={e => update('gpsLongitude', e.target.value)} />
            </FormField>
          </div>
        </TabsContent>

        {/* ── Tab 4: Family Information ── */}
        <TabsContent value="family" className="mt-4 space-y-4 form-tab-content">
          <FormField label="Spouse Name">
            <Input value={form.spouseName} onChange={e => update('spouseName', e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="No of Family Members">
              <Input type="number" value={form.familyMembers} onChange={e => update('familyMembers', e.target.value)} />
            </FormField>
            <FormField label="Total Children below 18">
              <Input type="number" value={form.childrenUnder18} onChange={e => update('childrenUnder18', e.target.value)} />
            </FormField>
          </div>
          <FormField label="Total School Going Children (&lt;18 Yrs)">
            <Input type="number" value={form.schoolGoingChildren} onChange={e => update('schoolGoingChildren', e.target.value)} />
          </FormField>
        </TabsContent>

        {/* ── Tab 5: Asset Information ── */}
        <TabsContent value="assets" className="mt-4 space-y-4 form-tab-content">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Housing Ownership">
              <CatalogSelect category="housing_ownership" value={form.housingOwnership} onValueChange={v => update('housingOwnership', v)} placeholder="Select" />
            </FormField>
            <FormField label="House Type">
              <CatalogSelect category="house_type" value={form.houseType} onValueChange={v => update('houseType', v)} placeholder="Select" />
            </FormField>
          </div>
          {/* Assets — catalog-driven multi-select + free text (team feedback: farmers have diverse assets) */}
          <FormField label="Assets Owned (select from list + add your own)">
            <AssetMultiSelect
              value={form.assets || []}
              onChange={(v) => update('assets', v)}
              category="asset_type"
            />
          </FormField>
          <FormField label="Consumer Electronics">
            <div className="flex flex-wrap gap-2 pt-1">
              {['TV', 'Washing Machine', 'Air Conditioner', 'Fridge', 'Radio', 'Smartphone'].map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleBadge('consumerElectronics', item)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                    (form.consumerElectronics || []).includes(item)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="Vehicles">
            <div className="flex flex-wrap gap-2 pt-1">
              {['Bicycle', 'Motorcycle', 'Car', 'Pickup', 'Lorry', 'Animal-drawn Cart'].map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleBadge('vehicles', item)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                    (form.vehicles || []).includes(item)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </FormField>
        </TabsContent>

        {/* ── Tab 6: Finance Information ── */}
        <TabsContent value="finance" className="mt-4 space-y-4 form-tab-content">
          {/* Bank Accounts (multi-entry) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bank Accounts</p>
              <Button type="button" variant="outline" size="sm" onClick={addBankAccount} className="gap-1 h-7 text-xs">
                <Plus className="w-3 h-3" /> Add Account
              </Button>
            </div>
            {form.bankAccounts.map((acc: any, i: number) => (
              <div key={i} className="relative border rounded-lg p-3 space-y-3 bg-muted/20">
                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeBankAccount(i)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Account Type">
                    <Select value={acc.accountType} onValueChange={v => updateBankAccount(i, 'accountType', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Current">Current</SelectItem>
                        <SelectItem value="Savings">Savings</SelectItem>
                        <SelectItem value="Salary">Salary</SelectItem>
                        <SelectItem value="Fixed Deposit">Fixed Deposit</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Recurring Deposit">Recurring Deposit</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Account No">
                    <Input value={acc.accountNo} onChange={e => updateBankAccount(i, 'accountNo', e.target.value)} />
                  </FormField>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <FormField label="Bank Name">
                    <CatalogSelect category="bank_uganda" value={acc.bankName} onValueChange={v => updateBankAccount(i, 'bankName', v)} placeholder="Select bank" />
                  </FormField>
                  <FormField label="Branch Details">
                    <Input value={acc.branchDetails} onChange={e => updateBankAccount(i, 'branchDetails', e.target.value)} />
                  </FormField>
                  <FormField label="Sort Code">
                    <Input value={acc.sortCode} onChange={e => updateBankAccount(i, 'sortCode', e.target.value)} />
                  </FormField>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Loan Section */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Loan History</p>
            <FormField label="Loan Taken Last Year?">
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="loan" checked={form.loanTakenLastYear === true} onChange={() => update('loanTakenLastYear', true)} className="accent-primary" />
                  YES
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="loan" checked={form.loanTakenLastYear === false} onChange={() => update('loanTakenLastYear', false)} className="accent-primary" />
                  NO
                </label>
              </div>
            </FormField>
            {form.loanTakenLastYear && (
              <div className="space-y-3">
                <FormField label="Loan Taken From">
                  <Select value={form.loanTakenFrom} onValueChange={v => update('loanTakenFrom', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank">Bank</SelectItem>
                      <SelectItem value="Relative">Relative</SelectItem>
                      <SelectItem value="Friend">Friend</SelectItem>
                      <SelectItem value="Farming Contract">Farming Contract</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Loan Amount">
                    <Input type="number" value={form.loanAmount} onChange={e => update('loanAmount', e.target.value)} />
                  </FormField>
                  <FormField label="Purpose">
                    <CatalogSelect category="loan_purpose" value={form.loanPurpose} onValueChange={v => update('loanPurpose', v)} placeholder="Select" />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Loan Interest %">
                    <Input type="number" step="0.1" value={form.loanInterestPct} onChange={e => update('loanInterestPct', e.target.value)} />
                  </FormField>
                  <FormField label="Interest Period">
                    <div className="flex gap-4 pt-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="radio" name="interestPeriod" checked={form.loanInterestPeriod === 'Monthly'} onChange={() => update('loanInterestPeriod', 'Monthly')} className="accent-primary" />
                        Monthly
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="radio" name="interestPeriod" checked={form.loanInterestPeriod === 'Yearly'} onChange={() => update('loanInterestPeriod', 'Yearly')} className="accent-primary" />
                        Yearly
                      </label>
                    </div>
                  </FormField>
                </div>
                <FormField label="Security">
                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="loanSecurity" checked={form.loanHasSecurity === true} onChange={() => update('loanHasSecurity', true)} className="accent-primary" />
                      YES
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="loanSecurity" checked={form.loanHasSecurity === false} onChange={() => update('loanHasSecurity', false)} className="accent-primary" />
                      NO
                    </label>
                  </div>
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Loan Repayment Amount">
                    <Input type="number" value={form.loanRepaymentAmount} onChange={e => update('loanRepaymentAmount', e.target.value)} />
                  </FormField>
                  <FormField label="Loan Repayment Date">
                    <Input type="date" value={form.loanRepaymentDate} onChange={e => update('loanRepaymentDate', e.target.value)} />
                  </FormField>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Tab 7: Insurance Information (multi-entry) ── */}
        <TabsContent value="insurance" className="mt-4 space-y-4 form-tab-content">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Insurance Records</p>
            <Button type="button" variant="outline" size="sm" onClick={addInsurance} className="gap-1 h-7 text-xs">
              <Plus className="w-3 h-3" /> Add Insurance
            </Button>
          </div>
          {form.insurances.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No insurance records added yet.</p>
          )}
          {form.insurances.map((ins: any, i: number) => (
            <div key={i} className="relative border rounded-lg p-3 space-y-3 bg-muted/20">
              <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeInsurance(i)}>
                <X className="w-3.5 h-3.5" />
              </Button>
              <FormField label="Insurance Type">
                <div className="flex gap-4 pt-2">
                  {['Life', 'Health', 'Crop', 'Social'].map(t => (
                    <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name={`insType-${i}`} checked={ins.insuranceType === t} onChange={() => updateInsurance(i, 'insuranceType', t)} className="accent-primary" />
                      {t}
                    </label>
                  ))}
                </div>
              </FormField>
              {ins.insuranceType && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Provider" required>
                      <CatalogSelect category="insurance_company_uganda" value={ins.provider} onValueChange={v => updateInsurance(i, 'provider', v)} placeholder="Select provider" />
                    </FormField>
                    <FormField label="Insurance Amount" required>
                      <Input type="number" value={ins.insuranceAmount} onChange={e => updateInsurance(i, 'insuranceAmount', e.target.value)} required />
                    </FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Insurance Enrolled Date">
                      <Input type="date" value={ins.enrolledDate} onChange={e => updateInsurance(i, 'enrolledDate', e.target.value)} />
                    </FormField>
                    <FormField label="Insurance End Date">
                      <Input type="date" value={ins.endDate} onChange={e => updateInsurance(i, 'endDate', e.target.value)} />
                    </FormField>
                  </div>
                  <FormField label="Other Insurance Info">
                    <Input value={ins.otherInfo} onChange={e => updateInsurance(i, 'otherInfo', e.target.value)} />
                  </FormField>
                </>
              )}
            </div>
          ))}
        </TabsContent>

        {/* ── Tab 8: Farm Equipment (multi-entry) ── */}
        <TabsContent value="equipment" className="mt-4 space-y-4 form-tab-content">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Farm Equipment</p>
            <Button type="button" variant="outline" size="sm" onClick={addEquipment} className="gap-1 h-7 text-xs">
              <Plus className="w-3 h-3" /> Add Equipment
            </Button>
          </div>
          {form.farmEquipments.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No equipment records added yet.</p>
          )}
          {form.farmEquipments.map((eq: any, i: number) => (
            <div key={i} className="relative border rounded-lg p-3 space-y-3 bg-muted/20">
              <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeEquipment(i)}>
                <X className="w-3.5 h-3.5" />
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Farm Equipment Item">
                  <CatalogSelect category="farm_equipment" value={eq.equipmentItem} onValueChange={v => updateEquipment(i, 'equipmentItem', v)} placeholder="Select" />
                </FormField>
                <FormField label="Farm Equipment Item Count">
                  <Input type="number" value={eq.equipmentCount} onChange={e => updateEquipment(i, 'equipmentCount', e.target.value)} />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Year of Manufacture">
                  <Input value={eq.yearOfManufacture} onChange={e => updateEquipment(i, 'yearOfManufacture', e.target.value)} placeholder="e.g. 2022" />
                </FormField>
                <FormField label="Year of Purchase">
                  <Input value={eq.yearOfPurchase} onChange={e => updateEquipment(i, 'yearOfPurchase', e.target.value)} placeholder="e.g. 2023" />
                </FormField>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* ── Tab 9: Animal Husbandry (multi-entry) ── */}
        <TabsContent value="animals" className="mt-4 space-y-4 form-tab-content">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Animal Husbandry</p>
            <Button type="button" variant="outline" size="sm" onClick={addAnimal} className="gap-1 h-7 text-xs">
              <Plus className="w-3 h-3" /> Add Animal
            </Button>
          </div>
          {form.animals.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No animal records added yet.</p>
          )}
          {form.animals.map((an: any, i: number) => (
            <div key={i} className="relative border rounded-lg p-3 space-y-3 bg-muted/20">
              <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeAnimal(i)}>
                <X className="w-3.5 h-3.5" />
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Farm Animal">
                  <CatalogSelect category="animal_type" value={an.farmAnimal} onValueChange={v => updateAnimal(i, 'farmAnimal', v)} placeholder="Select" />
                </FormField>
                <FormField label="Animal Count">
                  <Input type="number" value={an.animalCount} onChange={e => updateAnimal(i, 'animalCount', e.target.value)} />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Fodder">
                  <CatalogSelect category="fodder" value={an.fodder} onValueChange={v => updateAnimal(i, 'fodder', v)} placeholder="Select" />
                </FormField>
                <FormField label="Animal Housing">
                  <CatalogSelect category="animal_housing" value={an.animalHousing} onValueChange={v => updateAnimal(i, 'animalHousing', v)} placeholder="Select" />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Revenue">
                  <Input type="number" value={an.revenue} onChange={e => updateAnimal(i, 'revenue', e.target.value)} />
                </FormField>
                <FormField label="Breed Name">
                  <Input value={an.breedName} onChange={e => updateAnimal(i, 'breedName', e.target.value)} />
                </FormField>
              </div>
              <FormField label="Animal for Growth">
                <CatalogSelect category="animal_for_growth" value={an.animalForGrowth} onValueChange={v => updateAnimal(i, 'animalForGrowth', v)} placeholder="Select" />
              </FormField>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Bottom action bar */}
      <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-border/40 mt-6">
          <Button type="button" variant="outline" onClick={onClose} className="gap-2 btn-hover-lift" disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="gap-2 btn-hover-lift min-w-[140px]">
            {saving ? (<><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>) : (isEdit ? 'Update Farmer' : 'Register Farmer')}
          </Button>
        </div>
      </div>
    </form>
  )
}

// FormField is now imported from the design system (DSFormField)
// Local alias for backward compatibility with existing JSX
const FormField = DSFormField
