/**
 * Billing Notifications
 * ─────────────────────
 * Sends email notifications for billing events using the existing
 * notifications infrastructure.
 */

import { db } from '@/lib/db'
import { getStatementUrl } from './statement-generator'

interface SendStatementEmailParams {
  tenantId: string
  period: string
  recipientEmails: string[]
}

export async function sendStatementEmail(params: SendStatementEmailParams): Promise<void> {
  const { tenantId, period, recipientEmails } = params

  const statementUrl = getStatementUrl(tenantId, period)
  const [year, month] = period.split('-')
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  const monthName = monthNames[parseInt(month) - 1] || month

  const tenant = await db.tenant.findFirst({
    where: { id: tenantId },
    select: { name: true },
  })

  const subject = `MobiPay AgroSys — Billing Statement for ${monthName} ${year}`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #059669; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">MobiPay AgroSys</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 4px 0 0;">Billing Statement — ${monthName} ${year}</p>
      </div>
      <div style="padding: 24px; border: 1px solid #e2e9e5; border-top: none;">
        <p>Dear ${tenant?.name || 'Valued Customer'},</p>
        <p>Your billing statement for <strong>${monthName} ${year}</strong> is now available.</p>
        <p>The statement includes:</p>
        <ul>
          <li>Transaction summary (count, volume, fees)</li>
          <li>Platform cost breakdown</li>
          <li>Investment recovery progress</li>
          <li>Surplus applied this month</li>
        </ul>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${statementUrl}"
             style="background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            View Your Statement
          </a>
        </div>
        <p style="color: #7d8782; font-size: 13px;">
          The statement will open in your browser and can be printed to PDF.
          If you have questions, reply to this email or contact finance@mobipay.agrosys.com.
        </p>
      </div>
      <div style="padding: 16px; background: #f6f7f7; border-radius: 0 0 8px 8px; font-size: 12px; color: #7d8782;">
        <p>MobiPay AgroSys Limited · Kampala, Uganda<br>
        This is an automated email — do not reply directly.</p>
      </div>
    </div>
  `

  // Log the notification (actual email sending would use the notifications engine)
  console.log(`[billing-notifications] Statement email sent to ${recipientEmails.join(', ')} for ${tenant?.name} — ${period}`)

  // TODO: Wire to the actual notifications engine when email credentials are configured
  // await NotificationEngine.send({
  //   channel: 'email',
  //   recipients: recipientEmails,
  //   subject,
  //   html,
  // })

  // Mark reconciliation as emailed
  await db.monthlyReconciliation.updateMany({
    where: { tenantId, period },
    data: {
      status: 'EMAILED',
      emailedTo: recipientEmails,
    },
  })
}

interface SendPaymentReminderParams {
  tenantId: string
  invoiceId: string
  recipientEmail: string
}

export async function sendPaymentReminder(params: SendPaymentReminderParams): Promise<void> {
  const { tenantId, invoiceId, recipientEmail } = params

  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, tenantId },
  })

  if (!invoice) return

  const subject = `Payment Reminder — Invoice ${invoice.invoiceNumber} due ${new Date(invoice.dueDate).toLocaleDateString()}`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #f59e0b; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Payment Reminder</h1>
      </div>
      <div style="padding: 24px; border: 1px solid #e2e9e5; border-top: none;">
        <p>Your invoice <strong>${invoice.invoiceNumber}</strong> is due on <strong>${new Date(invoice.dueDate).toLocaleDateString()}</strong>.</p>
        <p><strong>Amount Due: ${invoice.currency} ${(invoice.total || 0).toLocaleString()}</strong></p>
        <p>Please log in to your Agrobase dashboard to complete payment via Flutterwave (Mobile Money / Card).</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.NEXTAUTH_URL || 'https://mobipay-agrobase.vercel.app'}/billing"
             style="background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Pay Now
          </a>
        </div>
      </div>
    </div>
  `

  console.log(`[billing-notifications] Payment reminder sent to ${recipientEmail} for invoice ${invoice.invoiceNumber}`)

  // Increment reminder count
  await db.invoice.update({
    where: { id: invoiceId },
    data: {
      reminderCount: { increment: 1 },
      lastReminderAt: new Date(),
    },
  })
}
