import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'

/**
 * GET /api/farmers/me
 *   Self-service: Resolve the authenticated user's own FarmerProfile.
 *   Only works for FARMER / EKB_FARMER roles whose User is linked to a
 *   FarmerProfile (via FarmerProfile.userId).
 *
 *   Returns the farmer profile + summary of their own data:
 *     - products sold + quantities + income (from sales)
 *     - loans (with paid/remaining balance, repaid via produce sales)
 *     - input distribution balance remaining
 *     - ledger entries (chronological transactions)
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext()

    // Only farmer roles can use the self-service endpoint.
    if (!['FARMER', 'EKB_FARMER'].includes(ctx.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!ctx.userId || !ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Resolve the farmer profile linked to this user.
    const farmer = await db.farmerProfile.findFirst({
      where: { userId: ctx.userId, tenantId: ctx.tenantId },
      select: {
        id: true,
        farmerCode: true,
        firstName: true,
        lastName: true,
        phone: true,
        gender: true,
        photoUrl: true,
        isCertified: true,
        certificationType: true,
        farmSize: true,
        groupId: true,
        group: { select: { id: true, name: true } },
        villageName: true,
        district: true,
        province: true,
        country: true,
      },
    })
    if (!farmer) {
      return NextResponse.json({ error: 'No farmer profile linked to this account' }, { status: 404 })
    }

    const farmerId = farmer.id

    // ─── Sales / Produce sold to EKiBBO ───
    const sales = await db.sale.findMany({
      where: { farmerId, tenantId: ctx.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })

    // ─── Loans (EKIBBO farmer loans). Balance derived from sale deductions. ───
    const loans = await db.loanApplication.findMany({
      where: { farmerId, status: { not: 'REJECTED' } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        loanProduct: { select: { id: true, name: true } },
      },
    })

    // All sale deductions (treat as loan repayments via produce sold). There is
    // no per-loan FK on Sale, so we allocate total repayments FIFO across loans.
    const allSales = await db.sale.findMany({
      where: { farmerId, tenantId: ctx.tenantId },
      select: { loanDeducted: true },
    })
    const totalLoanRepaid = allSales.reduce((sum, s) => sum + (s.loanDeducted || 0), 0)

    let remainingRepaid = totalLoanRepaid
    const loansNormalized = loans.map((l) => {
      const repaid = Math.min(l.amount || 0, Math.max(0, remainingRepaid))
      remainingRepaid = Math.max(0, remainingRepaid - repaid)
      return {
        id: l.id,
        productName: l.loanProduct?.name || 'Farmer Loan',
        amount: l.amount,
        status: l.status,
        createdAt: l.createdAt,
        repaid,
        balance: Math.max(0, (l.amount || 0) - repaid),
      }
    })

    // ─── Input distributions (debt remaining) ───
    const inputs = await db.inputDistribution.findMany({
      where: { farmerId, tenantId: ctx.tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        inputType: true,
        quantity: true,
        totalCost: true,
        balanceRemaining: true,
        status: true,
        createdAt: true,
      },
    })
    const inputBalanceTotal = inputs.reduce((s, i) => s + (i.balanceRemaining || 0), 0)

    // ─── Ledger entries (transactions) ───
    const entries = await db.farmerLedgerEntry.findMany({
      where: { farmerId, tenantId: ctx.tenantId },
      orderBy: { date: 'desc' },
      take: 300,
    })

    const totalIncome = sales.reduce((s, x) => s + (x.netAmount || 0), 0)
    const totalSalesQuantity = sales.reduce((s, x) => s + (parseFloat(x.quantity) || 0), 0)
    const outstandingLoansTotal = loansNormalized.reduce((s, l) => s + l.balance, 0)

    return NextResponse.json({
      farmer,
      summary: {
        totalProductsSold: sales.length,
        totalSalesQuantity,
        totalIncome,
        totalPaid: entries.filter((e) => e.type === 'PAYMENT').reduce((s, e) => s + Math.abs(e.amount), 0),
        outstandingLoans: outstandingLoansTotal,
        outstandingInputs: inputBalanceTotal,
        currentBalance: entries[0]?.balanceAfter || 0,
      },
      sales,
      loans: loansNormalized,
      inputs,
      ledger: entries,
    })
  } catch (error: any) {
    console.error('[farmer self-service] error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch farmer self-service data', detail: error?.message || String(error) },
      { status: 500 }
    )
  }
}