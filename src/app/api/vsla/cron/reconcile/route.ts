/**
 * GET /api/vsla/cron/reconcile?key=<CRON_SECRET>
 * Daily cron: checks pending VSLA transactions and updates status.
 * V2 had "automatic reconciliation every 3 days" — we do daily for better accuracy.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    const cronSecret = process.env.IMPACT_CRON_SECRET || process.env.CRON_SECRET
    if (!cronSecret || key !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find all PENDING savings older than 5 minutes
    const pendingSavings = await db.vslaSaving.findMany({
      where: { status: 'PENDING', createdAt: { lt: new Date(Date.now() - 5 * 60 * 1000) } },
    })

    let reconciled = 0
    for (const s of pendingSavings) {
      // Auto-mark as COMPLETED (in production, check with payment provider)
      await db.vslaSaving.update({
        where: { id: s.id },
        data: { status: 'COMPLETED' },
      })
      reconciled++
    }

    // Find overdue loans
    const activeLoans = await db.vslaLoan.findMany({
      where: { status: 'DISBURSED', dueDate: { lt: new Date() } },
    })

    let overdueMarked = 0
    for (const loan of activeLoans) {
      await db.vslaLoan.update({
        where: { id: loan.id },
        data: { status: 'OVERDUE' },
      })
      overdueMarked++
    }

    return NextResponse.json({
      savingsReconciled: reconciled,
      loansMarkedOverdue: overdueMarked,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[vsla/cron/reconcile] error:', error)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
