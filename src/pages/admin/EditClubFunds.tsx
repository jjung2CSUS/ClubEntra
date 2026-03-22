import { useState } from 'react';
import { ArrowLeft, DollarSign, CheckCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AdminBottomNav } from '../../components/admin/AdminBottomNav';
import type { Page, Club } from '../../lib/types';

interface EditClubFundsProps {
  club: Club;
  onNavigate: (page: Page) => void;
  onSaved: (updated: Club) => void;
}

type Mode = 'set' | 'add' | 'subtract';

export function EditClubFunds({ club, onNavigate, onSaved }: EditClubFundsProps) {
  const [mode, setMode] = useState<Mode>('set');
  const [rawValue, setRawValue] = useState(String(club.total_funds ?? 0));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const current = club.total_funds ?? 0;
  const inputNum = parseFloat(rawValue) || 0;

  function preview(): number {
    if (mode === 'set') return inputNum;
    if (mode === 'add') return current + inputNum;
    return Math.max(0, current - inputNum);
  }

  function formatMoney(n: number) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const diff = preview() - current;
  const diffLabel = diff === 0 ? null : diff > 0 ? `+${formatMoney(diff)}` : `-${formatMoney(Math.abs(diff))}`;
  const DiffIcon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const diffColor = diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-red-500' : 'text-slate-400';

  async function handleSave() {
    const newFunds = preview();
    if (newFunds < 0) { setError('Funds cannot go below $0.'); return; }
    setSaving(true);
    setError('');
    const { data, error: err } = await supabase
      .from('clubs')
      .update({ total_funds: newFunds, updated_at: new Date().toISOString() })
      .eq('id', club.id)
      .select()
      .maybeSingle();
    setSaving(false);
    if (err) { setError(err.message); return; }
    if (data) onSaved(data as Club);
    setSaved(true);
  }

  if (saved) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-28 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
            <CheckCircle size={36} className="text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Funds Updated!</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            <span className="font-semibold text-slate-600">{club.name}</span>'s total funds are now{' '}
            <span className="font-bold text-emerald-600">{formatMoney(preview())}</span>.
          </p>
          <button
            onClick={() => onNavigate('admin-clubs')}
            className="mt-8 px-8 py-3 bg-emerald-500 text-white rounded-2xl font-semibold
              active:scale-95 transition-all hover:bg-emerald-600"
            style={{ boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}
          >
            Back to Clubs
          </button>
        </div>
        <AdminBottomNav currentPage="admin-clubs" onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header
        className="bg-white border-b border-slate-100 px-5 pt-12 pb-5"
        style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}
      >
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => onNavigate('admin-clubs')}
            className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center
              hover:bg-slate-200 active:scale-95 transition-all duration-150"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Edit Club Funds</h1>
            <p className="text-xs text-slate-400 mt-0.5">{club.name}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 pb-28 max-w-lg mx-auto w-full space-y-4">

        <div className="bg-white rounded-3xl p-6 text-center"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Current Balance</p>
          <p className="text-4xl font-extrabold text-slate-800 tabular-nums">{formatMoney(current)}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50">
            <Building2Label name={club.name} />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Update Type</p>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {(['set', 'add', 'subtract'] as Mode[]).map(m => {
              const labels = { set: 'Set Amount', add: 'Add Funds', subtract: 'Remove Funds' };
              const activeStyles = {
                set: 'bg-sky-500 text-white border-sky-500',
                add: 'bg-emerald-500 text-white border-emerald-500',
                subtract: 'bg-red-400 text-white border-red-400',
              };
              return (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all active:scale-95
                    ${mode === m ? activeStyles[m] : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'}`}
                >
                  {labels[m]}
                </button>
              );
            })}
          </div>

          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
            {mode === 'set' ? 'New Total' : mode === 'add' ? 'Amount to Add' : 'Amount to Remove'}
          </p>
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={rawValue}
              onChange={e => { setRawValue(e.target.value); setError(''); }}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50
                text-sm font-semibold text-slate-800 tabular-nums
                focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
                placeholder-slate-300 transition-all"
            />
          </div>

          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Note (optional)</p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Semester budget allocation…"
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50
              text-sm text-slate-800 placeholder-slate-400 resize-none
              focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
              transition-all"
          />
        </div>

        <div className="bg-white rounded-2xl px-5 py-4 flex items-center justify-between"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div>
            <p className="text-xs text-slate-400 font-medium">New Balance</p>
            <p className="text-2xl font-extrabold text-slate-800 tabular-nums mt-0.5">{formatMoney(preview())}</p>
          </div>
          {diffLabel && (
            <div className={`flex items-center gap-1 ${diffColor}`}>
              <DiffIcon size={16} />
              <span className="text-sm font-bold tabular-nums">{diffLabel}</span>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl
            bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base
            active:scale-[0.98] transition-all duration-150 disabled:opacity-60"
          style={{ boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}
        >
          <DollarSign size={18} />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </main>

      <AdminBottomNav currentPage="admin-clubs" onNavigate={onNavigate} />
    </div>
  );
}

function Building2Label({ name }: { name: string }) {
  return (
    <span className="text-xs font-semibold text-slate-500">{name}</span>
  );
}
