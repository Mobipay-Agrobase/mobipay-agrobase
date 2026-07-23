import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Unified module registry — single source of truth
const CORE_MODULES = [
  { code: 'DASHBOARD', name: 'Dashboard', category: 'CORE', icon: 'LayoutDashboard', isCore: true, sortOrder: 1, description: 'Unified platform dashboard with KPIs and quick navigation' },
  { code: 'VSLA', name: 'VSLA Management', category: 'CORE', icon: 'Users', isCore: true, sortOrder: 2, description: 'Village Savings & Loan Associations — groups, members, savings, loans, social fund, cycles, meetings, reports' },
  { code: 'NSSF', name: 'NSSF Contributions', category: 'FINANCE', icon: 'Landmark', isCore: false, sortOrder: 3, description: 'NSSF farmer contributions, activation, reminders' },
  { code: 'PAYMENTS', name: 'Mobile Money', category: 'FINANCE', icon: 'Smartphone', isCore: true, sortOrder: 4, description: 'MTN MoMo, Airtel Money, Flutterwave — disbursements and collections' },
  { code: 'SMS', name: 'SMS Notifications', category: 'COMMUNICATION', icon: 'MessageSquare', isCore: false, sortOrder: 5, description: "Africa's Talking SMS gateway for NSSF, VSLA, payment alerts" },
  { code: 'USSD', name: 'USSD Sessions', category: 'COMMUNICATION', icon: 'Hash', isCore: false, sortOrder: 6, description: 'USSD session tracking and menu flows for feature phones' },
  { code: 'PARTNERS', name: 'Partners', category: 'CORE', icon: 'Handshake', isCore: false, sortOrder: 7, description: 'Implementing partners (Kilimo Trust), revenue splits, settlements' },
  { code: 'REPORTS', name: 'Reports & Analytics', category: 'INTELLIGENCE', icon: 'BarChart3', isCore: true, sortOrder: 8, description: 'Group statements, aging, trial balance, partner settlements' },
  { code: 'AUDIT', name: 'Audit Log', category: 'COMPLIANCE', icon: 'ShieldCheck', isCore: true, sortOrder: 9, description: 'Immutable record of all platform actions' },
  { code: 'USERS', name: 'User Management', category: 'CORE', icon: 'UserCog', isCore: true, sortOrder: 10, description: 'Users, roles, RBAC' },
  { code: 'TENANTS', name: 'Tenant Management', category: 'CORE', icon: 'Building2', isCore: false, sortOrder: 11, description: 'Multi-tenant organization management' },
  { code: 'COMPLIANCE', name: 'Compliance', category: 'COMPLIANCE', icon: 'CheckCircle', isCore: false, sortOrder: 12, description: 'EUDR, Rainforest Alliance, GlobalG.A.P.' },
  { code: 'MARKETPLACE', name: 'Marketplace', category: 'CORE', icon: 'ShoppingCart', isCore: false, sortOrder: 13, description: 'Produce listings, buyer matching, consignments' },
  { code: 'TRAINING', name: 'Training & Groups', category: 'CORE', icon: 'GraduationCap', isCore: false, sortOrder: 14, description: 'Training events, attendance, cohorts' },
  { code: 'TRACE', name: 'Traceability', category: 'COMPLIANCE', icon: 'Footprints', isCore: false, sortOrder: 15, description: 'Farm-to-cup traceability, passports' },
  { code: 'CARBON', name: 'Carbon & CBAM', category: 'COMPLIANCE', icon: 'Leaf', isCore: false, sortOrder: 16, description: 'Carbon credits, CBAM reports' },
  { code: 'BILLING', name: 'Billing & Usage', category: 'FINANCE', icon: 'CreditCard', isCore: false, sortOrder: 17, description: 'SaaS subscription billing' },
  { code: 'API_ACCESS', name: 'API & Integrations', category: 'CORE', icon: 'Code', isCore: false, sortOrder: 18, description: 'API keys, webhooks, external integrations' },
];

// GET /api/admin/modules — list all modules with per-tenant entitlement status
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');

  // Sync modules to DB (idempotent)
  for (const m of CORE_MODULES) {
    await db.module.upsert({
      where: { code: m.code },
      update: { name: m.name, category: m.category, icon: m.icon, isCore: m.isCore, sortOrder: m.sortOrder, description: m.description },
      create: m,
    });
  }

  const modules = await db.module.findMany({ orderBy: { sortOrder: 'asc' } });

  if (tenantId) {
    const entitlements = await db.moduleEntitlement.findMany({ where: { tenantId } });
    const entMap = new Map(entitlements.map((e) => [e.moduleCode, e.isEnabled]));
    return NextResponse.json({
      modules: modules.map((m) => ({
        ...m,
        isEnabled: entMap.has(m.code) ? entMap.get(m.code) : m.isCore,
      })),
    });
  }

  return NextResponse.json({ modules });
}

// POST /api/admin/modules — toggle entitlement for a tenant
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tenantId, moduleCode, isEnabled } = body;

  if (!tenantId || !moduleCode) {
    return NextResponse.json({ error: 'tenantId, moduleCode required' }, { status: 400 });
  }

  const entitlement = await db.moduleEntitlement.upsert({
    where: { tenantId_moduleCode: { tenantId, moduleCode } },
    update: { isEnabled },
    create: { tenantId, moduleCode, isEnabled },
  });

  return NextResponse.json({ entitlement });
}
