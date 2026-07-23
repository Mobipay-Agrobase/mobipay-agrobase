import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { postJournalEntry, VSLA_TRANSACTION_TYPES, VSLA_LOAN_STATUS, Refs, writeAuditLog } from '@/lib/vsla-engine';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { amount, paymentMethod = 'CASH', mobileMoneyRef, repaidOnBehalfOf, notes, recordedByName = 'Treasurer' } = body;

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'amount required' }, { status: 400 });
  }

  const loan = await db.vslaLoan.findUnique({
    where: { id },
    include: { group: true, member: true },
  });
  if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 });

  if (loan.status !== VSLA_LOAN_STATUS.DESBURSED && loan.status !== VSLA_LOAN_STATUS.OVERDUE) {
    return NextResponse.json({ error: `Cannot repay loan in ${loan.status} status` }, { status: 400 });
  }

  const transactionRef = Refs.repayment();
  const newAmountRepaid = loan.amountRepaid + amount;
  const newOutstanding = Math.max(0, loan.totalRepayable - newAmountRepaid);
  const isFullyRepaid = newAmountRepaid >= loan.totalRepayable;

  const repayment = await db.$transaction(async (tx) => {
    const r = await tx.vslaLoanRepayment.create({
      data: {
        loanId: id,
        amount,
        paymentMethod,
        mobileMoneyRef,
        transactionRef,
        repaidOnBehalfOf,
        notes,
      },
    });

    await tx.vslaLoan.update({
      where: { id },
      data: {
        amountRepaid: newAmountRepaid,
        outstanding: newOutstanding,
        status: isFullyRepaid ? VSLA_LOAN_STATUS.REPAID : loan.status,
        closedDate: isFullyRepaid ? new Date() : null,
      },
    });

    await tx.vslaTransaction.create({
      data: {
        groupId: loan.groupId,
        type: VSLA_TRANSACTION_TYPES.LOAN_REPAYMENT,
        amount,
        transactionRef,
        refType: 'REPAYMENT',
        refId: r.id,
        memberId: loan.memberId,
      },
    });

    return r;
  });

  // Post double-entry: Debit Cash/MoMo (+ interest portion to Interest Income), Credit Loans Receivable
  const principalPortion = Math.min(amount, loan.outstanding - loan.interestAmount);
  const interestPortion = Math.max(0, amount - principalPortion);

  await postJournalEntry({
    groupId: loan.groupId,
    description: `Loan repayment from ${loan.member.fullName} (${amount} UGX)`,
    refType: 'REPAYMENT',
    refId: repayment.id,
    transactionId: transactionRef,
    lines: [
      { accountCode: paymentMethod === 'MOBILE_MONEY' ? '1100' : '1000', debit: amount },
      { accountCode: '1200', credit: principalPortion },
      ...(interestPortion > 0 ? [{ accountCode: '4000', credit: interestPortion }] : []),
    ],
  });

  await writeAuditLog({
    tenantId: loan.group.tenantId,
    actorName: recordedByName,
    action: 'REPAY',
    entityType: 'VslaLoanRepayment',
    entityId: repayment.id,
    description: `Repayment of ${amount} UGX on loan ${loan.transactionRef}`,
    metadata: { loanId: id, amount, newOutstanding, isFullyRepaid },
  });

  return NextResponse.json({ repayment, loan: { ...loan, amountRepaid: newAmountRepaid, outstanding: newOutstanding, status: isFullyRepaid ? 'REPAID' : loan.status } });
}
