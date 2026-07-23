import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureGroupAccounts, getGroupStats, writeAuditLog } from '@/lib/vsla-engine';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await db.vslaGroup.findUnique({
    where: { id },
    include: {
      members: { orderBy: { joinedAt: 'asc' } },
      cycles: { orderBy: { startDate: 'desc' } },
      loanProducts: { where: { isActive: true } },
      officerRoles: { where: { status: 'ACTIVE' }, include: { member: true } },
      _count: { select: { savings: true, loans: true, meetings: true } },
    },
  });
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const stats = await getGroupStats(id);
  return NextResponse.json({ group, stats });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const allowedFields = [
    'name', 'region', 'district', 'description', 'shareValue', 'loanInterestRate',
    'maxLoanMultiplier', 'meetingFrequency', 'meetingDay', 'welfareContribution', 'status',
  ];
  const data: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (body[f] !== undefined) data[f] = body[f];
  }

  const group = await db.vslaGroup.update({ where: { id }, data });
  await writeAuditLog({
    tenantId: group.tenantId,
    action: 'UPDATE',
    entityType: 'VslaGroup',
    entityId: id,
    description: `Updated VSLA group "${group.name}"`,
    metadata: data,
  });
  return NextResponse.json({ group });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await db.vslaGroup.update({
    where: { id },
    data: { status: 'CLOSED', closedAt: new Date() },
  });
  await writeAuditLog({
    tenantId: group.tenantId,
    action: 'CLOSE',
    entityType: 'VslaGroup',
    entityId: id,
    description: `Closed VSLA group "${group.name}"`,
  });
  return NextResponse.json({ group });
}
