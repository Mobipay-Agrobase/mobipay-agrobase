import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const partners = await db.kilimoPartner.findMany({
    include: {
      _count: { select: { settlements: true, revenueSplits: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ partners });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, name, type = 'IMPLEMENTING_PARTNER', contactName, contactEmail, contactPhone, agreementTerms } = body;

  if (!code || !name) return NextResponse.json({ error: 'code, name required' }, { status: 400 });

  const partner = await db.kilimoPartner.create({
    data: {
      code: code.toUpperCase(),
      name, type,
      contactName, contactEmail, contactPhone,
      status: 'ACTIVE',
      agreementDate: new Date(),
      agreementTerms: agreementTerms ? JSON.stringify(agreementTerms) : null,
    },
  });
  return NextResponse.json({ partner }, { status: 201 });
}
