import { useEffect, useState } from 'react';
import { ChevronLeft, RefreshCw, ShieldAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { BottomNav } from '../components/layout/BottomNav';
import type { Page, Club, ClubFund, ClubMember } from '../lib/types';

interface OfficerClubFundsProps {
  clubId: string;
  onNavigate: (page: Page, id?: string) => void;
  onBack: () => void;
  onFundSelect?: (fundType: FundType) => void;
}

type FundType = 'IRA' | 'DOC' | 'ASI' | 'Club Fund';

const FUND_TYPES: FundType[] = ['IRA', 'DOC', 'ASI', 'Club Fund'];

interface FundColors {
  bg: string;
  border: string;
  titleText: string;
  usedColor: string;
  availableColor: string;
  usedLabel: string;
  availableLabel: string;
}

const FUND_CONFIG: Record<FundType, FundColors> = {
  IRA: {
    bg: 'bg-white',
    border: 'border-slate-100',
    titleText: 'text-slate-800',
    usedColor: '#10b981',
    availableColor: '#d1fae5',
    usedLabel: 'text-emerald-600',
    availableLabel: 'text-emerald-300',
  },
  DOC: {
    bg: 'bg-white',
    border: 'border-slate-100',
    titleText: 'text-slate-800',
    usedColor: '#0ea5e9',
    availableColor: '#bae6fd',
    usedLabel: 'text-sky-600',
    availableLabel: 'text-sky-300',
  },
  ASI: {
    bg: 'bg-white',
    border: 'border-slate-100',
    titleText: 'text-slate-800',
    usedColor: '#f59e0b',
    availableColor: '#fde68a',
    usedLabel: 'text-amber-600',
    availableLabel: 'text-amber-300',
  },
  'Club Fund': {
    bg: 'bg-white',
    border: 'border-slate-100',
    titleText: 'text-slate-800',
    usedColor: '#f43f5e',
    availableColor: '#fecdd3',
    usedLabel: 'text-rose-600',
    availableLabel: 'text-rose-300',
  },
};

function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function OfficerClubFunds({ clubId, onNavigate, onBack, onFundSelect }: OfficerClubFundsProps) {
  const { user } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [funds, setFunds] = useState<Map<FundType, ClubFund>>(new Map());
  const [userRole, setUserRole] = useState<ClubMember['role'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    if (!user) return;
    const [clubRes, memberRes, fundsRes] = await Promise.all([
      supabase.from('clubs').select('*').eq('id', clubId).maybeSingle(),
      supabase
        .from('club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle(),
      supabase.from('club_funds').select('*').eq('club_id', clubId),
    ]);

    const role = memberRes.data?.role as ClubMember['role'] | undefined;
    if (!role || role === 'member') {
      setAccessDenied(true);
      setLoading(false);
      return;
    }

    setUserRole(role);
    setClub(clubRes.data as Club);

    const fundMap = new Map<FundType, ClubFund>();
    (fundsRes.data || []).forEach((f: ClubFund) => {
      fundMap.set(f.fund_type as FundType, f);
    });
    setFunds(fundMap);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [user, clubId]);

  async function handleRefresh() {
    setRefreshing(true);
    const { data } = await supabase.from('club_funds').select('*').eq('club_id', clubId);
    const fundMap = new Map<FundType, ClubFund>();
    (data || []).forEach((f: ClubFund) => {
      fundMap.set(f.fund_type as FundType, f);
    });
    setFunds(fundMap);
    setRefreshing(false);
  }

  const totalBalance = FUND_TYPES.reduce((sum, type) => sum + (funds.get(type)?.balance ?? 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="bg-white px-5 pt-14 pb-5" style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}>
          <div className="max-w-lg mx-auto">
            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
            <div className="h-8 w-52 bg-slate-200 rounded animate-pulse mt-3" />
            <div className="h-3 w-32 bg-slate-200 rounded animate-pulse mt-2" />
          </div>
        </div>
        <main className="flex-1 px-4 pt-5 pb-28 max-w-lg mx-auto w-full space-y-4">
          <div className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-52 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 flex items-center justify-center mb-4">
          <ShieldAlert size={28} className="text-rose-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Officer Access Only</h2>
        <p className="text-slate-400 text-sm mt-2 leading-relaxed max-w-xs">
          You need to be an officer or president of this club to view its funds.
        </p>
        <button
          onClick={onBack}
          className="mt-6 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold text-sm
            active:scale-95 hover:bg-emerald-600 transition-all"
          style={{ boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  const clubName = club?.name ?? '';
  const shortClubName = clubName.length > 22 ? clubName.slice(0, 20) + '…' : clubName;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header
        className="bg-white px-5 pt-14 pb-4"
        style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}
      >
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-600 active:scale-95 transition-all -ml-1"
            >
              <ChevronLeft size={18} />
              <span className="text-sm font-medium">My Clubs</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center
                hover:bg-slate-200 active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={`text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
            {shortClubName} Funds
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 capitalize font-medium">{userRole} view</p>
        </div>
      </header>

      <main className="flex-1 px-4 pt-5 pb-28 max-w-lg mx-auto w-full">
        <TotalCard total={totalBalance} />

        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-6 mb-3 px-1">
          Fund Breakdown
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {FUND_TYPES.map((type) => {
            const fund = funds.get(type);
            const total = fund?.balance ?? 0;
            const used = Math.min(fund?.funds_used ?? 0, total);
            const available = total - used;
            const config = FUND_CONFIG[type];
            return (
              <FundCard
                key={type}
                type={type}
                total={total}
                used={used}
                available={available}
                config={config}
                onTap={onFundSelect ? () => onFundSelect(type) : undefined}
              />
            );
          })}
        </div>
      </main>

      <BottomNav currentPage="home" onNavigate={onNavigate} />
    </div>
  );
}

function TotalCard({ total }: { total: number }) {
  return (
    <div
      className="rounded-2xl bg-emerald-500 px-5 py-4 text-white relative overflow-hidden"
      style={{ boxShadow: '0 8px 28px rgba(16,185,129,0.30)' }}
    >
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
      <div className="absolute -bottom-4 left-1/3 w-24 h-24 bg-white/10 rounded-full" />
      <div className="relative">
        <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest">Combined Total</p>
        <p className="text-3xl font-extrabold mt-1 tracking-tight">{formatCurrency(total)}</p>
        <p className="text-emerald-200 text-xs mt-0.5">Across IRA · DOC · ASI · Club Fund</p>
      </div>
    </div>
  );
}

function DonutChart({
  used,
  available,
  usedColor,
  availableColor,
  size = 96,
  strokeWidth = 14,
}: {
  used: number;
  available: number;
  usedColor: string;
  availableColor: string;
  size?: number;
  strokeWidth?: number;
}) {
  const total = used + available;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const usedRatio = total > 0 ? used / total : 0;
  const availableRatio = total > 0 ? available / total : 1;

  const usedDash = usedRatio * circumference;
  const availableDash = availableRatio * circumference;
  const gap = 0;

  const usedOffset = 0;
  const availableOffset = -(usedDash + gap);

  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={availableColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: 'rotate(-90deg)' }}
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={availableColor}
        strokeWidth={strokeWidth}
        strokeDasharray={`${availableDash - 2} ${circumference - availableDash + 2}`}
        strokeDashoffset={availableOffset}
        strokeLinecap="butt"
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={usedColor}
        strokeWidth={strokeWidth}
        strokeDasharray={`${usedDash > 2 ? usedDash - 2 : usedDash} ${circumference - usedDash + 2}`}
        strokeDashoffset={usedOffset}
        strokeLinecap="butt"
      />
    </svg>
  );
}

function FundCard({
  type,
  total,
  used,
  available,
  config,
  onTap,
}: {
  type: FundType;
  total: number;
  used: number;
  available: number;
  config: FundColors;
  onTap?: () => void;
}) {
  const usedPct = total > 0 ? Math.round((used / total) * 100) : 0;

  return (
    <div
      role={onTap ? 'button' : undefined}
      tabIndex={onTap ? 0 : undefined}
      onClick={onTap}
      onKeyDown={onTap ? (e) => e.key === 'Enter' && onTap() : undefined}
      className={`${config.bg} ${config.border} border rounded-2xl p-4 flex flex-col
        ${onTap ? 'cursor-pointer active:scale-95 hover:shadow-md transition-all duration-150' : ''}`}
      style={{ boxShadow: '0 2px 14px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-center justify-center py-2">
        <div className="relative">
          <DonutChart
            used={used}
            available={available}
            usedColor={config.usedColor}
            availableColor={config.availableColor}
            size={100}
            strokeWidth={14}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-extrabold text-slate-800 leading-none">{usedPct}%</span>
            <span className="text-[9px] font-semibold text-slate-400 mt-0.5 leading-none">used</span>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: config.usedColor }} />
          <span className="text-[10px] font-semibold text-slate-500 flex-1">Used</span>
          <span className="text-[11px] font-bold text-slate-700">{formatCurrency(used)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: config.availableColor }} />
          <span className="text-[10px] font-semibold text-slate-500 flex-1">Available</span>
          <span className="text-[11px] font-bold text-slate-700">{formatCurrency(available)}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-end justify-between">
        <span className={`text-sm font-extrabold ${config.titleText}`}>{type}</span>
        <div className="text-right">
          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide leading-none">Total</p>
          <p className="text-xs font-extrabold text-slate-700 mt-0.5">{formatCurrency(total)}</p>
        </div>
      </div>
    </div>
  );
}
