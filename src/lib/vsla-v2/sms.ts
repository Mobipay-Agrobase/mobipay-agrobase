/**
 * VSLA V2 — SMS Service (Africa's Talking)
 * ──────────────────────────────────────
 * Sends SMS via Africa's Talking API for:
 * - Member welcome SMS with PIN (SRS 3.4)
 * - SMS OTP for member login (SRS 4)
 * - Loan application notification to key holders (SRS 5.1)
 * - Loan approval notification to member (SRS 5.1)
 * - Loan disbursement notification (SRS 5.1)
 * - Cycle close share-out notification (SRS 5.3)
 * - Meeting reminders
 * 
 * Environment variables:
 * - AT_USERNAME (e.g. "mobisms")
 * - AT_API_KEY (e.g. "4bb94a4c...")
 * - AT_SENDER_ID (e.g. "KILIMO" — optional, defaults to "AT" for sandbox)
 */

const AT_API_URL = 'https://api.africastalking.com/v1/messaging'

interface SendSmsResult {
  success: boolean
  messageId?: string
  cost?: number
  error?: string
}

/**
 * Send an SMS via Africa's Talking.
 * Non-blocking — errors are logged but don't fail the calling operation.
 */
export async function sendSms(
  phone: string,
  message: string,
): Promise<SendSmsResult> {
  const username = process.env.AT_USERNAME
  const apiKey = process.env.AT_API_KEY
  const senderId = process.env.AT_SENDER_ID

  if (!username || !apiKey) {
    console.error('[vsla-v2/sms] AT_USERNAME or AT_API_KEY not configured')
    return { success: false, error: 'SMS provider not configured' }
  }

  // Normalize phone number (Africa's Talking requires international format without +)
  const normalizedPhone = phone.replace(/^\+/, '').replace(/\s/g, '')

  try {
    const params = new URLSearchParams({
      username,
      to: normalizedPhone,
      message,
      enqueue: 'true',
    })

    if (senderId) {
      params.append('from', senderId)
    }

    const response = await fetch(AT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${username}:${apiKey}`).toString('base64'),
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => 'Unknown error')
      console.error('[vsla-v2/sms] AT API error:', response.status, text)
      return { success: false, error: `AT API error: ${response.status}` }
    }

    const data = await response.json() as {
      SMSMessageData?: {
        MessageId?: string
        Recipients?: Array<{
          messageId?: string
          status?: string
          number?: string
          cost?: string
        }>
      }
    }

    const recipients = data.SMSMessageData?.Recipients
    if (recipients && recipients.length > 0) {
      const recipient = recipients[0]
      return {
        success: recipient.status === 'Success',
        messageId: recipient.messageId || `sms-at-${Date.now()}`,
        cost: recipient.cost ? parseFloat(recipient.cost) : undefined,
      }
    }

    return {
      success: true,
      messageId: data.SMSMessageData?.MessageId || `sms-at-${Date.now()}`,
    }
  } catch (error) {
    console.error('[vsla-v2/sms] Error sending SMS:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send SMS to multiple recipients (e.g., all key holders, all members).
 */
export async function sendBulkSms(
  phones: string[],
  message: string,
): Promise<{ sent: number; failed: number; results: SendSmsResult[] }> {
  const results = await Promise.all(
    phones.map(phone => sendSms(phone, message))
  )
  const sent = results.filter(r => r.success).length
  const failed = results.length - sent
  return { sent, failed, results }
}

// ─── Pre-built message templates (SRS-compliant) ───

export function buildWelcomeSms(params: {
  memberName: string
  groupName: string
  memberId: string
  pin: string
}): string {
  return `Welcome to ${params.groupName}, ${params.memberName}! Your member ID is ${params.memberId} and your PIN is ${params.pin}. Use these to log in via USSD or the app. Do not share your PIN. — MobiPay Agrobase`
}

export function buildOtpSms(otp: string): string {
  return `Your MobiPay VSLA login code is ${otp}. It expires in 5 minutes. Do not share this code. — MobiPay Agrobase`
}

export function buildLoanPendingApprovalSms(params: {
  memberName: string
  amount: number
  groupName: string
  loanId: string
}): string {
  return `${params.memberName} applied for UGX ${params.amount.toLocaleString()} loan in ${params.groupName}. Your approval is required. Loan ref: ${params.loanId.slice(-8).toUpperCase()}. — MobiPay Agrobase`
}

export function buildLoanApprovedSms(params: {
  memberName: string
  amount: number
  groupName: string
}): string {
  return `Good news, ${params.memberName}! Your loan of UGX ${params.amount.toLocaleString()} in ${params.groupName} has been approved by all key holders. You will receive the disbursement shortly. — MobiPay Agrobase`
}

export function buildLoanRejectedSms(params: {
  memberName: string
  groupName: string
}): string {
  return `Hello ${params.memberName}, your loan application in ${params.groupName} was not approved by the key holders. Please contact your group admin for details. — MobiPay Agrobase`
}

export function buildLoanDisbursedSms(params: {
  memberName: string
  amount: number
  groupName: string
}): string {
  return `${params.memberName}, your loan of UGX ${params.amount.toLocaleString()} from ${params.groupName} has been disbursed. Please ensure timely repayment. — MobiPay Agrobase`
}

export function buildShareOutSms(params: {
  memberName: string
  groupName: string
  shares: number
  amount: number
  perShare: number
}): string {
  return `${params.memberName}, the cycle for ${params.groupName} has closed. Your share-out: ${params.shares} shares × UGX ${params.perShare.toFixed(2)} = UGX ${params.amount.toFixed(2)}. — MobiPay Agrobase`
}

export function buildMeetingReminderSms(params: {
  memberName: string
  groupName: string
  meetingDate: string
  location: string
}): string {
  return `Reminder: ${params.groupName} meeting on ${params.meetingDate} at ${params.location}. Please attend. — MobiPay Agrobase`
}
