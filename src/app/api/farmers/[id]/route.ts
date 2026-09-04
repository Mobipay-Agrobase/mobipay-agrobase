import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { decryptField, encryptField } from '@/lib/security/field-crypto'
import { isEkibboTenant } from '@/lib/ekibbo'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getTenantContext(_req)
  const tf = buildTenantFilter(ctx, 'tenantId') as any

  const farmer = await db.farmerProfile.findFirst({
    where: { id, ...tf },
    include: {
      group: true,
      village: { include: { parish: { include: { subCounty: { include: { county: { include: { district: { include: { subRegion: { include: { region: true } } } } } } } } } } } },
      creditScores: { orderBy: { scoreDate: 'desc' }, take: 1 },
      savings: { take: 10, orderBy: { createdAt: 'desc' } },
      vslaLoans: { take: 10, orderBy: { createdAt: 'desc' } },
      farms: { include: { cultivations: true } },
      trainings: { include: { training: true } },
      farmerBankAccounts: { orderBy: { createdAt: 'desc' } },
      farmerInsurances: { orderBy: { createdAt: 'desc' } },
      farmerAnimals: { orderBy: { createdAt: 'desc' } },
      farmerEquipment: { orderBy: { createdAt: 'desc' } },
      cropProductions: { orderBy: { createdAt: 'desc' } },
      // Recent produce/input sales for the mobile farmer detail page
      sales: { take: 10, orderBy: { createdAt: 'desc' } },
    }
  })
  if (!farmer) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 })

  // Parse JSON string fields stored in the DB into proper arrays/objects.
  // The LIST endpoint (/api/farmers) already does this; the detail endpoint
  // must do the same or the edit form's bankAccounts.map() / etc. will crash
  // with "X.map is not a function" because the raw Prisma value is a string.
  const parseJson = (raw: string | null | undefined, fallback: any) => {
    if (!raw) return fallback
    try { return JSON.parse(raw) } catch { return fallback }
  }
  const farmerDecrypted = {
    ...farmer,
    consumerElectronics: parseJson(farmer.consumerElectronics, []),
    vehicle: parseJson(farmer.vehicle, []),
    bankAccounts: parseJson(farmer.bankAccounts, []),
    insuranceData: parseJson(farmer.insuranceData, []),
    farmEquipment: parseJson(farmer.farmEquipment, []),
    mainCrops: parseJson(farmer.mainCrops, []),
    livestockTypes: parseJson(farmer.livestockTypes, []),
    // P7: Decrypt PII fields for the response
    phone: farmer.phone && farmer.phone.startsWith('enc:v1:') ? decryptField(farmer.phone) : farmer.phone,
    nationalIdNo: farmer.nationalIdNo ? decryptField(farmer.nationalIdNo) : null,
    bankAccountNo: farmer.bankAccountNo ? decryptField(farmer.bankAccountNo) : null,
    email: farmer.email ? decryptField(farmer.email) : null,
  }

  // ─── Inline loyalty summary (year-to-date) ─────────────────────────────
  // EKIBBO-ONLY feature — the loyalty block is only embedded when the
  // caller's tenant is the EKIBBO tenant (type=EXPORTER). Other tenants
  // get loyalty=null and the farmer detail page hides the loyalty badge.
  let loyaltySummary: any = null
  if (await isEkibboTenant(ctx)) {
    try {
      const now = new Date()
      const ytdFrom = new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
      const farmerFilter = { farmerId: id }
      const [sales, inputs, trainings, visits] = await Promise.all([
        db.sale.findMany({
          where: { ...tf, ...farmerFilter, category: 'PRODUCE', status: 'COMPLETED', createdAt: { gte: ytdFrom, lte: now } },
          select: { product: true, totalAmount: true },
        }),
        db.inputDistribution.findMany({
          where: { ...tf, ...farmerFilter, distributionDate: { gte: ytdFrom, lte: now } },
          select: { id: true },
        }),
        db.trainingAttendance.findMany({
          where: { ...farmerFilter, training: { ...tf, date: { gte: ytdFrom, lte: now } }, attended: true },
          select: { id: true },
        }),
        db.farmVisit.findMany({
          where: { ...farmerFilter, visitDate: { gte: ytdFrom, lte: now } },
          select: { id: true },
        }),
      ])

      const salesCount = sales.length
      const stageSale = salesCount >= 1
      const stageRepeat = salesCount >= 2
      const stageInput = inputs.length >= 1
      const stageTraining = trainings.length >= 1 || visits.length >= 1
      const stages = [stageTraining, stageInput, stageSale, stageRepeat].filter(Boolean).length

      const cropsSet = new Set<string>()
      let totalSalesValue = 0
      for (const s of sales) {
        if (s.product) cropsSet.add(s.product)
        totalSalesValue += s.totalAmount || 0
      }

      const tierLabels = ['New', 'Engaged', 'Active', 'Loyal', 'Champion']
      loyaltySummary = {
        stages,
        stageFlags: { training: stageTraining, input: stageInput, sale: stageSale, repeat: stageRepeat },
        counts: {
          salesCount,
          cropsSold: cropsSet.size,
          inputPurchases: inputs.length,
          trainingsAttended: trainings.length,
          farmVisits: visits.length,
        },
        totalSalesValueUGX: Math.round(totalSalesValue),
        isLoyal: stageSale,
        label: tierLabels[stages],
      }
    } catch (e) {
      // Loyalty computation should never break the farmer-detail fetch
      console.error('Inline loyalty summary error:', e)
    }
  }

  // ─── Inline financial summary (loans + sales) ─────────────────────────────
  // Computed for every tenant (unlike loyalty, which is EKIBBO-only) so the
  // mobile farmer detail page can render loan-balance / sales summary cards.
  // Never throws — a failure here must not break the farmer-detail fetch.
  let financialSummary: any = null
  try {
    const [loanApps, vslaLoanRows, produceSales] = await Promise.all([
      // LoanApplication has no tenantId column; scoping by farmerId is safe
      // because the farmer itself was already tenant-filtered above.
      db.loanApplication.findMany({
        where: { farmerId: id },
        select: { amount: true, status: true, disbursedAt: true },
      }),
      db.vslaLoan.findMany({
        where: { ...tf, farmerId: id },
        select: { amount: true, totalRepayable: true, amountRepaid: true, status: true },
      }),
      db.sale.findMany({
        where: { ...tf, farmerId: id, category: 'PRODUCE' },
        select: { totalAmount: true, status: true, createdAt: true, loanBalanceAfter: true },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // Agribusiness loans (loan module): outstanding = sum of active loan
    // amounts. EKIBBO's produce-sale loan deduction writes `loanBalanceAfter`
    // on each Sale, so when present the most recent value is authoritative.
    const agriActive = loanApps.filter((l) => l.status === 'DISBURSED' || l.status === 'OVERDUE')
    const agriTotalBorrowed = loanApps
      .filter((l) => ['DISBURSED', 'OVERDUE', 'COMPLETED'].includes(l.status))
      .reduce((sum, l) => sum + (l.amount || 0), 0)
    const lastBalanceAfter = produceSales.find((s) => s.loanBalanceAfter != null)?.loanBalanceAfter ?? null
    const agriOutstanding =
      lastBalanceAfter != null ? lastBalanceAfter : agriActive.reduce((sum, l) => sum + (l.amount || 0), 0)

    // VSLA loans: outstanding = totalRepayable - amountRepaid on active loans
    const vslaActive = vslaLoanRows.filter((l) => l.status === 'DISBURSED' || l.status === 'OVERDUE')
    const vslaOutstanding = vslaActive.reduce(
      (sum, l) => sum + Math.max((l.totalRepayable || 0) - (l.amountRepaid || 0), 0), 0
    )
    const vslaTotalRepaid = vslaLoanRows.reduce((sum, l) => sum + (l.amountRepaid || 0), 0)

    // Sales: only settled statuses count toward totals (matches loyalty logic)
    const validSales = produceSales.filter((s) => s.status === 'COMPLETED' || s.status === 'PAID')
    const ytdFrom = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1))
    const totalSalesValue = validSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
    const ytdSalesValue = validSales
      .filter((s) => s.createdAt >= ytdFrom)
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0)

    financialSummary = {
      currency: 'UGX',
      loanBalance: Math.round(agriOutstanding + vslaOutstanding),
      loanBalanceBreakdown: {
        agribusiness: Math.round(agriOutstanding),
        vsla: Math.round(vslaOutstanding),
      },
      activeLoanCount: agriActive.length + vslaActive.length,
      totalBorrowed: Math.round(
        agriTotalBorrowed + vslaLoanRows.reduce((sum, l) => sum + (l.amount || 0), 0)
      ),
      vslaTotalRepaid: Math.round(vslaTotalRepaid),
      sales: {
        totalAllTime: Math.round(totalSalesValue),
        ytd: Math.round(ytdSalesValue),
        count: validSales.length,
        lastSaleAt: validSales[0]?.createdAt ?? null,
      },
    }
  } catch (e) {
    console.error('Inline financial summary error:', e)
  }

  return NextResponse.json({ data: { ...farmerDecrypted, loyalty: loyaltySummary, financialSummary } })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getTenantContext(req)
  const tf = buildTenantFilter(ctx, 'tenantId') as any
  const body = await req.json()

  const existing = await db.farmerProfile.findFirst({ where: { id, ...tf } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { firstName, lastName, gender, phone, villageId, status } = body

    // JSON fields stringified for storage
    const jsonData: Record<string, string> = {}
    for (const key of ['consumerElectronics', 'vehicle', 'bankAccounts', 'insuranceData', 'farmEquipment', 'mainCrops', 'livestockTypes']) {
      if (body[key] !== undefined) jsonData[key] = JSON.stringify(body[key])
    }

    const scalar: Record<string, unknown> = {}
    const textFields = [
      'farmerCode', 'nationalIdType', 'education', 'maritalStatus', 'memberType',
      'enrollmentPlace', 'icsYear', 'farmerRegistrationUnder', 'cooperativeId', 'extensionOfficer', 'guardianName', 'photoUrl',
      'country', 'province', 'district', 'commune', 'villageName', 'villageId', 'zipCode',
      'spouseName', 'housingOwnership', 'houseType', 'bankName', 'bankBranch',
      'loanTakenFrom', 'loanPurpose', 'loanInterestPeriod', 'landOwnershipInfo',
      'nextOfKinName', 'nextOfKinPhone', 'nextOfKinRelation',
      // New fields from the rebuilt AddFarmerForm
      'certificationType', 'primaryIncomeSource', 'secondaryIncomeSource',
      'livingConditions', 'fuelType', 'mealsPerDay', 'farmOwnership',
    ]
    for (const k of textFields) if (body[k] !== undefined) scalar[k] = body[k]

    const numFields = [
      'gpsLatitude', 'gpsLongitude', 'familyMembers', 'childrenUnder18', 'schoolGoingChildren',
      'childrenMaleUnder18', 'childrenFemaleUnder18', 'schoolGoingMale', 'schoolGoingFemale',
      'loanAmount', 'loanInterestPct', 'loanRepaymentAmount', 'farmSize',
      'monthlyHouseholdIncome', 'annualHouseholdIncome', 'monthlyFarmIncome', 'annualFarmIncome',
      'fuelCostMonthly', 'unusedLandSize', 'gpsAltitude',
    ]
    for (const k of numFields) if (body[k] !== undefined) scalar[k] = body[k]

    const boolFields = ['isCertified', 'loanTakenLastYear', 'loanHasSecurity']
    for (const k of boolFields) if (body[k] !== undefined) scalar[k] = !!body[k]

    const dateFields = ['dateOfBirth', 'enrollmentDate', 'loanRepaymentDate']
    for (const k of dateFields) if (body[k] !== undefined) scalar[k] = new Date(body[k])

    const updated = await db.farmerProfile.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(gender !== undefined && { gender }),
        ...(phone !== undefined && { phone: encryptField(phone) || phone }),
        ...(body.nationalIdNo !== undefined && { nationalIdNo: encryptField(body.nationalIdNo) || body.nationalIdNo }),
        ...(body.email !== undefined && { email: encryptField(body.email) || body.email }),
        ...(body.bankAccountNo !== undefined && { bankAccountNo: encryptField(body.bankAccountNo) || body.bankAccountNo }),
        ...(villageId !== undefined && { villageId }),
        ...(status !== undefined && { status }),
        ...scalar,
        ...jsonData,
        updatedAt: new Date(),
      },
    })
    return NextResponse.json({ data: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getTenantContext(req)
  const tf = buildTenantFilter(ctx, 'tenantId') as any

  const existing = await db.farmerProfile.findFirst({ where: { id, ...tf } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.farmerProfile.update({
    where: { id },
    data: { status: 'INACTIVE', updatedAt: new Date() },
  })
  return NextResponse.json({ message: 'Deleted successfully' })
}