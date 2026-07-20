/**
 * POST /api/sms/test
 * Test SMS sending via Africa's Talking.
 * SUPER_ADMIN only.
 * 
 * Body: { phone: "+256...", message: "Test message" }
 * Returns: { sent: boolean, method: string, response?: any }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { sendSms } from '@/lib/nssf/notifications'

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!ctx.isSuperAdmin && ctx.role !== 'MOBIPAY_FINANCE') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { phone, message } = body

    if (!phone || !message) {
      return NextResponse.json({ error: 'phone and message are required' }, { status: 400 })
    }

    const result = await sendSms({ phone, message })

    return NextResponse.json({
      ...result,
      phone,
      message: result.sent ? 'SMS sent successfully' : 'SMS not sent (check credentials)',
      credentials: {
        username: process.env.AT_USERNAME || 'not set',
        apiKeySet: !!process.env.AT_API_KEY,
        senderId: process.env.AT_SENDER_ID || 'KILIMO',
      },
    })
  } catch (error: any) {
    console.error('[sms/test] error:', error)
    return NextResponse.json({ error: 'SMS test failed', details: error.message }, { status: 500 })
  }
}
