/**
 * Download CSV template for bulk cash disbursement
 */
import { NextResponse } from 'next/server'

export async function GET() {
  const csv = `beneficiaryId,phone,amount,partner,paymentMethod
RESET-BEN-00001,+256700400000,100000,CARE,MTN_MOMO
RESET-BEN-00002,+256700400001,150000,CARE,AIRTEL_MONEY
RESET-BEN-00003,+256700400002,80000,SCI,MTN_MOMO`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="reset-cash-disbursement-template.csv"',
    },
  })
}
