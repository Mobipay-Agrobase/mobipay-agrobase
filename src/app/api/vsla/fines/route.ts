import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Refs, postJournalEntry, VSLA_TRANSACTION_TYPES, writeAuditLog } from '@/lib/vsla-engine';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const groupId = url.searchParams.get('groupId');
  const status = url.searchParams.get('status');
  const where: Record<string, unknown> = {};
  if (groupId) where.groupId = groupId;
  if (status) where.status = status;

  const fines = await db.vslaFine.findMany({
    where,
    include: { member: { select: { fullName: true, memberId: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ fines });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { groupId, memberId, amount: amountRaw, fineType, description, meetingId, useGroupSchedule = false } = body;

  if (!groupId || !fineType) {
    return NextResponse.json({ error: 'groupId, fineType required' }, { status: 400 });
  }

  const group = await db.vslaGroup.findUnique({ where: { id: groupId } });
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

  // Determine amount — if useGroupSchedule=true, look up the group's configured fine for this type
  let amount = amountRaw;
  if (useGroupSchedule || !amount) {
    switch (fineType) {
      case 'LATE_ATTENDANCE':
        amount = group.lateAttendanceFine;
        break;
      case 'ABSENCE':
        amount = group.absenceFine;
        break;
      case 'LATE_REPAYMENT':
        amount = group.lateRepaymentFine;
        break;
      default:
        // For OTHER fine type, amount must be provided
        if (!amount) {
          return NextResponse.json({
            error: `Amount required for fine type ${fineType}. Group has no default configured.`,
          }, { status: 400 });
        }
    }
  }

  if (!amount || amount <= 0) {
    return NextResponse.json({
      error: `Fine amount is 0 or not configured for type ${fineType}. Update group fine schedule or provide amount.`,
    }, { status: 400 });
  }

  const transactionRef = Refs.fine();
  const fine = await db.vslaFine.create({
    data: {
      groupId, memberId, amount, fineType, description, meetingId,
      status: 'OUTSTANDING',
      transactionRef,
    },
  });

  await writeAuditLog({
    tenantId: group.tenantId,
    action: 'CREATE',
    entityType: 'VslaFine',
    entityId: fine.id,
    description: `Fine ${amount} UGX (${fineType}) — ${description || 'auto from group schedule'}`,
    metadata: { groupId, memberId, amount, fineType, useGroupSchedule },
  });

  return NextResponse.json({ fine }, { status: 201 });
}

// PATCH — pay or waive a fine
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { fineId, action, paymentMethod = 'CASH' } = body;

  const fine = await db.vslaFine.findUnique({ where: { id: fineId }, include: { group: true } });
  if (!fine) return NextResponse.json({ error: 'Fine not found' }, { status: 404 });

  if (action === 'pay') {
    const updated = await db.$transaction(async (tx) => {
      const f = await tx.vslaFine.update({
        where: { id: fineId },
        data: { status: 'PAID', paidAt: new Date(), paymentMethod },
      });
      await tx.vslaTransaction.create({
        data: {
          groupId: fine.groupId,
          type: VSLA_TRANSACTION_TYPES.FINE,
          amount: fine.amount,
          transactionRef: fine.transactionRef,
          refType: 'FINE',
          refId: f.id,
          memberId: fine.memberId,
        },
      });
      return f;
    });

    await postJournalEntry({
      groupId: fine.groupId,
      description: `Fine paid (${fine.amount} UGX — ${fine.fineType})`,
      refType: 'FINE',
      refId: fineId,
      transactionId: fine.transactionRef,
      lines: [
        { accountCode: paymentMethod === 'MOBILE_MONEY' ? '1100' : '1000', debit: fine.amount },
        { accountCode: '4100', credit: fine.amount },
      ],
    });

    return NextResponse.json({ fine: updated });
  }

  if (action === 'waive') {
    const updated = await db.vslaFine.update({
      where: { id: fineId },
      data: { status: 'WAIVED' },
    });
    return NextResponse.json({ fine: updated });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
