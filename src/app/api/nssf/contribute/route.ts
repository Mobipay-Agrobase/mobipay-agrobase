/**
 * POST /api/nssf/contribute
 * Make an NSSF voluntary savings contribution.
 * Uses Zod validation + audit logging.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { db } from '@/lib/db'
import { logAction, logPaymentAction } from '@/lib/security/audit-logger'
import { sendContributionConfirmationSms, sendActivationSms } from '@/lib/nssf/notifications'
import { z } from 'zod'

const contributeSchema = z.object({
  registrationId: z.string().min(1, 'Registration ID is required'),
  amount: z.number().min(1000, 'Minimum contribution is UGX 1,000'),
  paymentMethod: z.enum(['MTN_MOMO', 'AIRTEL_MONEY', 'CARD', 'BANK_TRANSFER', 'CASH']),
  paymentReference: z.string().optional(),
  channel: z.enum(['WEB', 'MOBILE', 'USSD', 'FIELD_OFFICER']).default('WEB'),
})

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'nssf:contribute')) {
      return NextResponse.json({ error: 'NSSF contribution access required' }, { status: 403 })
    }

    const body = await request.json()
    const validated = contributeSchema.parse(body)

    // Verify registration exists and is activated
    const registration = await db.nssfRegistration.findFirst({
      where: {
        id: validated.registrationId,
        ...buildTenantFilter(ctx, 'tenantId'),
      },
    })

    if (!registration) {
      return NextResponse.json({ error: 'NSSF registration not found' }, { status: 404 })
    }

    if (registration.activationStatus !== 'ACTIVATED' && registration.activationStatus !== 'VERIFIED') {
      return NextResponse.json({ error: 'Farmer NSSF registration is not yet activated. Please complete verification first.' }, { status: 400 })
    }

    // Create contribution record
    const contribution = await db.nssfContribution.create({
      data: {
        tenantId: ctx.tenantId,
        registrationId: validated.registrationId,
        farmerId: registration.farmerId,
        amount: validated.amount,
        currency: 'UGX',
        paymentMethod: validated.paymentMethod,
        paymentReference: validated.paymentReference || null,
        paymentProvider: validated.paymentMethod === 'MTN_MOMO' ? 'MTN_DIRECT' :
                         validated.paymentMethod === 'AIRTEL_MONEY' ? 'AIRTEL_DIRECT' : 'FLUTTERWAVE',
        status: 'PENDING',
        initiatedById: ctx.userId,
        channel: validated.channel,
      },
    })

    // Audit log
    await logPaymentAction({
      userId: ctx.userId,
      tenantId: ctx.tenantId,
      action: 'NSSF_CONTRIBUTION_INITIATED',
      entityType: 'NssfContribution',
      entityId: contribution.id,
      after: { amount: validated.amount, farmerId: registration.farmerId, paymentMethod: validated.paymentMethod },
      ipAddress: request.headers.get('x-forwarded-for') || '',
    })

    // ─── AUTO-ACTIVATION: If this is the first contribution, mark farmer as ACTIVATED ───
    // Per NSSF document Step 2: first deposit activates the account
    // For now, we mark the contribution as COMPLETED (assuming MoMo will succeed)
    // When Joel provides real MTN/Airtel integration, we wait for payment callback before COMPLETED
    await db.nssfContribution.update({
      where: { id: contribution.id },
      data: { 
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    })

    // Check if this is the farmer's first contribution
    const contributionCount = await db.nssfContribution.count({
      where: { farmerId: registration.farmerId, status: 'COMPLETED' },
    })

    if (contributionCount === 1) {
      // First contribution — activate the farmer's NSSF account
      await db.farmerProfile.update({
        where: { id: registration.farmerId },
        data: {
          nssfActivationStatus: 'ACTIVATED',
          nssfActivatedAt: new Date(),
        },
      })

      await logAction({
        userId: ctx.userId,
        tenantId: ctx.tenantId,
        action: 'NSSF_ACCOUNT_ACTIVATED',
        entityType: 'FarmerProfile',
        entityId: registration.farmerId,
        details: { firstContributionId: contribution.id, amount: validated.amount },
        ipAddress: request.headers.get('x-forwarded-for') || '',
      })
    }

    // Send SMS notifications (non-blocking)
    try {
      const farmer = await db.farmerProfile.findFirst({
        where: { id: registration.farmerId },
        select: { firstName: true, lastName: true, phone: true, nssfNumber: true },
      })

      if (farmer?.phone) {
        const farmerName = `${farmer.firstName} ${farmer.lastName}`
        const reference = contribution.id.slice(-8).toUpperCase()

        // Send contribution confirmation SMS
        await sendContributionConfirmationSms({
          phone: farmer.phone,
          farmerName,
          amount: validated.amount,
          reference,
        })

        // If first contribution, send activation SMS
        if (contributionCount === 1) {
          await sendActivationSms({
            phone: farmer.phone,
            farmerName,
            nssfNumber: farmer.nssfNumber,
          })
        }
      }
    } catch (smsError) {
      console.error('[nssf/contribute] SMS error:', smsError)
      // Non-blocking — contribution still succeeds
    }

    return NextResponse.json({ 
      data: contribution,
      activated: contributionCount === 1,
      message: contributionCount === 1 
        ? 'First contribution received. NSSF account activated.' 
        : 'Contribution received.',
    }, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', fields: error.issues }, { status: 400 })
    }
    console.error('[nssf/contribute POST] error:', error)
    return NextResponse.json({ error: 'Failed to process contribution' }, { status: 500 })
  }
}
