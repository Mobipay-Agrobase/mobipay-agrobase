/**
 * Upload CSV and create batch cash disbursements
 * Also supports GET to list existing batches
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { sendSms } from '@/lib/vsla-v2/sms'

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'reset:read')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const where: Record<string, unknown> = {}
    if (!ctx.isSuperAdmin) where.tenantId = { in: ctx.tenantScope }

    const batches = await db.resetDisbursementBatch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ batches })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'reset:create')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const formData = await req.formData()
    const file = formData.get('file') as File
    const partner = formData.get('partner') as string || 'CARE'

    if (!file) return NextResponse.json({ error: 'CSV file required' }, { status: 400 })

    // Parse CSV
    const text = await file.text()
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())

    // Validate headers
    const requiredHeaders = ['beneficiaryId', 'phone', 'amount']
    for (const h of requiredHeaders) {
      if (!headers.includes(h)) {
        return NextResponse.json({ error: `Missing required column: ${h}. Required: ${requiredHeaders.join(', ')}` }, { status: 400 })
      }
    }

    // Parse rows
    const records: Array<{ beneficiaryId: string; phone: string; amount: number; partner: string; paymentMethod: string }> = []
    const errors: Array<{ row: number; error: string }> = []

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim())
      const row: Record<string, string> = {}
      headers.forEach((h, j) => { row[h] = cols[j] || '' })

      const amount = parseFloat(row.amount)
      if (!row.beneficiaryId) { errors.push({ row: i + 1, error: 'Missing beneficiaryId' }); continue }
      if (!row.phone) { errors.push({ row: i + 1, error: 'Missing phone' }); continue }
      if (!amount || amount <= 0) { errors.push({ row: i + 1, error: `Invalid amount: ${row.amount}` }); continue }

      records.push({
        beneficiaryId: row.beneficiaryId,
        phone: row.phone,
        amount,
        partner: row.partner || partner,
        paymentMethod: row.paymentMethod || 'MTN_MOMO',
      })
    }

    if (records.length === 0) {
      return NextResponse.json({ error: 'No valid records found in CSV', errors }, { status: 400 })
    }

    // Create batch
    const batchCode = `BATCH-${Date.now().toString(36).toUpperCase()}`
    const totalAmount = records.reduce((s, r) => s + r.amount, 0)

    const batch = await db.resetDisbursementBatch.create({
      data: {
        batchCode,
        tenantId: ctx.tenantId,
        partner,
        totalBeneficiaries: records.length,
        totalAmount,
        status: 'PROCESSING',
        uploadedBy: ctx.userId || 'admin',
      },
    })

    // Create individual disbursements
    let created = 0
    let failed = 0
    const disbursementErrors: Array<{ beneficiaryId: string; error: string }> = []

    for (const record of records) {
      // Find beneficiary
      const beneficiary = await db.resetBeneficiary.findFirst({
        where: { beneficiaryId: record.beneficiaryId },
      })

      if (!beneficiary) {
        failed++
        disbursementErrors.push({ beneficiaryId: record.beneficiaryId, error: 'Beneficiary not found' })
        continue
      }

      // Check for duplicate (already received cash in this batch period)
      const existing = await db.resetCashDisbursement.findFirst({
        where: { beneficiaryId: beneficiary.id, status: { in: ['PENDING', 'SENT', 'CONFIRMED'] } },
      })
      if (existing) {
        failed++
        disbursementErrors.push({ beneficiaryId: record.beneficiaryId, error: 'Duplicate — already has pending/active disbursement' })
        continue
      }

      // Create disbursement record
      await db.resetCashDisbursement.create({
        data: {
          batchId: batch.id,
          beneficiaryId: beneficiary.id,
          partner: record.partner,
          amount: record.amount,
          paymentMethod: record.paymentMethod,
          status: 'PENDING',
          initiatedBy: ctx.userId || 'admin',
        },
      })

      // Update beneficiary wallet
      await db.resetBeneficiary.update({
        where: { id: beneficiary.id },
        data: { walletBalance: { increment: record.amount } },
      })

      // Send SMS notification
      await sendSms(
        beneficiary.phone,
        `You have received UGX ${record.amount.toLocaleString()} from ${record.partner === 'SWISS_CONTACT' ? 'Swiss Contact' : record.partner} via ReSET MarketLink. Check your mobile money account. — MobiPay`
      ).catch(() => {})

      created++
    }

    // Update batch status
    await db.resetDisbursementBatch.update({
      where: { id: batch.id },
      data: {
        status: created > 0 ? 'COMPLETED' : 'FAILED',
        completedAt: new Date(),
      },
    })

    return NextResponse.json({
      batch,
      summary: {
        total: records.length,
        created,
        failed,
        totalAmount: records.slice(0, created).reduce((s, r) => s + r.amount, 0),
      },
      errors: [...errors, ...disbursementErrors],
    }, { status: 201 })
  } catch (error) {
    console.error('[reset/cash/batch POST]', error)
    return NextResponse.json({ error: 'Failed to process batch' }, { status: 500 })
  }
}
