'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { CatalogSelect } from '@/components/ui/catalog-select'

interface FarmerData {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string | null
  gender?: string | null
  dateOfBirth?: string | null
  education?: string | null
  maritalStatus?: string | null
  nationalIdType?: string | null
  nationalIdNo?: string | null
  guardianName?: string | null
  memberType?: string
  isCertified?: boolean
  certificationType?: string | null
  enrollmentPlace?: string | null
  country?: string | null
  province?: string | null
  district?: string | null
  commune?: string | null
  villageName?: string | null
  zipCode?: string | null
  gpsLatitude?: number | null
  gpsLongitude?: number | null
  spouseName?: string | null
  familyMembers?: number | null
  childrenUnder18?: number | null
  schoolGoingChildren?: number | null
  childrenMaleUnder18?: number | null
  childrenFemaleUnder18?: number | null
  schoolGoingMale?: number | null
  schoolGoingFemale?: number | null
  housingOwnership?: string | null
  houseType?: string | null
  loanTakenLastYear?: boolean
  loanTakenFrom?: string | null
  loanAmount?: number | null
  loanPurpose?: string | null
  loanInterestPct?: number | null
  loanInterestPeriod?: string | null
  loanHasSecurity?: boolean
  monthlyHouseholdIncome?: number | null
  annualHouseholdIncome?: number | null
  primaryIncomeSource?: string | null
  secondaryIncomeSource?: string | null
  farmSize?: number | null
  farmOwnership?: string | null
  mainCrops?: string | null
  livestockTypes?: string | null
  extensionOfficer?: string | null
  livingConditions?: string | null
  fuelType?: string | null
  mealsPerDay?: string | null
  status?: string
}

interface Props {
  farmer: FarmerData
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

const toDateInput = (iso?: string | null): string => {
  if (!iso) return ''
  try { return new Date(iso).toISOString().split('T')[0] } catch { return '' }
}

export function EditFarmerDialog({ farmer, open, onOpenChange, onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('demographics')
  const [form, setForm] = useState<Record<string, any>>({})

  // Prefill form when farmer changes or dialog opens
  useEffect(() => {
    if (!open || !farmer) return
    setForm({
      firstName: farmer.firstName || '',
      lastName: farmer.lastName || '',
      phone: farmer.phone || '',
      email: farmer.email || '',
      gender: farmer.gender || '',
      dateOfBirth: toDateInput(farmer.dateOfBirth),
      education: farmer.education || '',
      maritalStatus: farmer.maritalStatus || '',
      nationalIdType: farmer.nationalIdType || '',
      nationalIdNo: farmer.nationalIdNo || '',
      guardianName: farmer.guardianName || '',
      memberType: farmer.memberType || 'General',
      isCertified: !!farmer.isCertified,
      certificationType: farmer.certificationType || '',
      enrollmentPlace: farmer.enrollmentPlace || '',

      country: farmer.country || '',
      province: farmer.province || '',
      district: farmer.district || '',
      commune: farmer.commune || '',
      villageName: farmer.villageName || '',
      zipCode: farmer.zipCode || '',
      gpsLatitude: farmer.gpsLatitude ?? '',
      gpsLongitude: farmer.gpsLongitude ?? '',

      spouseName: farmer.spouseName || '',
      familyMembers: farmer.familyMembers ?? '',
      childrenUnder18: farmer.childrenUnder18 ?? '',
      schoolGoingChildren: farmer.schoolGoingChildren ?? '',
      childrenMaleUnder18: farmer.childrenMaleUnder18 ?? '',
      childrenFemaleUnder18: farmer.childrenFemaleUnder18 ?? '',
      schoolGoingMale: farmer.schoolGoingMale ?? '',
      schoolGoingFemale: farmer.schoolGoingFemale ?? '',
      housingOwnership: farmer.housingOwnership || '',
      houseType: farmer.houseType || '',

      loanTakenLastYear: !!farmer.loanTakenLastYear,
      loanTakenFrom: farmer.loanTakenFrom || '',
      loanAmount: farmer.loanAmount ?? '',
      loanPurpose: farmer.loanPurpose || '',
      loanInterestPct: farmer.loanInterestPct ?? '',
      loanInterestPeriod: farmer.loanInterestPeriod || '',
      loanHasSecurity: !!farmer.loanHasSecurity,
      monthlyHouseholdIncome: farmer.monthlyHouseholdIncome ?? '',
      annualHouseholdIncome: farmer.annualHouseholdIncome ?? '',
      primaryIncomeSource: farmer.primaryIncomeSource || '',
      secondaryIncomeSource: farmer.secondaryIncomeSource || '',

      farmSize: farmer.farmSize ?? '',
      farmOwnership: farmer.farmOwnership || '',
      mainCrops: typeof farmer.mainCrops === 'string' ? farmer.mainCrops : '',
      livestockTypes: typeof farmer.livestockTypes === 'string' ? farmer.livestockTypes : '',
      extensionOfficer: farmer.extensionOfficer || '',
      livingConditions: farmer.livingConditions || '',
      fuelType: farmer.fuelType || '',
      mealsPerDay: farmer.mealsPerDay || '',

      status: farmer.status || 'ACTIVE',
    })
    setActiveTab('demographics')
  }, [open, farmer])

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
        status: form.status || undefined,
      }
      const res = await fetch(`/api/farmers/${farmer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to save')
      }
      toast.success('Farmer updated successfully')
      onOpenChange(false)
      onSaved()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save farmer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Farmer — {farmer.firstName} {farmer.lastName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="demographics" className="text-xs">Demographics</TabsTrigger>
              <TabsTrigger value="location" className="text-xs">Location</TabsTrigger>
              <TabsTrigger value="family" className="text-xs">Family</TabsTrigger>
              <TabsTrigger value="finance" className="text-xs">Finance</TabsTrigger>
              <TabsTrigger value="farm" className="text-xs">Farm</TabsTrigger>
              <TabsTrigger value="status" className="text-xs">Status</TabsTrigger>
            </TabsList>

            {/* Demographics */}
            <TabsContent value="demographics" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name *"><Input value={form.firstName || ''} onChange={e => update('firstName', e.target.value)} required /></Field>
                <Field label="Last Name *"><Input value={form.lastName || ''} onChange={e => update('lastName', e.target.value)} required /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone *"><Input value={form.phone || ''} onChange={e => update('phone', e.target.value)} required /></Field>
                <Field label="Email"><Input type="email" value={form.email || ''} onChange={e => update('email', e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Gender">
                  <CatalogSelect category="gender" value={form.gender || ''} onValueChange={v => update('gender', v)} placeholder="Select" />
                </Field>
                <Field label="Date of Birth"><Input type="date" value={form.dateOfBirth || ''} onChange={e => update('dateOfBirth', e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Education">
                  <CatalogSelect category="education_level" value={form.education || ''} onValueChange={v => update('education', v)} placeholder="Select" />
                </Field>
                <Field label="Marital Status">
                  <CatalogSelect category="marital_status" value={form.maritalStatus || ''} onValueChange={v => update('maritalStatus', v)} placeholder="Select" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="National ID Type">
                  <CatalogSelect category="national_id_type" value={form.nationalIdType || ''} onValueChange={v => update('nationalIdType', v)} placeholder="Select" />
                </Field>
                <Field label="National ID No"><Input value={form.nationalIdNo || ''} onChange={e => update('nationalIdNo', e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Guardian Name"><Input value={form.guardianName || ''} onChange={e => update('guardianName', e.target.value)} /></Field>
                <Field label="Enrollment Place">
                  <CatalogSelect category="enrollment_place" value={form.enrollmentPlace || ''} onValueChange={v => update('enrollmentPlace', v)} placeholder="Select" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Member Type">
                  <Select value={form.memberType || 'General'} onValueChange={v => update('memberType', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Contract Farmer">Contract Farmer</SelectItem>
                      <SelectItem value="Out-grower">Out-grower</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Certified?">
                  <Select value={form.isCertified ? 'yes' : 'no'} onValueChange={v => update('isCertified', v === 'yes')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              {form.isCertified && (
                <Field label="Certification Type">
                  <CatalogSelect category="certification_type" value={form.certificationType || ''} onValueChange={v => update('certificationType', v)} placeholder="Select" />
                </Field>
              )}
            </TabsContent>

            {/* Location */}
            <TabsContent value="location" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Country"><Input value={form.country || ''} onChange={e => update('country', e.target.value)} /></Field>
                <Field label="Province/Region"><Input value={form.province || ''} onChange={e => update('province', e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="District"><Input value={form.district || ''} onChange={e => update('district', e.target.value)} /></Field>
                <Field label="Sub-county / Commune"><Input value={form.commune || ''} onChange={e => update('commune', e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Village"><Input value={form.villageName || ''} onChange={e => update('villageName', e.target.value)} /></Field>
                <Field label="ZIP Code"><Input value={form.zipCode || ''} onChange={e => update('zipCode', e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="GPS Latitude"><Input type="number" step="0.000001" value={form.gpsLatitude ?? ''} onChange={e => update('gpsLatitude', e.target.value)} /></Field>
                <Field label="GPS Longitude"><Input type="number" step="0.000001" value={form.gpsLongitude ?? ''} onChange={e => update('gpsLongitude', e.target.value)} /></Field>
              </div>
            </TabsContent>

            {/* Family */}
            <TabsContent value="family" className="mt-4 space-y-4">
              <Field label="Spouse Name"><Input value={form.spouseName || ''} onChange={e => update('spouseName', e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Total Family Members"><Input type="number" value={form.familyMembers ?? ''} onChange={e => update('familyMembers', e.target.value)} /></Field>
                <Field label="Children Under 18"><Input type="number" value={form.childrenUnder18 ?? ''} onChange={e => update('childrenUnder18', e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Male Children (<18)"><Input type="number" value={form.childrenMaleUnder18 ?? ''} onChange={e => update('childrenMaleUnder18', e.target.value)} /></Field>
                <Field label="Female Children (<18)"><Input type="number" value={form.childrenFemaleUnder18 ?? ''} onChange={e => update('childrenFemaleUnder18', e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="School-going Children"><Input type="number" value={form.schoolGoingChildren ?? ''} onChange={e => update('schoolGoingChildren', e.target.value)} /></Field>
                <Field label="School-going Male"><Input type="number" value={form.schoolGoingMale ?? ''} onChange={e => update('schoolGoingMale', e.target.value)} /></Field>
              </div>
              <Field label="School-going Female"><Input type="number" value={form.schoolGoingFemale ?? ''} onChange={e => update('schoolGoingFemale', e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Housing Ownership">
                  <CatalogSelect category="housing_ownership" value={form.housingOwnership || ''} onValueChange={v => update('housingOwnership', v)} placeholder="Select" />
                </Field>
                <Field label="House Type">
                  <CatalogSelect category="house_type" value={form.houseType || ''} onValueChange={v => update('houseType', v)} placeholder="Select" />
                </Field>
              </div>
            </TabsContent>

            {/* Finance */}
            <TabsContent value="finance" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Monthly Household Income (UGX)"><Input type="number" value={form.monthlyHouseholdIncome ?? ''} onChange={e => update('monthlyHouseholdIncome', e.target.value)} /></Field>
                <Field label="Annual Household Income (UGX)"><Input type="number" value={form.annualHouseholdIncome ?? ''} onChange={e => update('annualHouseholdIncome', e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Primary Income Source">
                  <CatalogSelect category="income_source" value={form.primaryIncomeSource || ''} onValueChange={v => update('primaryIncomeSource', v)} placeholder="Select" />
                </Field>
                <Field label="Secondary Income Source"><Input value={form.secondaryIncomeSource || ''} onChange={e => update('secondaryIncomeSource', e.target.value)} /></Field>
              </div>
              <Separator />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Loan History (last 12 months)</p>
              <Field label="Loan Taken Last Year?">
                <Select value={form.loanTakenLastYear ? 'yes' : 'no'} onValueChange={v => update('loanTakenLastYear', v === 'yes')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {form.loanTakenLastYear && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Loan From">
                      <CatalogSelect category="loan_source" value={form.loanTakenFrom || ''} onValueChange={v => update('loanTakenFrom', v)} placeholder="Select" />
                    </Field>
                    <Field label="Loan Amount (UGX)"><Input type="number" value={form.loanAmount ?? ''} onChange={e => update('loanAmount', e.target.value)} /></Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Loan Purpose">
                      <CatalogSelect category="loan_purpose" value={form.loanPurpose || ''} onValueChange={v => update('loanPurpose', v)} placeholder="Select" />
                    </Field>
                    <Field label="Interest Rate (%)"><Input type="number" step="0.1" value={form.loanInterestPct ?? ''} onChange={e => update('loanInterestPct', e.target.value)} /></Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Interest Period">
                      <Select value={form.loanInterestPeriod || ''} onValueChange={v => update('loanInterestPeriod', v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Has Security/Collateral?">
                      <Select value={form.loanHasSecurity ? 'yes' : 'no'} onValueChange={v => update('loanHasSecurity', v === 'yes')}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Farm */}
            <TabsContent value="farm" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Farm Size (ha)"><Input type="number" step="0.01" value={form.farmSize ?? ''} onChange={e => update('farmSize', e.target.value)} /></Field>
                <Field label="Farm Ownership">
                  <CatalogSelect category="land_ownership" value={form.farmOwnership || ''} onValueChange={v => update('farmOwnership', v)} placeholder="Select" />
                </Field>
              </div>
              <Field label="Main Crops"><Input value={form.mainCrops || ''} onChange={e => update('mainCrops', e.target.value)} /></Field>
              <Field label="Livestock Types"><Input value={form.livestockTypes || ''} onChange={e => update('livestockTypes', e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Extension Officer"><Input value={form.extensionOfficer || ''} onChange={e => update('extensionOfficer', e.target.value)} /></Field>
                <Field label="Living Conditions"><Input value={form.livingConditions || ''} onChange={e => update('livingConditions', e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fuel Type">
                  <CatalogSelect category="fuel_type" value={form.fuelType || ''} onValueChange={v => update('fuelType', v)} placeholder="Select" />
                </Field>
                <Field label="Meals Per Day">
                  <Select value={form.mealsPerDay || ''} onValueChange={v => update('mealsPerDay', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4+">4+</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </TabsContent>

            {/* Status */}
            <TabsContent value="status" className="mt-4 space-y-4">
              <Field label="Status">
                <Select value={form.status || 'ACTIVE'} onValueChange={v => update('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  )
}

export default EditFarmerDialog
