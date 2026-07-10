/**
 * Monthly Statement Generator
 * ───────────────────────────
 * Generates an HTML statement for a MonthlyReconciliation record.
 * The statement is viewable in the browser and can be printed to PDF.
 *
 * For email delivery, the cron job sends a link to the statement URL
 * rather than an attachment (simpler, no heavy PDF deps needed).
 */

import { db } from '@/lib/db'

interface StatementData {
  tenantName: string
  tenantCountry: string | null
  period: string
  billingModel: string
  feeType: string | null
  feeRate: number | null
  transactionCount: number
  grossVolume: number
  totalFeesCollected: number
  momoGatewayFees: number
  mobipayFees: number
  recurringCostIncurred: number
  surplusApplied: number
  investmentBefore: number | null
  investmentAfter: number | null
  recoveredThisMonth: number | null
  status: string
}

export async function generateStatementHTML(tenantId: string, period: string): Promise<string | null> {
  const reconciliation = await db.monthlyReconciliation.findUnique({
    where: { tenantId_period: { tenantId, period } },
    include: {
      tenant: { select: { name: true, country: true } },
      agreement: true,
    },
  })

  if (!reconciliation) return null

  const data: StatementData = {
    tenantName: reconciliation.tenant.name,
    tenantCountry: reconciliation.tenant.country,
    period: reconciliation.period,
    billingModel: reconciliation.agreement.billingModel,
    feeType: reconciliation.agreement.feeType,
    feeRate: Number(reconciliation.agreement.feeRate),
    transactionCount: reconciliation.transactionCount,
    grossVolume: Number(reconciliation.grossVolume),
    totalFeesCollected: Number(reconciliation.totalFeesCollected),
    momoGatewayFees: Number(reconciliation.momoGatewayFees),
    mobipayFees: Number(reconciliation.mobipayFees),
    recurringCostIncurred: Number(reconciliation.recurringCostIncurred),
    surplusApplied: Number(reconciliation.surplusApplied),
    investmentBefore: reconciliation.investmentBefore ? Number(reconciliation.investmentBefore) : null,
    investmentAfter: reconciliation.investmentAfter ? Number(reconciliation.investmentAfter) : null,
    recoveredThisMonth: reconciliation.recoveredThisMonth ? Number(reconciliation.recoveredThisMonth) : null,
    status: reconciliation.status,
  }

  const fmtUGX = (n: number) => 'UGX ' + n.toLocaleString()
  const [year, month] = period.split('-')
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  const monthName = monthNames[parseInt(month) - 1] || month

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Billing Statement — ${data.tenantName} — ${monthName} ${year}</title>
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #181b1a; max-width: 800px; margin: 0 auto; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #059669; padding-bottom: 20px; margin-bottom: 30px; }
  .logo { font-size: 24px; font-weight: bold; color: #059669; }
  .logo span { color: #181b1a; }
  .period { text-align: right; }
  .period h1 { font-size: 20px; margin: 0; }
  .period p { color: #7d8782; font-size: 14px; margin: 4px 0 0; }
  .section { margin-bottom: 30px; }
  .section h2 { font-size: 16px; color: #46765e; border-bottom: 1px solid #b8d1c4; padding-bottom: 8px; }
  .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .summary-item { background: #f6f7f7; padding: 16px; border-radius: 8px; }
  .summary-item .label { font-size: 12px; color: #7d8782; margin-bottom: 4px; }
  .summary-item .value { font-size: 18px; font-weight: bold; }
  .table { width: 100%; border-collapse: collapse; }
  .table th { text-align: left; font-size: 12px; color: #7d8782; padding: 8px; border-bottom: 2px solid #b8d1c4; }
  .table td { padding: 8px; border-bottom: 1px solid #e2e9e5; font-size: 14px; }
  .table .right { text-align: right; }
  .total-row { font-weight: bold; background: #e2e9e5; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #b8d1c4; font-size: 12px; color: #7d8782; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">MobiPay <span>AgroSys</span></div>
    <div class="period">
      <h1>Billing Statement</h1>
      <p>${monthName} ${year}</p>
    </div>
  </div>

  <div class="section">
    <h2>Tenant</h2>
    <p><strong>${data.tenantName}</strong>${data.tenantCountry ? ' — ' + data.tenantCountry : ''}</p>
    <p>Billing Model: <strong>${data.billingModel}</strong>${data.feeType ? ' · Fee: ' + (data.feeType === 'PERCENTAGE' ? ((data.feeRate || 0) * 100) + '%' : 'UGX ' + (data.feeRate || 0)) : ''}</p>
  </div>

  <div class="section">
    <h2>Monthly Summary</h2>
    <div class="summary">
      <div class="summary-item">
        <div class="label">Transactions</div>
        <div class="value">${data.transactionCount}</div>
      </div>
      <div class="summary-item">
        <div class="label">Gross Volume</div>
        <div class="value">${fmtUGX(data.grossVolume)}</div>
      </div>
      <div class="summary-item">
        <div class="label">Fees Collected</div>
        <div class="value">${fmtUGX(data.totalFeesCollected)}</div>
      </div>
      <div class="summary-item">
        <div class="label">MoMo Gateway Fees (pass-through)</div>
        <div class="value">${fmtUGX(data.momoGatewayFees)}</div>
      </div>
      <div class="summary-item">
        <div class="label">MobiPay Fees</div>
        <div class="value">${fmtUGX(data.mobipayFees)}</div>
      </div>
      <div class="summary-item">
        <div class="label">Platform Cost</div>
        <div class="value">${fmtUGX(data.recurringCostIncurred)}</div>
      </div>
    </div>
  </div>

  ${data.investmentBefore !== null ? `
  <div class="section">
    <h2>Investment Recovery</h2>
    <table class="table">
      <tr><td>Investment Balance (start of month)</td><td class="right">${fmtUGX(data.investmentBefore || 0)}</td></tr>
      <tr><td>Recovered This Month</td><td class="right">${fmtUGX(data.recoveredThisMonth || 0)}</td></tr>
      <tr class="total-row"><td>Investment Balance (end of month)</td><td class="right">${fmtUGX(data.investmentAfter || 0)}</td></tr>
    </table>
  </div>
  ` : ''}

  <div class="section">
    <h2>Surplus Applied</h2>
    <table class="table">
      <tr><td>MobiPay Fees</td><td class="right">${fmtUGX(data.mobipayFees)}</td></tr>
      <tr><td>Platform Cost</td><td class="right">(${fmtUGX(data.recurringCostIncurred)})</td></tr>
      <tr class="total-row"><td>Surplus to Investment Recovery</td><td class="right">${fmtUGX(data.surplusApplied)}</td></tr>
    </table>
  </div>

  <div class="footer">
    <p>Generated by MobiPay AgroSys Billing Engine · ${new Date().toISOString()}</p>
    <p>Questions? Contact finance@mobipay.agrosys.com</p>
  </div>
</body>
</html>
  `
}

/**
 * Returns the URL where a tenant can view their statement.
 * The statement is rendered on-demand from the reconciliation record.
 */
export function getStatementUrl(tenantId: string, period: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://mobipay-agrobase.vercel.app'
  return `${baseUrl}/api/billing/statement?tenantId=${tenantId}&period=${period}`
}
