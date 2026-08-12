'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, Plus, Trash2, Banknote, Shield, Tractor, Users,
  Loader2, Save, MapPin, QrCode, TrendingUp, ShoppingCart,
  CreditCard, FileText, Landmark, Pencil, User, Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'

const safeVal = (v: unknown): string => (v != null && v !== '' ? String(v) : '')

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
  email: string | null
  nationalIdType: string | null
  nationalIdNo: string | null
  enrollmentDate: string | null
  enrollmentPlace: string | null
  farmerRegistrationUnder: string | null
  cooperative: string | null
  fieldOfficer: string | null
  isCertified: boolean | null
  certificationType: string | null
  yearOfIcs: string | null
  country: string | null
  province: string | null
  zipCode: string | null
  loanTakenFrom: string | null
  loanPurpose: string | null
  loanInterestPct: number | null
  loanInterestPeriod: string | null
  loanHasSecurity: boolean | null
  loanRepaymentAmount: number | null
  loanRepaymentDate: string | null
  consumerElectronics: string[] | null
  vehicles: string[] | null
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

const TAB_CONFIG = [
  { value: 'profile', label: 'Profile', icon: User },
  { value: 'family', label: 'Family', icon: Users },
  { value: 'finance', label: 'Finance', icon: Banknote },
  { value: 'bank', label: 'Bank Accounts', icon: Landmark },
  { value: 'insurance', label: 'Insurance', icon: Shield },
  { value: 'livestock', label: 'Livestock', icon: Users },
  { value: 'equipment', label: 'Equipment', icon: Tractor },
  { value: 'farm-lands', label: 'Farm Lands', icon: MapPin },
  { value: 'qrcode', label: 'QR Code', icon: QrCode },
  { value: 'credit', label: 'Credit Score', icon: TrendingUp },
  { value: 'sales', label: 'Sales', icon: ShoppingCart },
  { value: 'purchases', label: 'Purchases', icon: FileText },
  { value: 'ledger', label: 'Ledger', icon: CreditCard },
]

export function FarmerDetailFull({ farmerId, onBack }: Props) {
  const { setActiveModule, setSelectedFarmerId } = useAppStore()
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

  const handleEdit = () => {
    setSelectedFarmerId(farmerId)
    setActiveModule('farmer-edit')
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b bg-card px-6 py-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!farmer) return <div className="text-center p-8 text-muted-foreground">Farmer not found</div>

  const bankCount = farmer.farmerBankAccounts?.length || 0
  const insuranceCount = farmer.farmerInsurances?.length || 0
  const animalCount = farmer.farmerAnimals?.length || 0
  const equipmentCount = farmer.farmerEquipment?.length || 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {farmer.firstName?.[0]}{farmer.lastName?.[0]}
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  {farmer.firstName} {farmer.lastName}
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {farmer.farmerCode && <Badge variant="outline" className="text-[10px] font-mono">{farmer.farmerCode}</Badge>}
                  {farmer.phone && <span>{farmer.phone}</span>}
                  {farmer.district && <span className="hidden sm:inline">· {farmer.district}</span>}
                  {farmer.villageName && <span className="hidden md:inline">· {farmer.villageName}</span>}
                </div>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleEdit} className="gap-1.5">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b bg-card/50 px-6 shrink-0">
            <TabsList className="h-auto gap-0 bg-transparent p-0 -mb-px">
              {TAB_CONFIG.map(tab => {
                const Icon = tab.icon
                let count: number | undefined
                if (tab.value === 'bank') count = bankCount
                if (tab.value === 'insurance') count = insuranceCount
                if (tab.value === 'livestock') count = animalCount
                if (tab.value === 'equipment') count = equipmentCount

                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="relative rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none gap-1.5"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {count !== undefined && count > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{count}</Badge>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-0 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" /> Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoField label="Full Name" value={`${farmer.firstName} ${farmer.lastName}`} />
                    <InfoField label="Phone" value={farmer.phone} />
                    <InfoField label="Gender" value={farmer.gender} />
                    <InfoField label="Date of Birth" value={farmer.dateOfBirth ? new Date(farmer.dateOfBirth).toLocaleDateString() : ''} />
                    <InfoField label="Education" value={farmer.education} />
                    <InfoField label="Marital Status" value={farmer.maritalStatus} />
                    <InfoField label="Email" value={farmer.email} />
                    <InfoField label="National ID" value={farmer.nationalIdNo ? `${farmer.nationalIdType || ''} - ${farmer.nationalIdNo}` : ''} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" /> Location & Farm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoField label="Country" value={farmer.country} />
                    <InfoField label="Province" value={farmer.province} />
                    <InfoField label="District" value={farmer.district} />
                    <InfoField label="Sub-county" value={farmer.commune} />
                    <InfoField label="Village" value={farmer.villageName} />
                    <InfoField label="GPS Coordinates" value={farmer.gpsLatitude && farmer.gpsLongitude ? `${farmer.gpsLatitude.toFixed(6)}, ${farmer.gpsLongitude.toFixed(6)}` : ''} />
                    <InfoField label="Farm Size (ha)" value={farmer.farmSize ? String(farmer.farmSize) : ''} />
                    <InfoField label="Land Ownership" value={farmer.farmOwnership} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Enrollment Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoField label="Enrollment Date" value={farmer.enrollmentDate ? new Date(farmer.enrollmentDate).toLocaleDateString() : ''} />
                    <InfoField label="Enrollment Place" value={farmer.enrollmentPlace} />
                    <InfoField label="Registration Under" value={farmer.farmerRegistrationUnder} />
                    <InfoField label="Cooperative" value={farmer.cooperative} />
                    <InfoField label="Field Officer" value={farmer.fieldOfficer} />
                    <InfoField label="Extension Officer" value={farmer.extensionOfficer} />
                    <InfoField label="Certified Farmer" value={farmer.isCertified ? 'Yes' : 'No'} />
                    {farmer.isCertified && <InfoField label="Certification Type" value={farmer.certificationType} />}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Family Tab */}
            <TabsContent value="family" className="mt-0 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> Family Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoField label="Spouse Name" value={farmer.spouseName} />
                    <InfoField label="Family Members" value={farmer.familyMembers ? String(farmer.familyMembers) : ''} />
                    <InfoField label="Children under 18" value={farmer.childrenUnder18 ? String(farmer.childrenUnder18) : ''} />
                    <InfoField label="School Going Children" value={farmer.schoolGoingChildren ? String(farmer.schoolGoingChildren) : ''} />
                    <InfoField label="Housing Ownership" value={farmer.housingOwnership} />
                    <InfoField label="House Type" value={farmer.houseType} />
                    <InfoField label="Meals per Day" value={farmer.mealsPerDay} />
                    <InfoField label="Fuel Type" value={farmer.fuelType} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Finance Tab */}
            <TabsContent value="finance" className="mt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-primary" /> Income
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <span className="text-sm text-muted-foreground">Monthly Income</span>
                        <span className="text-sm font-semibold">{farmer.monthlyHouseholdIncome ? `UGX ${farmer.monthlyHouseholdIncome.toLocaleString()}` : '—'}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <span className="text-sm text-muted-foreground">Annual Income</span>
                        <span className="text-sm font-semibold">{farmer.annualHouseholdIncome ? `UGX ${farmer.annualHouseholdIncome.toLocaleString()}` : '—'}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <span className="text-sm text-muted-foreground">Primary Income Source</span>
                        <span className="text-sm font-semibold">{farmer.primaryIncomeSource || '—'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" /> Loan Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <span className="text-sm text-muted-foreground">Loan Taken Last Year</span>
                        <Badge variant={farmer.loanTakenLastYear ? 'default' : 'secondary'} className="text-[10px]">
                          {farmer.loanTakenLastYear ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      {farmer.loanTakenLastYear && (
                        <>
                          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground">Loan Amount</span>
                            <span className="text-sm font-semibold">{farmer.loanAmount ? `UGX ${farmer.loanAmount.toLocaleString()}` : '—'}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground">Loan From</span>
                            <span className="text-sm font-semibold">{farmer.loanTakenFrom || '—'}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground">Interest Rate</span>
                            <span className="text-sm font-semibold">{farmer.loanInterestPct ? `${farmer.loanInterestPct}%` : '—'}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Active VSLA Loans + outstanding balance — EKIBBO requirement */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-primary" /> Active Loan Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const loans = (farmer as any).vslaLoans || []
                      const active = loans.filter((l: any) => ['DISBURSED', 'OUTSTANDING', 'OVERDUE'].includes(l.status))
                      if (active.length === 0) {
                        return <p className="text-xs text-muted-foreground italic">No active loans.</p>
                      }
                      return (
                        <div className="space-y-2">
                          {active.map((l: any) => {
                            const outstanding = (Number(l.amount) || 0) - (Number(l.repaymentAmount) || 0)
                            return (
                              <div key={l.id} className="p-3 rounded-lg bg-muted/50">
                                <div className="flex justify-between mb-1">
                                  <span className="text-xs text-muted-foreground">
                                    {l.vslaGroup?.name || 'VSLA Loan'} · {l.status}
                                  </span>
                                  <Badge variant={outstanding > 0 ? 'default' : 'secondary'} className="text-[10px]">
                                    {outstanding > 0 ? 'Outstanding' : 'Repaid'}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div>
                                    <p className="text-muted-foreground">Principal</p>
                                    <p className="font-medium">UGX {(Number(l.amount) || 0).toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Repaid</p>
                                    <p className="font-medium text-emerald-600">UGX {(Number(l.repaymentAmount) || 0).toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Balance</p>
                                    <p className="font-bold text-red-600">UGX {outstanding.toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Bank Accounts Tab */}
            <TabsContent value="bank" className="mt-0">
              <MultiEntrySection
                title="Bank Accounts"
                icon={Landmark}
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

            {/* Insurance Tab */}
            <TabsContent value="insurance" className="mt-0">
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

            {/* Livestock Tab */}
            <TabsContent value="livestock" className="mt-0">
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

            {/* Equipment Tab */}
            <TabsContent value="equipment" className="mt-0">
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

            {/* Farm Lands Tab */}
            <TabsContent value="farm-lands" className="mt-0">
              <FarmLandsTab farmerId={farmer.id} onRefresh={load} />
            </TabsContent>

            {/* QR Code Tab */}
            <TabsContent value="qrcode" className="mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-primary" /> Farmer QR Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center py-8">
                  <div className="w-48 h-48 bg-muted/50 rounded-xl flex items-center justify-center border-2 border-dashed">
                    <div className="text-center">
                      <QrCode className="w-16 h-16 mx-auto text-muted-foreground/40" />
                      <p className="text-xs text-muted-foreground mt-2">QR Code</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{farmer.farmerCode || farmer.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">Scan to view farmer profile</p>
                  <Button variant="outline" size="sm" className="mt-3 gap-1.5">
                    <QrCode className="w-3.5 h-3.5" /> Download QR
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Credit Score Tab */}
            <TabsContent value="credit" className="mt-0">
              <CreditScoreTab farmerId={farmer.id} />
            </TabsContent>

            {/* Sales Tab */}
            <TabsContent value="sales" className="mt-0">
              <SalesTab farmerId={farmer.id} />
            </TabsContent>

            {/* Purchases Tab */}
            <TabsContent value="purchases" className="mt-0">
              <PurchasesTab farmerId={farmer.id} />
            </TabsContent>

            {/* Ledger Tab */}
            <TabsContent value="ledger" className="mt-0">
              <LedgerTab farmerId={farmer.id} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

/* ─── Sub-tabs ────────────────────────────────────────────────────── */

function CreditScoreTab({ farmerId }: { farmerId: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/credit-score/${farmerId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [farmerId])

  if (loading) return <Skeleton className="h-48" />
  const score = data?.score
  if (!score) return <EmptyTabCard icon={TrendingUp} title="Credit Score" description="No credit score available yet" />

  const scoreVal = typeof score === 'number' ? score : score?.score || 0
  const riskCat = typeof score === 'object' ? score?.riskCategory : null

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Credit Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full border-4 border-primary/20 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold">{scoreVal}</p>
                <p className="text-[10px] text-muted-foreground">/ 1000</p>
              </div>
            </div>
            <div className="space-y-2">
              {riskCat && <Badge className="text-xs">{riskCat}</Badge>}
              {score?.practicePoints != null && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Practices:</span>
                  <span className="font-medium">{score.practicePoints}</span>
                </div>
              )}
              {score?.yieldPoints != null && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Yield:</span>
                  <span className="font-medium">{score.yieldPoints}</span>
                </div>
              )}
              {score?.trainingPoints != null && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Training:</span>
                  <span className="font-medium">{score.trainingPoints}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SalesTab({ farmerId }: { farmerId: string }) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/farmers/${farmerId}/ledger?type=sale`)
      .then(r => r.json())
      .then(d => { setData(d.data || d.sales || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [farmerId])

  if (loading) return <Skeleton className="h-48" />
  if (data.length === 0) return <EmptyTabCard icon={ShoppingCart} title="Sales" description="No sales recorded yet" />

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-primary" /> Sales History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{data.length} sale(s) recorded</p>
      </CardContent>
    </Card>
  )
}

function PurchasesTab({ farmerId }: { farmerId: string }) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/farmers/${farmerId}/ledger?type=purchase`)
      .then(r => r.json())
      .then(d => { setData(d.data || d.purchases || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [farmerId])

  if (loading) return <Skeleton className="h-48" />
  if (data.length === 0) return <EmptyTabCard icon={FileText} title="Purchases" description="No purchases recorded yet" />

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> Purchase History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{data.length} purchase(s) recorded</p>
      </CardContent>
    </Card>
  )
}

function LedgerTab({ farmerId }: { farmerId: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/farmers/${farmerId}/ledger`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [farmerId])

  if (loading) return <Skeleton className="h-48" />
  if (!data) return <EmptyTabCard icon={CreditCard} title="Ledger" description="No ledger entries yet" />

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" /> Farmer Ledger
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoField label="Total Sales" value={data.totalSales ? `UGX ${Number(data.totalSales).toLocaleString()}` : ''} />
          <InfoField label="Total Purchases" value={data.totalPurchases ? `UGX ${Number(data.totalPurchases).toLocaleString()}` : ''} />
          <InfoField label="Balance" value={data.balance ? `UGX ${Number(data.balance).toLocaleString()}` : ''} />
        </div>
      </CardContent>
    </Card>
  )
}

function FarmLandsTab({ farmerId, onRefresh }: { farmerId: string; onRefresh: () => void }) {
  const [lands, setLands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/farm-lands?farmerId=${farmerId}`)
      .then(r => r.json())
      .then(d => { setLands(d.data || d.farmLands || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [farmerId])

  if (loading) return <Skeleton className="h-48" />
  if (lands.length === 0) return <EmptyTabCard icon={MapPin} title="Farm Lands" description="No farm lands registered yet" />

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" /> Farm Lands ({lands.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {lands.map((land: any) => (
            <div key={land.id} className="p-3 rounded-lg border bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{land.name || land.farmName || 'Unnamed Farm'}</p>
                  <p className="text-xs text-muted-foreground">{land.size || land.farmSize ? `${land.size || land.farmSize} ha` : ''} {land.location ? `· ${land.location}` : ''}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">{land.status || 'Active'}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyTabCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center text-muted-foreground">
        <Icon className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">{title}</p>
        <p className="text-sm mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

/* ─── InfoField ───────────────────────────────────────────────────── */

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value || '—'}</p>
    </div>
  )
}

/* ─── MultiEntrySection ───────────────────────────────────────────── */

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
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" /> {title}
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)} className="gap-1 h-7">
          <Plus className="w-3 h-3" /> Add
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
                          item[f.name] ? `UGX ${Number(item[f.name]).toLocaleString()}` : '—'
                        ) : (
                          safeVal(item[f.name]) || '—'
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
