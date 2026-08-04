import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { encryptField } from '@/lib/security/field-crypto'

/**
 * GET /api/sacco/members?saccoId=xxx
 *   List members of a SACCO.
 *
 * POST /api/sacco/members
 *   Add a new member to a SACCO. Auto-generates member number.
 *   Encrypts PII (phone, nationalIdNo) at rest.
 */

export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext(request)
    if (!hasPermission(ctx.role, 'sacco:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const saccoId = searchParams.get('saccoId')
    if (!saccoId) {
      return NextResponse.json({ error: 'saccoId is required' }, { status: 400 })
    }

    // Verify SACCO belongs to tenant
    const sacco = await db.sacco.findFirst({
      where: { id: saccoId, ...buildTenantFilter(ctx, 'tenantId') },
      select: { id: true },
    })
    if (!sacco) {
      return NextResponse.json({ error: 'SACCO not found' }, { status: 404 })
    }

    const members = await db.saccoMember.findMany({
      where: { saccoId },
      orderBy: { joinedAt: 'desc' },
      include: {
        _count: { select: { loans: true, sharePurchases: true, dividends: true } },
      },
    })

    return NextResponse.json({
      members: members.map(m => ({
        ...m,
        loanCount: m._count.loans,
        sharePurchaseCount: m._count.sharePurchases,
        dividendCount: m._count.dividends,
      })),
      total: members.length,
    })
  } catch (error) {
    console.error('[sacco/members GET]', error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext(request)
    if (!hasPermission(ctx.role, 'sacco:create')) {
      return NextResponse.json({ error: 'Forbidden — sacco:create permission required' }, { status: 403 })
    }

    const body = await request.json()
    const { saccoId, fullName, phone, email, nationalIdNo, gender, occupation, farmerId } = body as {
      saccoId?: string; fullName?: string; phone?: string; email?: string
      nationalIdNo?: string; gender?: string; occupation?: string; farmerId?: string
    }

    if (!saccoId || !fullName || !phone) {
      return NextResponse.json({ error: 'saccoId, fullName, and phone are required' }, { status: 400 })
    }

    // Verify SACCO belongs to tenant
    const sacco = await db.sacco.findFirst({
      where: { id: saccoId, ...buildTenantFilter(ctx, 'tenantId') },
      select: { id: true, name: true },
    })
    if (!sacco) {
      return NextResponse.json({ error: 'SACCO not found' }, { status: 404 })
    }

    // Generate member number: SACCO-XXXX
    const existingCount = await db.saccoMember.count({ where: { saccoId } })
    const memberNumber = `SACCO-${String(existingCount + 1).padStart(4, '0')}`

    const member = await db.saccoMember.create({
      data: {
        saccoId,
        farmerId: farmerId || null,
        memberNumber,
        fullName: fullName!,
        // P7: Encrypt PII at rest
        phone: encryptField(phone) || phone,
        email: email ? encryptField(email) : null,
        nationalIdNo: nationalIdNo ? encryptField(nationalIdNo) : null,
        gender: gender || null,
        occupation: occupation || null,
      },
    })

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    console.error('[sacco/members POST]', error)
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 })
  }
}
