/**
 * GET /api/nssf/commission
 * View commission tracking (MOBIPAY_FINANCE + SUPER_ADMIN).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!ctx.isSuperAdmin && ctx.role !== 'MOBIPAY_FINANCE') {
      return NextResponse.json({ error: 'Finance access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId') || ''

    const where: any = {}
    if (tenantId) where.tenantId = tenantId

    const commissions = await db.nssfCommission.findMany({
      where,
      include: { tenant: { select: { name: true } } },
      orderBy: { period: 'desc' },
      take: 50,
    })

    return NextResponse.json({ data: commissions })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to load commissions' }, { status: 500 })
  }
}
