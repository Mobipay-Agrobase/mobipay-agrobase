import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'reset:update')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params
    const merchant = await db.resetMerchant.update({ where: { id }, data: { status: 'APPROVED', approvedAt: new Date(), approvedBy: ctx.userId } })
    return NextResponse.json({ merchant })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
