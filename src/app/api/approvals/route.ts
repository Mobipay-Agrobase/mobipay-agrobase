import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext()

    // Fetch pending purchases — match both status='PENDING' and approvalStatus='SUBMITTED'
    const pendingPurchases = await db.purchase.findMany({
      where: {
        OR: [
          { status: 'PENDING', farmer: { tenantId: ctx.tenantId } },
          { approvalStatus: 'SUBMITTED', tenantId: ctx.tenantId },
        ],
      },
      include: { farmer: true },
      orderBy: { createdAt: 'desc' },
    })

    // Fetch pending loan applications
    const pendingLoans = await db.loanApplication.findMany({
      where: { status: 'PENDING', loanProduct: { tenantId: ctx.tenantId } },
      orderBy: { createdAt: 'desc' },
    })

    // Fetch pending input requests (filtered by tenant via dealer relationship)
    const pendingInputRequests = await db.inputRequest.findMany({
      where: { status: 'PENDING', dealer: { tenantId: ctx.tenantId } },
      orderBy: { createdAt: 'desc' },
    })

    // Combine into unified approvals list
    const approvals = [
      ...pendingPurchases.map((p) => ({
        id: p.id,
        type: 'PURCHASE' as const,
        title: `Purchase: ${p.commodity}`,
        applicant: p.farmer
          ? `${p.farmer.firstName} ${p.farmer.lastName}`
          : 'Unknown',
        applicantPhone: p.farmer?.phone || undefined,
        amount: p.totalAmount,
        date: p.createdAt,
        status: p.status,
        // Detailed purchase fields for the approval detail view
        details: {
          commodity: p.commodity,
          variety: p.variety,
          quantity: p.quantity,
          unitPrice: p.unitPrice,
          totalAmount: p.totalAmount,
          netWeight: p.netWeight,
          moistureReading: p.moistureReading,
          defectCount: p.defectCount,
          qualityDeduction: p.qualityDeduction,
          dailyPrice: p.dailyPrice,
          loanDeduction: p.loanDeduction,
          inputDeduction: p.inputDeduction,
          momoCharges: p.momoCharges,
          momoTax: p.momoTax,
          netPayment: p.netPayment,
          approvalStatus: p.approvalStatus,
          farmerCode: p.farmer?.farmerCode,
        },
      })),
      ...pendingLoans.map((l) => ({
        id: l.id,
        type: 'LOAN' as const,
        title: `Loan: ${l.purpose || 'General'}`,
        applicant: l.applicantName,
        amount: l.amount,
        date: l.createdAt,
        status: l.status,
      })),
      ...pendingInputRequests.map((r) => ({
        id: r.id,
        type: 'INPUT_REQUEST' as const,
        title: `Input Request: ${r.product}`,
        applicant: r.farmerName,
        amount: r.totalPrice,
        date: r.createdAt,
        status: r.status,
      })),
    ]

    // Sort by date descending
    approvals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      data: approvals,
      total: approvals.length,
      summary: {
        purchases: pendingPurchases.length,
        loans: pendingLoans.length,
        inputRequests: pendingInputRequests.length,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch approvals' }, { status: 500 })
  }
}

/**
 * POST /api/approvals
 *   Approve or reject a pending item.
 *   Body: { id, type, action: 'APPROVE' | 'REJECT', reason? }
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()
    const { id, type, action, reason } = body

    if (!id || !type || !action) {
      return NextResponse.json({ error: 'id, type, and action are required' }, { status: 400 })
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'

    if (type === 'PURCHASE') {
      // Use the purchases PATCH endpoint which triggers ledger entries,
      // traceability batch, and impact events on approval.
      const approvalStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
      const purchaseRes = await fetch(`${request.nextUrl.origin}/api/purchases`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...Object.fromEntries(request.headers) },
        body: JSON.stringify({ id, status: newStatus, approvalStatus }),
      })
      if (!purchaseRes.ok) {
        // Fallback: direct update
        await db.purchase.update({
          where: { id },
          data: { status: newStatus, approvalStatus, approvedById: ctx.userId, approvedAt: new Date() },
        })
      }
    } else if (type === 'LOAN') {
      await db.loanApplication.update({ where: { id }, data: { status: newStatus } })
    } else if (type === 'INPUT_REQUEST') {
      await db.inputRequest.update({ where: { id }, data: { status: newStatus } })
    } else {
      return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
    }

    return NextResponse.json({ message: `${type} ${newStatus.toLowerCase()}` })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 })
  }
}