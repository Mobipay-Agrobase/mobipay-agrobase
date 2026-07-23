import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { guarantorIds } = body as { guarantorIds: string[] };

  if (!guarantorIds || !Array.isArray(guarantorIds) || guarantorIds.length === 0) {
    return NextResponse.json({ error: 'guarantorIds array required' }, { status: 400 });
  }

  const loan = await db.vslaLoan.findUnique({ where: { id: id }, include: { group: true } });
  if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 });

  // Each guarantor guarantees a proportional share
  const guaranteedAmount = loan.totalRepayable / guarantorIds.length;

  await db.vslaLoanGuarantor.deleteMany({ where: { loanId: id } });
  const guarantors = await Promise.all(
    guarantorIds.map((memberId) =>
      db.vslaLoanGuarantor.create({
        data: {
          loanId: id,
          memberId,
          guaranteedAmount,
          status: 'APPROVED',
          approvedAt: new Date(),
        },
      })
    )
  );

  return NextResponse.json({ guarantors });
}
