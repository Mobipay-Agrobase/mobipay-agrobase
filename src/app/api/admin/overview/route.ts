import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/overview — platform-wide stats for the unified admin
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');

  const tenantFilter = tenantId ? { tenantId } : {};

  const [
    tenants,
    totalUsers,
    vslaGroups,
    vslaMembers,
    vslaLoans,
    vslaSavings,
    nssfContributions,
    payments,
    smsLogs,
    ussdSessions,
    partners,
    auditLogs,
  ] = await Promise.all([
    db.tenant.count(),
    db.user.count(),
    db.vslaGroup.count({ where: tenantId ? { tenantId } : {} }),
    db.vslaMember.count(),
    db.vslaLoan.count({ where: tenantId ? { tenantId } : {} }),
    db.vslaSaving.count(),
    db.nssfContribution.count({ where: tenantFilter }),
    db.payment.count({ where: tenantFilter }),
    db.smsLog.count(),
    db.ussdSession.count(),
    db.partner.count(),
    db.auditLog.count({ where: tenantFilter }),
  ]);

  // Aggregations
  const [
    totalSavingsAmount,
    outstandingLoansAmount,
    disbursedLoansAmount,
    nssfTotalAmount,
    paymentsTotalAmount,
    activeLoans,
    pendingLoans,
    overdueLoans,
    smsSent,
    smsFailed,
    paymentsSuccessful,
    paymentsPending,
  ] = await Promise.all([
    db.vslaSaving.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
    db.vslaLoan.aggregate({ where: { status: { in: ['DISBURSED', 'OVERDUE'] } }, _sum: { outstanding: true } }),
    db.vslaLoan.aggregate({ where: { status: { in: ['DISBURSED', 'REPAID', 'OVERDUE', 'WRITTEN_OFF'] } }, _sum: { amount: true } }),
    db.nssfContribution.aggregate({ where: tenantFilter, _sum: { amount: true } }),
    db.payment.aggregate({ where: tenantFilter, _sum: { amount: true } }),
    db.vslaLoan.count({ where: { status: { in: ['DISBURSED', 'OVERDUE'] } } }),
    db.vslaLoan.count({ where: { status: 'PENDING' } }),
    db.vslaLoan.count({ where: { status: 'OVERDUE' } }),
    db.smsLog.count({ where: { status: { in: ['SENT', 'DELIVERED'] } } }),
    db.smsLog.count({ where: { status: 'FAILED' } }),
    db.payment.count({ where: { status: 'SUCCESS' } }),
    db.payment.count({ where: { status: 'PENDING' } }),
  ]);

  // Per-module usage (so the admin can see which modules are actually used)
  const moduleUsage = {
    VSLA: { groups: vslaGroups, members: vslaMembers, loans: vslaLoans, savings: vslaSavings },
    NSSF: { contributions: nssfContributions, totalAmount: nssfTotalAmount._sum.amount ?? 0 },
    PAYMENTS: { total: payments, successful: paymentsSuccessful, pending: paymentsPending, totalAmount: paymentsTotalAmount._sum.amount ?? 0 },
    SMS: { total: smsLogs, sent: smsSent, failed: smsFailed },
    USSD: { sessions: ussdSessions },
    PARTNERS: { count: partners },
    AUDIT: { events: auditLogs },
  };

  return NextResponse.json({
    counts: {
      tenants,
      users: totalUsers,
      vslaGroups,
      vslaMembers,
      vslaLoans,
      vslaSavings,
      nssfContributions,
      payments,
      smsLogs,
      ussdSessions,
      partners,
      auditLogs,
    },
    financials: {
      totalSavings: totalSavingsAmount._sum.amount ?? 0,
      outstandingLoans: outstandingLoansAmount._sum.outstanding ?? 0,
      disbursedLoans: disbursedLoansAmount._sum.amount ?? 0,
      nssfTotal: nssfTotalAmount._sum.amount ?? 0,
      paymentsTotal: paymentsTotalAmount._sum.amount ?? 0,
    },
    loanPortfolio: {
      active: activeLoans,
      pending: pendingLoans,
      overdue: overdueLoans,
    },
    moduleUsage,
  });
}
