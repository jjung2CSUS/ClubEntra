import { useEffect, useState } from 'react';
import { ArrowLeft, Search, Building2, ChevronRight, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AdminBottomNav } from '../components/admin/AdminBottomNav';
import type { Page, Club } from '../lib/types';

interface ManageClubsProps {
  onNavigate: (page: Page) => void;
  onEditClubFunds?: (club: Club) => void;
}

export function ManageClubs({ onNavigate, onEditClubFunds }: ManageClubsProps) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase
      .from('clubs')
      .select('*')
      .order('name')
      .then(({ data }) => {
        setClubs(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = clubs.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  );

  const totalFundsAll = filtered.reduce((sum, c) => sum + (c.total_funds ?? 0), 0);

  function formatMoney(n: number) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header
        className="bg-white border-b border-slate-100 px-5 pt-12 pb-4"
        style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}
      >
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => onNavigate('admin-home')}
              className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center
                hover:bg-slate-200 active:scale-95 transition-all duration-150"
            >
              <ArrowLeft size={18} className="text-slate-600" />
            </button>
            <h1 className="text-xl font-bold text-slate-900">Manage Clubs</h1>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clubs…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50
                text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
                placeholder-slate-400 text-slate-800 transition-all"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 py-5 pb-28 max-w-lg mx-auto w-full">

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 bg-white rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Building2 size={15} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Clubs</p>
              <p className="text-base font-bold text-slate-800">{filtered.length}</p>
            </div>
          </div>
          <div className="flex-1 bg-white rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center">
              <DollarSign size={15} className="text-sky-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Funds</p>
              <p className="text-base font-bold text-slate-800">{formatMoney(totalFundsAll)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl overflow-hidden"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

          <div className="flex items-center px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
            <span className="flex-1 text-xs font-bold text-slate-500 uppercase tracking-wider">Club Name</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Funds</span>
          </div>

          {loading ? (
            <div className="divide-y divide-slate-100">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center px-5 py-4 gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                    <div className="h-2.5 bg-slate-100 rounded w-1/3" />
                  </div>
                  <div className="h-3 bg-slate-100 rounded w-16" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-8">
              <Building2 size={36} className="text-slate-300 mb-3" />
              <p className="text-slate-500 font-semibold">No clubs found</p>
              {search && <p className="text-slate-400 text-sm mt-1">Try a different search term</p>}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(club => (
                <ClubRow
                  key={club.id}
                  club={club}
                  formatMoney={formatMoney}
                  onClick={() => onEditClubFunds ? onEditClubFunds(club) : onNavigate('admin-edit-club-funds')}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <AdminBottomNav currentPage="admin-clubs" onNavigate={onNavigate} />
    </div>
  );
}

function ClubRow({
  club, formatMoney, onClick,
}: {
  club: Club;
  formatMoney: (n: number) => string;
  onClick: () => void;
}) {
  const initials = club.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const funds = club.total_funds ?? 0;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-4
        hover:bg-slate-50 active:bg-slate-100 active:scale-[0.99]
        transition-all duration-150 text-left"
    >
      <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center
        flex-shrink-0 text-xs font-bold text-emerald-700">
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm truncate">{club.name}</p>
        <p className="text-xs text-slate-400 truncate mt-0.5">{club.category}</p>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className={`text-sm font-bold tabular-nums ${funds > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
          {formatMoney(funds)}
        </span>
        <ChevronRight size={14} className="text-slate-300" />
      </div>
    </button>
  );
}
