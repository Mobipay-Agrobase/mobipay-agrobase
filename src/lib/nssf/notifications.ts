/**
 * NSSF SMS Notifications
 * Uses Africa's Talking API (when configured).
 * Falls back to console.log if not configured.
 */

interface SmsParams {
  phone: string
  message: string
}

export async function sendSms({ phone, message }: SmsParams): Promise<{ sent: boolean; method: string }> {
  const apiKey = process.env.AT_API_KEY || process.env.AFRICAS_TALKING_API_KEY
  const username = process.env.AT_USERNAME || process.env.AFRICAS_TALKING_USERNAME || 'sandbox'

  if (!apiKey) {
    console.log(`[SMS - not configured] To: ${phone}, Message: ${message}`)
    return { sent: false, method: 'console' }
  }

  try {
    const response = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': apiKey,
      },
      body: new URLSearchParams({
        username,
        to: phone,
        message,
        from: 'KILIMO',
      }),
    })

    if (response.ok) {
      console.log(`[SMS - sent] To: ${phone}`)
      return { sent: true, method: 'africas_talking' }
    } else {
      console.error(`[SMS - failed] To: ${phone}, Status: ${response.status}`)
      return { sent: false, method: 'failed' }
    }
  } catch (error) {
    console.error(`[SMS - error] To: ${phone}`, error)
    return { sent: false, method: 'error' }
  }
}

export async function sendContributionConfirmationSms(params: {
  phone: string
  farmerName: string
  amount: number
  reference: string
}): Promise<void> {
  await sendSms({
    phone: params.phone,
    message: `Dear ${params.farmerName}, we have received your NSSF voluntary savings contribution of UGX ${params.amount.toLocaleString()}. Reference: ${params.reference}. Thank you for saving with NSSF.`,
  })
}

export async function sendActivationSms(params: {
  phone: string
  farmerName: string
  nssfNumber?: string | null
}): Promise<void> {
  await sendSms({
    phone: params.phone,
    message: `Dear ${params.farmerName}, your NSSF account is now active. NSSF Number: ${params.nssfNumber || 'Pending'}. You can now make monthly contributions via *123# or the Kilimo Trust app. Min UGX 1,000.`,
  })
}

export async function sendReminderSms(params: {
  phone: string
  farmerName: string
  nssfNumber?: string | null
}): Promise<{ sent: boolean; method: string }> {
  return sendSms({
    phone: params.phone,
    message: `Dear ${params.farmerName}, your NSSF contribution is due this month. Pay min UGX 1,000 via *123# or the Kilimo Trust app. NSSF No: ${params.nssfNumber || 'N/A'}. Thank you.`,
  })
}

export async function sendRegistrationSms(params: {
  phone: string
  farmerName: string
}): Promise<void> {
  await sendSms({
    phone: params.phone,
    message: `Dear ${params.farmerName}, your NSSF registration has been received. You will be notified once your account is activated. Thank you for choosing NSSF Voluntary Savings.`,
  })
}
