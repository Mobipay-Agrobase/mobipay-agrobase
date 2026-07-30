import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'

/**
 * GET /api/sacco/reports?saccoId=xxx&type=xxx
 *
 * Report types:
 *   - summary: KPI summary (members, total shares, total savings, outstanding loans, etc.)
 *   - members: Full member roster with shares + savings + loan balances
 *   - loans: Loan portfolio (outstanding, disbursed, repaid, defaulted)
 *   - shares: Share purchase history
 *   - financial-statement: Balance sheet style (assets = shares + savings, liabilities = loans outstanding)
 *
 * All reports support ?format=csv for Excel export.
 */

export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext(request)
    if (!hasPermission(ctx.role, 'sacco:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const saccoId = searchParams.get('saccoId')
    const reportType = searchParams.get('type') || 'summary'
    const format = searchParams.get('format') // 'csv' for Excel export

    if (!saccoId) {
      return NextResponse.json({ error: 'saccoId is required' }, { status: 400 })
    }

    const sacco = await db.sacco.findFirst({
      where: { id: saccoId, ...buildTenantFilter(ctx, 'tenantId') },
      include: {
        members: { orderBy: { joinedAt: 'desc' } },
        loans: { include: { repayments: true } },
        sharePurchases: { orderBy: { createdAt: 'desc' }, take: 100 },
      },
    })

    if (!sacco) {
      return NextResponse.json({ error: 'SACCO not found' }, { status: 404 })
    }

    let report: Record<string, unknown> = {}

    if (reportType === 'summary') {
      const totalShares = sacco.members.reduce((sum, m) => sum + m.sharesOwned, 0)
      const totalSavings = sacco.members.reduce((sum, m) => sum + m.totalSavings, 0)
      const totalDisbursed = sacco.loans
        .filter(l => ['DISBURSED', 'REPAID', 'DEFAULTED'].includes(l.status))
        .reduce((sum, l) => sum + l.principal, 0)
      const totalOutstanding = sacco.loans
        .filter(l => l.status === 'DISBURSED')
        .reduce((sum, l) => sum + (l.totalRepayable - l.amountRepaid), 0)
      const totalRepaid = sacco.loans.reduce((sum, l) => sum + l.amountRepaid, 0)
      const totalShareCapital = totalShares * sacco.shareValue

      report = {
        saccoName: sacco.name,
        district: sacco.district,
        generatedAt: new Date().toISOString(),
        kpis: {
          memberCount: sacco.members.length,
          totalShares,
          totalShareCapital,
          totalSavings,
          totalLoansDisbursed: totalDisbursed,
          totalLoansOutstanding: totalOutstanding,
          totalLoansRepaid: totalRepaid,
          activeLoans: sacco.loans.filter(l => l.status === 'DISBURSED').length,
          pendingLoans: sacco.loans.filter(l => l.status === 'PENDING').length,
          defaultedLoans: sacco.loans.filter(l => l.status === 'DEFAULTED').length,
        },
      }
    } else if (reportType === 'members') {
      report = {
        saccoName: sacco.name,
        generatedAt: new Date().toISOString(),
        members: sacco.members.map(m => ({
          memberNumber: m.memberNumber,
          fullName: m.fullName,
          phone: m.phone,
          gender: m.gender,
          occupation: m.occupation,
          sharesOwned: m.sharesOwned,
          shareValue: sacco.shareValue,
          totalShareCapital: m.sharesOwned * sacco.shareValue,
          totalSavings: m.totalSavings,
          totalBorrowed: m.totalBorrowed,
          totalRepaid: m.totalRepaid,
          status: m.status,
          joinedAt: m.joinedAt.toISOString(),
        })),
      }
    } else if (reportType === 'loans') {
      report = {
        saccoName: sacco.name,
        generatedAt: new Date().toISOString(),
        loans: sacco.loans.map(l => ({
          loanNumber: l.loanNumber,
          memberName: sacco.members.find(m => m.id === l.memberId)?.fullName || 'Unknown',
          principal: l.principal,
          interestRate: l.interestRate,
          interestAmount: l.interestAmount,
          totalRepayable: l.totalRepayable,
          amountRepaid: l.amountRepaid,
          outstanding: l.totalRepayable - l.amountRepaid,
          status: l.status,
          purpose: l.purpose,
          disbursedAt: l.disbursedAt?.toISOString() || null,
          dueDate: l.dueDate?.toISOString() || null,
        })),
      }
    } else if (reportType === 'financial-statement') {
      const totalShares = sacco.members.reduce((sum, m) => sum + m.sharesOwned, 0)
      const totalShareCapital = totalShares * sacco.shareValue
      const totalSavings = sacco.members.reduce((sum, m) => sum + m.totalSavings, 0)
      const totalOutstanding = sacco.loans
        .filter(l => l.status === 'DISBURSED')
        .reduce((sum, l) => sum + (l.totalRepayable - l.amountRepaid), 0)
      const totalRepaid = sacco.loans.reduce((sum, l) => sum + l.amountRepaid, 0)

      report = {
        saccoName: sacco.name,
        district: sacco.district,
        generatedAt: new Date().toISOString(),
        balanceSheet: {
          assets: {
            cashOnHand: totalSavings,
            loansOutstanding: totalOutstanding,
            totalAssets: totalSavings + totalOutstanding,
          },
          liabilities: {
            memberShares: totalShareCapital,
            memberSavings: totalSavings,
            totalLiabilities: totalShareCapital + totalSavings,
          },
          surplus: (totalSavings + totalOutstanding) - (totalShareCapital + totalSavings),
        },
        incomeStatement: {
          interestIncome: sacco.loans.reduce((sum, l) => sum + l.interestAmount, 0),
          totalIncome: sacco.loans.reduce((sum, l) => sum + l.interestAmount, 0),
        },
      }
    } else {
      return NextResponse.json({ error: `Unknown report type: ${reportType}. Use: summary, members, loans, financial-statement` }, { status: 400 })
    }

    // CSV export for Excel
    if (format === 'csv') {
      const csv = convertToCSV(report, reportType)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="sacco-${reportType}-${sacco.name.replace(/\s+/g, '-')}.csv"`,
        },
      })
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error('[sacco/reports GET]', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}

function convertToCSV(report: Record<string, unknown>, type: string): string {
  if (type === 'summary' && report.kpis) {
    const kpis = report.kpis as Record<string, number | string>
    const rows = [['Metric', 'Value']]
    for (const [key, value] of Object.entries(kpis)) {
      rows.push([key, String(value)])
    }
    return rows.map(r => r.join(',')).join('\n')
  }
  if (type === 'members' && report.members) {
    const members = report.members as Array<Record<string, unknown>>
    if (members.length === 0) return 'No members found'
    const headers = Object.keys(members[0])
    const rows = [headers, ...members.map(m => headers.map(h => String(m[h] ?? '')))]
    return rows.map(r => r.join(',')).join('\n')
  }
  if (type === 'loans' && report.loans) {
    const loans = report.loans as Array<Record<string, unknown>>
    if (loans.length === 0) return 'No loans found'
    const headers = Object.keys(loans[0])
    const rows = [headers, ...loans.map(l => headers.map(h => String(l[h] ?? '')))]
    return rows.map(r => r.join(',')).join('\n')
  }
  return JSON.stringify(report, null, 2)
}
