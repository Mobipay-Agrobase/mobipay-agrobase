/**
 * GET /api/billing/cron/monthly?key=<CRON_SECRET>
 * Runs on the 1st of each month at 02:00 UTC.
 * Vercel cron config: 0 2 1 * *
 *
 * For every tenant with an ACTIVE or RECOVERED BillingAgreement:
 *   1. Run monthly reconciliation (creates MonthlyReconciliation record)
 *   2. (Future) Generate PDF statement
 *   3. (Future) Email statement to tenant's finance team
 */
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { runMonthlyReconciliation } from '@/lib/vendor-financing/engine'

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    const cronSecret = process.env.IMPACT_CRON_SECRET || process.env.CRON_SECRET

    if (!cronSecret || key !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Determine the previous month (we run on the 1st, so reconcile the month that just ended)
    const now = new Date()
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const period = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`

    // Find all tenants with active agreements
    const agreements = await db.billingAgreement.findMany({
      where: { status: { in: ['ACTIVE', 'RECOVERED'] } },
      select: { tenantId: true },
    })

    const results: Array<{ tenantId: string; status: string; error?: string }> = []

    for (const { tenantId } of agreements) {
      try {
        await runMonthlyReconciliation(tenantId, period)
        results.push({ tenantId, status: 'success' })
      } catch (e: any) {
        results.push({ tenantId, status: 'error', error: e.message })
      }
    }

    return NextResponse.json({
      period,
      totalAgreements: agreements.length,
      results,
    })
  } catch (error: any) {
    console.error('[billing/cron/monthly] error:', error)
    return NextResponse.json({ error: 'Cron job failed', details: error?.message }, { status: 500 })
  }
}
