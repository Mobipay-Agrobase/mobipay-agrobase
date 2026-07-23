import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { postJournalEntry, VSLA_LOAN_STATUS, VSLA_TRANSACTION_TYPES, Refs, writeAuditLogV3 } from '@/lib/vsla-engine';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loan = await db.vslaLoanV3.findUnique({
    where: { id },
    include: {
      member: true,
      group: true,
      product: true,
      guarantors: { include: { member: true } },
      repayments: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!loan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ loan });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { action, approvedByName = 'Officer', rejectionReason, disbursementMethod, mobileMoneyRef } = body;

  const loan = await db.vslaLoanV3.findUnique({
    where: { id },
    include: { group: true, member: true },
  });
  if (!loan) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let updateData: Record<string, unknown> = {};
  let auditAction = 'UPDATE';

  if (action === 'approve') {
    updateData = {
      status: VSLA_LOAN_STATUS.APPROVED,
      approvalDate: new Date(),
      approvedByName,
    };
    auditAction = 'APPROVE';
  } else if (action === 'reject') {
    updateData = {
      status: VSLA_LOAN_STATUS.REJECTED,
      rejectionReason,
    };
    auditAction = 'REJECT';
  } else if (action === 'disburse') {
    updateData = {
      status: VSLA_LOAN_STATUS.DESBURSED,
      disbursementDate: new Date(),
      disbursementMethod: disbursementMethod || 'CASH',
      mobileMoneyRef,
      disbursedById: approvedByName,
    };
    auditAction = 'DISBURSE';

    // Post double-entry: Debit Loans Receivable, Credit Cash/MoMo
    await postJournalEntry({
      groupId: loan.groupId,
      description: `Loan disbursement to ${loan.member.fullName} (${loan.amount} UGX)`,
      refType: 'LOAN',
      refId: loan.id,
      transactionId: loan.transactionRef,
      lines: [
        { accountCode: '1200', debit: loan.amount },
        { accountCode: disbursementMethod === 'MOBILE_MONEY' ? '1100' : '1000', credit: loan.amount },
      ],
    });

    // Write master ledger
    await db.vslaTransactionV3.create({
      data: {
        groupId: loan.groupId,
        type: VSLA_TRANSACTION_TYPES.LOAN_DISBURSEMENT,
        amount: loan.amount,
        transactionRef: Refs.loan(),
        refType: 'LOAN',
        refId: loan.id,
        memberId: loan.memberId,
      },
    });
  } else if (action === 'writeoff') {
    updateData = {
      status: VSLA_LOAN_STATUS.WRITTEN_OFF,
      closedDate: new Date(),
    };
    auditAction = 'WRITE_OFF';
  } else {
    // Generic update
    const allowed = ['purpose', 'termDays'];
    for (const f of allowed) if (body[f] !== undefined) updateData[f] = body[f];
  }

  const updated = await db.vslaLoanV3.update({ where: { id }, data: updateData });

  await writeAuditLogV3({
    tenantId: loan.group.tenantId,
    actorName: approvedByName,
    action: auditAction,
    entityType: 'VslaLoan',
    entityId: id,
    description: `Loan ${auditAction.toLowerCase()} — ${loan.amount} UGX to ${loan.member.fullName}`,
    metadata: { action, amount: loan.amount, status: updateData.status },
  });

  return NextResponse.json({ loan: updated });
}
