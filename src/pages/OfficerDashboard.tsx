import { useEffect, useState } from 'react';
import { Users, CheckCircle, XCircle, Crown, UserMinus, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Club, ClubMember, MembershipApplication } from '../lib/types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

type Tab = 'overview' | 'applications' | 'members' | 'settings';

export function OfficerDashboard() {
  const { user } = useAuth();
  const [officerClubs, setOfficerClubs] = useState<(Club & { membership: ClubMember })[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [applications, setApplications] = useState<(MembershipApplication & { profile?: { full_name: string; major: string; university: string } })[]>([]);
  const [members, setMembers] = useState<(ClubMember & { profile?: { full_name: string; major: string } })[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editClub, setEditClub] = useState<Partial<Club>>({});

  useEffect(() => {
    loadClubs();
  }, [user]);

  useEffect(() => {
    if (selectedClub) loadClubData(selectedClub.id);
  }, [selectedClub]);

  async function loadClubs() {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('club_members')
      .select('*, clubs(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('role', ['president', 'officer', 'admin']);

    const clubs = ((data || []) as (ClubMember & { clubs: Club })[])
      .filter(m => m.clubs)
      .map(m => ({ ...(m.clubs as Club), membership: { id: m.id, club_id: m.club_id, user_id: m.user_id, role: m.role, status: m.status, joined_at: m.joined_at } }));

    setOfficerClubs(clubs);
    if (clubs.length > 0 && !selectedClub) setSelectedClub(clubs[0]);
    setLoading(false);
  }

  async function loadClubData(clubId: string) {
    const [appsRes, membersRes] = await Promise.all([
      supabase.from('membership_applications').select('*, profile:profiles(full_name, major, university)').eq('club_id', clubId).order('created_at', { ascending: false }),
      supabase.from('club_members').select('*, profile:profiles(full_name, major)').eq('club_id', clubId).eq('status', 'active'),
    ]);
    setApplications((appsRes.data || []) as (MembershipApplication & { profile?: { full_name: string; major: string; university: string } })[]);
    setMembers((membersRes.data || []) as (ClubMember & { profile?: { full_name: string; major: string } })[]);
  }

  async function handleApplication(appId: string, status: 'approved' | 'rejected', userId: string) {
    await supabase.from('membership_applications').update({ status, reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq('id', appId);
    if (status === 'approved' && selectedClub) {
      await supabase.from('club_members').insert({ club_id: selectedClub.id, user_id: userId, role: 'member', status: 'active' });
      await supabase.from('clubs').update({ member_count: (selectedClub.member_count || 0) + 1 }).eq('id', selectedClub.id);
    }
    if (selectedClub) await loadClubData(selectedClub.id);
  }

  async function handleRemoveMember(memberId: string) {
    await supabase.from('club_members').delete().eq('id', memberId);
    if (selectedClub) {
      await supabase.from('clubs').update({ member_count: Math.max(0, (selectedClub.member_count || 1) - 1) }).eq('id', selectedClub.id);
      await loadClubData(selectedClub.id);
    }
  }

  async function handleChangeRole(memberId: string, role: ClubMember['role']) {
    await supabase.from('club_members').update({ role }).eq('id', memberId);
    if (selectedClub) await loadClubData(selectedClub.id);
  }

  async function handleSaveSettings() {
    if (!selectedClub) return;
    setSaving(true);
    await supabase.from('clubs').update(editClub).eq('id', selectedClub.id);
    setSelectedClub(prev => prev ? { ...prev, ...editClub } : prev);
    setEditOpen(false);
    setSaving(false);
  }

  const pendingApps = applications.filter(a => a.status === 'pending');
  const roleColors: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
    president: 'warning', officer: 'primary', member: 'neutral', admin: 'error',
  };
  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'applications', label: 'Applications', badge: pendingApps.length },
    { key: 'members', label: 'Members', badge: members.length },
    { key: 'settings', label: 'Club Settings' },
  ];

  if (loading) return <div className="p-6"><div className="h-64 bg-slate-200 animate-pulse rounded-2xl" /></div>;

  if (officerClubs.length === 0) return (
    <div className="p-6 text-center py-20">
      <Shield size={48} className="mx-auto text-slate-300 mb-4" />
      <h3 className="text-xl font-semibold text-slate-700 mb-2">No Officer Access</h3>
      <p className="text-slate-500 text-sm">You're not an officer of any clubs yet. Create a club or ask a president to promote you.</p>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      {officerClubs.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {officerClubs.map(club => (
            <button
              key={club.id}
              onClick={() => setSelectedClub(club)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedClub?.id === club.id ? 'bg-sky-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              {club.name}
            </button>
          ))}
        </div>
      )}

      {selectedClub && (
        <>
          <div className="bg-gradient-to-r from-sky-600 to-sky-700 rounded-2xl p-5 text-white mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Crown size={18} className="text-amber-300" />
                  <span className="text-sky-200 text-sm font-medium capitalize">{officerClubs.find(c => c.id === selectedClub.id)?.membership.role}</span>
                </div>
                <h2 className="text-xl font-bold mt-0.5">{selectedClub.name}</h2>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{selectedClub.member_count}</p>
                <p className="text-sky-200 text-sm">Total Members</p>
              </div>
            </div>
          </div>

          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 px-3 rounded-lg whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="bg-sky-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{tab.badge}</span>
                )}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <h3 className="font-semibold text-slate-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Active Members', value: members.length },
                    { label: 'Pending Applications', value: pendingApps.length },
                    { label: 'Officers', value: members.filter(m => ['officer', 'president', 'admin'].includes(m.role)).length },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">{label}</span>
                      <span className="font-semibold text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <h3 className="font-semibold text-slate-900 mb-4">Club Info</h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <p><span className="font-medium">Category:</span> {selectedClub.category}</p>
                  <p><span className="font-medium">Schedule:</span> {selectedClub.meeting_schedule || '—'}</p>
                  <p><span className="font-medium">Location:</span> {selectedClub.location || '—'}</p>
                  <p><span className="font-medium">Email:</span> {selectedClub.contact_email || '—'}</p>
                </div>
                <button onClick={() => { setEditClub({ name: selectedClub.name, short_description: selectedClub.short_description, description: selectedClub.description, meeting_schedule: selectedClub.meeting_schedule, location: selectedClub.location, contact_email: selectedClub.contact_email }); setEditOpen(true); }} className="mt-3 text-sm text-sky-600 font-medium hover:underline">Edit Info</button>
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="space-y-3">
              {pendingApps.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-100 p-8 text-center">
                  <CheckCircle size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500">No pending applications</p>
                </div>
              ) : pendingApps.map(app => (
                <div key={app.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                        <span className="text-sky-700 font-bold text-sm">{app.profile?.full_name?.charAt(0) || '?'}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{app.profile?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{app.profile?.major} • {app.profile?.university}</p>
                        {app.message && <p className="text-sm text-slate-600 mt-1 italic">"{app.message}"</p>}
                        <p className="text-xs text-slate-400 mt-1">{new Date(app.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleApplication(app.id, 'approved', app.user_id)} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors">
                        <CheckCircle size={16} />
                      </button>
                      <button onClick={() => handleApplication(app.id, 'rejected', app.user_id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors">
                        <XCircle size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {applications.filter(a => a.status !== 'pending').length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-slate-500 mb-2">Previously Reviewed</h4>
                  {applications.filter(a => a.status !== 'pending').map(app => (
                    <div key={app.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50">
                      <span className="text-sm text-slate-700">{app.profile?.full_name}</span>
                      <Badge variant={app.status === 'approved' ? 'success' : 'error'}>{app.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{member.profile?.full_name?.charAt(0) || '?'}</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{member.profile?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{member.profile?.major}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={roleColors[member.role] || 'neutral'}>{member.role}</Badge>
                    {member.user_id !== user?.id && (
                      <div className="flex gap-1">
                        {member.role === 'member' && (
                          <button onClick={() => handleChangeRole(member.id, 'officer')} className="p-1.5 rounded-lg hover:bg-sky-50 text-slate-400 hover:text-sky-600 transition-colors" title="Promote to Officer">
                            <Crown size={13} />
                          </button>
                        )}
                        {member.role === 'officer' && (
                          <button onClick={() => handleChangeRole(member.id, 'member')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors" title="Demote to Member">
                            <Users size={13} />
                          </button>
                        )}
                        <button onClick={() => handleRemoveMember(member.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Remove Member">
                          <UserMinus size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Club Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Club Name</label>
                  <input defaultValue={selectedClub.name} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" onChange={e => setEditClub(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Short Description</label>
                  <input defaultValue={selectedClub.short_description} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" onChange={e => setEditClub(p => ({ ...p, short_description: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Description</label>
                  <textarea rows={4} defaultValue={selectedClub.description} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition resize-none" onChange={e => setEditClub(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Meeting Schedule</label>
                    <input defaultValue={selectedClub.meeting_schedule} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" onChange={e => setEditClub(p => ({ ...p, meeting_schedule: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
                    <input defaultValue={selectedClub.location} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" onChange={e => setEditClub(p => ({ ...p, location: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Email</label>
                    <input type="email" defaultValue={selectedClub.contact_email} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" onChange={e => setEditClub(p => ({ ...p, contact_email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Website</label>
                    <input defaultValue={selectedClub.website} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" onChange={e => setEditClub(p => ({ ...p, website: e.target.value }))} />
                  </div>
                </div>
                <div className="pt-2">
                  <Button onClick={handleSaveSettings} loading={saving}>Save Changes</Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
