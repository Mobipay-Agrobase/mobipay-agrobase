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

  // Pick only the allowed fields (avoid malicious updates)
  const {
    topic, description, date, location, trainerName,
    type, status, startTime, endTime, durationMinutes, expectedAttendees, materialsUsed, notes,
    groupId,
    // EKiBBO Training Feedback fields
    mainTopic, specificTopic, funder, findings, challenges, recommendations, attachmentUrls,
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
      ...(durationMinutes !== undefined && { durationMinutes: durationMinutes ? parseInt(durationMinutes) : null }),
      ...(expectedAttendees !== undefined && { expectedAttendees: expectedAttendees ? parseInt(expectedAttendees) : null }),
      ...(materialsUsed !== undefined && { materialsUsed }),
      ...(notes !== undefined && { notes }),
      ...(groupId !== undefined && { groupId }),
      // EKiBBO Training Feedback fields
      ...(mainTopic !== undefined && { mainTopic }),
      ...(specificTopic !== undefined && { specificTopic }),
      ...(funder !== undefined && { funder }),
      ...(findings !== undefined && { findings }),
      ...(challenges !== undefined && { challenges }),
      ...(recommendations !== undefined && { recommendations }),
      ...(attachmentUrls !== undefined && { attachmentUrls }),
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