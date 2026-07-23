import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Verify webhook signature per provider.
 * Uses crypto.timingSafeEqual to prevent timing attacks.
 *
 * SECURITY: Each provider's secret is read from environment variables.
 * Never hardcode secrets in source.
 */
async function verifyProviderSignature(provider: string, request: NextRequest): Promise<boolean> {
  try {
    // Get the raw body for HMAC verification (must be exact bytes the provider signed)
    const rawBody = await request.text()

    switch (provider.toLowerCase()) {
      case 'flutterwave':
      case 'flw': {
        // Flutterwave sends "verif-hash" header with the webhook secret
        const signature = request.headers.get('verif-hash') || ''
        const secret = process.env.FLW_WEBHOOK_HASH
        if (!secret || !signature) return false
        const a = Buffer.from(signature)
        const b = Buffer.from(secret)
        if (a.length !== b.length) return false
        return crypto.timingSafeEqual(a, b)
      }

      case 'mtn':
      case 'mtn_momo':
      case 'mtnmomo': {
        // MTN MoMo sends HMAC-SHA256 in "signature" header
        const signature = request.headers.get('signature') || ''
        const secret = process.env.MTN_MOMO_CALLBACK_SECRET
        if (!secret || !signature) return false
        const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
        const a = Buffer.from(signature)
        const b = Buffer.from(expected)
        if (a.length !== b.length) return false
        return crypto.timingSafeEqual(a, b)
      }

      case 'airtel':
      case 'airtel_money':
      case 'airtelmoney': {
        // Airtel Money sends "X-Signature" header with HMAC-SHA256 of payload
        const signature = request.headers.get('x-signature') || ''
        const secret = process.env.AIRTEL_CALLBACK_SECRET
        if (!secret || !signature) return false
        const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
        const a = Buffer.from(signature)
        const b = Buffer.from(expected)
        if (a.length !== b.length) return false
        return crypto.timingSafeEqual(a, b)
      }

      default:
        // Unknown provider — reject by default
        return false
    }
  } catch (error) {
    console.error('[webhook] Signature verification error:', error)
    return false
  }
}

/**
 * Payment callback/webhook endpoint.
 * Receives callbacks from payment providers and updates payment status.
 *
 * SECURITY: Per-provider webhook signature verification is enforced.
 * Test provider is only accepted in non-production environments.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params

    // SECURITY FIX: Real per-provider webhook signature verification.
    // Previous code had `isValidSignature = false` hardcoded — rejecting all real
    // webhooks while accepting any 'test' provider request (spoofable).
    if (provider === 'test') {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Test provider not allowed in production' }, { status: 403 })
      }
    } else {
      const isValidSignature = await verifyProviderSignature(provider, request)
      if (!isValidSignature) {
        console.error('[webhook] Rejected unsigned/invalid webhook', {
          provider,
          ip: request.headers.get('x-forwarded-for'),
          userAgent: request.headers.get('user-agent'),
          timestamp: new Date().toISOString(),
        })
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // Parse body (may have been consumed by request.text() in verifyProviderSignature)
    let body: any
    try {
      body = await request.json()
    } catch {
      body = JSON.parse(await request.text())
    }

    const { transactionRef, status, errorMessage, providerRef } = body as {
      transactionRef?: string
      status?: string
      errorMessage?: string
      providerRef?: string
    }

    if (!transactionRef || !status) {
      return NextResponse.json({ error: 'transactionRef and status are required' }, { status: 400 })
    }

    // Map provider status to internal status
    const statusMap: Record<string, string> = {
      successful: 'COMPLETED',
      completed: 'COMPLETED',
      success: 'COMPLETED',
      failed: 'FAILED',
      failure: 'FAILED',
      pending: 'PROCESSING',
      processing: 'PROCESSING',
    }

    const mappedStatus = statusMap[status.toLowerCase()] || 'PENDING'
    const updateData: Record<string, unknown> = { status: mappedStatus }

    if (mappedStatus === 'COMPLETED') {
      updateData.updatedAt = new Date()
    }
    if (mappedStatus === 'FAILED' && errorMessage) {
      updateData.description = errorMessage
    }

    // Find and update the payment
    const payment = await db.payment.findFirst({
      where: { transactionRef },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const updated = await db.payment.update({
      where: { id: payment.id },
      data: updateData,
    })

    // Trigger side effects based on payment type and status
    if (mappedStatus === 'COMPLETED') {
      // Side effects will be expanded in follow-up tasks
      // e.g., confirm VSLA savings, complete purchase, etc.
      console.log(`Payment ${payment.id} completed. Type: ${payment.type}`)
    }

    return NextResponse.json({ data: updated, provider, received: true })
  } catch (error) {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}