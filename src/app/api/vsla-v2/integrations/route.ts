/**
 * VSLA V2 — Cross-Module Integration API
 * ──────────────────────────────────────
 * Other modules call this to record transactions in the VSLA cashbox.
 * 
 * POST /api/vsla-v2/integrations — record an integration transaction
 * GET  /api/vsla-v2/integrations — list integration transactions
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { recordVslaIntegration, getTenantIntegrations, type IntegrationType } from '@/lib/vsla-v2/integrations'
import { z } from 'zod'

const IntegrationSchema = z.object({
  groupId: z.string().min(1),
  type: z.enum([
    'INPUT_PURCHASE', 'PRODUCT_SALE', 'MARKETPLACE_SALE',
    'INSURANCE_PREMIUM', 'INSURANCE_CLAIM',
    'NSSF_CONTRIBUTION', 'CARBON_CREDIT',
    'MFI_LOAN_DISBURSEMENT', 'MFI_LOAN_REPAYMENT',
  ]),
  amount: z.number().positive(),
  memberId: z.string().optional(),
  refType: z.string().optional(),
  refId: z.string().optional(),
  description: z.string().min(5).max(500),
  recordedByName: z.string().min(2),
}).strict()

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'vsla:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    let validated
    try {
      validated = IntegrationSchema.parse(body)
    } catch (err: any) {
      return NextResponse.json({
        error: 'Validation failed',
        fields: err.issues?.map((e: any) => ({ field: e.path.join('.'), message: e.message })) || [],
      }, { status: 400 })
    }

    const result = await recordVslaIntegration({
      ...validated,
      recordedById: ctx.userId,
      tenantId: ctx.tenantId,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('[vsla-v2/integrations POST] error:', error)
    return NextResponse.json({ error: error.message || 'Failed to record integration' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'vsla:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')

    const scope = ctx.isSuperAdmin ? [] : ctx.tenantScope
    let entries

    if (ctx.isSuperAdmin) {
      // Super admin — get all
      entries = await db.vslaCashboxEntryV2.findMany({
        where: { description: { contains: 'INT-' } },
        include: { group: { select: { name: true, district: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
    } else {
      entries = await getTenantIntegrations(scope, limit)
    }

    // Summary by type
    const summary: Record<string, { count: number; totalIn: number; totalOut: number }> = {}
    for (const entry of entries) {
      const typeMatch = entry.description.match(/INT-(\w+)/)
      const type = typeMatch ? typeMatch[1] : 'OTHER'
      if (!summary[type]) summary[type] = { count: 0, totalIn: 0, totalOut: 0 }
      summary[type].count++
      if (entry.balanceAfter > entry.balanceBefore) {
        summary[type].totalIn += entry.amount
      } else {
        summary[type].totalOut += entry.amount
      }
    }

    return NextResponse.json({ entries, summary })
  } catch (error) {
    console.error('[vsla-v2/integrations GET] error:', error)
    return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 })
  }
}
