import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { numericId } from '@/lib/mobile/ekibbo-adapter'
import { isMobileStaff } from '@/lib/mobile/ekibbo-mobile-utils'
import { hasPermission } from '@/lib/permissions'
import { generateBatchNumber } from '@/lib/processing-batch-number'

/**
 * Second review (L — Processing): mobile Processing module.
 *
 * GET /api/mobile/ekibbo-processing
 *   Tenant-scoped batch list (staff roles) in the upstream JSON shape:
 *   { result, data: { batches: [{ id, batch_number, input_commodity,
 *       process_type, output_product, input_quantity, input_unit,
 *       output_quantity, output_unit, quality_grade, quality_score,
 *       status, facility, start_date, end_date, notes }],
 *     summary: { total, pending, approved, in_progress, completed } } }
 *
 * POST /api/mobile/ekibbo-processing  (multipart or JSON)
 *   { batch_id, action: 'approve' | 'reject' | 'start' | 'complete', reason?,
 *     output_quantity?, output_unit?, quality_grade?, quality_score?, notes? }
 *   → same permission-gated state machine as the web
 *     (/api/processing/[id]/approve): PENDING→APPROVED/REJECTED→IN_PROGRESS→COMPLETED.
 *
 * POST /api/mobile/ekibbo-processing  (multipart or JSON, no batch_id/action)
 *   { input_commodity, process_type, output_product, input_quantity,
 *     input_unit?, facility, notes? } → creates a PENDING batch
 *   (requires processing:create).
 */
const TRANSITIONS: Record<string, { from: string[]; to: string; perm: string }> = {
  approve: { from: ['PENDING'], to: 'APPROVED', perm: 'processing:approve' },
  reject: { from: ['PENDING'], to: 'REJECTED', perm: 'processing:approve' },
  start: { from: ['APPROVED'], to: 'IN_PROGRESS', perm: 'processing:update' },
  complete: { from: ['IN_PROGRESS'], to: 'COMPLETED', perm: 'processing:update' },
}

function toRow(b: {
  id: string
  batchNumber: string
  inputCommodity: string
  processType: string
  outputProduct: string | null
  inputQuantity: number
  inputUnit: string
  outputQuantity: number | null
  outputUnit: string | null
  qualityGrade: string | null
  qualityScore: number | null
  status: string
  facility: string | null
  startDate: Date | null
  endDate: Date | null
  notes: string | null
}) {
  return {
    id: numericId(b.id),
    batch_number: b.batchNumber,
    input_commodity: b.inputCommodity,
    process_type: b.processType,
    output_product: b.outputProduct,
    input_quantity: Number(b.inputQuantity) || 0,
    input_unit: b.inputUnit || 'kg',
    output_quantity: b.outputQuantity == null ? 0 : Number(b.outputQuantity),
    output_unit: b.outputUnit ?? 'kg',
    quality_grade: b.qualityGrade ?? '',
    quality_score: b.qualityScore == null ? 0 : Number(b.qualityScore),
    status: b.status,
    facility: b.facility ?? '',
    start_date: b.startDate ? new Date(b.startDate).toISOString() : '',
    end_date: b.endDate ? new Date(b.endDate).toISOString() : null,
    notes: b.notes ?? '',
  }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    if (!isMobileStaff(ctx.role)) {
      return NextResponse.json({ result: false, message: 'Not authorized' }, { status: 403 })
    }
    const tf = buildTenantFilter(ctx, 'tenantId')

    const batches = await db.processingBatch.findMany({
      where: { ...tf },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    const rows = batches.map(toRow)
    return NextResponse.json({
      result: true,
      data: {
        batches: rows,
        summary: {
          total: rows.length,
          pending: rows.filter(r => r.status === 'PENDING').length,
          approved: rows.filter(r => r.status === 'APPROVED').length,
          in_progress: rows.filter(r => r.status === 'IN_PROGRESS').length,
          completed: rows.filter(r => r.status === 'COMPLETED').length,
        },
      },
    })
  } catch (error) {
    console.error('[ekibbo-processing GET]', error)
    return NextResponse.json({ result: false, message: 'Failed to load processing batches' }, { status: 500 })
  }
}

async function readBody(req: NextRequest): Promise<Record<string, any>> {
  const body: Record<string, any> = {}
  const ct = req.headers.get('content-type') || ''
  if (ct.includes('multipart/form-data')) {
    const form = await req.formData()
    for (const [k, v] of form.entries()) {
      if (typeof v === 'string') body[k] = v
    }
  } else {
    Object.assign(body, await req.json().catch(() => ({})))
  }
  return body
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    if (!isMobileStaff(ctx.role)) {
      return NextResponse.json({ result: false, message: 'Not authorized' }, { status: 403 })
    }
    const tf = buildTenantFilter(ctx, 'tenantId')
    const body = await readBody(req)

    const action = String(body.action || '').toLowerCase()

    // ── Branch 1: workflow action on an existing batch ──────────────────
    if (action) {
      const rule = TRANSITIONS[action]
      if (!rule) {
        return NextResponse.json({ result: false, message: 'action must be approve, reject, start or complete' }, { status: 400 })
      }
      if (!hasPermission(ctx.role || '', rule.perm as any)) {
        return NextResponse.json({ result: false, message: `Not authorized — requires ${rule.perm}` }, { status: 403 })
      }

      const batchNumId = parseInt(String(body.batch_id ?? ''), 10)
      if (Number.isNaN(batchNumId)) {
        return NextResponse.json({ result: false, message: 'batch_id is required' }, { status: 400 })
      }
      const all = await db.processingBatch.findMany({
        where: { ...tf },
        select: { id: true, status: true, notes: true },
        take: 5000,
      })
      const target = all.find(b => numericId(b.id) === batchNumId)
      if (!target) {
        return NextResponse.json({ result: false, message: 'Processing batch not found' }, { status: 404 })
      }
      if (!rule.from.includes(target.status)) {
        return NextResponse.json(
          { result: false, message: `Cannot ${action} a batch in status ${target.status}` },
          { status: 409 },
        )
      }

      const data: Record<string, unknown> = { status: rule.to }
      if (action === 'reject' && body.reason) {
        data.notes = [target.notes, `Rejection reason: ${String(body.reason).trim()}`].filter(Boolean).join(' · ')
      }
      if (action === 'start') data.startDate = new Date()
      if (action === 'complete') {
        const outputQuantity = Number(body.output_quantity)
        if (!Number.isFinite(outputQuantity) || outputQuantity <= 0) {
          return NextResponse.json(
            { result: false, message: 'output_quantity must be a positive number to complete' },
            { status: 400 },
          )
        }
        data.outputQuantity = outputQuantity
        data.endDate = new Date()
        if (body.output_unit) data.outputUnit = String(body.output_unit).trim()
        if (body.quality_grade) data.qualityGrade = String(body.quality_grade).trim()
        const qs = Number(body.quality_score)
        if (Number.isFinite(qs)) data.qualityScore = qs
        if (body.notes) data.notes = [target.notes, String(body.notes).trim()].filter(Boolean).join(' · ')
      }

      await db.processingBatch.update({ where: { id: target.id }, data })
      return NextResponse.json({ result: true, data: { id: batchNumId, status: rule.to } })
    }

    // ── Branch 2: create a new PENDING batch ────────────────────────────
    if (!hasPermission(ctx.role || '', 'processing:create')) {
      return NextResponse.json({ result: false, message: 'Not authorized — requires processing:create' }, { status: 403 })
    }
    const inputCommodity = String(body.input_commodity ?? '').trim()
    const processType = String(body.process_type ?? '').trim()
    const outputProduct = String(body.output_product ?? '').trim()
    const inputQuantity = Number(body.input_quantity)
    const facility = String(body.facility ?? '').trim()

    if (!inputCommodity || !processType || !outputProduct || !Number.isFinite(inputQuantity) || inputQuantity <= 0 || !facility) {
      return NextResponse.json(
        { result: false, message: 'input_commodity, process_type, output_product, input_quantity and facility are required' },
        { status: 400 },
      )
    }

    const batch = await db.processingBatch.create({
      data: {
        tenantId: ctx.tenantId,
        batchNumber: generateBatchNumber(),
        inputCommodity,
        processType,
        outputProduct,
        inputQuantity,
        inputUnit: String(body.input_unit || 'kg'),
        notes: body.notes ? String(body.notes).trim() : null,
        facility,
        status: 'PENDING',
      },
    })
    return NextResponse.json({ result: true, data: { id: numericId(batch.id) } }, { status: 201 })
  } catch (error) {
    console.error('[ekibbo-processing POST]', error)
    return NextResponse.json({ result: false, message: 'Failed to save processing batch' }, { status: 500 })
  }
}
