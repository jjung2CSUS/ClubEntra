import { useEffect, useState } from 'react';
import { Users, Settings, ChevronRight, Clock, MapPin, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Club, ClubMember } from '../lib/types';
import { Badge } from '../components/ui/Badge';

interface MyClubsProps {
  onNavigate: (page: string, id?: string) => void;
}

type ClubWithMembership = Club & { membership: ClubMember };

export function MyClubs({ onNavigate }: MyClubsProps) {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<ClubWithMembership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data } = await supabase
        .from('club_members')
        .select('*, clubs(*)')
        .eq('user_id', user!.id)
        .eq('status', 'active');

      const result: ClubWithMembership[] = (data || [])
        .filter((r: { clubs: Club }) => r.clubs)
        .map((r: ClubMember & { clubs: Club }) => ({ ...(r.clubs as Club), membership: { id: r.id, club_id: r.club_id, user_id: r.user_id, role: r.role, status: r.status, joined_at: r.joined_at } }));

      setClubs(result);
      setLoading(false);
    }
    load();
  }, [user]);

  const roleColors: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
    president: 'warning', officer: 'primary', member: 'neutral', admin: 'error',
  };

  const isLeadership = (role: string) => ['president', 'officer', 'admin'].includes(role);

  if (loading) return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-2xl" />)}
    </div>
  );

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {clubs.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={36} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">You haven't joined any clubs yet</h3>
          <p className="text-slate-500 text-sm mb-6">Explore the club directory to find communities you love</p>
          <button
            onClick={() => onNavigate('directory')}
            className="px-6 py-3 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 transition-colors"
          >
            Browse Clubs
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <p className="text-slate-500 text-sm">{clubs.length} club{clubs.length !== 1 ? 's' : ''}</p>
            <button onClick={() => onNavigate('directory')} className="text-sm text-sky-600 font-medium hover:underline">+ Join More</button>
          </div>

          {clubs.some(c => isLeadership(c.membership.role)) && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Leadership Roles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {clubs.filter(c => isLeadership(c.membership.role)).map(club => (
                  <ClubCard key={club.id} club={club} roleColors={roleColors} onNavigate={onNavigate} showOfficerBadge />
                ))}
              </div>
            </div>
          )}

          {clubs.some(c => !isLeadership(c.membership.role)) && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Memberships</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {clubs.filter(c => !isLeadership(c.membership.role)).map(club => (
                  <ClubCard key={club.id} club={club} roleColors={roleColors} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ClubCard({ club, roleColors, onNavigate, showOfficerBadge }: {
  club: ClubWithMembership;
  roleColors: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info'>;
  onNavigate: (page: string, id?: string) => void;
  showOfficerBadge?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
      <div className="h-20 bg-gradient-to-r from-sky-500 to-sky-700 relative">
        <div className="absolute top-3 right-3">
          <Badge variant={roleColors[club.membership.role] || 'neutral'}>{club.membership.role}</Badge>
        </div>
        {showOfficerBadge && (
          <div className="absolute top-3 left-3">
            <Star size={14} className="text-amber-300" fill="currentColor" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 truncate">{club.name}</h3>
        <p className="text-xs text-slate-500 truncate mt-0.5">{club.short_description || club.category}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Users size={11} />{club.member_count}</span>
          {club.meeting_schedule && <span className="flex items-center gap-1 truncate"><Clock size={11} />{club.meeting_schedule}</span>}
          {club.location && <span className="flex items-center gap-1 truncate"><MapPin size={11} />{club.location}</span>}
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onNavigate('club-detail', club.id)}
            className="flex-1 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
          >
            View <ChevronRight size={12} />
          </button>
          {showOfficerBadge && (
            <button
              onClick={() => onNavigate('officer')}
              className="flex-1 text-xs font-medium text-sky-700 bg-sky-50 rounded-lg px-3 py-1.5 hover:bg-sky-100 transition-colors flex items-center justify-center gap-1"
            >
              <Settings size={12} /> Manage
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
