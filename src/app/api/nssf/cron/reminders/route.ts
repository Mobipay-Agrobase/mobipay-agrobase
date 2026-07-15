/**
 * GET /api/nssf/cron/reminders?key=<CRON_SECRET>
 * 
 * Monthly reminder: sends SMS to farmers who haven't contributed this month.
 * Runs on the 1st of each month at 8 AM EAT (schedule: 0 5 1 * * — 5 AM UTC = 8 AM EAT)
 * 
 * For each farmer with NSSF ACTIVATED status:
 *   - Check if they have a COMPLETED contribution this month
 *   - If not, send SMS: "Dear [Name], your NSSF contribution is due. 
 *     Pay via *123# or the Kilimo Trust app. Min UGX 1,000."
 * 
 * SMS is sent via Africa's Talking (when Joel provides the API key).
 * For now, logs the reminders to console.
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

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Find all farmers with NSSF ACTIVATED status
    const activatedFarmers = await db.farmerProfile.findMany({
      where: {
        nssfActivationStatus: 'ACTIVATED',
        phone: { not: '' },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        nssfNumber: true,
        tenantId: true,
      },
    })

    let remindersSent = 0
    let alreadyPaid = 0
    const results: any[] = []

    for (const farmer of activatedFarmers) {
      // Check if farmer has a COMPLETED contribution this month
      const hasContribution = await db.nssfContribution.findFirst({
        where: {
          farmerId: farmer.id,
          status: 'COMPLETED',
          contributionDate: { gte: monthStart },
        },
        select: { id: true },
      })

      if (hasContribution) {
        alreadyPaid++
        continue
      }

      // Farmer hasn't contributed this month — send reminder
      const message = `Dear ${farmer.firstName}, your NSSF voluntary savings contribution for this month is due. Pay min UGX 1,000 via *123# or the Kilimo Trust app. NSSF No: ${farmer.nssfNumber || 'N/A'}. Thank you.`

      // TODO: Send actual SMS via Africa's Talking when Joel provides API key
      // For now, log to console
      console.log(`[NSSF REMINDER] SMS to ${farmer.phone}: ${message}`)

      remindersSent++
      results.push({
        farmerId: farmer.id,
        name: `${farmer.firstName} ${farmer.lastName}`,
        phone: farmer.phone,
        nssfNumber: farmer.nssfNumber,
        status: 'reminder_logged',
      })
    }

    return NextResponse.json({
      period: currentMonth,
      totalActivatedFarmers: activatedFarmers.length,
      remindersSent,
      alreadyPaid,
      results: results.slice(0, 50), // first 50 for debugging
    })
  } catch (error: any) {
    console.error('[nssf/cron/reminders] error:', error)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
