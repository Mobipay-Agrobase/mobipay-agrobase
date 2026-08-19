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
  ChevronDown, Sprout, Printer, Share2,
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
  status: string
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
  { value: 'profile', label: 'Profile', shortLabel: 'Profile', icon: User },
  { value: 'farm-lands', label: 'Farm Lands', shortLabel: 'Farms', icon: MapPin },
  { value: 'credit', label: 'Credit Score', shortLabel: 'Credit', icon: TrendingUp },
  { value: 'sales', label: 'Sales', shortLabel: 'Sales', icon: ShoppingCart },
  { value: 'purchases', label: 'Purchases', shortLabel: 'Purch', icon: FileText },
  { value: 'ledger', label: 'Ledger', shortLabel: 'Ledger', icon: CreditCard },
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

  const handleShare = () => {
    // Generate a shareable link with MASKED sensitive data
    // The public link shows only: name, farmer code, district, certification, farm size
    // Phone, email, national ID, bank details are NOT included
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://mobipay-agrobase.vercel.app'
    const shareUrl = `${baseUrl}/farmer/${farmerId}?public=1`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl)
      toast.success('Share link copied to clipboard (sensitive data masked)')
    } else {
      toast.info(`Share this link: ${shareUrl}`)
    }
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
      {/* Hero Card — green gradient with credit score circle, loyalty badge, QR, badges, actions */}
      <div className="shrink-0 p-3 sm:p-4 lg:p-6 pb-0">
        <div className="relative rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700">
          {/* Decorative bubble shapes */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />

          <div className="relative p-4 sm:p-5">
            {/* Top row: back + identity + actions */}
            {/* On mobile: stack vertically; on sm+: single row */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
              <div className="flex items-start gap-3 sm:gap-4">
                <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/10 h-9 w-9 shrink-0 mt-1">
                  <ArrowLeft className="w-5 h-5" />
                </Button>

                {/* Avatar with verification badge */}
                <div className="relative shrink-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-xl sm:text-2xl font-bold text-white border-2 border-white/30">
                    {farmer.firstName?.[0]}{farmer.lastName?.[0]}
                  </div>
                  {farmer.isCertified && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-emerald-700">
                      <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-800" />
                    </div>
                  )}
                </div>

                {/* Name + badges + metadata */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-white truncate">{farmer.firstName} {farmer.lastName}</h1>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5">
                    {farmer.farmerCode && (
                      <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-white/15 text-white flex items-center gap-1">
                        <QrCode className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {farmer.farmerCode}
                      </span>
                    )}
                    {farmer.isCertified && (
                      <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-200 border border-yellow-400/30">
                        {farmer.certificationType || 'Certified'}
                      </span>
                    )}
                    <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full ${farmer.status === 'ACTIVE' ? 'bg-green-400/20 text-green-200 border border-green-400/30' : 'bg-gray-400/20 text-gray-200'}`}>
                      ● {farmer.status || 'ACTIVE'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-[10px] sm:text-xs text-white/70">
                    {farmer.district && <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {farmer.district}</span>}
                    {farmer.villageName && <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {farmer.villageName}</span>}
                    {farmer.farmSize != null && <span className="flex items-center gap-1"><Sprout className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {farmer.farmSize} ha</span>}
                  </div>
                </div>
              </div>

              {/* Right side: loyalty badge + credit score circle + QR code */}
              {/* On mobile: smaller circles (w-16) + smaller QR (w-12); on sm+: full size (w-20) + QR (w-16) */}
              <div className="flex items-center justify-end gap-1.5 sm:gap-3 shrink-0">
                {/* Loyalty Badge — Phase 2 */}
                <LoyaltyBadge farmerId={farmer.id} />
                {/* Credit Score Circle */}
                <CreditScoreCircle farmerId={farmer.id} />
                {/* QR Code — real scannable QR linking to public farmer page */}
                {/* Uses api.qrserver.com (free, no install) to generate the QR image.
                    The QR encodes the /farmer/[id] public URL which shows masked data. */}
                <a
                  href={`${typeof window !== 'undefined' ? window.location.origin : 'https://mobipay-agrobase.vercel.app'}/farmer/${farmerId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Scan to view public profile (sensitive data masked)"
                  className="bg-white p-1 sm:p-1.5 rounded-lg shadow-md shrink-0 hover:shadow-lg transition-shadow cursor-pointer block"
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=0&data=${encodeURIComponent(
                      `${typeof window !== 'undefined' ? window.location.origin : 'https://mobipay-agrobase.vercel.app'}/farmer/${farmerId}`
                    )}`}
                    alt="QR code linking to public farmer profile"
                    className="w-11 h-11 sm:w-16 sm:h-16"
                    width={64}
                    height={64}
                  />
                </a>
              </div>
            </div>

            {/* Action buttons row — wraps on mobile */}
            <div className="flex items-center justify-end gap-1.5 sm:gap-2 mt-3 sm:mt-4 flex-wrap">
              <Button variant="ghost" size="sm" onClick={handleEdit} className="text-white hover:bg-white/10 gap-1.5">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => window.print()} className="text-white hover:bg-white/10 gap-1.5">
                <Printer className="w-3.5 h-3.5" /> Print Card
              </Button>
              <Button variant="ghost" size="sm" onClick={handleShare} className="text-white hover:bg-white/10 gap-1.5">
                <Share2 className="w-3.5 h-3.5" /> Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden flex flex-col p-3 sm:p-4 lg:p-6 pt-3 sm:pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="flex-wrap h-auto gap-1 p-1 rounded-xl bg-muted/50 border border-border/40 overflow-x-auto">
            {TAB_CONFIG.map(tab => {
              const Icon = tab.icon
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="text-xs gap-1.5 rounded-lg whitespace-nowrap">
                  <Icon className="w-3.5 h-3.5 shrink-0" /> <span className="hidden sm:inline">{tab.label}</span><span className="sm:hidden">{tab.shortLabel || tab.label.slice(0, 4)}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          <div className="flex-1 overflow-auto mt-4 space-y-4 form-tab-content" key={activeTab}>
            <TabsContent value="profile" className="mt-0 space-y-3">
              <ProfileAccordion farmer={farmer} onRefresh={load} />
            </TabsContent>
            <TabsContent value="farm-lands" className="mt-0">
              <FarmLandsTab farmerId={farmer.id} onRefresh={load} />
            </TabsContent>
            <TabsContent value="credit" className="mt-0">
              <CreditScoreTab farmerId={farmer.id} />
            </TabsContent>
            <TabsContent value="sales" className="mt-0">
              <SalesTab farmerId={farmer.id} />
            </TabsContent>
            <TabsContent value="purchases" className="mt-0">
              <PurchasesTab farmerId={farmer.id} />
            </TabsContent>
            <TabsContent value="ledger" className="mt-0">
              <LedgerTab farmerId={farmer.id} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

/* --- CreditScoreCircle — donut-style score for the hero card --- */
function CreditScoreCircle({ farmerId }: { farmerId: string }) {
  const [score, setScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/credit-score/${farmerId}`)
      .then(r => r.json())
      .then(d => {
        const s = d.score
        const val = typeof s === 'number' ? s : s?.score || s?.totalScore || null
        setScore(val)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [farmerId])

  if (loading) {
    return (
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 backdrop-blur flex items-center justify-center shrink-0">
        <Loader2 className="w-5 h-5 text-white/50 animate-spin" />
      </div>
    )
  }

  if (score == null) {
    return (
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border-2 border-white/20 shrink-0">
        <div className="text-center">
          <p className="text-[9px] sm:text-[10px] text-white/50">No</p>
          <p className="text-[9px] sm:text-[10px] text-white/50">Score</p>
        </div>
      </div>
    )
  }

  // Score circle with gradient color based on score
  const pct = Math.min(100, (score / 1000) * 100)
  const color = score >= 700 ? '#22c55e' : score >= 400 ? '#f59e0b' : '#ef4444'
  const bgGradient = score >= 700 ? 'from-green-400/20 to-emerald-500/20' : score >= 400 ? 'from-amber-400/20 to-orange-500/20' : 'from-red-400/20 to-rose-500/20'

  return (
    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br ${bgGradient} backdrop-blur flex items-center justify-center border-2 border-white/30 relative shrink-0`}>
      {/* SVG donut ring */}
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
        <circle cx="40" cy="40" r="36" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 36 * pct / 100} ${2 * Math.PI * 36}`} />
      </svg>
      <div className="relative text-center">
        <p className="text-lg sm:text-xl font-bold text-white">{score}</p>
        <p className="text-[7px] sm:text-[8px] text-white/60 uppercase tracking-wide">Score</p>
      </div>
    </div>
  )
}

/* --- LoyaltyBadge — 0–4 stage cycle indicator for the hero card --- */
/* Clean SVG donut design matching CreditScoreCircle. 4 ring segments —
   completed stages are tier-colored, incomplete are faint white.
   Center shows tier label + "X/4". No heart icon (it rendered as a black
   blob). Hover tooltip shows per-stage breakdown. */
function LoyaltyBadge({ farmerId }: { farmerId: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/farmers/${farmerId}/loyalty`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [farmerId])

  if (loading) {
    return (
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 backdrop-blur flex items-center justify-center shrink-0">
        <Loader2 className="w-5 h-5 text-white/50 animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border-2 border-white/20 shrink-0">
        <div className="text-center">
          <p className="text-[9px] text-white/50">No loyalty</p>
          <p className="text-[9px] text-white/50">data</p>
        </div>
      </div>
    )
  }

  // Tier config — color is the SVG stroke color (hex), not a tailwind bg class
  const tiers = [
    { label: 'New', color: '#94a3b8', shortLabel: 'New' },         // slate-400
    { label: 'Engaged', color: '#60a5fa', shortLabel: 'Engaged' },  // blue-400
    { label: 'Active', color: '#fbbf24', shortLabel: 'Active' },    // amber-400
    { label: 'Loyal', color: '#34d399', shortLabel: 'Loyal' },      // emerald-400
    { label: 'Champion', color: '#fb7185', shortLabel: 'Champ' },   // rose-400
  ]
  const tier = tiers[data.stages] || tiers[0]
  const stages = data.stages

  // SVG donut: 4 segments of 90° each. Each segment is 25% of the circle.
  // Completed segments use tier.color, incomplete use rgba(255,255,255,0.15).
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const segmentLength = circumference / 4
  const gap = 4 // small gap between segments

  return (
    <div className="relative group shrink-0">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border-2 border-white/20">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
          {stages >= 1 && (
            <circle cx="40" cy="40" r={radius} fill="none" stroke={tier.color} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${segmentLength - gap} ${circumference - segmentLength + gap}`}
              strokeDashoffset={0} />
          )}
          {stages >= 2 && (
            <circle cx="40" cy="40" r={radius} fill="none" stroke={tier.color} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${segmentLength - gap} ${circumference - segmentLength + gap}`}
              strokeDashoffset={-(segmentLength)} />
          )}
          {stages >= 3 && (
            <circle cx="40" cy="40" r={radius} fill="none" stroke={tier.color} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${segmentLength - gap} ${circumference - segmentLength + gap}`}
              strokeDashoffset={-(2 * segmentLength)} />
          )}
          {stages >= 4 && (
            <circle cx="40" cy="40" r={radius} fill="none" stroke={tier.color} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${segmentLength - gap} ${circumference - segmentLength + gap}`}
              strokeDashoffset={-(3 * segmentLength)} />
          )}
          {/* Base ring (faint) */}
          <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
        </svg>
        <div className="relative text-center">
          <p className="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wide leading-tight">{tier.shortLabel}</p>
          <p className="text-[8px] sm:text-[9px] text-white/70 font-medium">{stages}/4</p>
        </div>
      </div>
      {/* Hover tooltip with stage breakdown */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
          <p className="font-semibold mb-1">{tier.label} ({stages}/4 stages)</p>
          <div className="space-y-0.5 text-[10px]">
            <p className={data.stageFlags.training ? 'text-emerald-300' : 'text-white/40'}>
              {data.stageFlags.training ? '✓' : '○'} Training/Visit ({data.counts.trainingsAttended + data.counts.farmVisits})
            </p>
            <p className={data.stageFlags.input ? 'text-emerald-300' : 'text-white/40'}>
              {data.stageFlags.input ? '✓' : '○'} Input Uptake ({data.counts.inputPurchases})
            </p>
            <p className={data.stageFlags.sale ? 'text-emerald-300' : 'text-white/40'}>
              {data.stageFlags.sale ? '✓' : '○'} Sold Produce ({data.counts.salesCount})
            </p>
            <p className={data.stageFlags.repeat ? 'text-emerald-300' : 'text-white/40'}>
              {data.stageFlags.repeat ? '✓' : '○'} Repeat Seller
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* --- ProfileAccordion --- */
function ProfileAccordion({ farmer, onRefresh }: { farmer: FarmerDetail; onRefresh: () => void }) {
  const [open, setOpen] = useState<string | null>('personal')
  const toggle = (id: string) => setOpen(open === id ? null : id)
  const sections = [
    { id: 'personal', label: 'Personal & Enrollment', icon: User },
    { id: 'family', label: 'Family Information', icon: Users },
    { id: 'finance', label: 'Finance & Loans', icon: Banknote },
    { id: 'bank', label: 'Bank Accounts', icon: Landmark, count: farmer.farmerBankAccounts?.length || 0 },
    { id: 'insurance', label: 'Insurance', icon: Shield, count: farmer.farmerInsurances?.length || 0 },
    { id: 'livestock', label: 'Livestock', icon: Users, count: farmer.farmerAnimals?.length || 0 },
    { id: 'equipment', label: 'Equipment', icon: Tractor, count: farmer.farmerEquipment?.length || 0 },
  ]
  return (
    <div className="space-y-2">
      {sections.map(sec => {
        const Icon = sec.icon
        const isOpen = open === sec.id
        return (
          <div key={sec.id} className="rounded-xl border border-border/60 overflow-hidden">
            <button onClick={() => toggle(sec.id)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{sec.label}</span>
                {sec.count != null && sec.count > 0 && <Badge variant="secondary" className="text-[10px]">{sec.count}</Badge>}
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="p-4 border-t border-border/40 animate-form-fade-in">
                {sec.id === 'personal' && <PersonalSection farmer={farmer} />}
                {sec.id === 'family' && <FamilySection farmer={farmer} />}
                {sec.id === 'finance' && <FinanceSection farmer={farmer} />}
                {sec.id === 'bank' && <MultiEntrySection title="Bank Accounts" icon={Landmark} farmerId={farmer.id} endpoint="bank-accounts" dataKey="accounts" items={farmer.farmerBankAccounts || []} fields={[{ name: 'accountType', label: 'Account Type', type: 'select', options: ['Savings', 'Current', 'Fixed Deposit'] }, { name: 'accountNo', label: 'Account Number', type: 'text', required: true }, { name: 'bankName', label: 'Bank Name', type: 'text', required: true }, { name: 'branchDetails', label: 'Branch', type: 'text' }, { name: 'sortCode', label: 'Sort Code', type: 'text' }, { name: 'isPrimary', label: 'Primary Account', type: 'checkbox' }]} onRefresh={onRefresh} />}
                {sec.id === 'insurance' && <MultiEntrySection title="Insurance Records" icon={Shield} farmerId={farmer.id} endpoint="insurances" dataKey="insurances" items={farmer.farmerInsurances || []} fields={[{ name: 'insuranceType', label: 'Insurance Type', type: 'select', options: ['Life', 'Health', 'Crop', 'Social', 'Other'], required: true }, { name: 'provider', label: 'Provider', type: 'text' }, { name: 'amount', label: 'Amount', type: 'number' }, { name: 'enrolledDate', label: 'Enrolled Date', type: 'date' }, { name: 'endDate', label: 'End Date', type: 'date' }]} onRefresh={onRefresh} />}
                {sec.id === 'livestock' && <MultiEntrySection title="Animal Husbandry" icon={Users} farmerId={farmer.id} endpoint="animals" dataKey="animals" items={farmer.farmerAnimals || []} fields={[{ name: 'animalType', label: 'Animal Type', type: 'select', options: ['Cattle', 'Goat', 'Sheep', 'Poultry', 'Pigs', 'Rabbits', 'Fish', 'Bees'], required: true }, { name: 'count', label: 'Count', type: 'number', required: true }, { name: 'breedName', label: 'Breed', type: 'text' }, { name: 'fodder', label: 'Fodder', type: 'text' }, { name: 'animalHousing', label: 'Housing', type: 'text' }, { name: 'revenue', label: 'Revenue (UGX)', type: 'number' }, { name: 'animalForGrowth', label: 'Purpose', type: 'select', options: ['Meat', 'Milk', 'Eggs', 'Draught', 'Breeding', 'Other'] }]} onRefresh={onRefresh} />}
                {sec.id === 'equipment' && <MultiEntrySection title="Farm Equipment" icon={Tractor} farmerId={farmer.id} endpoint="equipment" dataKey="equipment" items={farmer.farmerEquipment || []} fields={[{ name: 'equipmentName', label: 'Equipment Name', type: 'text', required: true }, { name: 'count', label: 'Count', type: 'number', required: true }, { name: 'yearOfManufacture', label: 'Year of Manufacture', type: 'number' }, { name: 'yearOfPurchase', label: 'Year of Purchase', type: 'number' }]} onRefresh={onRefresh} />}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function PersonalSection({ farmer }: { farmer: FarmerDetail }) {
  return (
    <div className="space-y-4">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoField label="Country" value={farmer.country} />
        <InfoField label="Province" value={farmer.province} />
        <InfoField label="District" value={farmer.district} />
        <InfoField label="Sub-county" value={farmer.commune} />
        <InfoField label="Village" value={farmer.villageName} />
        <InfoField label="GPS" value={farmer.gpsLatitude && farmer.gpsLongitude ? `${farmer.gpsLatitude.toFixed(6)}, ${farmer.gpsLongitude.toFixed(6)}` : ''} />
        <InfoField label="Farm Size (ha)" value={farmer.farmSize ? String(farmer.farmSize) : ''} />
        <InfoField label="Land Ownership" value={farmer.farmOwnership} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoField label="Enrollment Date" value={farmer.enrollmentDate ? new Date(farmer.enrollmentDate).toLocaleDateString() : ''} />
        <InfoField label="Enrollment Place" value={farmer.enrollmentPlace} />
        <InfoField label="Registration Under" value={farmer.farmerRegistrationUnder} />
        <InfoField label="Cooperative" value={farmer.cooperative} />
        <InfoField label="Field Officer" value={farmer.fieldOfficer} />
        <InfoField label="Extension Officer" value={farmer.extensionOfficer} />
        <InfoField label="Certified" value={farmer.isCertified ? 'Yes' : 'No'} />
        {farmer.isCertified && <InfoField label="Certification Type" value={farmer.certificationType} />}
      </div>
    </div>
  )
}

function FamilySection({ farmer }: { farmer: FarmerDetail }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <InfoField label="Spouse Name" value={farmer.spouseName} />
      <InfoField label="Family Members" value={farmer.familyMembers ? String(farmer.familyMembers) : ''} />
      <InfoField label="Children under 18" value={farmer.childrenUnder18 ? String(farmer.childrenUnder18) : ''} />
      <InfoField label="School Going" value={farmer.schoolGoingChildren ? String(farmer.schoolGoingChildren) : ''} />
      <InfoField label="Housing Ownership" value={farmer.housingOwnership} />
      <InfoField label="House Type" value={farmer.houseType} />
      <InfoField label="Meals per Day" value={farmer.mealsPerDay} />
      <InfoField label="Fuel Type" value={farmer.fuelType} />
    </div>
  )
}

function FinanceSection({ farmer }: { farmer: FarmerDetail }) {
  const loans = (farmer as any).vslaLoans || []
  const activeLoans = loans.filter((l: any) => ['DISBURSED', 'OUTSTANDING', 'OVERDUE'].includes(l.status))
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Income</p>
          <div className="flex justify-between p-2 rounded-lg bg-muted/30"><span className="text-sm text-muted-foreground">Monthly</span><span className="text-sm font-medium">{farmer.monthlyHouseholdIncome ? `UGX ${farmer.monthlyHouseholdIncome.toLocaleString()}` : '—'}</span></div>
          <div className="flex justify-between p-2 rounded-lg bg-muted/30"><span className="text-sm text-muted-foreground">Annual</span><span className="text-sm font-medium">{farmer.annualHouseholdIncome ? `UGX ${farmer.annualHouseholdIncome.toLocaleString()}` : '—'}</span></div>
          <div className="flex justify-between p-2 rounded-lg bg-muted/30"><span className="text-sm text-muted-foreground">Source</span><span className="text-sm font-medium">{farmer.primaryIncomeSource || '—'}</span></div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Loan History</p>
          <div className="flex justify-between p-2 rounded-lg bg-muted/30"><span className="text-sm text-muted-foreground">Loan Taken</span><Badge variant={farmer.loanTakenLastYear ? 'default' : 'secondary'} className="text-[10px]">{farmer.loanTakenLastYear ? 'Yes' : 'No'}</Badge></div>
          {farmer.loanTakenLastYear && <>
            <div className="flex justify-between p-2 rounded-lg bg-muted/30"><span className="text-sm text-muted-foreground">Amount</span><span className="text-sm font-medium">{farmer.loanAmount ? `UGX ${farmer.loanAmount.toLocaleString()}` : '—'}</span></div>
            <div className="flex justify-between p-2 rounded-lg bg-muted/30"><span className="text-sm text-muted-foreground">From</span><span className="text-sm font-medium">{farmer.loanTakenFrom || '—'}</span></div>
          </>}
        </div>
      </div>
      {activeLoans.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Active VSLA Loans</p>
          {activeLoans.map((l: any) => {
            const outstanding = Math.max(0, (l.totalRepayable ?? l.amount) - (l.amountRepaid || 0))
            return (
              <div key={l.id} className="p-3 rounded-lg bg-muted/30">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{l.vslaGroup?.name || 'VSLA Loan'} · {l.status}</span>
                  <Badge variant={outstanding > 0 ? 'default' : 'secondary'} className="text-[10px]">{outstanding > 0 ? 'Outstanding' : 'Repaid'}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><p className="text-muted-foreground">Principal</p><p className="font-medium">UGX {(l.amount || 0).toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground">Repaid</p><p className="font-medium text-emerald-600">UGX {(l.amountRepaid || 0).toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground">Balance</p><p className="font-bold text-red-600">UGX {outstanding.toLocaleString()}</p></div>
                </div>
              </div>
            )
          })}
        </div>
      )}
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
      .then(d => { setLands(d.farms || d.data || d.farmLands || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [farmerId])

  if (loading) return <Skeleton className="h-48" />
  if (lands.length === 0) return <EmptyTabCard icon={MapPin} title="Farm Lands" description="No farm lands registered yet" />

  return (
    <div className="space-y-3">
      {lands.map((land: any) => (
        <Card key={land.id} className="card-hover">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> {land.name || 'Unnamed Farm'}
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">{land.isActive === false ? 'Inactive' : 'Active'}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <InfoField label="Area (ha)" value={land.sizeHectares ? String(land.sizeHectares) : '—'} />
              <InfoField label="Ownership" value={land.landOwnership || '—'} />
              <InfoField label="Soil Fertility" value={land.soilFertility || '—'} />
              <InfoField label="Water Source" value={land.waterSource || '—'} />
              <InfoField label="Topology" value={land.landTopology || '—'} />
              <InfoField label="Irrigation" value={land.irrigationType || '—'} />
              <InfoField label="Cultivations" value={land._count?.cultivations ? String(land._count.cultivations) : '0'} />
              <InfoField label="GPS Polygon" value={land._count?.polygonPoints ? 'Mapped' : 'None'} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
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
