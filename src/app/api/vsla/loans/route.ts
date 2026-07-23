import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateLoan, calculateMaxLoan, Refs, postJournalEntry, VSLA_TRANSACTION_TYPES, VSLA_LOAN_STATUS, writeAuditLog } from '@/lib/vsla-engine';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const groupId = url.searchParams.get('groupId');
  const status = url.searchParams.get('status');
  const memberId = url.searchParams.get('memberId');

  const where: Record<string, unknown> = {};
  if (groupId) where.groupId = groupId;
  if (status) where.status = status;
  if (memberId) where.memberId = memberId;

  const loans = await db.vslaLoan.findMany({
    where,
    include: {
      member: { select: { fullName: true, memberId: true, phone: true } },
      product: { select: { name: true, code: true } },
      guarantors: { include: { member: { select: { fullName: true, memberId: true } } } },
      repayments: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ loans });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    groupId, memberId, productId, amount, purpose,
    termDays: termDaysOverride,
    appliedByName = 'Member', interestRateOverride,
  } = body;

  if (!groupId || !memberId || !amount || !purpose) {
    return NextResponse.json({ error: 'groupId, memberId, amount, purpose required' }, { status: 400 });
  }

  const group = await db.vslaGroup.findUnique({ where: { id: groupId } });
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

  // Determine interest rate — loan product overrides group default
  let interestRate = group.loanInterestRate;
  let termDays = termDaysOverride ?? group.defaultLoanTermDays;
  let gracePeriodDays = group.gracePeriodDays;
  let product = null;
  if (productId) {
    product = await db.vslaLoanProduct.findUnique({ where: { id: productId } });
    if (product && product.groupId === groupId) {
      interestRate = product.interestRate;
      termDays = termDaysOverride ?? product.termDays;
      gracePeriodDays = product.gracePeriodDays ?? group.gracePeriodDays;
      // Enforce product min/max amount
      if (product.minAmount > 0 && amount < product.minAmount) {
        return NextResponse.json({
          error: `Amount below product minimum (${product.name}: ${product.minAmount} UGX)`,
        }, { status: 400 });
      }
      if (product.maxAmount > 0 && amount > product.maxAmount) {
        return NextResponse.json({
          error: `Amount exceeds product cap (${product.name}: ${product.maxAmount} UGX)`,
        }, { status: 400 });
      }
    }
  }
  if (interestRateOverride !== undefined) interestRate = interestRateOverride;

  // Check max loan eligibility based on group's multiplier
  const memberSavings = await db.vslaSaving.aggregate({
    where: { memberId, status: 'COMPLETED' },
    _sum: { amount: true },
  });
  const memberWithdrawals = await db.vslaSavingWithdrawal.aggregate({
    where: { memberId, status: { in: ['COMPLETED', 'APPROVED'] } },
    _sum: { amount: true },
  });
  const netSavings = (memberSavings._sum.amount ?? 0) - (memberWithdrawals._sum.amount ?? 0);
  const maxEligible = calculateMaxLoan(netSavings, group.maxLoanMultiplier);

  if (amount > maxEligible) {
    return NextResponse.json({
      error: `Amount exceeds eligibility. Max: ${maxEligible} (savings ${netSavings} × multiplier ${group.maxLoanMultiplier})`,
    }, { status: 400 });
  }

  // Use per-group config for loan calculation
  const calc = calculateLoan(
    amount,
    interestRate,
    termDays,
    new Date(),
    group.lateRepaymentPenaltyRate
  );

  // Apply grace period to expected repayment date
  const expectedRepaymentDate = new Date(calc.expectedRepaymentDate);
  expectedRepaymentDate.setDate(expectedRepaymentDate.getDate() + gracePeriodDays);

  const transactionRef = Refs.loan();

  const loan = await db.$transaction(async (tx) => {
    const l = await tx.vslaLoan.create({
      data: {
        groupId, memberId, productId,
        amount,
        interestRate,
        interestAmount: calc.interestAmount,
        totalRepayable: calc.totalRepayable,
        amountRepaid: 0,
        outstanding: calc.totalRepayable,
        purpose,
        termDays,
        gracePeriodDays,
        applicationDate: new Date(),
        expectedRepaymentDate,
        status: VSLA_LOAN_STATUS.PENDING,
        transactionRef,
      },
    });
    return l;
  });

  await writeAuditLog({
    tenantId: group.tenantId,
    actorName: appliedByName,
    action: 'APPLY',
    entityType: 'VslaLoan',
    entityId: loan.id,
    description: `Loan application: ${amount} UGX for "${purpose}" (rate ${interestRate}%, term ${termDays}d, grace ${gracePeriodDays}d)`,
    metadata: { groupId, memberId, amount, interestRate, termDays, maxEligible, gracePeriodDays, productId },
  });

  return NextResponse.json({ loan }, { status: 201 });
}
