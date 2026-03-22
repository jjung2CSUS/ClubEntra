import { useEffect, useState } from 'react';
import { ArrowLeft, Search, Shield, GraduationCap, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AdminBottomNav } from '../../components/admin/AdminBottomNav';
import type { Page, Profile } from '../../lib/types';

type Role = 'officer' | 'advisor' | 'member';

interface UserRoleListProps {
  role: Role;
  onNavigate: (page: Page) => void;
}

const CONFIG: Record<Role, {
  title: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  avatarBg: string;
  avatarText: string;
  dot: string;
  emptyIcon: React.ElementType;
}> = {
  officer: {
    title: 'Club Officers',
    icon: Shield,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    avatarBg: 'bg-emerald-100',
    avatarText: 'text-emerald-700',
    dot: 'bg-emerald-400',
    emptyIcon: Shield,
  },
  advisor: {
    title: 'Advisors',
    icon: GraduationCap,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    avatarBg: 'bg-amber-100',
    avatarText: 'text-amber-700',
    dot: 'bg-amber-400',
    emptyIcon: GraduationCap,
  },
  member: {
    title: 'Members',
    icon: Users,
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    avatarBg: 'bg-sky-100',
    avatarText: 'text-sky-700',
    dot: 'bg-sky-400',
    emptyIcon: Users,
  },
};

const BACK_PAGE: Record<Role, Page> = {
  officer: 'admin-officers',
  advisor: 'admin-advisors',
  member: 'admin-members',
};

export function UserRoleList({ role, onNavigate }: UserRoleListProps) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const cfg = CONFIG[role];

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .eq('student_role', role)
      .order('full_name')
      .then(({ data }) => { setUsers(data || []); setLoading(false); });
  }, [role]);

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.university?.toLowerCase().includes(search.toLowerCase())
  );

  const EmptyIcon = cfg.emptyIcon;
  const HeaderIcon = cfg.icon;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100 px-5 pt-12 pb-4"
        style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => onNavigate('admin-users')}
              className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center
                hover:bg-slate-200 active:scale-95 transition-all"
            >
              <ArrowLeft size={18} className="text-slate-600" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl ${cfg.iconBg} flex items-center justify-center`}>
                <HeaderIcon size={16} className={cfg.iconColor} />
              </div>
              <h1 className="text-xl font-bold text-slate-900">{cfg.title}</h1>
            </div>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${cfg.title.toLowerCase()}…`}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50
                text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
                placeholder-slate-400 text-slate-800"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 py-4 pb-28 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="space-y-3 mt-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                    <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <EmptyIcon size={40} className="text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No {cfg.title.toLowerCase()} found</p>
            {search && <p className="text-slate-400 text-sm mt-1">Try adjusting your search</p>}
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-400 mb-4 mt-1">
              {filtered.length} {cfg.title.toLowerCase()}
            </p>
            <div className="space-y-2.5">
              {filtered.map(u => {
                const initials = u.full_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
                return (
                  <div
                    key={u.id}
                    className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3"
                    style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
                  >
                    <div className={`w-10 h-10 rounded-full ${cfg.avatarBg} flex items-center justify-center
                      flex-shrink-0 font-semibold text-sm ${cfg.avatarText}`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">
                        {u.full_name || 'Unnamed User'}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {u.username ? `@${u.username}` : ''}{u.username && u.university ? ' · ' : ''}{u.university || ''}
                      </p>
                    </div>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      <AdminBottomNav currentPage={BACK_PAGE[role]} onNavigate={onNavigate} />
    </div>
  );
}
