import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const tenants = await db.tenant.findMany({
    include: {
      _count: { select: { users: true, vslaGroups: true, nssfContributions: true, payments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Compute MRR and active VSLA groups per tenant
  const enriched = await Promise.all(
    tenants.map(async (t) => {
      const vslaGroupCount = await db.vslaGroup.count({ where: { tenantId: t.id, status: 'ACTIVE' } });
      const vslaMemberCount = await db.vslaMember.count({
        where: { group: { tenantId: t.id }, status: 'ACTIVE' },
      });
      const savingsTotal = await db.vslaSaving.aggregate({
        where: { group: { tenantId: t.id }, status: 'COMPLETED' },
        _sum: { amount: true },
      });
      return {
        ...t,
        vslaGroupCount,
        vslaMemberCount,
        savingsTotal: savingsTotal._sum.amount ?? 0,
      };
    })
  );

  return NextResponse.json({ tenants: enriched });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, code, country, plan = 'GROWTH' } = body;
  if (!name || !code) return NextResponse.json({ error: 'name, code required' }, { status: 400 });

  const tenant = await db.tenant.create({
    data: { name, code: code.toUpperCase(), country, plan, status: 'TRIAL', mrr: 0 },
  });

  // Enable core modules by default
  const coreModules = await db.module.findMany({ where: { isCore: true } });
  await db.moduleEntitlement.createMany({
    data: coreModules.map((m) => ({ tenantId: tenant.id, moduleCode: m.code, isEnabled: true })),
  });

  return NextResponse.json({ tenant }, { status: 201 });
}
