'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft, Plus, Trash2, User, MapPin, Banknote, Shield, Tractor,
  Loader2, Save, Users, Wallet,
} from 'lucide-react'
import { toast } from 'sonner'

const safeVal = (v: unknown): string => (v != null && v !== '' ? String(v) : '')
const safeNum = (v: unknown): number => (typeof v === 'number' && !isNaN(v) ? v : 0)

interface FarmerDetail {
  id: string
  farmerCode: string
  firstName: string
  lastName: string
  phone: string
  gender: string | null
  dateOfBirth: string | null
  education: string | null
  maritalStatus: string | null
  district: string | null
  commune: string | null
  villageName: string | null
  gpsLatitude: number | null
  gpsLongitude: number | null
  farmSize: number | null
  farmOwnership: string | null
  familyMembers: number | null
  childrenUnder18: number | null
  schoolGoingChildren: number | null
  spouseName: string | null
  monthlyHouseholdIncome: number | null
  annualHouseholdIncome: number | null
  primaryIncomeSource: string | null
  extensionOfficer: string | null
  livingConditions: string | null
  fuelType: string | null
  mealsPerDay: string | null
  housingOwnership: string | null
  houseType: string | null
  loanTakenLastYear: boolean
  loanAmount: number | null
  farmerBankAccounts: Array<{
    id: string
    accountType: string | null
    accountNo: string
    bankName: string
    branchDetails: string | null
    sortCode: string | null
    isPrimary: boolean
  }>
  farmerInsurances: Array<{
    id: string
    insuranceType: string
    provider: string | null
    amount: number | null
    enrolledDate: string | null
    endDate: string | null
  }>
  farmerAnimals: Array<{
    id: string
    animalType: string
    count: number
    breedName: string | null
    fodder: string | null
    animalHousing: string | null
    revenue: number | null
    animalForGrowth: string | null
  }>
  farmerEquipment: Array<{
    id: string
    equipmentName: string
    count: number
    yearOfManufacture: number | null
    yearOfPurchase: number | null
  }>
}

interface Props {
  farmerId: string
  onBack: () => void
}

export function FarmerDetailFull({ farmerId, onBack }: Props) {
  const [farmer, setFarmer] = useState<FarmerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/farmers/${farmerId}`)
      .then(r => r.json())
      .then(d => {
        setFarmer(d.data || d.farmer || null)
        setLoading(false)
      })
      .catch(() => { toast.error('Failed to load farmer'); setLoading(false) })
  }, [farmerId])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!farmer) return <div className="text-center p-8">Farmer not found</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {farmer.firstName} {farmer.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {farmer.farmerCode} · {farmer.district || 'NA'} · {farmer.villageName || 'NA'}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="family">Family</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="bank">Bank Accounts ({farmer.farmerBankAccounts?.length || 0})</TabsTrigger>
          <TabsTrigger value="insurance">Insurance ({farmer.farmerInsurances?.length || 0})</TabsTrigger>
          <TabsTrigger value="animals">Livestock ({farmer.farmerAnimals?.length || 0})</TabsTrigger>
          <TabsTrigger value="equipment">Equipment ({farmer.farmerEquipment?.length || 0})</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle className="text-sm">Farmer Information</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoField label="Farmer Code" value={farmer.farmerCode} />
                <InfoField label="Phone" value={farmer.phone} />
                <InfoField label="Gender" value={farmer.gender} />
                <InfoField label="Date of Birth" value={farmer.dateOfBirth ? new Date(farmer.dateOfBirth).toLocaleDateString() : ''} />
                <InfoField label="Education" value={farmer.education} />
                <InfoField label="Marital Status" value={farmer.maritalStatus} />
                <InfoField label="Extension Officer" value={farmer.extensionOfficer} />
                <InfoField label="Primary Income" value={farmer.primaryIncomeSource} />
              </div>
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader><CardTitle className="text-sm">Location</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoField label="District" value={farmer.district} />
                <InfoField label="Sub-county" value={farmer.commune} />
                <InfoField label="Village" value={farmer.villageName} />
                <InfoField label="GPS Lat" value={farmer.gpsLatitude ? farmer.gpsLatitude.toFixed(6) : ''} />
                <InfoField label="GPS Lng" value={farmer.gpsLongitude ? farmer.gpsLongitude.toFixed(6) : ''} />
                <InfoField label="Farm Size (ha)" value={farmer.farmSize ? String(farmer.farmSize) : ''} />
                <InfoField label="Land Ownership" value={farmer.farmOwnership} />
                <InfoField label="Living Conditions" value={farmer.livingConditions} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Family Tab */}
        <TabsContent value="family">
          <Card>
            <CardHeader><CardTitle className="text-sm">Family Information</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoField label="Spouse Name" value={farmer.spouseName} />
                <InfoField label="Family Members" value={farmer.familyMembers ? String(farmer.familyMembers) : ''} />
                <InfoField label="Children < 18" value={farmer.childrenUnder18 ? String(farmer.childrenUnder18) : ''} />
                <InfoField label="School Going" value={farmer.schoolGoingChildren ? String(farmer.schoolGoingChildren) : ''} />
                <InfoField label="Housing Ownership" value={farmer.housingOwnership} />
                <InfoField label="House Type" value={farmer.houseType} />
                <InfoField label="Meals/Day" value={farmer.mealsPerDay} />
                <InfoField label="Fuel Type" value={farmer.fuelType} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Finance Tab */}
        <TabsContent value="finance">
          <Card>
            <CardHeader><CardTitle className="text-sm">Financial Information</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoField label="Monthly Income" value={farmer.monthlyHouseholdIncome ? `UGX ${farmer.monthlyHouseholdIncome.toLocaleString()}` : ''} />
                <InfoField label="Annual Income" value={farmer.annualHouseholdIncome ? `UGX ${farmer.annualHouseholdIncome.toLocaleString()}` : ''} />
                <InfoField label="Loan Taken" value={farmer.loanTakenLastYear ? 'Yes' : 'No'} />
                <InfoField label="Loan Amount" value={farmer.loanAmount ? `UGX ${farmer.loanAmount.toLocaleString()}` : ''} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Accounts Tab — Multi-entry */}
        <TabsContent value="bank">
          <MultiEntrySection
            title="Bank Accounts"
            icon={Banknote}
            farmerId={farmer.id}
            endpoint="bank-accounts"
            dataKey="accounts"
            items={farmer.farmerBankAccounts || []}
            fields={[
              { name: 'accountType', label: 'Account Type', type: 'select', options: ['Savings', 'Current', 'Fixed Deposit'] },
              { name: 'accountNo', label: 'Account Number', type: 'text', required: true },
              { name: 'bankName', label: 'Bank Name', type: 'text', required: true },
              { name: 'branchDetails', label: 'Branch', type: 'text' },
              { name: 'sortCode', label: 'Sort Code', type: 'text' },
              { name: 'isPrimary', label: 'Primary Account', type: 'checkbox' },
            ]}
            onRefresh={load}
          />
        </TabsContent>

        {/* Insurance Tab — Multi-entry */}
        <TabsContent value="insurance">
          <MultiEntrySection
            title="Insurance Records"
            icon={Shield}
            farmerId={farmer.id}
            endpoint="insurances"
            dataKey="insurances"
            items={farmer.farmerInsurances || []}
            fields={[
              { name: 'insuranceType', label: 'Insurance Type', type: 'select', options: ['Life', 'Health', 'Crop', 'Social', 'Other'], required: true },
              { name: 'provider', label: 'Provider', type: 'text' },
              { name: 'amount', label: 'Amount', type: 'number' },
              { name: 'enrolledDate', label: 'Enrolled Date', type: 'date' },
              { name: 'endDate', label: 'End Date', type: 'date' },
            ]}
            onRefresh={load}
          />
        </TabsContent>

        {/* Animals Tab — Multi-entry */}
        <TabsContent value="animals">
          <MultiEntrySection
            title="Animal Husbandry"
            icon={Users}
            farmerId={farmer.id}
            endpoint="animals"
            dataKey="animals"
            items={farmer.farmerAnimals || []}
            fields={[
              { name: 'animalType', label: 'Animal Type', type: 'select', options: ['Cattle', 'Goat', 'Sheep', 'Poultry', 'Pigs', 'Rabbits', 'Fish', 'Bees'], required: true },
              { name: 'count', label: 'Count', type: 'number', required: true },
              { name: 'breedName', label: 'Breed', type: 'text' },
              { name: 'fodder', label: 'Fodder', type: 'text' },
              { name: 'animalHousing', label: 'Housing', type: 'text' },
              { name: 'revenue', label: 'Revenue (UGX)', type: 'number' },
              { name: 'animalForGrowth', label: 'Purpose', type: 'select', options: ['Meat', 'Milk', 'Eggs', 'Draught', 'Breeding', 'Other'] },
            ]}
            onRefresh={load}
          />
        </TabsContent>

        {/* Equipment Tab — Multi-entry */}
        <TabsContent value="equipment">
          <MultiEntrySection
            title="Farm Equipment"
            icon={Tractor}
            farmerId={farmer.id}
            endpoint="equipment"
            dataKey="equipment"
            items={farmer.farmerEquipment || []}
            fields={[
              { name: 'equipmentName', label: 'Equipment Name', type: 'text', required: true },
              { name: 'count', label: 'Count', type: 'number', required: true },
              { name: 'yearOfManufacture', label: 'Year of Manufacture', type: 'number' },
              { name: 'yearOfPurchase', label: 'Year of Purchase', type: 'number' },
            ]}
            onRefresh={load}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value || 'NA'}</p>
    </div>
  )
}

interface FieldDef {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox'
  options?: string[]
  required?: boolean
}

function MultiEntrySection({
  title, icon: Icon, farmerId, endpoint, dataKey, items, fields, onRefresh,
}: {
  title: string
  icon: React.ElementType
  farmerId: string
  endpoint: string
  dataKey: string
  items: any[]
  fields: FieldDef[]
  onRefresh: () => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({})

  const submit = async () => {
    // Validate required fields
    for (const f of fields) {
      if (f.required && !form[f.name]) {
        toast.error(`${f.label} is required`)
        return
      }
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/farmers/${farmerId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success(`${title} entry added`)
        setForm({})
        setShowAdd(false)
        onRefresh()
      } else {
        toast.error('Failed to add entry')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteItem = async (itemId: string) => {
    if (!confirm('Delete this entry?')) return
    try {
      const res = await fetch(`/api/farmers/${farmerId}/${endpoint}?itemId=${itemId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Entry deleted')
        onRefresh()
      }
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="w-4 h-4" /> {title}
        </CardTitle>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </CardHeader>
      <CardContent>
        {showAdd && (
          <div className="mb-4 p-4 rounded-lg border bg-muted/30">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {fields.map(f => (
                <div key={f.name} className="space-y-1">
                  <Label className="text-xs">{f.label}{f.required && ' *'}</Label>
                  {f.type === 'select' ? (
                    <select
                      className="w-full px-2 py-1.5 text-sm border rounded-md bg-background"
                      value={form[f.name] || ''}
                      onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                    >
                      <option value="">Select...</option>
                      {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : f.type === 'checkbox' ? (
                    <input
                      type="checkbox"
                      checked={form[f.name] || false}
                      onChange={e => setForm(p => ({ ...p, [f.name]: e.target.checked }))}
                      className="h-4 w-4"
                    />
                  ) : (
                    <Input
                      type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                      value={form[f.name] || ''}
                      onChange={e => setForm(p => ({ ...p, [f.name]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                      className="h-8 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setShowAdd(false); setForm({}) }}>Cancel</Button>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No records. Click "Add" to create one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {fields.map(f => (
                    <th key={f.name} className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">{f.label}</th>
                  ))}
                  <th className="py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id || i} className="border-b hover:bg-muted/30">
                    {fields.map(f => (
                      <td key={f.name} className="py-2 px-3">
                        {f.type === 'checkbox' ? (
                          <Badge variant={item[f.name] ? 'default' : 'secondary'} className="text-[10px]">{item[f.name] ? 'Yes' : 'No'}</Badge>
                        ) : f.type === 'number' && f.name === 'revenue' ? (
                          item[f.name] ? `UGX ${Number(item[f.name]).toLocaleString()}` : 'NA'
                        ) : (
                          safeVal(item[f.name]) || 'NA'
                        )}
                      </td>
                    ))}
                    <td className="py-2 px-3">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteItem(item.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default FarmerDetailFull
