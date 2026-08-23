import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { decryptField } from '@/lib/security/field-crypto'
import { NotificationEngine } from '@/lib/notifications/engine'
import type { NotificationPayload } from '@/lib/notifications/types'

/**
 * POST /api/communication/price-broadcast
 *
 * Ekibbo feedback (Operations Manager): "Provision for sending farmers text
 * messages regarding prices".
 *
 * Sends an SMS price alert to farmers via the NotificationEngine (Africa's
 * Talking primary, Twilio fallback — configured via AT_ and TWILIO_ env vars).
 *
 * Body:
 *   commodity: string           e.g. "Coffee"
 *   price: number               UGX per kg
 *   unit?: string               default "kg"
 *   form?: string               e.g. "Fresh Cherry" (optional)
 *   customMessage?: string      optional override; {price} {commodity} tokens replaced
 *   district?: string           filter audience by district (optional)
 *   groupId?: string            filter audience by farmer group (optional)
 *   dryRun?: boolean            preview recipient count without sending
 *
 * Returns: { sent, failed, skipped, total, sample }
 */

function buildMessage(commodity: string, price: number, unit: string, form?: string, custom?: string): string {
  if (custom) {
    return custom
      .replace(/\{price\}/gi, `UGX ${Number(price).toLocaleString()}`)
      .replace(/\{commodity\}/gi, commodity)
      .replace(/\{form\}/gi, form || '')
  }
  const formPart = form ? ` (${form})` : ''
  return `PRICE ALERT: ${commodity}${formPart} is now UGX ${Number(price).toLocaleString()} per ${unit}. Bring your produce to the nearest collection point. — Ekibbo`
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    const body = await req.json()
    const { commodity, price, unit, form, customMessage, district, groupId, dryRun } = body

    if (!commodity || !price || Number(price) <= 0) {
      return NextResponse.json({ error: 'commodity and a positive price are required' }, { status: 400 })
    }

    // ── Build audience (tenant-scoped, optional district/group filters) ──
    const tf = buildTenantFilter(ctx, 'tenantId') as any
    const where: Record<string, unknown> = { ...tf, status: 'ACTIVE' }
    if (district) where.district = district
    if (groupId) where.groupId = groupId

    const farmers = await db.farmerProfile.findMany({
      where,
      select: { id: true, firstName: true, lastName: true, phone: true },
      take: 5000,
    })

    // Decrypt phones (PII is encrypted at rest) and de-duplicate
    const recipients: Array<{ id: string; name: string; phone: string }> = []
    const seen = new Set<string>()
    for (const f of farmers) {
      const phone = decryptField(f.phone) || f.phone
      if (!phone) continue
      const normalized = String(phone).replace(/[\s-]/g, '')
      if (seen.has(normalized)) continue
      seen.add(normalized)
      recipients.push({ id: f.id, name: `${f.firstName} ${f.lastName}`, phone: normalized })
    }

    const message = buildMessage(commodity, Number(price), unit || 'kg', form, customMessage)

    // ── Dry run: preview without sending ─────────────────────────────────
    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        total: recipients.length,
        message,
        sample: recipients.slice(0, 5).map(r => ({ name: r.name, phone: r.phone.slice(0, 6) + '***' })),
      })
    }

    // ── Send via NotificationEngine (SMS channel) ────────────────────────
    let sent = 0
    let failed = 0
    const BATCH = 50
    for (let i = 0; i < recipients.length; i += BATCH) {
      const batch = recipients.slice(i, i + BATCH)
      const results = await Promise.allSettled(
        batch.map(r =>
          NotificationEngine.dispatch({
            tenantId: ctx.tenantId,
            channel: 'SMS',
            category: 'ALERT',
            subject: `Price alert: ${commodity}`,
            body: message,
            recipientPhone: r.phone,
            data: { farmerId: r.id, commodity: String(commodity), price: String(price) },
          } as NotificationPayload)
        )
      )
      for (const res of results) {
        if (res.status === 'fulfilled') sent++
        else failed++
      }
    }

    return NextResponse.json({
      sent,
      failed,
      total: recipients.length,
      message,
    })
  } catch (error: any) {
    console.error('Price broadcast error:', error)
    return NextResponse.json({ error: 'Failed to send price broadcast', detail: error.message }, { status: 500 })
  }
}
