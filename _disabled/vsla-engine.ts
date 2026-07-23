// VSLA Engine — Centralized business logic for the VSLA module
// Fixes the live bugs found in audit:
//   1. Inconsistent share calc (/1000 vs /5000) — now uses group.shareValue everywhere
//   2. totalSavings was hardcoded to 0 — now computed from VslaSaving records
//   3. VslaTransaction was dead — now written by every VSLA operation
//   4. Double-entry ledger activated via VslaAccount + VslaJournalEntry

import { db } from '@/lib/db';

// ============================================================
// CONSTANTS
// ============================================================

export const VSLA_GROUP_STATUS = {
  ACTIVE: 'ACTIVE',
  DORMANT: 'DORMANT',
  CLOSED: 'CLOSED',
} as const;

export const VSLA_MEMBER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  EXITED: 'EXITED',
  DECEASED: 'DECEASED',
} as const;

export const VSLA_LOAN_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DISBURSED: 'DISBURSED',
  REPAID: 'REPAID',
  OVERDUE: 'OVERDUE',
  DEFAULTED: 'DEFAULTED',
  REJECTED: 'REJECTED',
  WRITTEN_OFF: 'WRITTEN_OFF',
} as const;

export const VSLA_TRANSACTION_TYPES = {
  SAVING: 'SAVING',
  WITHDRAWAL: 'WITHDRAWAL',
  LOAN_DISBURSEMENT: 'LOAN_DISBURSEMENT',
  LOAN_REPAYMENT: 'LOAN_REPAYMENT',
  SOCIAL_FUND_CONTRIBUTION: 'SOCIAL_FUND_CONTRIBUTION',
  SOCIAL_FUND_CLAIM: 'SOCIAL_FUND_CLAIM',
  FINE: 'FINE',
  INTEREST_EARNED: 'INTEREST_EARNED',
} as const;

// Chart of accounts — standard VSLA accounts per group
export const VSLA_CHART_OF_ACCOUNTS = [
  { code: '1000', name: 'Cash Box', type: 'ASSET' },
  { code: '1100', name: 'Mobile Money', type: 'ASSET' },
  { code: '1200', name: 'Loans Receivable', type: 'ASSET' },
  { code: '1300', name: 'Fines Receivable', type: 'ASSET' },
  { code: '2000', name: 'Members Savings', type: 'LIABILITY' },
  { code: '2100', name: 'Social Fund', type: 'LIABILITY' },
  { code: '2200', name: 'Accrued Interest Payable', type: 'LIABILITY' },
  { code: '3000', name: 'Group Capital', type: 'EQUITY' },
  { code: '4000', name: 'Interest Income', type: 'INCOME' },
  { code: '4100', name: 'Fines Income', type: 'INCOME' },
  { code: '5000', name: 'Bank Charges', type: 'EXPENSE' },
  { code: '5100', name: 'Operational Expenses', type: 'EXPENSE' },
] as const;

// ============================================================
// SHARE CALCULATION (FIXED — uses group.shareValue, not hardcoded)
// ============================================================

export function calculateShares(amount: number, shareValue: number): number {
  if (shareValue <= 0) return 0;
  return Math.floor(amount / shareValue);
}

export function calculateShareValue(totalSavings: number, totalShares: number): number {
  if (totalShares <= 0) return 0;
  return totalSavings / totalShares;
}

// ============================================================
// LOAN CALCULATIONS
// ============================================================

export interface LoanCalculation {
  amount: number;
  interestRate: number; // percentage
  termDays: number;
  interestAmount: number;
  totalRepayable: number;
  expectedRepaymentDate: Date;
  lateRepaymentPenalty: number; // estimated penalty if repaid 1 week late
}

export function calculateLoan(
  amount: number,
  interestRate: number,
  termDays: number = 90,
  startDate: Date = new Date(),
  lateRepaymentPenaltyRate: number = 0
): LoanCalculation {
  const interestAmount = (amount * interestRate) / 100;
  const totalRepayable = amount + interestAmount;
  const expectedRepaymentDate = new Date(startDate);
  expectedRepaymentDate.setDate(expectedRepaymentDate.getDate() + termDays);
  // Penalty estimate: 1 week late × penalty rate × outstanding
  const lateRepaymentPenalty = (totalRepayable * lateRepaymentPenaltyRate) / 100;
  return {
    amount,
    interestRate,
    termDays,
    interestAmount,
    totalRepayable,
    expectedRepaymentDate,
    lateRepaymentPenalty,
  };
}

// Maximum loan a member can take = multiplier × their net savings
export function calculateMaxLoan(memberSavings: number, maxLoanMultiplier: number): number {
  return memberSavings * maxLoanMultiplier;
}

// Calculate late repayment penalty based on days overdue
export function calculateLatePenalty(
  outstanding: number,
  daysOverdue: number,
  penaltyRatePerWeek: number
): number {
  if (daysOverdue <= 0 || penaltyRatePerWeek <= 0) return 0;
  const weeksOverdue = Math.ceil(daysOverdue / 7);
  return (outstanding * penaltyRatePerWeek * weeksOverdue) / 100;
}

// ============================================================
// SHARE-OUT CALCULATION (per-group config)
// ============================================================

export interface ShareOutCalculation {
  totalShares: number;
  totalSavings: number;
  interestEarned: number;
  finesCollected: number;
  grossTotal: number;
  reserveAmount: number;     // amount retained as group reserve
  distributableAmount: number; // amount distributed to members
  shareOutPerShare: number;  // distributable / totalShares
  reservePercentage: number;
  interestSplitPercentage: number;
}

export function calculateShareOut(params: {
  totalShares: number;
  totalSavings: number;
  interestEarned: number;
  finesCollected: number;
  reservePercentage: number;     // from group config
  interestSplitPercentage: number; // from group config (e.g. 100 = all interest distributed)
}): ShareOutCalculation {
  const { totalShares, totalSavings, interestEarned, finesCollected, reservePercentage, interestSplitPercentage } = params;
  // Distributable interest = interestEarned × (interestSplitPercentage / 100)
  const distributableInterest = (interestEarned * interestSplitPercentage) / 100;
  const grossTotal = totalSavings + distributableInterest + finesCollected;
  const reserveAmount = (grossTotal * reservePercentage) / 100;
  const distributableAmount = grossTotal - reserveAmount;
  const shareOutPerShare = totalShares > 0 ? distributableAmount / totalShares : 0;
  return {
    totalShares,
    totalSavings,
    interestEarned,
    finesCollected,
    grossTotal,
    reserveAmount,
    distributableAmount,
    shareOutPerShare,
    reservePercentage,
    interestSplitPercentage,
  };
}

// ============================================================
// AGGREGATIONS (FIXED — was hardcoded to 0)
// ============================================================

export async function getGroupSavingsTotal(groupId: string): Promise<number> {
  const result = await db.vslaSavingV3.aggregate({
    where: { groupId, status: 'COMPLETED' },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

export async function getGroupOutstandingLoans(groupId: string): Promise<number> {
  const loans = await db.vslaLoanV3.findMany({
    where: {
      groupId,
      status: { in: ['DISBURSED', 'OVERDUE'] },
    },
    select: { outstanding: true },
  });
  return loans.reduce((sum, l) => sum + l.outstanding, 0);
}

export async function getGroupSocialFundBalance(groupId: string): Promise<number> {
  const [contributions, claims] = await Promise.all([
    db.vslaSocialFundContributionV3.aggregate({
      where: { groupId },
      _sum: { amount: true },
    }),
    db.vslaSocialFundClaimV3.aggregate({
      where: { groupId, status: 'DISBURSED' },
      _sum: { amount: true },
    }),
  ]);
  return (contributions._sum.amount ?? 0) - (claims._sum.amount ?? 0);
}

export async function getGroupStats(groupId: string) {
  const [memberCount, savingsTotal, outstandingLoans, socialFundBalance, activeLoansCount, disbursedLoansTotal, totalRepayments] = await Promise.all([
    db.vslaMemberV3.count({ where: { groupId, status: 'ACTIVE' } }),
    getGroupSavingsTotal(groupId),
    getGroupOutstandingLoans(groupId),
    getGroupSocialFundBalance(groupId),
    db.vslaLoanV3.count({ where: { groupId, status: { in: ['DISBURSED', 'OVERDUE'] } } }),
    db.vslaLoanV3.aggregate({
      where: { groupId, status: { in: ['DISBURSED', 'REPAID', 'OVERDUE'] } },
      _sum: { amount: true },
    }),
    db.vslaLoanRepaymentV3.aggregate({
      where: { loan: { groupId } },
      _sum: { amount: true },
    }),
  ]);

  return {
    memberCount,
    savingsTotal,
    outstandingLoans,
    socialFundBalance,
    activeLoansCount,
    disbursedLoansTotal: disbursedLoansTotal._sum.amount ?? 0,
    totalRepayments: totalRepayments._sum.amount ?? 0,
  };
}

// ============================================================
// DOUBLE-ENTRY LEDGER
// ============================================================

export async function ensureGroupAccounts(groupId: string): Promise<void> {
  const existing = await db.vslaAccountV3.findMany({ where: { groupId } });
  if (existing.length > 0) return;

  await db.vslaAccountV3.createMany({
    data: VSLA_CHART_OF_ACCOUNTS.map((acc) => ({
      groupId,
      code: acc.code,
      name: acc.name,
      type: acc.type,
    })),
  });
}

export async function postJournalEntry(params: {
  groupId: string;
  description: string;
  refType?: string;
  refId?: string;
  transactionId?: string;
  lines: Array<{ accountCode: string; debit?: number; credit?: number }>;
}): Promise<void> {
  const { groupId, description, refType, refId, transactionId, lines } = params;

  for (const line of lines) {
    const account = await db.vslaAccountV3.findUnique({
      where: { groupId_code: { groupId, code: line.accountCode } },
    });
    if (!account) continue;

    const debit = line.debit ?? 0;
    const credit = line.credit ?? 0;

    await db.vslaJournalEntryV3.create({
      data: {
        groupId,
        accountId: account.id,
        transactionId: transactionId ?? `TXN-${Date.now()}`,
        description,
        debit,
        credit,
        refType,
        refId,
      },
    });

    // Update account balance — for ASSET/EXPENSE, debit increases; for LIABILITY/EQUITY/INCOME, credit increases
    const isDebitNormal = account.type === 'ASSET' || account.type === 'EXPENSE';
    const delta = isDebitNormal ? (debit - credit) : (credit - debit);
    await db.vslaAccountV3.update({
      where: { id: account.id },
      data: { balance: account.balance + delta },
    });
  }
}

// ============================================================
// TRANSACTION REF GENERATORS
// ============================================================

export function genRef(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export const Refs = {
  saving: () => genRef('SAV'),
  withdrawal: () => genRef('WD'),
  loan: () => genRef('LOAN'),
  repayment: () => genRef('RPY'),
  socialFundContribution: () => genRef('SF'),
  socialFundClaim: () => genRef('SFC'),
  fine: () => genRef('FINE'),
  payment: () => genRef('PAY'),
  nssf: () => genRef('NSSF'),
};

// ============================================================
// AGING REPORT BUCKETS
// ============================================================

export function getAgingBucket(dueDate: Date, asOf: Date = new Date()): string {
  const daysOverdue = Math.floor((asOf.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysOverdue <= 0) return 'CURRENT';
  if (daysOverdue <= 30) return '1-30';
  if (daysOverdue <= 60) return '31-60';
  if (daysOverdue <= 90) return '61-90';
  if (daysOverdue <= 180) return '91-180';
  return '180+';
}

// ============================================================
// AUDIT LOG HELPER
// ============================================================

export async function writeAuditLogV3(params: {
  tenantId?: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  await db.platformAuditLog.create({
    data: {
      tenantId: params.tenantId,
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      description: params.description,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      ipAddress: params.ipAddress,
    },
  });
}
