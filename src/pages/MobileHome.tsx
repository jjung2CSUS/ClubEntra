import { useEffect, useState } from 'react';
import { Users, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { BottomNav } from '../components/layout/BottomNav';
import type { Page, Club, ClubMember } from '../lib/types';

interface MobileHomeProps {
  onNavigate: (page: Page, id?: string) => void;
}

interface ClubWithRole extends Club {
  memberRole: ClubMember['role'];
}

const ROLE_LABELS: Record<ClubMember['role'], string> = {
  president: 'President',
  officer: 'Officer',
  admin: 'Admin',
  member: 'Member',
};

const CARD_COLORS = [
  'bg-emerald-100',
  'bg-sky-100',
  'bg-amber-100',
  'bg-rose-100',
  'bg-teal-100',
  'bg-violet-100',
  'bg-orange-100',
  'bg-cyan-100',
];

const TEXT_COLORS = [
  'text-emerald-700',
  'text-sky-700',
  'text-amber-700',
  'text-rose-700',
  'text-teal-700',
  'text-violet-700',
  'text-orange-700',
  'text-cyan-700',
];

export function MobileHome({ onNavigate }: MobileHomeProps) {
  const { profile, user } = useAuth();
  const [clubs, setClubs] = useState<ClubWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  const firstName = profile?.full_name?.split(' ')[0] || profile?.username || 'there';

  useEffect(() => {
    if (!user) return;
    supabase
      .from('club_members')
      .select('role, clubs(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .then(({ data }) => {
        const result: ClubWithRole[] = (data || []).map((row: { role: ClubMember['role']; clubs: Club | Club[] }) => {
          const club = Array.isArray(row.clubs) ? row.clubs[0] : row.clubs;
          return { ...club, memberRole: row.role } as ClubWithRole;
        }).filter(Boolean);
        setClubs(result);
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header
        className="bg-white px-5 pt-14 pb-5"
        style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}
      >
        <div className="max-w-lg mx-auto flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400 font-medium">Welcome back,</p>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">{firstName}</h1>
          </div>
          <button
            onClick={() => onNavigate('announcements')}
            className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center
              hover:bg-slate-200 active:scale-95 transition-all mt-1"
          >
            <Bell size={18} className="text-slate-500" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 pt-6 pb-28 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800">My Clubs</h2>
          {!loading && clubs.length > 0 && (
            <span className="text-xs text-slate-400 font-medium">{clubs.length} club{clubs.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
                <div className="w-full aspect-square rounded-2xl bg-slate-200" />
                <div className="h-3 bg-slate-200 rounded w-3/4" />
                <div className="h-2.5 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : clubs.length === 0 ? (
          <EmptyState onNavigate={onNavigate} />
        ) : (
          <div className="grid grid-cols-3 gap-x-4 gap-y-6">
            {clubs.map((club, i) => {
              const isOfficerRole = club.memberRole !== 'member';
              return (
                <ClubCard
                  key={club.id}
                  club={club}
                  colorBg={CARD_COLORS[i % CARD_COLORS.length]}
                  colorText={TEXT_COLORS[i % TEXT_COLORS.length]}
                  onClick={() => isOfficerRole
                    ? onNavigate('club-funds', club.id)
                    : onNavigate('club-detail', club.id)
                  }
                />
              );
            })}
          </div>
        )}
      </main>

      <BottomNav currentPage="home" onNavigate={onNavigate} />
    </div>
  );
}

function ClubCard({
  club, colorBg, colorText, onClick,
}: {
  club: ClubWithRole;
  colorBg: string;
  colorText: string;
  onClick: () => void;
}) {
  const initials = club.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);

  const roleLabel = ROLE_LABELS[club.memberRole] || 'Member';
  const shortName = club.name.length > 14 ? club.name.slice(0, 12) + '…' : club.name;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 active:scale-95 transition-transform duration-150 group"
    >
      <div
        className={`w-full aspect-square rounded-2xl ${colorBg}
          flex items-center justify-center
          shadow-sm group-hover:shadow-md transition-shadow duration-200
          border border-white/60`}
        style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}
      >
        <span className={`text-lg font-black ${colorText} tracking-tight`}>{initials}</span>
      </div>
      <div className="text-center w-full">
        <p className="text-xs font-bold text-slate-700 leading-tight">{shortName}</p>
        <p className={`text-xs font-semibold mt-0.5 ${colorText}`}>{roleLabel}</p>
      </div>
    </button>
  );
}

function EmptyState({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-16 h-16 rounded-3xl bg-emerald-100 flex items-center justify-center mb-4">
        <Users size={28} className="text-emerald-500" />
      </div>
      <p className="text-slate-700 font-bold text-base">No clubs yet</p>
      <p className="text-slate-400 text-sm mt-1 leading-relaxed">
        Join or discover clubs to see them here.
      </p>
      <button
        onClick={() => onNavigate('directory')}
        className="mt-5 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold text-sm
          active:scale-95 hover:bg-emerald-600 transition-all"
        style={{ boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}
      >
        Browse Clubs
      </button>
    </div>
  );
}
