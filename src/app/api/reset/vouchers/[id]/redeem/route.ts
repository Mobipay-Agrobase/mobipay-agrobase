import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const RedeemSchema = z.object({
  merchantId: z.string().min(1),
  pin: z.string().length(4),
  amount: z.number().positive().optional(),
  items: z.string().optional(),
}).strict()

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'reset:create')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id: voucherId } = await params
    const body = await req.json()
    let validated
    try { validated = RedeemSchema.parse(body) } catch (err: any) {
      return NextResponse.json({ error: 'Validation failed', fields: err.issues?.map((e: any) => ({ field: e.path.join('.'), message: e.message })) || [] }, { status: 400 })
    }

    const voucher = await db.resetVoucher.findUnique({ where: { id: voucherId }, include: { beneficiary: true } })
    if (!voucher) return NextResponse.json({ error: 'Voucher not found' }, { status: 404 })
    if (voucher.status !== 'ISSUED') return NextResponse.json({ error: `Voucher is ${voucher.status}` }, { status: 400 })
    if (new Date(voucher.expiryDate) < new Date()) return NextResponse.json({ error: 'Voucher expired' }, { status: 400 })

    // Verify PIN
    if (!voucher.beneficiary.pinHash) return NextResponse.json({ error: 'No PIN set' }, { status: 400 })
    const pinValid = await bcrypt.compare(validated.pin, voucher.beneficiary.pinHash)
    if (!pinValid) return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })

    // Verify merchant is approved
    const merchant = await db.resetMerchant.findUnique({ where: { id: validated.merchantId } })
    if (!merchant || merchant.status !== 'APPROVED') return NextResponse.json({ error: 'Merchant not approved' }, { status: 400 })

    // Check merchant restrictions
    if (voucher.allowedMerchants) {
      const allowed = JSON.parse(voucher.allowedMerchants) as string[]
      if (!allowed.includes(validated.merchantId)) return NextResponse.json({ error: 'Voucher not valid at this merchant' }, { status: 400 })
    }

    // Check location restrictions
    if (voucher.allowedLocations) {
      const allowed = JSON.parse(voucher.allowedLocations) as string[]
      if (!allowed.includes(merchant.settlement)) return NextResponse.json({ error: 'Voucher not valid in this location' }, { status: 400 })
    }

    const redemptionAmount = validated.amount || voucher.amount

    // Create redemption
    const redemption = await db.resetVoucherRedemption.create({
      data: {
        voucherId,
        beneficiaryId: voucher.beneficiaryId,
        merchantId: validated.merchantId,
        amount: redemptionAmount,
        items: validated.items,
        pinVerified: true,
        status: 'COMPLETED',
      },
    })

    // Update voucher
    await db.resetVoucher.update({ where: { id: voucherId }, data: { status: 'REDEEMED', redeemedAt: new Date(), redeemedAtMerchantId: validated.merchantId } })

    // Update beneficiary voucher balance
    await db.resetBeneficiary.update({ where: { id: voucher.beneficiaryId }, data: { voucherBalance: { decrement: redemptionAmount } } })

    // Update merchant payout amount
    await db.resetMerchant.update({ where: { id: validated.merchantId }, data: { payoutAmount: { increment: redemptionAmount } } })

    return NextResponse.json({ redemption, message: 'Voucher redeemed successfully. Merchant will be paid in next weekly payout.' })
  } catch (error) {
    console.error('[reset/vouchers/redeem]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
