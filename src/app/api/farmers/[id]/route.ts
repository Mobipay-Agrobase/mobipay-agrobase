import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { decryptField, encryptField } from '@/lib/security/field-crypto'

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
    }
  })
  if (!farmer) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 })

  // P7: Decrypt PII fields for the response
  const farmerDecrypted = {
    ...farmer,
    phone: farmer.phone && farmer.phone.startsWith('enc:v1:') ? decryptField(farmer.phone) : farmer.phone,
    nationalIdNo: farmer.nationalIdNo ? decryptField(farmer.nationalIdNo) : null,
    bankAccountNo: farmer.bankAccountNo ? decryptField(farmer.bankAccountNo) : null,
    email: farmer.email ? decryptField(farmer.email) : null,
  }

  return NextResponse.json({ data: farmerDecrypted })
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
      'enrollmentPlace', 'icsYear', 'cooperativeId', 'extensionOfficer', 'guardianName', 'photoUrl',
      'country', 'province', 'district', 'commune', 'villageName', 'villageId', 'zipCode',
      'spouseName', 'housingOwnership', 'houseType', 'bankName', 'bankBranch',
      'loanTakenFrom', 'loanPurpose', 'loanInterestPeriod', 'landOwnershipInfo',
      'nextOfKinName', 'nextOfKinPhone', 'nextOfKinRelation',
    ]
    for (const k of textFields) if (body[k] !== undefined) scalar[k] = body[k]

    const numFields = [
      'gpsLatitude', 'gpsLongitude', 'familyMembers', 'childrenUnder18', 'schoolGoingChildren',
      'childrenMaleUnder18', 'childrenFemaleUnder18', 'schoolGoingMale', 'schoolGoingFemale',
      'loanAmount', 'loanInterestPct', 'loanRepaymentAmount', 'farmSize',
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