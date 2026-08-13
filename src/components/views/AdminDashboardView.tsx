import React, { useState, useEffect, useMemo } from 'react';
import { Language } from '../../types';
import {
  ArrowLeft,
  ShieldCheck,
  BarChart3,
  Activity,
  Users,
  MessageSquare,
  FileText,
  Scale,
  X,
  Check,
  RefreshCw,
  AlertTriangle,
  KeyRound,
  BadgeCheck,
  LayoutDashboard,
} from 'lucide-react';
import { TrustStats, Lawyer, VerificationStatus } from '../../types/database';

interface AdminDashboardViewProps {
  language: Language;
  onBackToHome: () => void;
}

interface SummaryRow {
  event: string;
  date: string;
  count: number;
}

const DEFAULT_STATS: TrustStats = {
  total_consultations: 0,
  resolved_cases: 0,
  verified_lawyers: 0,
  avg_rating: 0,
};

const statusBadge = (status: string): { text: string; cls: string } => {
  if (status === 'verified') {
    return { text: 'Verified', cls: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]' };
  }
  if (status === 'rejected') {
    return { text: 'Rejected', cls: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]' };
  }
  return { text: 'Pending', cls: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]' };
};

const formatValue = (value: number): string => (Number.isInteger(value) ? String(value) : value.toFixed(1));

const extractSummary = (json: any): SummaryRow[] => {
  const raw = json?.summary ?? json?.events ?? (Array.isArray(json) ? json : []);
  if (!Array.isArray(raw)) return [];
  return raw.map((row: any) => ({
    event: row?.event ?? row?.event_name ?? 'unknown',
    date: row?.date ?? row?.created_at ?? row?.day ?? '',
    count: typeof row?.count === 'number' ? row.count : Number(row?.count ?? 0),
  }));
};

const extractLawyers = (json: any): Lawyer[] => {
  const raw = json?.lawyers ?? json?.data ?? (Array.isArray(json) ? json : []);
  return Array.isArray(raw) ? (raw as Lawyer[]) : [];
};

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ language, onBackToHome }) => {
  const [adminKey, setAdminKey] = useState<string>(() => localStorage.getItem('mw_admin_key') || '');
  const [authed, setAuthed] = useState<boolean>(() => sessionStorage.getItem('mw_admin_authed') === '1');
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [stats, setStats] = useState<TrustStats>(DEFAULT_STATS);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAuthError = () => {
    setAuthed(false);
    sessionStorage.removeItem('mw_admin_authed');
    setError('Invalid or expired admin key');
  };

  const fetchAll = async (key: string) => {
    setLoading(true);
    try {
      const [summaryRes, statsRes, lawyersRes] = await Promise.all([
        fetch('/api/analytics/summary', { headers: { 'x-admin-key': key } }),
        fetch('/api/db/stats/trust', { headers: { 'x-admin-key': key } }),
        fetch('/api/db/lawyers', { headers: { 'x-admin-key': key } }),
      ]);
      if (
        summaryRes.status === 401 ||
        summaryRes.status === 403 ||
        statsRes.status === 401 ||
        statsRes.status === 403 ||
        lawyersRes.status === 401 ||
        lawyersRes.status === 403
      ) {
        handleAuthError();
        return;
      }
      if (summaryRes.ok) {
        const json = await summaryRes.json();
        setSummary(extractSummary(json));
      }
      if (statsRes.ok) {
        const json = await statsRes.json();
        const s = json?.stats ?? json;
        setStats({
          total_consultations: Number(s?.total_consultations ?? 0),
          resolved_cases: Number(s?.resolved_cases ?? 0),
          verified_lawyers: Number(s?.verified_lawyers ?? 0),
          avg_rating: Number(s?.avg_rating ?? 0),
        });
      }
      if (lawyersRes.ok) {
        const json = await lawyersRes.json();
        setLawyers(extractLawyers(json));
      }
    } catch (err) {
      console.warn('AdminDashboardView fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) {
      fetchAll(adminKey);
    }
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/analytics/summary', {
        headers: { 'x-admin-key': adminKey.trim() },
      });
      if (res.status === 401 || res.status === 403 || !res.ok) {
        setError('Invalid admin key');
        return;
      }
      localStorage.setItem('mw_admin_key', adminKey.trim());
      sessionStorage.setItem('mw_admin_authed', '1');
      setAuthed(true);
      await fetchAll(adminKey.trim());
    } catch (err) {
      console.warn('Admin login notice:', err);
      setError('Invalid admin key');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('mw_admin_authed');
    localStorage.removeItem('mw_admin_key');
    setAuthed(false);
    setSummary([]);
    setLawyers([]);
    setStats(DEFAULT_STATS);
  };

  const handleVerification = async (lawyerId: string, status: VerificationStatus) => {
    setActionLoading(lawyerId);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/lawyers/${encodeURIComponent(lawyerId)}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ verification_status: status }),
      });
      if (res.status === 401 || res.status === 403) {
        handleAuthError();
        return;
      }
      if (res.ok) {
        setNotice(`Lawyer ${status === 'verified' ? 'verified' : 'rejected'} successfully`);
        await fetchAll(adminKey);
      } else {
        setNotice('Action failed. Please retry.');
      }
    } catch (err) {
      console.warn('Verification notice:', err);
      setNotice('Action failed. Please retry.');
    } finally {
      setActionLoading(null);
    }
  };

  const groupedEvents = useMemo(() => {
    const grouped = new Map<string, SummaryRow[]>();
    summary.forEach((row) => {
      const key = row.event;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(row);
    });
    const rows: SummaryRow[] = [];
    grouped.forEach((eventRows, event) => {
      eventRows
        .slice()
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))
        .forEach((r) => rows.push({ event, date: r.date, count: r.count }));
    });
    return rows.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [summary]);

  const statCards: {
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
    iconColor: string;
  }[] = [
    {
      label: 'Total Consultations',
      value: stats.total_consultations,
      icon: Activity,
      accent: 'bg-gradient-to-br from-[#D98800] to-[#F5A623]',
      iconColor: 'text-[#0F1D38]',
    },
    {
      label: 'Resolved Cases',
      value: stats.resolved_cases,
      icon: Scale,
      accent: 'bg-gradient-to-br from-[#0F1D38] to-[#1E2E4F]',
      iconColor: 'text-[#F5A623]',
    },
    {
      label: 'Verified Lawyers',
      value: stats.verified_lawyers,
      icon: ShieldCheck,
      accent: 'bg-gradient-to-br from-[#D98800] to-[#F5A623]',
      iconColor: 'text-[#0F1D38]',
    },
    {
      label: 'Avg. Rating',
      value: stats.avg_rating,
      icon: BadgeCheck,
      accent: 'bg-gradient-to-br from-[#0F1D38] to-[#1E2E4F]',
      iconColor: 'text-[#F5A623]',
    },
  ];

  const pendingCount = lawyers.filter((l) => l.verification_status === 'pending').length;

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-10 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-md mx-auto space-y-6">
          <div className="bg-[#0F1D38] text-[#FFFFFF] rounded-3xl p-6 sm:p-8 shadow-xl border border-[#1E2E4F] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4A017]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-3 bg-[#D4A017] text-[#0F1D38] rounded-2xl shadow-md font-bold">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold leading-tight">Admin Dashboard</h1>
                <p className="text-xs text-[#CBD5E1] mt-0.5">Restricted area — staff only</p>
              </div>
            </div>
            <button
              onClick={onBackToHome}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 border border-[#FFFFFF]/20 text-xs font-bold transition-all cursor-pointer relative z-10"
            >
              <ArrowLeft className="w-4 h-4 text-[#D4A017]" />
              Back to Home
            </button>
          </div>

          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-[#0F1D38] text-[#F5A623] rounded-xl shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-[#0F1D38]">Enter Admin Key</h2>
                <p className="text-xs text-[#64748B] mt-0.5">Provide the admin key to access internal analytics.</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Admin key"
                autoComplete="off"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] focus:outline-none focus:border-[#D98800] focus:ring-2 focus:ring-[#D98800]/20 text-sm text-[#0F1D38] bg-[#FFFFFF]"
              />
              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-bold text-[#DC2626]">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading || !adminKey.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#D98800] to-[#F5A623] text-[#0F1D38] text-sm font-extrabold shadow-md hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {loading ? 'Checking…' : 'Access Dashboard'}
              </button>
            </form>

            <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
              {[
                { icon: Users, text: 'Lawyer KYC verification queue' },
                { icon: MessageSquare, text: 'Consultation & engagement analytics' },
                { icon: FileText, text: 'Case and document trust stats' },
              ].map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.text} className="flex items-center gap-2 text-xs text-[#64748B]">
                    <Icon className="w-4 h-4 text-[#D98800] shrink-0" />
                    <span>{row.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">

        <div className="bg-[#0F1D38] text-[#FFFFFF] rounded-3xl p-6 sm:p-8 shadow-xl border border-[#1E2E4F] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4A017]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#FFFFFF]/15 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#D4A017] text-[#0F1D38] rounded-2xl shadow-md font-bold">
                <LayoutDashboard className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FFFFFF] leading-tight">Admin Dashboard</h1>
                <p className="text-xs sm:text-sm text-[#CBD5E1] mt-1">
                  Aggregate analytics, trust stats & lawyer KYC verification.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => fetchAll(adminKey)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 border border-[#FFFFFF]/20 text-xs font-bold transition-all cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 text-[#D4A017] ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#DC2626]/20 hover:bg-[#DC2626]/30 border border-[#DC2626]/40 text-xs font-bold text-[#FCA5A5] transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
                Logout
              </button>
              <button
                onClick={onBackToHome}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 border border-[#FFFFFF]/20 text-xs font-bold transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#D4A017]" />
                Back to Home
              </button>
            </div>
          </div>
        </div>

        {notice && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs font-bold text-[#059669] shadow-sm">
            <Check className="w-4 h-4 shrink-0" />
            {notice}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-bold text-[#DC2626] shadow-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-sm p-5 space-y-3"
              >
                <div className={`w-11 h-11 rounded-2xl ${card.accent} ${card.iconColor} flex items-center justify-center shadow-md`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">{card.label}</p>
                  <p className="text-2xl font-extrabold text-[#0F1D38] mt-1">{formatValue(card.value)}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="border-b border-[#E2E8F0] px-5 py-4 flex items-center justify-between gap-2 bg-[#F8FAFC]">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#D98800]" />
              <h3 className="text-sm font-extrabold text-[#0F1D38]">Events over time</h3>
            </div>
            <span className="text-[10px] font-bold text-[#64748B] bg-[#FFFFFF] border border-[#E2E8F0] rounded-full px-2.5 py-1">
              {summary.length} records
            </span>
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#F8FAFC]">
                <tr className="border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider text-[#64748B]">
                  <th className="px-5 py-2.5 font-extrabold">Event</th>
                  <th className="px-5 py-2.5 font-extrabold">Date</th>
                  <th className="px-5 py-2.5 font-extrabold">Count</th>
                </tr>
              </thead>
              <tbody>
                {groupedEvents.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-[#94A3B8]">
                      No events recorded yet.
                    </td>
                  </tr>
                ) : (
                  groupedEvents.map((row, index) => (
                    <tr
                      key={`${row.event}-${row.date}-${index}`}
                      className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]"
                    >
                      <td className="px-5 py-2.5 font-bold text-[#0F1D38] capitalize">{row.event.replace(/_/g, ' ')}</td>
                      <td className="px-5 py-2.5 font-mono text-[#64748B]">{row.date}</td>
                      <td className="px-5 py-2.5 font-extrabold text-[#D98800]">{row.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="border-b border-[#E2E8F0] px-5 py-4 flex items-center justify-between gap-2 bg-[#F8FAFC]">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#D98800]" />
              <h3 className="text-sm font-extrabold text-[#0F1D38]">Lawyer KYC Verification Queue</h3>
            </div>
            {pendingCount > 0 && (
              <span className="text-[10px] font-bold text-[#B45309] bg-[#FFFBEB] border border-[#FDE68A] rounded-full px-2.5 py-1">
                {pendingCount} pending
              </span>
            )}
          </div>
          <div className="divide-y divide-[#E2E8F0]">
            {lawyers.length === 0 ? (
              <div className="px-5 py-10 text-center text-xs text-[#94A3B8]">No lawyers found.</div>
            ) : (
              lawyers.map((lawyer) => {
                const badge = statusBadge(lawyer.verification_status);
                const canAct = lawyer.verification_status === 'pending' || lawyer.verification_status === 'rejected';
                const name = lawyer.profile?.full_name || lawyer.id;
                const initials =
                  name
                    .split(' ')
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || 'L';
                return (
                  <div key={lawyer.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#0F1D38] text-[#F5A623] font-extrabold text-sm flex items-center justify-center shrink-0 border border-[#D98800]/40">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-extrabold text-[#0F1D38] truncate">{name}</p>
                          {lawyer.is_verified && <BadgeCheck className="w-4 h-4 text-[#059669] shrink-0" />}
                        </div>
                        <p className="text-[11px] text-[#64748B] mt-0.5 truncate">
                          Bar Reg: <span className="font-mono font-bold text-[#0F1D38]">{lawyer.bar_council_number || '—'}</span>
                          {lawyer.bar_council_state ? ` • ${lawyer.bar_council_state}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-extrabold ${badge.cls}`}>
                        {badge.text}
                      </span>
                      {canAct && (
                        <>
                          <button
                            onClick={() => handleVerification(lawyer.id, 'verified')}
                            disabled={actionLoading !== null}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] text-[11px] font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === lawyer.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            Verify ✓
                          </button>
                          <button
                            onClick={() => handleVerification(lawyer.id, 'rejected')}
                            disabled={actionLoading !== null}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-[#FFFFFF] text-[11px] font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboardView;
