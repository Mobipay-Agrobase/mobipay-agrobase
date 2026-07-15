/**
 * GET /api/nssf/export?period=2026-07
 * 
 * Exports NSSF contributions as a CSV file for NSSF Uganda reconciliation.
 * Format per NSSF document Step 5:
 *   NSSF No, Name, Amount, Date, Phone
 * 
 * This file is sent to NSSF by Klimotrust for account crediting.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!ctx.isSuperAdmin && ctx.role !== 'MOBIPAY_FINANCE' && !ctx.role.startsWith('EKB_')) {
      // Allow finance + tenant admins
      if (ctx.role !== 'TENANT_ADMIN') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') // e.g., "2026-07"
    const settlementId = searchParams.get('settlementId')

    let where: any = { status: 'COMPLETED' }

    // Filter by period or settlement
    if (settlementId) {
      where.settlementId = settlementId
    } else if (period) {
      const [year, month] = period.split('-').map(Number)
      const periodStart = new Date(year, month - 1, 1)
      const periodEnd = new Date(year, month, 1)
      where.contributionDate = { gte: periodStart, lt: periodEnd }
    }

    const contributions = await db.nssfContribution.findMany({
      where,
      include: {
        farmer: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            nssfNumber: true,
            nssfNationalId: true,
          },
        },
      },
      orderBy: { contributionDate: 'asc' },
    })

    // Build CSV
    const headers = ['NSSF No', 'National ID', 'Name', 'Amount (UGX)', 'Date', 'Phone', 'Payment Method', 'Reference']
    const rows = contributions.map(c => [
      c.farmer?.nssfNumber || '',
      c.farmer?.nssfNationalId || '',
      c.farmer ? `${c.farmer.firstName} ${c.farmer.lastName}` : '',
      Number(c.amount).toFixed(0),
      new Date(c.contributionDate).toISOString().split('T')[0],
      c.farmer?.phone || '',
      c.paymentMethod,
      c.paymentReference || c.id.slice(-8).toUpperCase(),
    ])

    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const filename = period
      ? `nssf_contributions_${period}.csv`
      : settlementId
        ? `nssf_settlement_${settlementId.slice(-8)}.csv`
        : `nssf_contributions_all.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('[nssf/export] error:', error)
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 })
  }
}
