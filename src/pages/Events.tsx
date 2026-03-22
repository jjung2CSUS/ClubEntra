import { useEffect, useState } from 'react';
import { Calendar, MapPin, Clock, Users, Plus, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Event, Club } from '../lib/types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

interface EventsProps {
  searchQuery: string;
}

const EVENT_TYPES = ['general', 'meeting', 'social', 'fundraiser', 'workshop', 'competition', 'community'] as const;
const TYPE_COLORS: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
  meeting: 'primary', social: 'success', fundraiser: 'warning', workshop: 'info',
  competition: 'error', community: 'success', general: 'neutral',
};

export function Events({ searchQuery }: EventsProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [rsvpIds, setRsvpIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'my-clubs'>('upcoming');
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [officerClubs, setOfficerClubs] = useState<Club[]>([]);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', location: '', start_time: '', end_time: '', club_id: '', event_type: 'general', max_attendees: '', is_public: true });

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    const now = new Date().toISOString();
    const [eventsRes, rsvpsRes, memberRes] = await Promise.all([
      supabase.from('events').select('*').gte('start_time', now).order('start_time', { ascending: true }).limit(50),
      user ? supabase.from('event_rsvps').select('event_id').eq('user_id', user.id) : Promise.resolve({ data: [] }),
      user ? supabase.from('club_members').select('clubs(*), role').eq('user_id', user.id).eq('status', 'active') : Promise.resolve({ data: [] }),
    ]);

    setEvents((eventsRes.data as Event[]) || []);
    setRsvpIds(new Set((rsvpsRes.data || []).map((r: { event_id: string }) => r.event_id)));

    const clubs = ((memberRes.data || []) as { clubs: Club; role: string }[])
      .filter(m => m.clubs)
      .map(m => m.clubs as Club);
    setMyClubs(clubs);
    setOfficerClubs(((memberRes.data || []) as { clubs: Club; role: string }[]).filter(m => ['president', 'officer', 'admin'].includes(m.role) && m.clubs).map(m => m.clubs as Club));
    setLoading(false);
  }

  async function handleRSVP(eventId: string) {
    if (!user) return;
    if (rsvpIds.has(eventId)) {
      await supabase.from('event_rsvps').delete().eq('event_id', eventId).eq('user_id', user.id);
      await supabase.from('events').update({ rsvp_count: Math.max(0, (events.find(e => e.id === eventId)?.rsvp_count || 1) - 1) }).eq('id', eventId);
      setRsvpIds(prev => { const n = new Set(prev); n.delete(eventId); return n; });
    } else {
      await supabase.from('event_rsvps').insert({ event_id: eventId, user_id: user.id, status: 'going' });
      await supabase.from('events').update({ rsvp_count: (events.find(e => e.id === eventId)?.rsvp_count || 0) + 1 }).eq('id', eventId);
      setRsvpIds(prev => new Set([...prev, eventId]));
    }
    await loadData();
  }

  async function handleCreate() {
    if (!user || !newEvent.title || !newEvent.club_id || !newEvent.start_time) return;
    setCreating(true);
    await supabase.from('events').insert({
      ...newEvent,
      created_by: user.id,
      max_attendees: newEvent.max_attendees ? parseInt(newEvent.max_attendees) : null,
      end_time: newEvent.end_time || null,
    });
    setCreateOpen(false);
    setNewEvent({ title: '', description: '', location: '', start_time: '', end_time: '', club_id: '', event_type: 'general', max_attendees: '', is_public: true });
    await loadData();
    setCreating(false);
  }

  const myClubIds = new Set(myClubs.map(c => c.id));

  let filtered = events;
  if (filter === 'my-clubs') filtered = events.filter(e => myClubIds.has(e.club_id));
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(e => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.location.toLowerCase().includes(q));
  }

  if (loading) return (
    <div className="p-6 space-y-4">
      {[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-slate-200 animate-pulse rounded-xl" />)}
    </div>
  );

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {(['upcoming', 'all', 'my-clubs'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
              {f === 'my-clubs' ? 'My Clubs' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {officerClubs.length > 0 && (
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus size={14} /> Create Event
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Calendar size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-600">No events found</h3>
          <p className="text-slate-400 text-sm mt-1">
            {filter === 'my-clubs' ? 'Events from your clubs will appear here' : 'No upcoming events right now'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(event => {
            const isRSVPed = rsvpIds.has(event.id);
            const start = new Date(event.start_time);
            return (
              <div key={event.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all">
                <div className="flex gap-4">
                  <div className="hidden sm:flex flex-col items-center justify-center bg-sky-50 rounded-xl px-3 py-2 min-w-[60px] text-center flex-shrink-0">
                    <span className="text-xs font-bold text-sky-600 uppercase">{start.toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-2xl font-bold text-sky-700 leading-tight">{start.getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-900">{event.title}</h3>
                      <Badge variant={TYPE_COLORS[event.event_type] || 'neutral'}>{event.event_type}</Badge>
                    </div>
                    {event.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{event.description}</p>}
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1 sm:hidden">
                        <Calendar size={11} />{start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1"><Clock size={11} />{start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                      {event.location && <span className="flex items-center gap-1"><MapPin size={11} />{event.location}</span>}
                      <span className="flex items-center gap-1"><Users size={11} />{event.rsvp_count} going</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => handleRSVP(event.id)}
                    className={`flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${
                      isRSVPed
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-sky-600 text-white hover:bg-sky-700'
                    }`}
                  >
                    {isRSVPed ? <><CheckCircle size={14} /> Going</> : 'RSVP'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Event" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Club *</label>
            <select value={newEvent.club_id} onChange={e => setNewEvent(p => ({ ...p, club_id: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition bg-white">
              <option value="">Select a club...</option>
              {officerClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Event Title *</label>
            <input value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} placeholder="Annual Hackathon" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Time *</label>
              <input type="datetime-local" value={newEvent.start_time} onChange={e => setNewEvent(p => ({ ...p, start_time: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">End Time</label>
              <input type="datetime-local" value={newEvent.end_time} onChange={e => setNewEvent(p => ({ ...p, end_time: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
              <input value={newEvent.location} onChange={e => setNewEvent(p => ({ ...p, location: e.target.value }))} placeholder="Building A, Room 101" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Event Type</label>
              <select value={newEvent.event_type} onChange={e => setNewEvent(p => ({ ...p, event_type: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition bg-white">
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea rows={3} value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))} placeholder="What's this event about?" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Max Attendees</label>
              <input type="number" value={newEvent.max_attendees} onChange={e => setNewEvent(p => ({ ...p, max_attendees: e.target.value }))} placeholder="Leave blank for unlimited" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newEvent.is_public} onChange={e => setNewEvent(p => ({ ...p, is_public: e.target.checked }))} className="w-4 h-4 rounded accent-sky-600" />
                <span className="text-sm font-medium text-slate-700">Public Event</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating} disabled={!newEvent.title || !newEvent.club_id || !newEvent.start_time}>Create Event</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
