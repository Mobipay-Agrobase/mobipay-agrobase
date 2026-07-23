import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Demo credentials for VSLA module testing
export const DEMO_CREDENTIALS = [
  {
    email: 'eric@mobipay.agrobase',
    password: 'mobipay2025',
    role: 'SUPER_ADMIN',
    name: 'Eric Mwangi',
    description: 'Full platform access — all 12 modules, all tenants',
  },
  {
    email: 'admin@kilimo.org',
    password: 'kilimo2025',
    role: 'TENANT_ADMIN',
    name: 'Beatrice Auma',
    description: 'Tenant admin — VSLA management, NSSF, payments, reports',
  },
  {
    email: 'officer@kilimo.org',
    password: 'officer2025',
    role: 'VSLA_OFFICER',
    name: 'Joel Okello',
    description: 'Field officer — VSLA groups, savings, loans, meetings',
  },
  {
    email: 'partner@kilimotrust.org',
    password: 'partner2025',
    role: 'PARTNER_ADMIN',
    name: 'Kilimo Trust Liaison',
    description: 'Partner view — revenue splits, settlements, mobilized farmers',
  },
  {
    email: 'finance@coop.ug',
    password: 'finance2025',
    role: 'TENANT_ADMIN',
    name: 'Sarah Namutebi',
    description: 'Finance officer — payments, NSSF, billing',
  },
];

export async function GET() {
  return NextResponse.json({
    credentials: DEMO_CREDENTIALS,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password required' }, { status: 400 });
  }

  const match = DEMO_CREDENTIALS.find(
    (c) => c.email.toLowerCase() === email.toLowerCase() && c.password === password
  );

  if (!match) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Find the actual user in DB (if seeded)
  const user = await db.user.findUnique({
    where: { email: match.email },
    include: { tenant: { select: { id: true, name: true, code: true } } },
  });

  // Update last login
  if (user) {
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }).catch(() => null);
  }

  return NextResponse.json({
    token: Buffer.from(`${match.email}:${Date.now()}`).toString('base64'),
    user: {
      email: match.email,
      name: match.name,
      role: match.role,
      tenantId: user?.tenantId,
      tenantName: user?.tenant?.name,
    },
  });
}
