import { useEffect, useState } from 'react';
import { ChevronLeft, RefreshCw, ShieldAlert, ChevronDown, Plus, Pencil, Check, X, Receipt, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { BottomNav } from '../components/layout/BottomNav';
import type { Page, ClubFund, ClubMember, FundTransaction } from '../lib/types';

export type FundType = 'IRA' | 'DOC' | 'ASI' | 'Club Fund';

interface FundDetailProps {
  clubId: string;
  fundType: FundType;
  onNavigate: (page: Page, id?: string) => void;
  onBack: () => void;
  onAddTransaction?: (fundId: string | null, year: number) => void;
}

interface FundTheme {
  badgeBg: string;
  badgeText: string;
  actionBg: string;
  actionText: string;
  accentText: string;
}

const FUND_THEMES: Record<FundType, FundTheme> = {
  IRA: { badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-700', actionBg: 'bg-sky-500', actionText: 'text-white', accentText: 'text-sky-600' },
  DOC: { badgeBg: 'bg-sky-100', badgeText: 'text-sky-700', actionBg: 'bg-sky-500', actionText: 'text-white', accentText: 'text-sky-600' },
  ASI: { badgeBg: 'bg-amber-100', badgeText: 'text-amber-700', actionBg: 'bg-sky-500', actionText: 'text-white', accentText: 'text-sky-600' },
  'Club Fund': { badgeBg: 'bg-rose-100', badgeText: 'text-rose-700', actionBg: 'bg-sky-500', actionText: 'text-white', accentText: 'text-sky-600' },
};

const YEARS = [2024, 2025, 2026, 2027, 2028];

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function FundDetail({ clubId, fundType, onNavigate, onBack, onAddTransaction }: FundDetailProps) {
  const { user } = useAuth();
  const [fund, setFund] = useState<ClubFund | null>(null);
  const [transactions, setTransactions] = useState<FundTransaction[]>([]);
  const [userRole, setUserRole] = useState<ClubMember['role'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [receiptModal, setReceiptModal] = useState<string | null>(null);

  const theme = FUND_THEMES[fundType];

  async function loadData(year = selectedYear) {
    if (!user) return;
    const [memberRes, fundRes] = await Promise.all([
      supabase
        .from('club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle(),
      supabase
        .from('club_funds')
        .select('*')
        .eq('club_id', clubId)
        .eq('fund_type', fundType)
        .eq('year', year)
        .maybeSingle(),
    ]);

    const role = memberRes.data?.role as ClubMember['role'] | undefined;
    if (!role || role === 'member') {
      setAccessDenied(true);
      setLoading(false);
      return;
    }
    setUserRole(role);
    const fundData = fundRes.data as ClubFund | null;
    setFund(fundData);

    const txnRes = await supabase
      .from('fund_transactions')
      .select('*')
      .eq('club_id', clubId)
      .eq('fund_type', fundType)
      .eq('year', year)
      .order('created_at', { ascending: false });

    const txns = (txnRes.data ?? []) as FundTransaction[];
    setTransactions(txns);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [user, clubId, fundType]);

  async function handleYearChange(year: number) {
    setSelectedYear(year);
    setYearDropdownOpen(false);
    setLoading(true);
    await loadData(year);
  }

  async function handleRefresh() {
    setRefreshing(true);
    const [fundRes, txnRes] = await Promise.all([
      supabase
        .from('club_funds')
        .select('*')
        .eq('club_id', clubId)
        .eq('fund_type', fundType)
        .eq('year', selectedYear)
        .maybeSingle(),
      supabase
        .from('fund_transactions')
        .select('*')
        .eq('club_id', clubId)
        .eq('fund_type', fundType)
        .eq('year', selectedYear)
        .order('created_at', { ascending: false }),
    ]);
    setFund(fundRes.data as ClubFund | null);
    setTransactions((txnRes.data ?? []) as FundTransaction[]);
    setRefreshing(false);
  }

  async function saveAllocation() {
    const newBalance = parseFloat(editValue.replace(/[^0-9.]/g, ''));
    if (isNaN(newBalance) || newBalance < 0) return;
    setSaving(true);
    if (fund?.id) {
      await supabase
        .from('club_funds')
        .update({ balance: newBalance, updated_by: user?.id })
        .eq('id', fund.id);
      setFund({ ...fund, balance: newBalance });
    } else {
      const { data } = await supabase
        .from('club_funds')
        .insert({
          club_id: clubId, fund_type: fundType, balance: newBalance,
          funds_used: 0, year: selectedYear, updated_by: user?.id,
        })
        .select()
        .maybeSingle();
      if (data) setFund(data as ClubFund);
    }
    setSaving(false);
    setEditingAllocation(false);
  }

  const totalAllocation = fund?.balance ?? 0;
  const totalUsed = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const fundsLeft = Math.max(totalAllocation - totalUsed, 0);
  const availablePct = totalAllocation > 0 ? (fundsLeft / totalAllocation) * 100 : 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="bg-white px-5 pt-14 pb-5" style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}>
          <div className="max-w-lg mx-auto space-y-2">
            <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
            <div className="h-8 w-44 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
        <main className="flex-1 px-4 pt-5 pb-28 max-w-lg mx-auto w-full space-y-4">
          {[44, 10, 24, 36, 48].map((h, i) => (
            <div key={i} className={`h-${h} bg-slate-200 rounded-2xl animate-pulse`} style={{ height: `${h * 4}px` }} />
          ))}
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
          You need to be an officer or president of this club to view fund details.
        </p>
        <button
          onClick={onBack}
          className="mt-6 px-6 py-2.5 bg-sky-500 text-white rounded-xl font-semibold text-sm
            active:scale-95 hover:bg-sky-600 transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col"
      onClick={() => yearDropdownOpen && setYearDropdownOpen(false)}
    >
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
              <span className="text-sm font-medium">Club Funds</span>
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">{fundType} Funds</h1>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText}`}>
              {userRole}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-5 pb-28 max-w-lg mx-auto w-full space-y-4">
        <MainCard
          total={totalAllocation}
          available={fundsLeft}
          used={totalUsed}
          availablePct={availablePct}
        />

        <YearSelector
          selectedYear={selectedYear}
          open={yearDropdownOpen}
          onToggle={(e) => { e.stopPropagation(); setYearDropdownOpen(v => !v); }}
          onSelect={handleYearChange}
        />

        {editingAllocation ? (
          <EditAllocationCard
            editValue={editValue}
            onChange={setEditValue}
            onSave={saveAllocation}
            onCancel={() => setEditingAllocation(false)}
            saving={saving}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onAddTransaction ? onAddTransaction(fund?.id ?? null, selectedYear) : onNavigate('add-transaction')}
              className={`${theme.actionBg} ${theme.actionText} rounded-2xl px-4 py-4
                flex items-center justify-center gap-2 active:scale-95 hover:opacity-90 transition-all`}
              style={{ boxShadow: '0 4px 16px rgba(14,165,233,0.25)' }}
            >
              <Plus size={16} />
              <span className="text-sm font-bold">Add Transaction</span>
            </button>
            <button
              onClick={() => { setEditValue(String(totalAllocation)); setEditingAllocation(true); }}
              className="bg-white border border-slate-200 rounded-2xl px-4 py-4 flex items-center
                justify-center gap-2 active:scale-95 hover:bg-slate-50 transition-all"
              style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}
            >
              <Pencil size={15} className="text-slate-500" />
              <span className="text-sm font-bold text-slate-700">EDIT</span>
            </button>
          </div>
        )}

        <SummarySection total={totalAllocation} used={totalUsed} available={fundsLeft} theme={theme} />

        <TransactionsList
          transactions={transactions}
          onReceiptOpen={url => setReceiptModal(url)}
        />
      </main>

      <BottomNav currentPage="home" onNavigate={onNavigate} />

      {receiptModal && (
        <ReceiptModal url={receiptModal} onClose={() => setReceiptModal(null)} />
      )}
    </div>
  );
}

function MainCard({
  total, available, used, availablePct,
}: { total: number; available: number; used: number; availablePct: number }) {
  const [barWidth, setBarWidth] = useState(0);
  useEffect(() => {
    setBarWidth(0);
    const t = setTimeout(() => setBarWidth(availablePct), 100);
    return () => clearTimeout(t);
  }, [availablePct]);

  return (
    <div className="bg-white rounded-2xl px-5 py-5" style={{ boxShadow: '0 2px 18px rgba(0,0,0,0.08)' }}>
      <div className="space-y-3">
        <div className="relative w-full h-5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-300 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-base font-extrabold text-slate-800 leading-none">{fmt(available)}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Available</p>
          </div>
          <div className="text-right">
            <p className="text-base font-extrabold text-slate-400 leading-none">{fmt(used)}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Used</p>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex justify-end">
        <p className="text-[11px] text-slate-400">
          Total Allocation: <span className="font-extrabold text-slate-700">{fmt(total)}</span>
        </p>
      </div>
    </div>
  );
}

function YearSelector({
  selectedYear, open, onToggle, onSelect,
}: {
  selectedYear: number;
  open: boolean;
  onToggle: (e: React.MouseEvent) => void;
  onSelect: (y: number) => void;
}) {
  return (
    <div className="flex justify-center relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl border border-slate-200
          text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
        style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
      >
        <span>{selectedYear}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className="absolute top-full mt-2 bg-white rounded-xl border border-slate-100 overflow-hidden z-20"
          style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '100px' }}
          onClick={e => e.stopPropagation()}
        >
          {YEARS.map(y => (
            <button
              key={y}
              onClick={() => onSelect(y)}
              className={`w-full text-center px-6 py-2.5 text-sm font-semibold transition-colors
                ${y === selectedYear ? 'bg-sky-50 text-sky-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {y}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EditAllocationCard({
  editValue, onChange, onSave, onCancel, saving,
}: {
  editValue: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl px-5 py-4" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Edit Total Allocation</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">$</span>
          <input
            autoFocus
            type="number"
            min="0"
            step="0.01"
            value={editValue}
            onChange={e => onChange(e.target.value)}
            className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold
              text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent"
          />
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center
            hover:bg-sky-600 active:scale-95 transition-all disabled:opacity-50"
        >
          <Check size={16} className="text-white" />
        </button>
        <button
          onClick={onCancel}
          className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center
            hover:bg-slate-200 active:scale-95 transition-all"
        >
          <X size={16} className="text-slate-500" />
        </button>
      </div>
    </div>
  );
}

function SummarySection({
  total, used, available, theme,
}: { total: number; used: number; available: number; theme: FundTheme }) {
  const rows: { label: string; value: number; accent?: boolean }[] = [
    { label: 'Total Allocation', value: total },
    { label: 'Total Funds Used', value: used },
    { label: 'Funds Left', value: available, accent: true },
  ];
  return (
    <div className="bg-white rounded-2xl px-5 py-4" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Summary</p>
      <div className="space-y-2.5">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-sm text-slate-500 font-medium">{row.label}</span>
            <span className={`text-sm font-extrabold px-3 py-1 rounded-lg
              ${row.accent ? `${theme.accentText} bg-sky-50` : 'text-slate-700 bg-slate-50'}`}>
              {fmt(row.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransactionsList({
  transactions, onReceiptOpen,
}: { transactions: FundTransaction[]; onReceiptOpen: (url: string) => void }) {
  return (
    <div className="bg-white rounded-2xl px-5 py-4" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Transactions</p>
      {transactions.length === 0 ? (
        <div className="py-8 flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Receipt size={18} className="text-slate-300" />
          </div>
          <p className="text-sm text-slate-400">No transactions yet</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {transactions.map(txn => (
            <div key={txn.id} className="py-3.5">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {txn.event_name || txn.description || 'Transaction'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {txn.event_date && (
                      <span className="text-[11px] text-slate-400">{txn.event_date}</span>
                    )}
                    {txn.event_date && txn.attendee_count > 0 && (
                      <span className="text-[11px] text-slate-300">·</span>
                    )}
                    {txn.attendee_count > 0 && (
                      <span className="text-[11px] text-slate-400">{txn.attendee_count} attended</span>
                    )}
                    {!txn.event_date && !txn.attendee_count && (
                      <span className="text-[11px] text-slate-400">{formatDate(txn.created_at)}</span>
                    )}
                  </div>
                  {txn.description ? (
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{txn.description}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-sm font-extrabold text-slate-700">{fmt(Number(txn.amount))}</span>
                  <button
                    onClick={() => txn.receipt_url ? onReceiptOpen(txn.receipt_url) : undefined}
                    disabled={!txn.receipt_url}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-95
                      ${txn.receipt_url
                        ? 'bg-sky-50 text-sky-500 hover:bg-sky-100'
                        : 'bg-slate-50 text-slate-200 cursor-default'
                      }`}
                    title={txn.receipt_url ? 'View receipt' : 'No receipt'}
                  >
                    <ImageIcon size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReceiptModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden max-w-sm w-full"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.30)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-700">Receipt</p>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center
              hover:bg-slate-200 active:scale-95 transition-all"
          >
            <X size={14} className="text-slate-500" />
          </button>
        </div>
        <div className="p-3">
          <img
            src={url}
            alt="Receipt"
            className="w-full rounded-xl object-contain max-h-[60vh]"
            onError={e => { (e.target as HTMLImageElement).alt = 'Could not load image'; }}
          />
        </div>
      </div>
    </div>
  );
}
