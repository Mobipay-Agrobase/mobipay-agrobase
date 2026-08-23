import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'

export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || ''
    const product = searchParams.get('product') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}
    if (category) where.product = category
    if (product) where.product = product

    // Filter through farmer tenantId
    if (!ctx.isSuperAdmin) {
      const validFarmerIds = await db.farmerProfile.findMany({
        where: { tenantId: { in: ctx.tenantScope as string[] } },
        select: { id: true },
      })
      where.farmerId = { in: validFarmerIds.map(f => f.id) }
    }

    const [data, total] = await Promise.all([
      db.sale.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { farmer: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.sale.count({ where }),
    ])

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    // ─── EKIBBO: Auto loan deduction from produce sold ───
    // If farmer has an outstanding loan, deduct a portion of the sale toward repayment.
    // Default: deduct the smaller of (outstanding balance) or (50% of sale value),
    // unless the caller explicitly passes loanDeducted.
    let loanDeducted = Number(body.loanDeducted) || 0
    let loanBalanceAfter: number | null = null
    let linkedLoanId: string | null = null

    if (body.farmerId) {
      // Find the farmer's most recent outstanding VSLA loan
      const outstandingLoan = await db.vslaLoan.findFirst({
        where: {
          farmerId: body.farmerId,
          status: { in: ['DISBURSED', 'OUTSTANDING', 'OVERDUE'] },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, amount: true, totalRepayable: true, amountRepaid: true },
      })

      if (outstandingLoan) {
        // Outstanding = total repayable - already repaid
        const totalRepayable = Number(outstandingLoan.totalRepayable ?? outstandingLoan.amount) || 0
        const alreadyRepaid = Number(outstandingLoan.amountRepaid) || 0
        const outstanding = Math.max(0, totalRepayable - alreadyRepaid)
        if (outstanding > 0) {
          const saleValue = Number(body.totalAmount) || 0
          if (loanDeducted === 0 && saleValue > 0) {
            // Auto-deduct: min(outstanding, 50% of sale value)
            loanDeducted = Math.min(outstanding, saleValue * 0.5)
          }
          loanBalanceAfter = Math.max(0, outstanding - loanDeducted)
          linkedLoanId = outstandingLoan.id

          // Update the loan's amountRepaid + status
          await db.vslaLoan.update({
            where: { id: outstandingLoan.id },
            data: {
              amountRepaid: alreadyRepaid + loanDeducted,
              status: loanBalanceAfter === 0 ? 'REPAID' : (loanBalanceAfter < outstanding * 0.5 ? 'OUTSTANDING' : undefined),
            },
          })
        }
      }
    }

    // Auto-calc netAmount if not provided
    const charges = Number(body.charges) || 0
    const taxAmount = Number(body.taxAmount) || 0
    const totalAmount = Number(body.totalAmount) || 0
    const netAmount = body.netAmount != null ? Number(body.netAmount) : Math.max(0, totalAmount - charges - taxAmount - loanDeducted)

    const sale = await db.sale.create({
      data: {
        tenantId: ctx.tenantId,
        farmerId: body.farmerId || null,
        customerId: body.customerId || null,
        customerName: body.customerName || null,
        product: body.product,
        category: body.category || 'PRODUCE',
        quantity: body.quantity,
        unitPrice: body.unitPrice ?? null,
        totalAmount,
        charges,
        taxAmount,
        netAmount,
        paymentMethod: body.paymentMethod || null,
        loanDeducted: loanDeducted > 0 ? loanDeducted : null,
        loanBalanceAfter,
        batchId: body.batchId || null,
        status: body.status || 'COMPLETED',
        approvedBy: body.approvedBy || null,
      },
      include: { farmer: true },
    })

    // Create a ledger entry for this sale (and the loan deduction if any)
    if (body.farmerId && ctx.tenantId) {
      try {
        await db.farmerLedgerEntry.create({
          data: {
            tenantId: ctx.tenantId,
            farmerId: body.farmerId,
            type: 'SALE',
            description: `Sale of ${body.product} (${body.quantity})`,
            amount: totalAmount,
            referenceType: 'Sale',
            referenceId: sale.id,
          },
        })
        if (loanDeducted > 0) {
          await db.farmerLedgerEntry.create({
            data: {
              tenantId: ctx.tenantId,
              farmerId: body.farmerId,
              type: 'LOAN_REPAY',
              description: `Auto loan repayment from sale of ${body.product}`,
              amount: -loanDeducted,
              referenceType: 'Sale',
              referenceId: sale.id,
            },
          })
        }
      } catch (ledgerErr) {
        console.error('[sales POST] ledger entry failed:', ledgerErr)
      }
    }

    return NextResponse.json({ data: sale, loanDeducted, loanBalanceAfter, linkedLoanId }, { status: 201 })
  } catch (error) {
    console.error('[sales POST] error:', error)
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 })
  }
}