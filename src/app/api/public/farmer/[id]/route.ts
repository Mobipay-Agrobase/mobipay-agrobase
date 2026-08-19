import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

/**
 * GET /api/public/farmer/[id]
 *
 * Public farmer profile — NO auth required. Used by the QR code scanner
 * on the farmer detail page + the public /farmer/[id] page.
 *
 * Returns ONLY non-sensitive fields suitable for public verification:
 *   - firstName, lastName, farmerCode
 *   - district, villageName, farmSize
 *   - isCertified, certificationType
 *   - mainCrops (parsed from JSON)
 *   - enrollmentDate
 *   - tenant name (so the scanner can verify which org registered them)
 *
 * Sensitive fields are NEVER returned:
 *   - phone, email, nationalIdNo, bankAccountNo (PII — encrypted in DB,
 *     but we don't decrypt them for public view)
 *   - exact GPS coordinates (approximate to district level only)
 *   - financial details (income, loan balances, savings)
 *
 * Returns 404 if the farmer doesn't exist or is not ACTIVE.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const farmer = await db.farmerProfile.findFirst({
      where: { id, status: 'ACTIVE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        farmerCode: true,
        district: true,
        villageName: true,
        farmSize: true,
        isCertified: true,
        certificationType: true,
        mainCrops: true,
        enrollmentDate: true,
        tenant: { select: { name: true, type: true } },
      },
    })

    if (!farmer) {
      return NextResponse.json({ error: 'Farmer not found' }, { status: 404 })
    }

    // Parse mainCrops JSON → string[]
    let crops: string[] = []
    if (farmer.mainCrops) {
      try {
        const parsed = JSON.parse(farmer.mainCrops)
        crops = Array.isArray(parsed) ? parsed.map(String) : []
      } catch {
        crops = []
      }
    }

    return NextResponse.json({
      data: {
        id: farmer.id,
        firstName: farmer.firstName,
        lastName: farmer.lastName,
        farmerCode: farmer.farmerCode,
        district: farmer.district,
        villageName: farmer.villageName,
        farmSize: farmer.farmSize,
        isCertified: farmer.isCertified,
        certificationType: farmer.certificationType,
        mainCrops: crops,
        enrollmentDate: farmer.enrollmentDate ? new Date(farmer.enrollmentDate).toISOString().split('T')[0] : null,
        registeredBy: farmer.tenant?.name || null,
        tenantType: farmer.tenant?.type || null,
        // Verification timestamp — lets the scanner know when the data was fetched
        verifiedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Public farmer fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch farmer profile' }, { status: 500 })
  }
}
