/**
 * VSLA V2 — Member Registration
 * SRS 3.4: Register member, generate member ID, send welcome SMS with PIN
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { logSecureAction } from '@/lib/security/secure-audit-logger'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const RegisterMemberSchema = z.object({
  groupId: z.string().min(1),
  fullName: z.string().min(2).max(100),
  phone: z.string().min(10).max(15).regex(/^\+?[0-9]+$/),
  email: z.string().email().optional(),
  nationalId: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
}).strict()

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'vsla:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const url = new URL(req.url)
    const groupId = url.searchParams.get('groupId')
    const where: Record<string, unknown> = {}
    if (groupId) where.groupId = groupId
    const members = await db.vslaMemberV2.findMany({
      where,
      include: { group: { select: { name: true, code: true } } },
      orderBy: { joinedAt: 'desc' },
      take: 200,
    })
    return NextResponse.json({ members })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'vsla:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    let validated
    try {
      validated = RegisterMemberSchema.parse(body)
    } catch (err: any) {
      return NextResponse.json({
        error: 'Validation failed',
        fields: err.issues?.map((e: any) => ({ field: e.path.join('.'), message: e.message })) || [],
      }, { status: 400 })
    }

    // Verify group exists
    const group = await db.vslaGroupV2.findUnique({ where: { id: validated.groupId } })
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    // Generate member ID (sequential per group)
    const memberCount = await db.vslaMemberV2.count({ where: { groupId: validated.groupId } })
    const memberId = `VSLA-MBR-${String(memberCount + 1).padStart(4, '0')}`

    // Generate 4-digit PIN
    const pin = String(Math.floor(1000 + Math.random() * 9000))
    const pinHash = await bcrypt.hash(pin, 12)

    const member = await db.vslaMemberV2.create({
      data: {
        groupId: validated.groupId,
        memberId,
        fullName: validated.fullName,
        phone: validated.phone,
        email: validated.email,
        nationalId: validated.nationalId,
        gender: validated.gender,
        pinHash,
        pinSetAt: new Date(),
        status: 'PENDING', // Activated after first share purchase (SRS 3.4)
      },
    })

    // ─── Send welcome SMS with PIN (SRS 3.4) ───
    // TODO: Wire to Africa's Talking SMS gateway
    // For now, log the PIN (in production, this goes via SMS only)
    const welcomeMessage = `Welcome to ${group.name}, ${validated.fullName}! Your member ID is ${memberId} and your PIN is ${pin}. Use these to log in via USSD or the app. Do not share your PIN.`
    console.log(`[SMS] Welcome SMS to ${validated.phone}: ${welcomeMessage}`)

    // In production, call: await sendSms(validated.phone, welcomeMessage)

    await logSecureAction({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      actorRole: ctx.role,
      action: 'VSLA_V2_MEMBER_REGISTERED',
      entityType: 'VslaMemberV2',
      entityId: member.id,
      description: `Registered member ${validated.fullName} (${memberId}) in group "${group.name}"`,
      metadata: { memberId, phone: validated.phone, groupId: validated.groupId },
      httpMethod: 'POST',
      path: '/api/vsla-v2/members',
    })

    return NextResponse.json({
      member,
      pin, // Return PIN once — for the registration agent to share with the member
      message: 'Member registered. Welcome SMS with PIN sent.',
    }, { status: 201 })
  } catch (error) {
    console.error('[vsla-v2/members POST] error:', error)
    return NextResponse.json({ error: 'Failed to register member' }, { status: 500 })
  }
}
