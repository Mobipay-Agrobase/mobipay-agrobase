'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Landmark, Smartphone, MessageSquare, Hash,
  Handshake, BarChart3, ShieldCheck, UserCog, Building2, Boxes,
  Wallet, TrendingUp, AlertCircle, CheckCircle2, Clock, Activity,
  Menu, X, ChevronRight, Search, Bell, LogOut, Leaf, ShoppingCart,
  GraduationCap, Footprints, CreditCard, Code, Globe2, Server,
  PieChart, FileText, ArrowUpRight, ArrowDownRight, DollarSign,
  RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { useApi, api, toast } from '@/lib/api';
import { formatUGX, formatNumber, formatDate, timeAgo, statusColor } from '@/lib/format';

// ============================================================
// TYPES
// ============================================================

type ViewKey =
  | 'overview' | 'vsla' | 'nssf' | 'payments' | 'sms' | 'ussd'
  | 'partners' | 'reports' | 'audit' | 'users' | 'tenants' | 'modules';

interface NavItem {
  key: ViewKey;
  label: string;
  icon: any;
  category: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, category: 'Platform' },
  { key: 'vsla', label: 'VSLA Management', icon: Users, category: 'Platform' },
  { key: 'nssf', label: 'NSSF Contributions', icon: Landmark, category: 'Finance' },
  { key: 'payments', label: 'Mobile Money', icon: Smartphone, category: 'Finance' },
  { key: 'sms', label: 'SMS Notifications', icon: MessageSquare, category: 'Communication' },
  { key: 'ussd', label: 'USSD Sessions', icon: Hash, category: 'Communication' },
  { key: 'partners', label: 'Partners & Revenue', icon: Handshake, category: 'Platform' },
  { key: 'reports', label: 'Reports & Analytics', icon: BarChart3, category: 'Intelligence' },
  { key: 'audit', label: 'Audit Log', icon: ShieldCheck, category: 'Compliance' },
  { key: 'users', label: 'Users & Roles', icon: UserCog, category: 'Platform' },
  { key: 'tenants', label: 'Tenants', icon: Building2, category: 'Platform' },
  { key: 'modules', label: 'Module Registry', icon: Boxes, category: 'Platform' },
];

const CATEGORY_ORDER = ['Platform', 'Finance', 'Communication', 'Intelligence', 'Compliance'];

// ============================================================
// MAIN APP
// ============================================================

export default function AdminApp() {
  const [view, setView] = useState<ViewKey>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [seeded, setSeeded] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mobipay_admin_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.user && parsed?.expiresAt && Date.now() < parsed.expiresAt) {
          setAuthUser(parsed.user);
        } else {
          localStorage.removeItem('mobipay_admin_session');
        }
      }
    } catch {}
    setAuthLoading(false);
  }, []);

  // Auto-seed on first load if database is empty AND user is logged in
  const overview = useApi(authUser ? '/api/admin/overview' : null);
  useEffect(() => {
    if (overview.data && overview.data.counts.tenants === 0 && !seeded) {
      handleSeed();
    }
  }, [overview.data, seeded]);

  async function handleSeed() {
    setSeeding(true);
    try {
      await api('/api/seed', { method: 'POST' });
      toast('Demo data seeded successfully', 'success');
      setSeeded(true);
      overview.refetch();
    } catch (e: any) {
      toast(`Seed failed: ${e.message}`, 'error');
    } finally {
      setSeeding(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('mobipay_admin_session');
    setAuthUser(null);
    setView('overview');
  }

  function handleLogin(user: any) {
    const session = {
      user,
      token: Buffer.from(`${user.email}:${Date.now()}`).toString('base64'),
      expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
    };
    localStorage.setItem('mobipay_admin_session', JSON.stringify(session));
    setAuthUser(user);
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!authUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-white border-r border-slate-200 overflow-hidden flex-shrink-0`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">M</div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">MobiPay Agrobase</div>
                <div className="text-xs text-slate-500">Platform Admin</div>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-2 space-y-4">
            {CATEGORY_ORDER.map((cat) => (
              <div key={cat}>
                <div className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">{cat}</div>
                <div className="space-y-0.5">
                  {NAV_ITEMS.filter((n) => n.category === cat).map((item) => {
                    const Icon = item.icon;
                    const isActive = view === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => setView(item.key)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 font-medium'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-3 border-t border-slate-200">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${seeding ? 'animate-spin' : ''}`} />
              {seeding ? 'Seeding...' : 'Reseed demo data'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <h1 className="text-lg font-semibold text-slate-900">
              {NAV_ITEMS.find((n) => n.key === view)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md text-xs text-slate-600">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </div>
            <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-medium">
                {(authUser?.name || 'U').charAt(0)}
              </div>
              <div className="hidden md:block text-xs">
                <div className="font-medium text-slate-900">{authUser?.name || 'User'}</div>
                <div className="text-slate-500">{authUser?.role}</div>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-1.5 rounded-md hover:bg-slate-100 text-slate-600"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {view === 'overview' && <OverviewView />}
          {view === 'vsla' && <VslaView />}
          {view === 'nssf' && <NssfView />}
          {view === 'payments' && <PaymentsView />}
          {view === 'sms' && <SmsView />}
          {view === 'ussd' && <UssdView />}
          {view === 'partners' && <PartnersView />}
          {view === 'reports' && <ReportsView />}
          {view === 'audit' && <AuditView />}
          {view === 'users' && <UsersView />}
          {view === 'tenants' && <TenantsView />}
          {view === 'modules' && <ModulesView />}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}

// ============================================================
// TOAST
// ============================================================

function ToastContainer() {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: string }>>([]);

  useEffect(() => {
    function handleToast(e: Event) {
      const detail = (e as CustomEvent).detail;
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, ...detail }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
    }
    window.addEventListener('admin-toast', handleToast);
    return () => window.removeEventListener('admin-toast', handleToast);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2 rounded-md text-sm shadow-lg border ${
            t.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            t.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// REUSABLE UI PRIMITIVES
// ============================================================

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-lg border border-slate-200 ${className}`}>{children}</div>;
}

function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
      <div>
        <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Badge({ status, children }: { status?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(status || (typeof children === 'string' ? children : ''))}`}>
      {children}
    </span>
  );
}

function KpiCard({ title, value, subtitle, icon: Icon, trend, color = 'emerald' }: {
  title: string;
  value: string;
  subtitle?: string;
  icon: any;
  trend?: { value: string; up: boolean };
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    slate: 'bg-slate-100 text-slate-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
          {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
          {trend && (
            <div className={`text-xs mt-1 flex items-center gap-1 ${trend.up ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trend.value}
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}

function EmptyState({ icon: Icon, title, hint }: { icon: any; title: string; hint?: string }) {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <h3 className="text-sm font-medium text-slate-900">{title}</h3>
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <RefreshCw className="w-5 h-5 text-slate-400 animate-spin mr-2" />
      <span className="text-sm text-slate-500">{label}</span>
    </div>
  );
}

// ============================================================
// OVERVIEW VIEW
// ============================================================

function OverviewView() {
  const { data, loading, error } = useApi('/api/admin/overview');

  if (loading) return <LoadingState label="Loading platform overview..." />;
  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!data) return null;

  const { counts, financials, loanPortfolio, moduleUsage } = data;

  const moduleCards = [
    { code: 'VSLA', label: 'VSLA Groups', value: counts.vslaGroups, sub: `${counts.vslaMembers} members`, icon: Users, color: 'emerald' },
    { code: 'NSSF', label: 'NSSF Contributions', value: counts.nssfContributions, sub: formatUGX(financials.nssfTotal), icon: Landmark, color: 'blue' },
    { code: 'PAYMENTS', label: 'Payments Processed', value: counts.payments, sub: formatUGX(financials.paymentsTotal), icon: Smartphone, color: 'purple' },
    { code: 'SMS', label: 'SMS Sent', value: moduleUsage.SMS.total, sub: `${moduleUsage.SMS.failed} failed`, icon: MessageSquare, color: 'amber' },
    { code: 'USSD', label: 'USSD Sessions', value: counts.ussdSessions, sub: 'Last 7 days', icon: Hash, color: 'slate' },
    { code: 'PARTNERS', label: 'Active Partners', value: counts.partners, sub: 'Kilimo Trust', icon: Handshake, color: 'emerald' },
    { code: 'AUDIT', label: 'Audit Events', value: counts.auditLogs, sub: 'Last 30 days', icon: ShieldCheck, color: 'slate' },
    { code: 'TENANTS', label: 'Tenants', value: counts.tenants, sub: 'Multi-tenant', icon: Building2, color: 'blue' },
  ];

  return (
    <div className="space-y-6">
      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Savings" value={formatUGX(financials.totalSavings)} subtitle="Across all VSLA groups" icon={Wallet} color="emerald" />
        <KpiCard title="Outstanding Loans" value={formatUGX(financials.outstandingLoans)} subtitle={`${loanPortfolio.active} active loans`} icon={TrendingUp} color="amber" />
        <KpiCard title="Disbursed Loans" value={formatUGX(financials.disbursedLoans)} subtitle={`${counts.vslaLoans} total loans`} icon={DollarSign} color="blue" />
        <KpiCard title="NSSF Processed" value={formatUGX(financials.nssfTotal)} subtitle={`${counts.nssfContributions} contributions`} icon={Landmark} color="purple" />
      </div>

      {/* Module health grid */}
      <Card>
        <CardHeader title="Module Usage" subtitle="Live counts per module across the platform" />
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {moduleCards.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.code} className="p-4 rounded-lg border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center bg-${m.color}-50 text-${m.color}-700`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-slate-400">{m.code}</span>
                </div>
                <div className="mt-3 text-2xl font-bold text-slate-900">{m.value}</div>
                <div className="text-xs font-medium text-slate-700">{m.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{m.sub}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Two-column row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan portfolio */}
        <Card>
          <CardHeader title="Loan Portfolio" subtitle="Status distribution" />
          <div className="p-5 space-y-3">
            <PortfolioBar label="Active" count={loanPortfolio.active} total={counts.vslaLoans} color="bg-blue-500" />
            <PortfolioBar label="Pending Approval" count={loanPortfolio.pending} total={counts.vslaLoans} color="bg-amber-500" />
            <PortfolioBar label="Overdue" count={loanPortfolio.overdue} total={counts.vslaLoans} color="bg-red-500" />
            <div className="pt-3 border-t border-slate-200 flex justify-between text-sm">
              <span className="text-slate-600">Total Loans</span>
              <span className="font-semibold text-slate-900">{counts.vslaLoans}</span>
            </div>
          </div>
        </Card>

        {/* SMS stats */}
        <Card>
          <CardHeader title="SMS Notification Stats" subtitle="Africa's Talking gateway" />
          <div className="p-5 space-y-3">
            <PortfolioBar label="Sent / Delivered" count={moduleUsage.SMS.sent} total={counts.smsLogs} color="bg-emerald-500" />
            <PortfolioBar label="Pending" count={moduleUsage.SMS.pending || 0} total={counts.smsLogs} color="bg-amber-500" />
            <PortfolioBar label="Failed" count={moduleUsage.SMS.failed} total={counts.smsLogs} color="bg-red-500" />
            <div className="pt-3 border-t border-slate-200 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs text-slate-500">Delivery Rate</div>
                <div className="text-sm font-semibold text-slate-900">{counts.smsLogs > 0 ? Math.round((moduleUsage.SMS.sent / counts.smsLogs) * 100) : 0}%</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">By Category</div>
                <div className="text-sm font-semibold text-slate-900">{moduleUsage.SMS.total > 0 ? '4 active' : '—'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Provider</div>
                <div className="text-sm font-semibold text-slate-900">AT Live</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader title="Recent Audit Activity" subtitle="Latest platform events" action={<a href="#" className="text-xs text-emerald-700 hover:underline">View all</a>} />
        <RecentActivityTable />
      </Card>
    </div>
  );
}

function PortfolioBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-900">{count} {total > 0 && `(${Math.round(pct)}%)`}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function RecentActivityTable() {
  const { data, loading } = useApi('/api/admin/audit-log?limit=10');
  if (loading) return <LoadingState />;
  if (!data || data.logs.length === 0) return <EmptyState icon={Activity} title="No activity yet" />;

  return (
    <div className="divide-y divide-slate-100">
      {data.logs.map((log: any) => (
        <div key={log.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
            log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700' :
            log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
            log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
            log.action === 'APPROVE' ? 'bg-purple-100 text-purple-700' :
            log.action === 'DISBURSE' ? 'bg-amber-100 text-amber-700' :
            'bg-slate-100 text-slate-700'
          }`}>
            {log.action.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-slate-900 truncate">{log.description || `${log.action} on ${log.entityType}`}</div>
            <div className="text-xs text-slate-500">
              {log.actorName || 'System'} · {log.entityType} · {timeAgo(log.createdAt)}
            </div>
          </div>
          <Badge status={log.action}>{log.action}</Badge>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// VSLA VIEW (the big one)
// ============================================================

function VslaView() {
  const [tab, setTab] = useState<'groups' | 'members' | 'savings' | 'loans' | 'social' | 'cycles' | 'meetings' | 'reports'>('groups');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const tabs = [
    { key: 'groups', label: 'Groups' },
    { key: 'members', label: 'Members' },
    { key: 'savings', label: 'Savings' },
    { key: 'loans', label: 'Loans' },
    { key: 'social', label: 'Social Fund' },
    { key: 'cycles', label: 'Cycles' },
    { key: 'meetings', label: 'Meetings' },
    { key: 'reports', label: 'Reports' },
  ] as const;

  return (
    <div className="space-y-4">
      {/* VSLA KPIs */}
      <VslaKpiBar />

      {/* Tab navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.key ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'groups' && <VslaGroupsTab selectedGroup={selectedGroup} setSelectedGroup={setSelectedGroup} />}
      {tab === 'members' && <VslaMembersTab />}
      {tab === 'savings' && <VslaSavingsTab />}
      {tab === 'loans' && <VslaLoansTab />}
      {tab === 'social' && <VslaSocialTab />}
      {tab === 'cycles' && <VslaCyclesTab />}
      {tab === 'meetings' && <VslaMeetingsTab />}
      {tab === 'reports' && <VslaReportsTab />}
    </div>
  );
}

function VslaKpiBar() {
  const { data, loading } = useApi('/api/admin/overview');
  if (loading || !data) return null;
  const { counts, financials } = data;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <KpiCard title="VSLA Groups" value={formatNumber(counts.vslaGroups)} subtitle={`${counts.vslaMembers} members`} icon={Users} color="emerald" />
      <KpiCard title="Total Savings" value={formatUGX(financials.totalSavings)} subtitle="All groups" icon={Wallet} color="emerald" />
      <KpiCard title="Outstanding Loans" value={formatUGX(financials.outstandingLoans)} subtitle={`${data.loanPortfolio.active} active`} icon={TrendingUp} color="amber" />
      <KpiCard title="Disbursed" value={formatUGX(financials.disbursedLoans)} subtitle={`${counts.vslaLoans} loans`} icon={DollarSign} color="blue" />
    </div>
  );
}

function VslaGroupsTab({ selectedGroup, setSelectedGroup }: { selectedGroup: string | null; setSelectedGroup: (id: string | null) => void }) {
  const { data, loading, refetch } = useApi('/api/vsla/groups');
  const [showCreate, setShowCreate] = useState(false);

  if (loading) return <LoadingState label="Loading groups..." />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-600">{data.groups.length} VSLA groups across the platform</p>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 flex items-center gap-1.5"
        >
          <Users className="w-4 h-4" /> New Group
        </button>
      </div>

      {showCreate && <CreateGroupForm onClose={() => setShowCreate(false)} onCreated={() => { refetch(); setShowCreate(false); }} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.groups.map((g: any) => (
          <Card key={g.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-slate-900">{g.name}</div>
                <div className="text-xs text-slate-500">{g.code} · {g.district || '—'}</div>
              </div>
              <Badge status={g.status}>{g.status}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-slate-500">Members</div>
                <div className="font-semibold text-slate-900">{g._count?.members ?? 0}</div>
              </div>
              <div>
                <div className="text-slate-500">Total Savings</div>
                <div className="font-semibold text-emerald-700">{formatUGX(g.totalSavings)}</div>
              </div>
              <div>
                <div className="text-slate-500">Share Value</div>
                <div className="font-semibold text-slate-900">{formatUGX(g.shareValue)}</div>
              </div>
              <div>
                <div className="text-slate-500">Loan Rate</div>
                <div className="font-semibold text-slate-900">{g.loanInterestRate}%</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Outstanding: <span className="font-semibold text-amber-700">{formatUGX(g.outstandingLoans)}</span></span>
              <span className="text-slate-500">Social: <span className="font-semibold text-slate-900">{formatUGX(g.socialFundBalance)}</span></span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CreateGroupForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', region: '', district: '', shareValue: 5000, loanInterestRate: 10, maxLoanMultiplier: 3, meetingFrequency: 'WEEKLY', meetingDay: 'TUESDAY', welfareContribution: 1000 });
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await api('/api/vsla/groups', {
        method: 'POST',
        body: JSON.stringify({ ...form, tenantId: 'first-tenant' }), // demo
      });
      toast('VSLA group created', 'success');
      onCreated();
    } catch (e: any) {
      toast(`Failed: ${e.message}`, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-5 mb-4">
      <h3 className="font-semibold text-slate-900 mb-3">Create New VSLA Group</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <input className="px-3 py-2 border rounded-md" placeholder="Group name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="px-3 py-2 border rounded-md" placeholder="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
        <input type="number" className="px-3 py-2 border rounded-md" placeholder="Share value" value={form.shareValue} onChange={(e) => setForm({ ...form, shareValue: +e.target.value })} />
        <input type="number" className="px-3 py-2 border rounded-md" placeholder="Loan rate %" value={form.loanInterestRate} onChange={(e) => setForm({ ...form, loanInterestRate: +e.target.value })} />
        <input type="number" className="px-3 py-2 border rounded-md" placeholder="Max loan multiplier" value={form.maxLoanMultiplier} onChange={(e) => setForm({ ...form, maxLoanMultiplier: +e.target.value })} />
        <input type="number" className="px-3 py-2 border rounded-md" placeholder="Welfare contribution" value={form.welfareContribution} onChange={(e) => setForm({ ...form, welfareContribution: +e.target.value })} />
      </div>
      <div className="mt-3 flex gap-2 justify-end">
        <button onClick={onClose} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md">Cancel</button>
        <button onClick={submit} disabled={saving || !form.name} className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50">
          {saving ? 'Creating...' : 'Create Group'}
        </button>
      </div>
    </Card>
  );
}

function VslaMembersTab() {
  const { data, loading } = useApi('/api/vsla/members?limit=100');
  if (loading) return <LoadingState />;
  if (!data) return null;

  return (
    <Card>
      <CardHeader title="VSLA Members" subtitle={`${data.members.length} members across all groups`} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Member</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Group</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Phone</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Savings</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Shares</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Outstanding</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Role</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.members.map((m: any) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <div className="font-medium text-slate-900">{m.fullName}</div>
                  <div className="text-xs text-slate-500">{m.memberId}</div>
                </td>
                <td className="px-4 py-2 text-slate-600">{m.group?.name || '—'}</td>
                <td className="px-4 py-2 text-slate-600">{m.phone || '—'}</td>
                <td className="px-4 py-2 text-right font-medium text-emerald-700">{formatUGX(m.totalSavings)}</td>
                <td className="px-4 py-2 text-right text-slate-600">{m.totalShares}</td>
                <td className="px-4 py-2 text-right font-medium text-amber-700">{formatUGX(m.outstandingLoans)}</td>
                <td className="px-4 py-2 text-center">
                  {m.officerRoles?.length > 0 ? (
                    <Badge>{m.officerRoles[0].role}</Badge>
                  ) : (
                    <span className="text-xs text-slate-400">Member</span>
                  )}
                </td>
                <td className="px-4 py-2 text-center"><Badge status={m.status}>{m.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function VslaSavingsTab() {
  const { data, loading } = useApi('/api/vsla/savings?limit=100');
  if (loading) return <LoadingState />;
  if (!data) return null;

  return (
    <Card>
      <CardHeader
        title="Savings Transactions"
        subtitle={`Total: ${formatUGX(data.totalAmount)} · ${data.totalShares} shares`}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Member</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Group</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Amount</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Shares</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Method</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.savings.map((s: any) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-slate-600">{formatDate(s.createdAt)}</td>
                <td className="px-4 py-2 font-medium text-slate-900">{s.member?.fullName || '—'}</td>
                <td className="px-4 py-2 text-slate-600">{s.group?.name || '—'}</td>
                <td className="px-4 py-2 text-right font-medium text-emerald-700">{formatUGX(s.amount)}</td>
                <td className="px-4 py-2 text-right text-slate-600">{s.sharesBought}</td>
                <td className="px-4 py-2 text-center text-xs text-slate-600">{s.paymentMethod}</td>
                <td className="px-4 py-2 text-center"><Badge status={s.status}>{s.status}</Badge></td>
                <td className="px-4 py-2 text-xs text-slate-500 font-mono">{s.transactionRef}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function VslaLoansTab() {
  const { data, loading, refetch } = useApi('/api/vsla/loans?limit=100');
  const [actionLoan, setActionLoan] = useState<any | null>(null);
  if (loading) return <LoadingState />;
  if (!data) return null;

  return (
    <Card>
      <CardHeader title="Loans" subtitle={`${data.loans.length} total loans`} action={
        <span className="text-xs text-slate-500">Click actions to approve/disburse/repay</span>
      } />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Applied</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Member</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Purpose</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Amount</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Repayable</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Outstanding</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.loans.map((l: any) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-slate-600 text-xs">{formatDate(l.applicationDate)}</td>
                <td className="px-4 py-2 font-medium text-slate-900">{l.member?.fullName || '—'}</td>
                <td className="px-4 py-2 text-slate-600">{l.purpose}</td>
                <td className="px-4 py-2 text-right font-medium text-slate-900">{formatUGX(l.amount)}</td>
                <td className="px-4 py-2 text-right text-slate-600">{formatUGX(l.totalRepayable)}</td>
                <td className="px-4 py-2 text-right font-medium text-amber-700">{formatUGX(l.outstanding)}</td>
                <td className="px-4 py-2 text-center"><Badge status={l.status}>{l.status}</Badge></td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => setActionLoan(l)}
                    className="text-xs px-2 py-1 rounded border border-slate-300 hover:bg-slate-100"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {actionLoan && (
        <LoanActionModal
          loan={actionLoan}
          onClose={() => setActionLoan(null)}
          onAction={() => { setActionLoan(null); refetch(); }}
        />
      )}
    </Card>
  );
}

function LoanActionModal({ loan, onClose, onAction }: { loan: any; onClose: () => void; onAction: () => void }) {
  const [repayAmount, setRepayAmount] = useState('');
  const [busy, setBusy] = useState(false);

  async function act(action: string, extra: any = {}) {
    setBusy(true);
    try {
      if (action === 'repay') {
        await api(`/api/vsla/loans/${loan.id}/repay`, {
          method: 'POST',
          body: JSON.stringify({ amount: parseFloat(repayAmount), recordedByName: 'Eric Mwangi' }),
        });
      } else {
        await api(`/api/vsla/loans/${loan.id}`, {
          method: 'PUT',
          body: JSON.stringify({ action, approvedByName: 'Eric Mwangi', ...extra }),
        });
      }
      toast(`Loan ${action} successful`, 'success');
      onAction();
    } catch (e: any) {
      toast(`Failed: ${e.message}`, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full">
        <CardHeader title={`Manage Loan — ${loan.member?.fullName}`} subtitle={`${formatUGX(loan.amount)} · ${loan.status}`} action={
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        } />
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-xs text-slate-500">Purpose</div><div className="font-medium">{loan.purpose}</div></div>
            <div><div className="text-xs text-slate-500">Term</div><div className="font-medium">{loan.termDays} days</div></div>
            <div><div className="text-xs text-slate-500">Total Repayable</div><div className="font-medium">{formatUGX(loan.totalRepayable)}</div></div>
            <div><div className="text-xs text-slate-500">Outstanding</div><div className="font-medium text-amber-700">{formatUGX(loan.outstanding)}</div></div>
            <div><div className="text-xs text-slate-500">Amount Repaid</div><div className="font-medium">{formatUGX(loan.amountRepaid)}</div></div>
            <div><div className="text-xs text-slate-500">Due Date</div><div className="font-medium">{formatDate(loan.expectedRepaymentDate)}</div></div>
          </div>

          <div className="flex flex-wrap gap-2">
            {loan.status === 'PENDING' && (
              <>
                <button onClick={() => act('approve')} disabled={busy} className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50">Approve</button>
                <button onClick={() => act('reject', { rejectionReason: 'Rejected by admin' })} disabled={busy} className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50">Reject</button>
              </>
            )}
            {loan.status === 'APPROVED' && (
              <button onClick={() => act('disburse', { disbursementMethod: 'CASH' })} disabled={busy} className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">Disburse</button>
            )}
            {(loan.status === 'DISBURSED' || loan.status === 'OVERDUE') && (
              <>
                <input
                  type="number"
                  placeholder="Repayment amount"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="px-3 py-1.5 border rounded-md text-sm flex-1 min-w-32"
                />
                <button onClick={() => act('repay')} disabled={busy || !repayAmount} className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50">Record Repayment</button>
              </>
            )}
            {(loan.status === 'DISBURSED' || loan.status === 'OVERDUE') && (
              <button onClick={() => act('writeoff')} disabled={busy} className="px-3 py-1.5 bg-slate-600 text-white rounded-md text-sm hover:bg-slate-700 disabled:opacity-50">Write Off</button>
            )}
          </div>

          {loan.guarantors?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-600 uppercase mb-1">Guarantors</div>
              <div className="text-sm space-y-1">
                {loan.guarantors.map((g: any) => (
                  <div key={g.id} className="flex justify-between">
                    <span>{g.member?.fullName}</span>
                    <span className="text-slate-500">{formatUGX(g.guaranteedAmount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loan.repayments?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-600 uppercase mb-1">Repayment History</div>
              <div className="text-sm space-y-1">
                {loan.repayments.map((r: any) => (
                  <div key={r.id} className="flex justify-between text-xs">
                    <span>{formatDate(r.createdAt)}</span>
                    <span className="font-medium">{formatUGX(r.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function VslaSocialTab() {
  const [tab, setTab] = useState<'contributions' | 'claims'>('contributions');
  const { data: contribData, loading: contribLoading } = useApi('/api/vsla/social-fund/contributions');
  const { data: claimsData, loading: claimsLoading } = useApi('/api/vsla/social-fund/claims');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setTab('contributions')} className={`px-3 py-1.5 text-sm rounded-md ${tab === 'contributions' ? 'bg-emerald-600 text-white' : 'bg-white border'}`}>Contributions</button>
        <button onClick={() => setTab('claims')} className={`px-3 py-1.5 text-sm rounded-md ${tab === 'claims' ? 'bg-emerald-600 text-white' : 'bg-white border'}`}>Claims</button>
      </div>

      {tab === 'contributions' && (
        <Card>
          <CardHeader title="Social Fund Contributions" subtitle={contribData ? `Total: ${formatUGX(contribData.total)}` : ''} />
          {contribLoading ? <LoadingState /> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Member</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contribData?.contributions.map((c: any) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2 text-slate-600 text-xs">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-2 font-medium text-slate-900">{c.member?.fullName || 'Group'}</td>
                    <td className="px-4 py-2"><Badge>{c.contributionType}</Badge></td>
                    <td className="px-4 py-2 text-right font-medium text-emerald-700">{formatUGX(c.amount)}</td>
                    <td className="px-4 py-2 text-xs text-slate-500 font-mono">{c.transactionRef}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === 'claims' && (
        <Card>
          <CardHeader title="Social Fund Claims" subtitle="Welfare assistance requests" />
          {claimsLoading ? <LoadingState /> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Member</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Amount</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claimsData?.claims.map((c: any) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2 text-slate-600 text-xs">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-2 font-medium text-slate-900">{c.member?.fullName}</td>
                    <td className="px-4 py-2"><Badge>{c.claimType}</Badge></td>
                    <td className="px-4 py-2 text-slate-600 text-xs max-w-xs truncate">{c.description}</td>
                    <td className="px-4 py-2 text-right font-medium">{formatUGX(c.amount)}</td>
                    <td className="px-4 py-2 text-center"><Badge status={c.status}>{c.status}</Badge></td>
                    <td className="px-4 py-2 text-center">
                      {c.status === 'PENDING' && (
                        <button
                          onClick={async () => {
                            await api(`/api/vsla/social-fund/claims/${c.id}/approve`, {
                              method: 'POST',
                              body: JSON.stringify({ action: 'approve' }),
                            });
                            toast('Claim approved', 'success');
                          }}
                          className="text-xs px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                        >
                          Approve
                        </button>
                      )}
                      {c.status === 'APPROVED' && (
                        <button
                          onClick={async () => {
                            await api(`/api/vsla/social-fund/claims/${c.id}/approve`, {
                              method: 'POST',
                              body: JSON.stringify({ action: 'disburse', disbursementMethod: 'CASH' }),
                            });
                            toast('Claim disbursed', 'success');
                          }}
                          className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Disburse
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}

function VslaCyclesTab() {
  const { data, loading } = useApi('/api/vsla/cycles');
  if (loading) return <LoadingState />;
  if (!data) return null;

  return (
    <Card>
      <CardHeader title="VSLA Cycles" subtitle="Time-bound savings cycles with share-out" />
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.cycles.map((c: any) => (
          <Card key={c.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-slate-900">{c.name}</div>
                <div className="text-xs text-slate-500">{c.group?.name}</div>
              </div>
              <Badge status={c.status}>{c.status}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div><div className="text-slate-500">Start</div><div className="font-medium">{formatDate(c.startDate)}</div></div>
              <div><div className="text-slate-500">End</div><div className="font-medium">{formatDate(c.endDate)}</div></div>
              <div><div className="text-slate-500">Target Savings</div><div className="font-medium">{formatUGX(c.targetSavings)}</div></div>
              <div><div className="text-slate-500">Interest Earned</div><div className="font-medium text-emerald-700">{formatUGX(c.interestEarned)}</div></div>
              <div><div className="text-slate-500">Fines Collected</div><div className="font-medium">{formatUGX(c.finesCollected)}</div></div>
              <div><div className="text-slate-500">Share-Out/Share</div><div className="font-medium text-purple-700">{formatUGX(c.shareOutPerShare)}</div></div>
            </div>
            {c.status === 'ACTIVE' && (
              <button
                onClick={async () => {
                  if (!confirm('Process share-out? This will close the cycle.')) return;
                  const result = await api(`/api/vsla/cycles/${c.id}/share-out`, { method: 'POST' });
                  toast(`Share-out: ${formatUGX(result.shareOut.shareOutPerShare)} per share`, 'success');
                }}
                className="mt-3 w-full px-3 py-1.5 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
              >
                Process Share-Out
              </button>
            )}
          </Card>
        ))}
      </div>
    </Card>
  );
}

function VslaMeetingsTab() {
  const { data, loading } = useApi('/api/vsla/meetings?limit=50');
  if (loading) return <LoadingState />;
  if (!data) return null;

  return (
    <Card>
      <CardHeader title="Meetings" subtitle={`${data.meetings.length} meetings recorded`} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">#</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Group</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Title</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Attendance</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Savings</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.meetings.map((m: any) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-slate-600">{m.meetingNumber}</td>
                <td className="px-4 py-2 text-slate-600 text-xs">{formatDate(m.meetingDate)}</td>
                <td className="px-4 py-2 text-slate-600">{m.group?.name}</td>
                <td className="px-4 py-2 font-medium text-slate-900">{m.title}</td>
                <td className="px-4 py-2 text-center">
                  <span className="text-emerald-700 font-medium">{m.attendanceCount}</span>
                  <span className="text-slate-400"> / {m.totalMembers}</span>
                </td>
                <td className="px-4 py-2 text-right font-medium">{formatUGX(m.totalSavings)}</td>
                <td className="px-4 py-2 text-center"><Badge status={m.status}>{m.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function VslaReportsTab() {
  const [groupId, setGroupId] = useState<string | null>(null);
  const { data: groupsData } = useApi('/api/vsla/groups');

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <label className="text-xs font-semibold text-slate-600 uppercase block mb-2">Select Group for Comprehensive Report</label>
        <select
          value={groupId || ''}
          onChange={(e) => setGroupId(e.target.value || null)}
          className="w-full px-3 py-2 border rounded-md text-sm"
        >
          <option value="">— Choose a group —</option>
          {groupsData?.groups.map((g: any) => (
            <option key={g.id} value={g.id}>{g.name} ({g.code})</option>
          ))}
        </select>
      </Card>

      {groupId && <GroupReport groupId={groupId} />}
    </div>
  );
}

function GroupReport({ groupId }: { groupId: string }) {
  const { data, loading } = useApi(`/api/vsla/reports/group/${groupId}`);
  if (loading) return <LoadingState label="Generating report..." />;
  if (!data) return null;

  const { group, stats, portfolio, aging, memberStatements, trialBalance } = data;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Members" value={formatNumber(stats.memberCount)} icon={Users} color="emerald" />
        <KpiCard title="Total Savings" value={formatUGX(stats.savingsTotal)} icon={Wallet} color="emerald" />
        <KpiCard title="Outstanding Loans" value={formatUGX(stats.outstandingLoans)} icon={TrendingUp} color="amber" />
        <KpiCard title="Social Fund" value={formatUGX(stats.socialFundBalance)} icon={Handshake} color="purple" />
      </div>

      {/* Loan portfolio + aging */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Loan Portfolio" />
          <div className="p-5 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-600">Total Loans</span><span className="font-semibold">{portfolio.total}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Active</span><span className="font-semibold text-blue-700">{portfolio.active}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Disbursed Amount</span><span className="font-semibold">{formatUGX(portfolio.disbursedAmount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Outstanding</span><span className="font-semibold text-amber-700">{formatUGX(portfolio.outstandingAmount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Repaid</span><span className="font-semibold text-emerald-700">{formatUGX(portfolio.repaidAmount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Written Off</span><span className="font-semibold text-red-700">{portfolio.writtenOff}</span></div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Aging Buckets" subtitle="Outstanding by due-date bucket" />
          <div className="p-5 space-y-2 text-sm">
            {Object.entries(aging).map(([bucket, amount]: [string, any]) => (
              <div key={bucket} className="flex justify-between">
                <span className="text-slate-600">{bucket}</span>
                <span className="font-semibold">{formatUGX(amount)}</span>
              </div>
            ))}
            {Object.keys(aging).length === 0 && <div className="text-sm text-slate-500">No active loans to age</div>}
          </div>
        </Card>
      </div>

      {/* Trial Balance */}
      <Card>
        <CardHeader
          title="Trial Balance"
          subtitle={trialBalance.isBalanced ? '✓ Books are balanced' : '⚠ Books are out of balance'}
          action={<span className="text-xs text-slate-500">Double-entry ledger</span>}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Code</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Account</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Debit</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trialBalance.accounts.map((a: any) => (
                <tr key={a.code}>
                  <td className="px-4 py-2 text-slate-600 font-mono text-xs">{a.code}</td>
                  <td className="px-4 py-2 font-medium text-slate-900">{a.name}</td>
                  <td className="px-4 py-2"><Badge>{a.type}</Badge></td>
                  <td className="px-4 py-2 text-right">{a.debit > 0 ? formatUGX(a.debit) : '—'}</td>
                  <td className="px-4 py-2 text-right">{a.credit > 0 ? formatUGX(a.credit) : '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-300">
              <tr>
                <td colSpan={3} className="px-4 py-2 font-semibold text-slate-900">Total</td>
                <td className="px-4 py-2 text-right font-bold text-slate-900">{formatUGX(trialBalance.totalDebit)}</td>
                <td className="px-4 py-2 text-right font-bold text-slate-900">{formatUGX(trialBalance.totalCredit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Member statements */}
      <Card>
        <CardHeader title="Member Statements" subtitle={`${memberStatements.length} active members`} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Member</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Savings</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Shares</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Active Loans</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Outstanding</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {memberStatements.map((m: any) => (
                <tr key={m.memberId}>
                  <td className="px-4 py-2 font-medium text-slate-900">{m.name}<div className="text-xs text-slate-500">{m.memberId}</div></td>
                  <td className="px-4 py-2 text-right font-medium text-emerald-700">{formatUGX(m.totalSavings)}</td>
                  <td className="px-4 py-2 text-right">{m.totalShares}</td>
                  <td className="px-4 py-2 text-right">{m.activeLoans}</td>
                  <td className="px-4 py-2 text-right font-medium text-amber-700">{formatUGX(m.outstandingLoans)}</td>
                  <td className="px-4 py-2 text-slate-600 text-xs">{formatDate(m.joinedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// NSSF VIEW
// ============================================================

function NssfView() {
  const { data, loading } = useApi('/api/nssf/contributions?limit=100');
  if (loading) return <LoadingState />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <KpiCard title="Total Contributions" value={formatNumber(data.contributions.length)} icon={Landmark} color="blue" />
        <KpiCard title="Total Amount" value={formatUGX(data.total)} icon={Wallet} color="emerald" />
        <KpiCard title="Confirmed" value={formatNumber(data.contributions.filter((c: any) => c.status === 'CONFIRMED').length)} icon={CheckCircle2} color="emerald" />
        <KpiCard title="Failed" value={formatNumber(data.contributions.filter((c: any) => c.status === 'FAILED').length)} icon={AlertCircle} color="red" />
      </div>

      <Card>
        <CardHeader title="NSSF Contributions" subtitle="Farmer contributions with auto-SMS confirmation" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Farmer</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">NSSF #</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Amount</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Method</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Partner</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">SMS</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.contributions.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-600 text-xs">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-2 font-medium text-slate-900">{c.farmerName}<div className="text-xs text-slate-500">{c.farmerPhone}</div></td>
                  <td className="px-4 py-2 text-slate-600 text-xs">{c.nssfNumber || '—'}</td>
                  <td className="px-4 py-2 text-right font-medium">{formatUGX(c.amount)}</td>
                  <td className="px-4 py-2 text-center text-xs">{c.paymentMethod}</td>
                  <td className="px-4 py-2 text-center">{c.partnerCode ? <Badge>{c.partnerCode}</Badge> : '—'}</td>
                  <td className="px-4 py-2 text-center">{c.smsSent ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <Clock className="w-4 h-4 text-amber-500 mx-auto" />}</td>
                  <td className="px-4 py-2 text-center"><Badge status={c.status}>{c.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// PAYMENTS VIEW
// ============================================================

function PaymentsView() {
  const { data, loading } = useApi('/api/payments?limit=100');
  if (loading) return <LoadingState />;
  if (!data) return null;

  const stats = {
    success: data.payments.filter((p: any) => p.status === 'SUCCESS').length,
    pending: data.payments.filter((p: any) => p.status === 'PENDING').length,
    failed: data.payments.filter((p: any) => p.status === 'FAILED').length,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Total Payments" value={formatNumber(data.payments.length)} icon={Smartphone} color="purple" />
        <KpiCard title="Total Volume" value={formatUGX(data.total)} icon={Wallet} color="emerald" />
        <KpiCard title="Success Rate" value={`${data.payments.length > 0 ? Math.round((stats.success / data.payments.length) * 100) : 0}%`} icon={CheckCircle2} color="emerald" />
        <KpiCard title="Pending" value={formatNumber(stats.pending)} icon={Clock} color="amber" />
      </div>

      <Card>
        <CardHeader title="Mobile Money Transactions" subtitle="MTN MoMo · Airtel Money · Flutterwave" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Reference</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Payer</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Amount</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Provider</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Type</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.payments.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-600 text-xs">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-2 text-xs font-mono text-slate-500">{p.reference}</td>
                  <td className="px-4 py-2 font-medium text-slate-900">{p.payerName || '—'}<div className="text-xs text-slate-500">{p.payerPhone}</div></td>
                  <td className="px-4 py-2 text-right font-medium">{formatUGX(p.amount)}</td>
                  <td className="px-4 py-2 text-center"><Badge>{p.provider}</Badge></td>
                  <td className="px-4 py-2 text-center text-xs text-slate-600">{p.type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-2 text-center"><Badge status={p.status}>{p.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// SMS VIEW
// ============================================================

function SmsView() {
  const { data, loading } = useApi('/api/sms?limit=100');
  if (loading) return <LoadingState />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard title="Total Sent" value={formatNumber(data.stats.total)} icon={MessageSquare} color="emerald" />
        <KpiCard title="Delivered" value={formatNumber(data.stats.sent)} icon={CheckCircle2} color="emerald" />
        <KpiCard title="Pending" value={formatNumber(data.stats.pending)} icon={Clock} color="amber" />
        <KpiCard title="Failed" value={formatNumber(data.stats.failed)} icon={AlertCircle} color="red" />
        <KpiCard title="Categories" value={formatNumber(data.stats.byCategory.length)} icon={PieChart} color="slate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader title="Categories" subtitle="By message type" />
          <div className="p-5 space-y-2">
            {data.stats.byCategory.map((c: any) => (
              <div key={c.category} className="flex justify-between text-sm">
                <span className="text-slate-600">{c.category}</span>
                <span className="font-semibold">{c._count.id}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Recent SMS Logs" subtitle="Africa's Talking gateway" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">To</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Template</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Message</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.logs.slice(0, 20).map((l: any) => (
                  <tr key={l.id}>
                    <td className="px-4 py-2 text-xs text-slate-600">{formatDate(l.createdAt)}</td>
                    <td className="px-4 py-2 text-slate-600 text-xs">{l.toPhone}</td>
                    <td className="px-4 py-2"><Badge>{l.templateCode || l.category}</Badge></td>
                    <td className="px-4 py-2 text-xs text-slate-700 max-w-md truncate">{l.message}</td>
                    <td className="px-4 py-2 text-center"><Badge status={l.status}>{l.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// USSD VIEW
// ============================================================

function UssdView() {
  const { data, loading } = useApi('/api/ussd?limit=100');
  if (loading) return <LoadingState />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Total Sessions" value={formatNumber(data.stats.total)} icon={Hash} color="slate" />
        <KpiCard title="Completed" value={formatNumber(data.stats.completed)} icon={CheckCircle2} color="emerald" />
        <KpiCard title="Timed Out" value={formatNumber(data.stats.timedOut)} icon={Clock} color="amber" />
        <KpiCard title="Active Menus" value={formatNumber(data.stats.byMenu.length)} icon={Menu} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Menu Distribution" />
          <div className="p-5 space-y-2 text-sm">
            {data.stats.byMenu.map((m: any) => (
              <div key={m.currentMenu} className="flex justify-between">
                <span className="text-slate-600">{m.currentMenu}</span>
                <span className="font-semibold">{m._count.id}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Recent Sessions" subtitle="Service code: *284*97#" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Phone</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Menu</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Duration</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.sessions.slice(0, 20).map((s: any) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2 text-xs text-slate-600">{formatDate(s.createdAt)}</td>
                    <td className="px-4 py-2 text-xs">{s.phoneNumber}</td>
                    <td className="px-4 py-2"><Badge>{s.currentMenu}</Badge></td>
                    <td className="px-4 py-2 text-right text-xs">{s.duration}s</td>
                    <td className="px-4 py-2 text-center"><Badge status={s.status}>{s.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// PARTNERS VIEW (Kilimo Trust)
// ============================================================

function PartnersView() {
  const { data: partnersData, loading } = useApi('/api/partners');
  const { data: splitsData } = useApi('/api/admin/revenue-split');
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const { data: settlementsData } = useApi(selectedPartner ? `/api/partners/${selectedPartner}/settlements` : null);

  if (loading) return <LoadingState />;

  const partner = partnersData?.partners[0];
  const agreementTerms = partner?.agreementTerms ? JSON.parse(partner.agreementTerms) : null;

  return (
    <div className="space-y-4">
      {partner && (
        <>
          <Card>
            <CardHeader title="Kilimo Trust Partnership" subtitle="MoU executed 22 July 2025" action={<Badge status={partner.status}>{partner.status}</Badge>} />
            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase">Partner</div>
                <div className="font-semibold text-slate-900">{partner.name}</div>
                <div className="text-sm text-slate-600">{partner.contactName}</div>
                <div className="text-xs text-slate-500">{partner.contactEmail}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase">Operational Role</div>
                <div className="text-sm text-slate-700">Farmer mobilization, coordination, M&E, all field activities</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase">MobiPay Role</div>
                <div className="text-sm text-slate-700">System provision, farmer onboarding, payment infrastructure</div>
              </div>
            </div>
          </Card>

          {agreementTerms && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase">A. Program Commission</div>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-slate-600">Kilimo Trust</span><span className="font-bold text-emerald-700">{agreementTerms.commission.kilimoTrust}%</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-600">MobiPay</span><span className="font-bold text-slate-900">{agreementTerms.commission.mobipay}%</span></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Lead mobilizer takes the larger share</p>
              </Card>
              <Card className="p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase">B. Transaction Fees</div>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-slate-600">MobiPay</span><span className="font-bold text-emerald-700">{agreementTerms.transactionFee.mobipay}%</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-600">Kilimo Trust</span><span className="font-bold text-slate-900">{agreementTerms.transactionFee.kilimoTrust}%</span></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">MobiPay absorbs system, USSD, payment processing costs</p>
              </Card>
              <Card className="p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase">C. Float Income</div>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-slate-600">Kilimo Trust</span><span className="font-bold text-emerald-700">{agreementTerms.float.kilimoTrust}%</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-600">MobiPay</span><span className="font-bold text-slate-900">{agreementTerms.float.mobipay}%</span></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">OVA held by KT. Float risk transferred to KT.</p>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Revenue splits */}
      <Card>
        <CardHeader title="Revenue Splits (Live)" subtitle="Per-transaction splits across the three streams" />
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {splitsData?.summary.map((s: any) => (
            <Card key={s.streamType} className="p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase">{s.streamType.replace(/_/g, ' ')}</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{formatUGX(s._sum.grossAmount)}</div>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-slate-600">KT share</span><span className="font-semibold text-emerald-700">{formatUGX(s._sum.partnerShare)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">MP share</span><span className="font-semibold text-slate-900">{formatUGX(s._sum.mobipayShare)}</span></div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Settlements */}
      <Card>
        <CardHeader
          title="Monthly Settlements"
          subtitle="Per-stream monthly settlement statements"
          action={partner && (
            <button
              onClick={() => setSelectedPartner(partner.id)}
              className="text-xs text-emerald-700 hover:underline"
            >
              {selectedPartner ? 'Hide details' : 'Load details'}
            </button>
          )}
        />
        {selectedPartner && settlementsData && (
          <div className="p-5">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Period</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Stream</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Gross</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">KT Share</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">MP Share</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settlementsData.settlements.map((s: any) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2 font-medium">{s.period}</td>
                    <td className="px-4 py-2"><Badge>{s.streamType}</Badge></td>
                    <td className="px-4 py-2 text-right">{formatUGX(s.grossAmount)}</td>
                    <td className="px-4 py-2 text-right text-emerald-700 font-medium">{formatUGX(s.partnerShare)}</td>
                    <td className="px-4 py-2 text-right font-medium">{formatUGX(s.mobipayShare)}</td>
                    <td className="px-4 py-2 text-center"><Badge status={s.status}>{s.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ============================================================
// REPORTS VIEW (Platform-wide analytics)
// ============================================================

function ReportsView() {
  const { data, loading } = useApi('/api/admin/overview');
  const { data: agingData } = useApi('/api/vsla/reports/aging');

  if (loading) return <LoadingState />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Platform Volume</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{formatUGX(data.financials.totalSavings + data.financials.disbursedLoans + data.financials.nssfTotal + data.financials.paymentsTotal)}</div>
          <div className="text-xs text-slate-500 mt-1">Savings + Loans + NSSF + Payments</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase">SMS Delivery Rate</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{data.counts.smsLogs > 0 ? Math.round((data.moduleUsage.SMS.sent / data.counts.smsLogs) * 100) : 0}%</div>
          <div className="text-xs text-slate-500 mt-1">{data.moduleUsage.SMS.sent} of {data.counts.smsLogs} delivered</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase">Payment Success Rate</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{data.counts.payments > 0 ? Math.round((data.moduleUsage.PAYMENTS.successful / data.counts.payments) * 100) : 0}%</div>
          <div className="text-xs text-slate-500 mt-1">{data.moduleUsage.PAYMENTS.successful} of {data.counts.payments} successful</div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Aging Report" subtitle="Outstanding loans across all VSLA groups" />
        <div className="p-5">
          {agingData && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {Object.entries(agingData.summary).map(([bucket, info]: [string, any]) => (
                <Card key={bucket} className="p-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase">{bucket}</div>
                  <div className="mt-1 text-lg font-bold text-slate-900">{info.count}</div>
                  <div className="text-xs text-amber-700 font-medium">{formatUGX(info.amount)}</div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Module Usage Heatmap" subtitle="Per-module activity across the platform" />
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(data.moduleUsage).map(([module, info]: [string, any]) => (
            <Card key={module} className="p-3">
              <div className="text-xs font-semibold text-slate-500 uppercase">{module}</div>
              <div className="mt-1 text-lg font-bold text-slate-900">
                {module === 'VSLA' ? `${info.groups}G / ${info.members}M` :
                 module === 'NSSF' ? formatNumber(info.contributions) :
                 module === 'PAYMENTS' ? formatNumber(info.total) :
                 module === 'SMS' ? formatNumber(info.total) :
                 module === 'USSD' ? formatNumber(info.sessions) :
                 module === 'PARTNERS' ? formatNumber(info.count) :
                 module === 'AUDIT' ? formatNumber(info.events) : '—'}
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// AUDIT VIEW
// ============================================================

function AuditView() {
  const { data, loading } = useApi('/api/admin/audit-log?limit=200');
  if (loading) return <LoadingState />;
  if (!data) return null;

  return (
    <Card>
      <CardHeader title="Audit Log" subtitle={`${data.logs.length} events recorded`} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Timestamp</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Actor</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Role</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Action</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Entity</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.logs.map((log: any) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-xs text-slate-600">{formatDateTime(log.createdAt)}</td>
                <td className="px-4 py-2 font-medium text-slate-900">{log.actorName || 'System'}</td>
                <td className="px-4 py-2 text-xs text-slate-600">{log.actorRole || '—'}</td>
                <td className="px-4 py-2 text-center"><Badge status={log.action}>{log.action}</Badge></td>
                <td className="px-4 py-2 text-xs text-slate-600">{log.entityType}</td>
                <td className="px-4 py-2 text-xs text-slate-700">{log.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ============================================================
// USERS VIEW
// ============================================================

function UsersView() {
  const { data, loading } = useApi('/api/admin/users');
  if (loading) return <LoadingState />;
  if (!data) return null;

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-800',
    TENANT_ADMIN: 'bg-blue-100 text-blue-800',
    VSLA_OFFICER: 'bg-emerald-100 text-emerald-800',
    PARTNER_ADMIN: 'bg-purple-100 text-purple-800',
    FARMER: 'bg-slate-100 text-slate-700',
  };

  return (
    <Card>
      <CardHeader title="Platform Users" subtitle={`${data.users.length} users across all tenants`} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">User</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Tenant</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Role</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Last Login</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.users.map((u: any) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <div className="font-medium text-slate-900">{u.name}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </td>
                <td className="px-4 py-2 text-slate-600">{u.tenant?.name || '—'}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[u.role] || 'bg-slate-100'}`}>{u.role}</span>
                </td>
                <td className="px-4 py-2 text-xs text-slate-600">{u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'Never'}</td>
                <td className="px-4 py-2 text-center"><Badge status={u.status}>{u.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ============================================================
// TENANTS VIEW
// ============================================================

function TenantsView() {
  const { data, loading } = useApi('/api/admin/tenants');
  if (loading) return <LoadingState />;
  if (!data) return null;

  return (
    <Card>
      <CardHeader title="Tenants" subtitle={`${data.tenants.length} organizations on the platform`} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Tenant</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Country</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Plan</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">MRR</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Users</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">VSLA Groups</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Members</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Savings</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.tenants.map((t: any) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <div className="font-medium text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.code}</div>
                </td>
                <td className="px-4 py-2 text-slate-600">{t.country || '—'}</td>
                <td className="px-4 py-2 text-center"><Badge>{t.plan}</Badge></td>
                <td className="px-4 py-2 text-right font-medium">{formatUGX(t.mrr)}</td>
                <td className="px-4 py-2 text-right text-slate-600">{t._count?.users ?? 0}</td>
                <td className="px-4 py-2 text-right text-slate-600">{t.vslaGroupCount ?? 0}</td>
                <td className="px-4 py-2 text-right text-slate-600">{t.vslaMemberCount ?? 0}</td>
                <td className="px-4 py-2 text-right font-medium text-emerald-700">{formatUGX(t.savingsTotal)}</td>
                <td className="px-4 py-2 text-center"><Badge status={t.status}>{t.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ============================================================
// MODULES VIEW (Unified Module Registry)
// ============================================================

function ModulesView() {
  const { data, loading, refetch } = useApi('/api/admin/modules');
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const { data: tenantsData } = useApi('/api/admin/tenants');

  if (loading) return <LoadingState />;
  if (!data) return null;

  const tenantModules = selectedTenant
    ? data.modules
    : data.modules;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Unified Module Registry</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Single source of truth — {data.modules.length} modules across {['Platform', 'Finance', 'Communication', 'Intelligence', 'Compliance'].length} categories.
              Reconciles entitlement engine (18), config UI (23), default tenant (11), and RBAC (30) into one list.
            </p>
          </div>
          <select
            value={selectedTenant || ''}
            onChange={(e) => setSelectedTenant(e.target.value || null)}
            className="px-3 py-1.5 border rounded-md text-sm"
          >
            <option value="">All tenants (default)</option>
            {tenantsData?.tenants.map((t: any) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tenantModules.map((m: any) => {
          const Icon = iconMap[m.icon] || Boxes;
          return (
            <Card key={m.code} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center ${m.isCore ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{m.name}</div>
                    <div className="text-xs text-slate-500">{m.code}</div>
                  </div>
                </div>
                {m.isCore && <Badge status="ACTIVE">CORE</Badge>}
              </div>
              <p className="text-xs text-slate-600 mt-2">{m.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <Badge>{m.category}</Badge>
                {selectedTenant && (
                  <button
                    onClick={async () => {
                      await api('/api/admin/modules', {
                        method: 'POST',
                        body: JSON.stringify({
                          tenantId: selectedTenant,
                          moduleCode: m.code,
                          isEnabled: !m.isEnabled,
                        }),
                      });
                      toast(`${m.name} ${!m.isEnabled ? 'enabled' : 'disabled'}`, 'success');
                      refetch();
                    }}
                    className={`text-xs px-2 py-1 rounded ${m.isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {m.isEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

const iconMap: Record<string, any> = {
  LayoutDashboard, Users, Landmark, Smartphone, MessageSquare, Hash,
  Handshake, BarChart3, ShieldCheck, UserCog, Building2, Boxes,
  ShoppingCart, GraduationCap, Footprints, CreditCard, Code, Leaf,
  CheckCircle: CheckCircle2, Globe2, Server, PieChart, FileText, Wallet,
};

// ============================================================
// LOGIN SCREEN
// ============================================================

function LoginScreen({ onLogin }: { onLogin: (user: any) => void }) {
  const [email, setEmail] = useState('eric@mobipay.agrobase');
  const [password, setPassword] = useState('mobipay2025');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: credData } = useApi('/api/auth/login');

  async function submit(e?: React.FormEvent, quickEmail?: string, quickPassword?: string) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: quickEmail || email,
          password: quickPassword || password,
        }),
      });
      toast(`Welcome, ${result.user.name}`, 'success');
      onLogin(result.user);
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  function quickLogin(cred: any) {
    setEmail(cred.email);
    setPassword(cred.password);
    submit(undefined, cred.email, cred.password);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Branding */}
        <div className="hidden lg:flex flex-col justify-center p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl">M</div>
            <div>
              <div className="text-2xl font-bold text-slate-900">MobiPay Agrobase</div>
              <div className="text-sm text-slate-600">Platform Admin · V3</div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Test the full VSLA module
          </h1>
          <p className="text-slate-700 mb-6">
            Pick any demo role on the right to log in instantly. Each role sees a different slice of the platform — super admin sees everything, VSLA officer sees the field operations, partner admin sees the Kilimo Trust revenue splits.
          </p>
          <div className="space-y-2 text-sm text-slate-700">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
              <span>5 VSLA groups, 42 members, 32 loans, 561 savings records seeded</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
              <span>Double-entry bookkeeping with auto-balancing trial balance</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
              <span>Kilimo Trust MoU terms captured with live revenue splits</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
              <span>Full loan lifecycle: apply → approve → disburse → repay → write-off</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
              <span>Social fund, cycles with share-out, fines, officer roles</span>
            </div>
          </div>
        </div>

        {/* Right: Login form + quick logins */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-1">Sign in</h2>
          <p className="text-sm text-slate-500 mb-5">Use any demo credential below — or pick one to auto-fill.</p>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-emerald-600 text-white py-2 rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4 rotate-180" />}
              {busy ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase mb-3">Quick login (one click)</div>
            <div className="space-y-2">
              {credData?.credentials?.map((cred: any) => (
                <button
                  key={cred.email}
                  onClick={() => quickLogin(cred)}
                  disabled={busy}
                  className="w-full text-left p-3 rounded-md border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900">{cred.name}</div>
                      <div className="text-xs text-slate-500">{cred.email}</div>
                      <div className="text-xs text-slate-600 mt-1">{cred.description}</div>
                    </div>
                    <div className="ml-2 flex flex-col items-end gap-1">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{cred.role}</span>
                      <span className="text-xs font-mono text-slate-500">{cred.password}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200 text-xs text-slate-500">
            <p className="font-semibold text-slate-700 mb-1">Demo only — no real authentication</p>
            <p>Sessions expire after 8 hours. Use the "Reseed demo data" button in the sidebar to reset all VSLA, NSSF, payment, SMS, USSD, and audit data.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
