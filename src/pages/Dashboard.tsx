import { useEffect, useState } from 'react';
import { Calendar, Users, Megaphone, TrendingUp, ArrowRight, Clock, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Club, Event, Announcement } from '../lib/types';
import { Badge } from '../components/ui/Badge';

interface DashboardProps {
  onNavigate: (page: string, id?: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { profile, user } = useAuth();
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState({ clubs: 0, events: 0, announcements: 0, applications: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const [clubsRes, eventsRes, announcementsRes] = await Promise.all([
        supabase
          .from('club_members')
          .select('clubs(*)')
          .eq('user_id', user!.id)
          .eq('status', 'active')
          .limit(6),
        supabase
          .from('events')
          .select('*')
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(5),
        supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(4),
      ]);

      const clubs = (clubsRes.data || []).map((r: { clubs: Club | Club[] }) => Array.isArray(r.clubs) ? r.clubs[0] : r.clubs).filter(Boolean) as Club[];
      setMyClubs(clubs);
      setUpcomingEvents((eventsRes.data as Event[]) || []);
      setRecentAnnouncements((announcementsRes.data as Announcement[]) || []);
      setStats({
        clubs: clubs.length,
        events: eventsRes.data?.length || 0,
        announcements: announcementsRes.data?.length || 0,
        applications: 0,
      });
      setLoading(false);
    }
    load();
  }, [user]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  const statCards = [
    { label: 'My Clubs', value: stats.clubs, icon: Users, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Upcoming Events', value: stats.events, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Announcements', value: stats.announcements, icon: Megaphone, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Pending Apps', value: stats.applications, icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const eventTypeColors: Record<string, string> = {
    meeting: 'primary', social: 'success', fundraiser: 'warning',
    workshop: 'info', competition: 'error', community: 'success', general: 'neutral',
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="bg-gradient-to-r from-sky-600 to-sky-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-4 -right-4 w-40 h-40 bg-white rounded-full" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white rounded-full" />
        </div>
        <div className="relative">
          <p className="text-sky-200 text-sm font-medium">{greeting},</p>
          <h2 className="text-2xl font-bold mt-0.5">{firstName}!</h2>
          <p className="text-sky-100 text-sm mt-1">
            You're a member of {stats.clubs} club{stats.clubs !== 1 ? 's' : ''}.
            {stats.events > 0 && ` ${stats.events} upcoming event${stats.events !== 1 ? 's' : ''} this week.`}
          </p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => onNavigate('directory')}
              className="px-4 py-2 bg-white text-sky-700 text-sm font-semibold rounded-xl hover:bg-sky-50 transition-colors"
            >
              Discover Clubs
            </button>
            <button
              onClick={() => onNavigate('events')}
              className="px-4 py-2 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-400 transition-colors border border-sky-400"
            >
              View Events
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Upcoming Events</h3>
            <button onClick={() => onNavigate('events')} className="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1">
              View all <ArrowRight size={14} />
            </button>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500 text-sm">No upcoming events</p>
              <button onClick={() => onNavigate('directory')} className="mt-2 text-sky-600 text-sm font-medium hover:underline">Join clubs to see events</button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcomingEvents.map(event => (
                <div key={event.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onNavigate('events')}>
                  <div className="flex items-start gap-3">
                    <div className="text-center bg-slate-50 rounded-xl p-2 min-w-[52px]">
                      <p className="text-xs text-slate-500 font-medium uppercase">
                        {new Date(event.start_time).toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                      <p className="text-xl font-bold text-slate-900 leading-none">
                        {new Date(event.start_time).getDate()}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{event.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock size={11} />
                          {new Date(event.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1 text-xs text-slate-500 truncate">
                            <MapPin size={11} />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant={eventTypeColors[event.event_type] as 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info'}>{event.event_type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">My Clubs</h3>
              <button onClick={() => onNavigate('my-clubs')} className="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1">
                View all <ArrowRight size={14} />
              </button>
            </div>
            {myClubs.length === 0 ? (
              <div className="p-6 text-center">
                <Users size={28} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 text-sm">No clubs yet</p>
                <button onClick={() => onNavigate('directory')} className="mt-2 text-sky-600 text-sm font-medium hover:underline">Browse directory</button>
              </div>
            ) : (
              <div className="p-3 space-y-1">
                {myClubs.slice(0, 5).map(club => (
                  <button
                    key={club.id}
                    onClick={() => onNavigate('club-detail', club.id)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-sky-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{club.name.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{club.name}</p>
                      <p className="text-xs text-slate-500 truncate">{club.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Announcements</h3>
              <button onClick={() => onNavigate('announcements')} className="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1">
                All <ArrowRight size={14} />
              </button>
            </div>
            {recentAnnouncements.length === 0 ? (
              <div className="p-6 text-center">
                <Megaphone size={28} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 text-sm">No announcements</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentAnnouncements.slice(0, 3).map(ann => (
                  <div key={ann.id} className="p-4">
                    <p className="text-sm font-semibold text-slate-800 truncate">{ann.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ann.content}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
