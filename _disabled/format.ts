// Shared formatters for the unified admin UI

export function formatUGX(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return 'UGX 0';
  return `UGX ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return n.toLocaleString('en-US');
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(d);
}

export function statusColor(status: string): string {
  const s = status?.toUpperCase() ?? '';
  if (['ACTIVE', 'COMPLETED', 'SUCCESS', 'SENT', 'DELIVERED', 'REPAID', 'PAID', 'CONFIRMED'].includes(s)) {
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }
  if (['PENDING', 'SCHEDULED', 'TRIAL'].includes(s)) {
    return 'bg-amber-100 text-amber-800 border-amber-200';
  }
  if (['FAILED', 'REJECTED', 'OVERDUE', 'DEFAULTED', 'WRITTEN_OFF', 'CANCELLED'].includes(s)) {
    return 'bg-red-100 text-red-800 border-red-200';
  }
  if (['DISBURSED', 'APPROVED', 'IN_PROGRESS'].includes(s)) {
    return 'bg-blue-100 text-blue-800 border-blue-200';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200';
}
