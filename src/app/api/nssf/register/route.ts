/**
 * POST /api/nssf/register
 * Register a farmer for NSSF voluntary savings.
 * Uses Zod validation + audit logging.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { db } from '@/lib/db'
import { logAction } from '@/lib/security/audit-logger'
import { z } from 'zod'

const registerSchema = z.object({
  farmerId: z.string().min(1, 'Farmer ID is required'),
  nationalId: z.string().min(10, 'National ID is required (min 10 characters)'),
  fullName: z.string().min(2, 'Full name is required'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  phoneNumber: z.string().min(10, 'Phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  district: z.string().optional(),
  village: z.string().optional(),
  valueChain: z.string().optional(),
  employer: z.string().optional(),
  nssfNumber: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'nssf:read')) {
      return NextResponse.json({ error: 'NSSF read access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = { ...buildTenantFilter(ctx, 'tenantId') }
    if (status) where.activationStatus = status

    const [data, total] = await Promise.all([
      db.nssfRegistration.findMany({
        where,
        include: {
          farmer: { select: { id: true, firstName: true, lastName: true, farmerCode: true, phone: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.nssfRegistration.count({ where }),
    ])

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error: any) {
    console.error('[nssf/register GET] error:', error)
    return NextResponse.json({ error: 'Failed to load registrations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'nssf:create')) {
      return NextResponse.json({ error: 'NSSF registration access required' }, { status: 403 })
    }

    const body = await request.json()
    const validated = registerSchema.parse(body)

    // Check for duplicate national ID
    const existing = await db.nssfRegistration.findFirst({
      where: { tenantId: ctx.tenantId, nationalId: validated.nationalId },
    })
    if (existing) {
      return NextResponse.json({ error: 'A farmer with this National ID is already registered for NSSF' }, { status: 409 })
    }

    // Verify farmer exists in this tenant
    const farmer = await db.farmerProfile.findFirst({
      where: { id: validated.farmerId, ...buildTenantFilter(ctx, 'tenantId') },
    })
    if (!farmer) {
      return NextResponse.json({ error: 'Farmer not found' }, { status: 404 })
    }

    // Create registration
    const registration = await db.nssfRegistration.create({
      data: {
        tenantId: ctx.tenantId,
        farmerId: validated.farmerId,
        nationalId: validated.nationalId,
        fullName: validated.fullName,
        dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : null,
        gender: validated.gender || null,
        phoneNumber: validated.phoneNumber,
        email: validated.email || null,
        district: validated.district || null,
        village: validated.village || null,
        valueChain: validated.valueChain || null,
        employer: validated.employer || 'Self-employed (Farmer)',
        nssfNumber: validated.nssfNumber || null,
        activationStatus: 'PENDING',
        registeredById: ctx.userId,
      },
    })

    // Audit log
    await logAction({
      userId: ctx.userId,
      tenantId: ctx.tenantId,
      action: 'NSSF_REGISTRATION_CREATED',
      entityType: 'NssfRegistration',
      entityId: registration.id,
      details: { farmerId: validated.farmerId, nationalId: validated.nationalId },
      ipAddress: request.headers.get('x-forwarded-for') || '',
    })

    return NextResponse.json({ data: registration }, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', fields: error.issues }, { status: 400 })
    }
    console.error('[nssf/register POST] error:', error)
    return NextResponse.json({ error: 'Failed to register farmer for NSSF' }, { status: 500 })
  }
}
