import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getTenantContext(req)
  const tf = buildTenantFilter(ctx, 'tenantId') as any

  const record = await db.training.findFirst({
    where: { id, ...tf },
    include: {
      _count: { select: { attendance: true } },
      group: { select: { id: true, name: true, groupCode: true, location: true } },
      attendance: {
        orderBy: { createdAt: 'asc' },
        include: { farmer: { select: { id: true, firstName: true, lastName: true, farmerCode: true, phone: true } } },
      },
    },
  })
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: record })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getTenantContext(req)
  const tf = buildTenantFilter(ctx, 'tenantId') as any
  const body = await req.json()

  const existing = await db.training.findFirst({ where: { id, ...tf } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Optional: validate the farmer group belongs to this tenant
  if (body.groupId !== undefined && body.groupId) {
    const group = await db.farmerGroup.findFirst({ where: { id: body.groupId, ...tf }, select: { id: true } })
    if (!group) return NextResponse.json({ error: 'Farmer group not found' }, { status: 400 })
  }

  // Pick only the allowed fields (avoid malicious updates)
  const {
    topic, description, date, location, trainerName,
    type, status, startTime, endTime, expectedAttendees, materialsUsed, notes,
    mainTopic, funder, groupId, durationMinutes,
    findings, challenges, recommendations,
  } = body

  const updated = await db.training.update({
    where: { id },
    data: {
      ...(topic !== undefined && { topic }),
      ...(description !== undefined && { description }),
      ...(date !== undefined && { date: date ? new Date(date) : undefined }),
      ...(location !== undefined && { location }),
      ...(trainerName !== undefined && { trainerName }),
      ...(type !== undefined && { type }),
      ...(status !== undefined && { status }),
      ...(startTime !== undefined && { startTime: startTime ? new Date(startTime) : null }),
      ...(endTime !== undefined && { endTime: endTime ? new Date(endTime) : null }),
      ...(expectedAttendees !== undefined && { expectedAttendees: expectedAttendees ? parseInt(expectedAttendees) : null }),
      ...(materialsUsed !== undefined && { materialsUsed }),
      ...(notes !== undefined && { notes }),
      // ─── EKIBBO extensions (Scheduling + Reporting) ───
      ...(mainTopic !== undefined && { mainTopic: mainTopic || null }),
      ...(funder !== undefined && { funder: funder || null }),
      ...(groupId !== undefined && { groupId: groupId || null }),
      ...(durationMinutes !== undefined && {
        durationMinutes: durationMinutes !== null && durationMinutes !== '' ? Number(durationMinutes) : null,
      }),
      ...(findings !== undefined && { findings: findings || null }),
      ...(challenges !== undefined && { challenges: challenges || null }),
      ...(recommendations !== undefined && { recommendations: recommendations || null }),
    },
  })
  return NextResponse.json({ data: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getTenantContext(req)
  const tf = buildTenantFilter(ctx, 'tenantId') as any

  const existing = await db.training.findFirst({ where: { id, ...tf } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.training.deleteMany({ where: { id, ...tf } })
  return NextResponse.json({ message: 'Deleted successfully' })
}