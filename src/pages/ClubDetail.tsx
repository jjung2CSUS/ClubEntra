import { useEffect, useState } from 'react';
import { ArrowLeft, Users, MapPin, Globe, Mail, Instagram, Calendar, Megaphone, UserCheck, UserX, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Club, ClubMember, Event, Announcement } from '../lib/types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

interface ClubDetailProps {
  clubId: string;
  onBack: () => void;
  onNavigate: (page: string, id?: string) => void;
}

type Tab = 'about' | 'events' | 'announcements' | 'members';

export function ClubDetail({ clubId, onBack, onNavigate }: ClubDetailProps) {
  const { user } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [membership, setMembership] = useState<ClubMember | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [members, setMembers] = useState<(ClubMember & { profile?: { full_name: string; major: string } })[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('about');
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!clubId) return;
    loadAll();
  }, [clubId, user]);

  async function loadAll() {
    const [clubRes, membershipRes, applicationRes, eventsRes, announcementsRes, membersRes] = await Promise.all([
      supabase.from('clubs').select('*').eq('id', clubId).maybeSingle(),
      user ? supabase.from('club_members').select('*').eq('club_id', clubId).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
      user ? supabase.from('membership_applications').select('status').eq('club_id', clubId).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from('events').select('*').eq('club_id', clubId).order('start_time', { ascending: false }).limit(5),
      supabase.from('announcements').select('*').eq('club_id', clubId).order('created_at', { ascending: false }).limit(5),
      supabase.from('club_members').select('*, profile:profiles(full_name, major)').eq('club_id', clubId).eq('status', 'active').limit(20),
    ]);
    setClub(clubRes.data as Club);
    setMembership(membershipRes.data as ClubMember);
    setApplicationStatus((applicationRes.data as { status: string } | null)?.status || null);
    setEvents((eventsRes.data as Event[]) || []);
    setAnnouncements((announcementsRes.data as Announcement[]) || []);
    setMembers((membersRes.data || []) as (ClubMember & { profile?: { full_name: string; major: string } })[]);
    setLoading(false);
  }

  async function handleApply() {
    if (!user || !club) return;
    setApplying(true);
    await supabase.from('membership_applications').insert({ club_id: clubId, user_id: user.id, message: applyMessage });
    setApplicationStatus('pending');
    setApplyOpen(false);
    setApplying(false);
  }

  async function handleLeave() {
    if (!user) return;
    await supabase.from('club_members').delete().eq('club_id', clubId).eq('user_id', user.id);
    await supabase.from('clubs').update({ member_count: Math.max(0, (club?.member_count || 1) - 1) }).eq('id', clubId);
    setMembership(null);
    await loadAll();
  }

  const isOfficer = membership?.role === 'officer' || membership?.role === 'president' || membership?.role === 'admin';
  const tabs: { key: Tab; label: string }[] = [
    { key: 'about', label: 'About' },
    { key: 'events', label: `Events (${events.length})` },
    { key: 'announcements', label: `Announcements (${announcements.length})` },
    { key: 'members', label: `Members (${members.length})` },
  ];

  const roleColors: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
    president: 'warning', officer: 'primary', member: 'neutral', admin: 'error',
  };

  if (loading) return (
    <div className="p-6 space-y-4 animate-pulse max-w-4xl mx-auto">
      <div className="h-40 bg-slate-200 rounded-2xl" />
      <div className="h-8 bg-slate-200 rounded w-1/3" />
      <div className="h-32 bg-slate-200 rounded-xl" />
    </div>
  );

  if (!club) return (
    <div className="p-6 text-center">
      <p className="text-slate-500">Club not found</p>
      <Button onClick={onBack} variant="ghost" className="mt-2">Go Back</Button>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4 text-sm font-medium">
        <ArrowLeft size={16} /> Back to Directory
      </button>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
        <div className="h-40 bg-gradient-to-r from-sky-500 to-sky-700 relative">
          {club.banner_url && <img src={club.banner_url} alt="" className="w-full h-full object-cover absolute inset-0" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">{club.name}</h1>
                <Badge variant="info">{club.category}</Badge>
                {!club.is_active && <Badge variant="error">Inactive</Badge>}
              </div>
              <p className="text-slate-500 text-sm mt-1">{club.short_description}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><Users size={14} />{club.member_count} members</span>
                {club.location && <span className="flex items-center gap-1.5"><MapPin size={14} />{club.location}</span>}
                {club.meeting_schedule && <span className="flex items-center gap-1.5"><Clock size={14} />{club.meeting_schedule}</span>}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {membership ? (
                <>
                  <Badge variant={roleColors[membership.role] || 'neutral'} size="md">{membership.role}</Badge>
                  {!isOfficer && (
                    <Button variant="outline" size="sm" onClick={handleLeave}>
                      <UserX size={14} /> Leave
                    </Button>
                  )}
                  {isOfficer && (
                    <Button size="sm" onClick={() => onNavigate('officer')}>
                      Officer Tools
                    </Button>
                  )}
                </>
              ) : applicationStatus === 'pending' ? (
                <Badge variant="warning" size="md">Application Pending</Badge>
              ) : applicationStatus === 'rejected' ? (
                <Badge variant="error" size="md">Application Rejected</Badge>
              ) : (
                <Button onClick={() => setApplyOpen(true)}>
                  <UserCheck size={16} /> Apply to Join
                </Button>
              )}
            </div>
          </div>

          {(club.contact_email || club.website || club.instagram) && (
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-100">
              {club.contact_email && (
                <a href={`mailto:${club.contact_email}`} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-sky-600 transition-colors">
                  <Mail size={14} />{club.contact_email}
                </a>
              )}
              {club.website && (
                <a href={club.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-sky-600 transition-colors">
                  <Globe size={14} />Website
                </a>
              )}
              {club.instagram && (
                <a href={`https://instagram.com/${club.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-sky-600 transition-colors">
                  <Instagram size={14} />@{club.instagram}
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 text-sm font-medium py-2 px-3 rounded-lg whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'about' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-3">About This Club</h3>
          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{club.description || 'No description provided.'}</p>
          {club.founded_year && (
            <p className="text-sm text-slate-500 mt-4 pt-4 border-t border-slate-100">Founded in {club.founded_year}</p>
          )}
        </div>
      )}

      {activeTab === 'events' && (
        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
              <Calendar size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500">No events yet</p>
            </div>
          ) : events.map(event => (
            <div key={event.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{event.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{event.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span>{new Date(event.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                    {event.location && <span className="flex items-center gap-1"><MapPin size={11} />{event.location}</span>}
                    <span className="flex items-center gap-1"><Users size={11} />{event.rsvp_count} going</span>
                  </div>
                </div>
                <Badge variant="primary">{event.event_type}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'announcements' && (
        <div className="space-y-3">
          {announcements.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
              <Megaphone size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500">No announcements yet</p>
            </div>
          ) : announcements.map(ann => (
            <div key={ann.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-start gap-2">
                {ann.is_pinned && <span className="text-amber-500 text-xs font-medium bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">Pinned</span>}
                <div>
                  <p className="font-semibold text-slate-900">{ann.title}</p>
                  <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{ann.content}</p>
                  <p className="text-xs text-slate-400 mt-2">{new Date(ann.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{member.profile?.full_name?.charAt(0) || '?'}</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{member.profile?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{member.profile?.major || ''}</p>
                  </div>
                </div>
                <Badge variant={roleColors[member.role] || 'neutral'}>{member.role}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={applyOpen} onClose={() => setApplyOpen(false)} title={`Apply to ${club.name}`}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Tell the club officers why you want to join!</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Message (optional)</label>
            <textarea
              rows={4}
              value={applyMessage}
              onChange={e => setApplyMessage(e.target.value)}
              placeholder="I'm interested in joining because..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setApplyOpen(false)}>Cancel</Button>
            <Button onClick={handleApply} loading={applying}>Submit Application</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
