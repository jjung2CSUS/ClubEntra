import { useEffect, useState } from 'react';
import { BarChart3, Users, Calendar, TrendingUp, Award, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface AnalyticData {
  totalClubs: number;
  totalMembers: number;
  totalEvents: number;
  totalAnnouncements: number;
  topClubs: { id: string; name: string; member_count: number; category: string }[];
  categoryBreakdown: { category: string; count: number }[];
  recentActivity: { type: string; description: string; time: string }[];
  upcomingEventCount: number;
  pendingApplications: number;
}

export function Analytics() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    const [clubsRes, eventsRes, announcementsRes, upcomingRes, appsRes] = await Promise.all([
      supabase.from('clubs').select('id, name, member_count, category').eq('is_active', true).order('member_count', { ascending: false }),
      supabase.from('events').select('id', { count: 'exact' }),
      supabase.from('announcements').select('id', { count: 'exact' }),
      supabase.from('events').select('id', { count: 'exact' }).gte('start_time', new Date().toISOString()),
      user ? supabase.from('membership_applications').select('id', { count: 'exact' }).eq('status', 'pending') : Promise.resolve({ count: 0 }),
    ]);

    const clubs = clubsRes.data || [];
    const totalMembers = clubs.reduce((s: number, c: { member_count: number }) => s + (c.member_count || 0), 0);

    const categoryMap: Record<string, number> = {};
    clubs.forEach((c: { category: string }) => {
      categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;
    });
    const categoryBreakdown = Object.entries(categoryMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    setData({
      totalClubs: clubs.length,
      totalMembers,
      totalEvents: eventsRes.count || 0,
      totalAnnouncements: announcementsRes.count || 0,
      topClubs: clubs.slice(0, 5) as { id: string; name: string; member_count: number; category: string }[],
      categoryBreakdown,
      recentActivity: [],
      upcomingEventCount: upcomingRes.count || 0,
      pendingApplications: (appsRes as { count: number }).count || 0,
    });
    setLoading(false);
  }

  if (loading) return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}
      </div>
    </div>
  );

  if (!data) return null;

  const maxCategory = Math.max(...data.categoryBreakdown.map(c => c.count), 1);
  const maxMembers = Math.max(...data.topClubs.map(c => c.member_count), 1);

  const statCards = [
    { label: 'Total Clubs', value: data.totalClubs, icon: Building2, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Total Members', value: data.totalMembers.toLocaleString(), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Campus Events', value: data.totalEvents, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Upcoming Events', value: data.upcomingEventCount, icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award size={18} className="text-sky-600" />
            <h3 className="font-semibold text-slate-900">Top Clubs by Members</h3>
          </div>
          {data.topClubs.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No clubs yet</p>
          ) : (
            <div className="space-y-3">
              {data.topClubs.map((club, i) => (
                <div key={club.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-5 text-center">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-800 truncate flex-1 mr-2">{club.name}</span>
                      <span className="text-xs font-semibold text-slate-600">{club.member_count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full transition-all duration-700"
                        style={{ width: `${(club.member_count / maxMembers) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-sky-600" />
            <h3 className="font-semibold text-slate-900">Clubs by Category</h3>
          </div>
          {data.categoryBreakdown.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {data.categoryBreakdown.map(({ category, count }) => (
                <div key={category} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-24 truncate flex-shrink-0">{category}</span>
                  <div className="flex-1">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-400 to-teal-500 rounded-full transition-all duration-700"
                        style={{ width: `${(count / maxCategory) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 w-4 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Platform Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Avg Members/Club', value: data.totalClubs > 0 ? (data.totalMembers / data.totalClubs).toFixed(1) : '0' },
            { label: 'Total Announcements', value: data.totalAnnouncements },
            { label: 'Pending Applications', value: data.pendingApplications },
            { label: 'Upcoming Events', value: data.upcomingEventCount },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
