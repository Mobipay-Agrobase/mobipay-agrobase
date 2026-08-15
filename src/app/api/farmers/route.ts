import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { hashPassword } from '@/lib/password'
import { appendImpactEvent } from '@/lib/impact/hash-chain'
import { UsageTracker } from '@/lib/billing/usage'
import { encryptField, decryptField } from '@/lib/security/field-crypto'
import { generateFarmerCode } from '@/lib/farmer-code'

/**
 * GET /api/farmers — List farmers with search, filter, pagination
 * POST /api/farmers — Create a new farmer with full registration data
 *   (84 fields from the New Ecosystem Excel: Farmer Registration sheet)
 */

export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const groupId = searchParams.get('groupId') || ''
    const gender = searchParams.get('gender') || ''
    const status = searchParams.get('status') || ''
    const isCertified = searchParams.get('isCertified')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {
      ...buildTenantFilter(ctx, 'tenantId'),
    }
    if (status && status !== 'all') where.status = status
    else if (status !== 'all') where.status = 'ACTIVE'
    if (gender) where.gender = gender
    if (isCertified === 'true') where.isCertified = true
    if (isCertified === 'false') where.isCertified = false
    if (search) where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { farmerCode: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
    if (groupId) where.groupId = groupId

    const [farmers, total] = await Promise.all([
      db.farmerProfile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          group: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.farmerProfile.count({ where }),
    ])

    // Parse JSON fields for each farmer + decrypt PII + include new EKIBBO fields
    const farmersParsed = farmers.map(f => ({
      ...f,
      consumerElectronics: f.consumerElectronics ? JSON.parse(f.consumerElectronics) : [],
      vehicle: f.vehicle ? JSON.parse(f.vehicle) : [],
      bankAccounts: f.bankAccounts ? JSON.parse(f.bankAccounts) : [],
      insuranceData: f.insuranceData ? JSON.parse(f.insuranceData) : null,
      farmEquipment: f.farmEquipment ? JSON.parse(f.farmEquipment) : [],
      mainCrops: f.mainCrops ? JSON.parse(f.mainCrops) : [],
      livestockTypes: f.livestockTypes ? JSON.parse(f.livestockTypes) : [],
      // P7: Decrypt PII fields for the response
      phone: f.phone && f.phone.startsWith('enc:v1:') ? decryptField(f.phone) : f.phone,
      nationalIdNo: f.nationalIdNo ? decryptField(f.nationalIdNo) : null,
      bankAccountNo: f.bankAccountNo ? decryptField(f.bankAccountNo) : null,
      email: f.email ? decryptField(f.email) : null,
    }))

    return NextResponse.json({ farmers: farmersParsed, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Farmer list error:', error)
    return NextResponse.json({ error: 'Failed to fetch farmers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    // Generate tenant-aware farmer code (e.g. EKB-00001 for EKIBBO, SAA-00001 for SAA-WFP-AMS)
    const farmerCode = await generateFarmerCode(ctx.tenantId, body.farmerCode)

    // Stringify JSON fields
    const jsonData: Record<string, string | undefined> = {}
    if (body.consumerElectronics) jsonData.consumerElectronics = JSON.stringify(body.consumerElectronics)
    if (body.vehicle) jsonData.vehicle = JSON.stringify(body.vehicle)
    if (body.bankAccounts) jsonData.bankAccounts = JSON.stringify(body.bankAccounts)
    if (body.insuranceData) jsonData.insuranceData = JSON.stringify(body.insuranceData)
    if (body.farmEquipment) jsonData.farmEquipment = JSON.stringify(body.farmEquipment)
    if (body.mainCrops) jsonData.mainCrops = JSON.stringify(body.mainCrops)
    if (body.livestockTypes) jsonData.livestockTypes = JSON.stringify(body.livestockTypes)

    // Create the farmer
    const farmer = await db.farmerProfile.create({
      data: {
        tenantId: ctx.tenantId,
        farmerCode,
        firstName: body.firstName,
        lastName: body.lastName,
        // P7: Encrypt PII fields at rest
        phone: encryptField(body.phone) || body.phone,
        gender: body.gender,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        education: body.education,
        maritalStatus: body.maritalStatus,
        nationalIdType: body.nationalIdType,
        nationalIdNo: body.nationalIdNo ? encryptField(body.nationalIdNo) : null,
        photoUrl: body.photoUrl,
        isCertified: body.isCertified || false,
        certificationType: body.certificationType,
        memberType: body.memberType || 'General',
        status: body.status || 'ACTIVE',

        // Enrollment
        enrollmentDate: body.enrollmentDate ? new Date(body.enrollmentDate) : new Date(),
        enrollmentPlace: body.enrollmentPlace,
        icsYear: body.icsYear,
        farmerRegistrationUnder: body.farmerRegistrationUnder,
        cooperativeId: body.cooperativeId,
        extensionOfficer: body.extensionOfficer,

        // ID Proof
        idProofPhotoUrl: body.idProofPhotoUrl,
        guardianName: body.guardianName,
        // P7: Encrypt email at rest
        email: body.email ? encryptField(body.email) : null,

        // Location
        gpsLatitude: body.gpsLatitude,
        gpsLongitude: body.gpsLongitude,
        country: body.country,
        province: body.province,
        district: body.district,
        commune: body.commune,
        villageName: body.villageName,
        villageId: body.villageId,
        zipCode: body.zipCode,

        // Family
        familyMembers: body.familyMembers,
        childrenUnder18: body.childrenUnder18,
        schoolGoingChildren: body.schoolGoingChildren,
        spouseName: body.spouseName,
        childrenMaleUnder18: body.childrenMaleUnder18,
        childrenFemaleUnder18: body.childrenFemaleUnder18,
        schoolGoingMale: body.schoolGoingMale,
        schoolGoingFemale: body.schoolGoingFemale,

        // Assets
        housingOwnership: body.housingOwnership,
        houseType: body.houseType,
        ...jsonData,

        // Finance
        bankName: body.bankName,
        // P7: Encrypt bank account number at rest
        bankAccountNo: body.bankAccountNo ? encryptField(body.bankAccountNo) : null,
        bankBranch: body.bankBranch,
        loanTakenLastYear: body.loanTakenLastYear || false,
        loanTakenFrom: body.loanTakenFrom,
        loanAmount: body.loanAmount,
        loanPurpose: body.loanPurpose,
        loanInterestPct: body.loanInterestPct,
        loanInterestPeriod: body.loanInterestPeriod,
        loanHasSecurity: body.loanHasSecurity || false,
        loanRepaymentAmount: body.loanRepaymentAmount,
        loanRepaymentDate: body.loanRepaymentDate ? new Date(body.loanRepaymentDate) : null,

        // Farm
        farmSize: body.farmSize,
        farmOwnership: body.farmOwnership || body.housingOwnership,
        groupId: body.groupId,
      },
    })

    // Create a login user for the farmer if email/phone + password provided,
    // OR if body.createLogin === true (auto-generates a default password from the phone number).
    let farmerUserId: string | null = null
    const effectivePassword = body.password || (body.createLogin ? (body.phone || '12345678') : null)
    if (effectivePassword && (body.email || body.phone)) {
      const passwordHash = await hashPassword(effectivePassword)
      const isEkibbo = (await db.tenant.findFirst({
        where: { id: ctx.tenantId, isActive: true },
        select: { name: true },
      }))?.name?.toUpperCase().includes('EKIBBO') ?? false
      const createdUser = await db.user.create({
        data: {
          tenantId: ctx.tenantId,
          // EKIBBO farmers get the EKIBBO-scoped self-service role; others get the generic FARMER role.
          role: isEkibbo ? 'EKB_FARMER' : 'FARMER',
          email: body.email || null,
          phone: body.phone,
          passwordHash,
          firstName: body.firstName,
          lastName: body.lastName,
        },
      })
      farmerUserId = createdUser.id
    }

    // Link the farmer profile to its login user (enables self-service scoping).
    if (farmerUserId) {
      await db.farmerProfile.update({
        where: { id: farmer.id },
        data: { userId: farmerUserId },
      })
    }

    // Fire a FARMER_REGISTERED impact event
    try {
      await appendImpactEvent({
        tenantId: ctx.tenantId,
        farmerId: farmer.id,
        eventType: 'FARMER_REGISTERED',
        eventData: {
          farmerCode: farmer.farmerCode,
          name: `${farmer.firstName} ${farmer.lastName}`,
          enrolledBy: ctx.userId,
          country: farmer.country,
        },
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorType: 'EXTENSION_OFFICER',
      })
    } catch {
      // Impact event is non-critical — don't fail the registration
    }

    // P4: Track usage for billing — fire-and-forget, non-blocking
    UsageTracker.track(ctx.tenantId, 'FARMER_CREATED').catch(() => { /* non-blocking */ })

    return NextResponse.json(farmer, { status: 201 })
  } catch (error) {
    console.error('Farmer create error:', error)
    return NextResponse.json(
      { error: 'Failed to create farmer', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
