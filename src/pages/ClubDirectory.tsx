import { useEffect, useState } from 'react';
import { Search, Filter, Users, Plus, ChevronRight, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Club } from '../lib/types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

const CATEGORIES = ['All', 'Academic', 'Cultural', 'Sports', 'Technology', 'Arts', 'Service', 'Social', 'Professional', 'Religious', 'Environment', 'Political', 'General'];

interface ClubDirectoryProps {
  onNavigate: (page: string, id?: string) => void;
  searchQuery: string;
}

export function ClubDirectory({ onNavigate, searchQuery }: ClubDirectoryProps) {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [myClubIds, setMyClubIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newClub, setNewClub] = useState({ name: '', short_description: '', description: '', category: 'General', meeting_schedule: '', location: '', contact_email: '' });

  useEffect(() => {
    loadClubs();
  }, [user]);

  useEffect(() => {
    let result = clubs;
    if (selectedCategory !== 'All') result = result.filter(c => c.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.short_description.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
    }
    setFilteredClubs(result);
  }, [clubs, selectedCategory, searchQuery]);

  async function loadClubs() {
    const [clubsRes, memberRes] = await Promise.all([
      supabase.from('clubs').select('*').eq('is_public', true).eq('is_active', true).order('member_count', { ascending: false }),
      user ? supabase.from('club_members').select('club_id').eq('user_id', user.id).eq('status', 'active') : Promise.resolve({ data: [] }),
    ]);
    setClubs((clubsRes.data as Club[]) || []);
    setMyClubIds(new Set((memberRes.data || []).map((m: { club_id: string }) => m.club_id)));
    setLoading(false);
  }

  async function handleApply(clubId: string) {
    if (!user) return;
    const { error } = await supabase.from('membership_applications').insert({ club_id: clubId, user_id: user.id, message: '' });
    if (!error) await loadClubs();
  }

  async function handleCreateClub() {
    if (!user || !newClub.name.trim()) return;
    setCreating(true);
    const { data, error } = await supabase.from('clubs').insert({ ...newClub, created_by: user.id }).select().maybeSingle();
    if (!error && data) {
      await supabase.from('club_members').insert({ club_id: data.id, user_id: user.id, role: 'president', status: 'active' });
      await supabase.from('clubs').update({ member_count: 1 }).eq('id', data.id);
      setCreateOpen(false);
      setNewClub({ name: '', short_description: '', description: '', category: 'General', meeting_schedule: '', location: '', contact_email: '' });
      await loadClubs();
    }
    setCreating(false);
  }

  const categoryColors: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
    Academic: 'info', Cultural: 'warning', Sports: 'success', Technology: 'primary',
    Arts: 'warning', Service: 'success', Social: 'neutral', Professional: 'primary',
    Religious: 'neutral', Environment: 'success', Political: 'error', General: 'neutral',
  };

  if (loading) {
    return (
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => <div key={i} className="h-52 bg-slate-200 animate-pulse rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <p className="text-slate-500 text-sm">{filteredClubs.length} club{filteredClubs.length !== 1 ? 's' : ''} found</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          Create Club
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredClubs.length === 0 ? (
        <div className="text-center py-16">
          <Search size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-600">No clubs found</h3>
          <p className="text-slate-400 text-sm mt-1">Try a different search or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClubs.map(club => (
            <div
              key={club.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
            >
              <div className="h-24 bg-gradient-to-br from-sky-400 to-sky-700 relative">
                {club.banner_url && <img src={club.banner_url} alt="" className="w-full h-full object-cover absolute inset-0" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <Badge variant={categoryColors[club.category] || 'neutral'}>{club.category}</Badge>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{club.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{club.short_description || club.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {club.member_count} members
                  </span>
                  {club.location && (
                    <span className="truncate">{club.location}</span>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => onNavigate('club-detail', club.id)}
                    className="flex-1 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                  >
                    View <ChevronRight size={14} />
                  </button>
                  {!myClubIds.has(club.id) && (
                    <button
                      onClick={() => handleApply(club.id)}
                      className="flex-1 text-sm font-medium text-white bg-sky-600 rounded-lg px-3 py-1.5 hover:bg-sky-700 transition-colors"
                    >
                      Apply
                    </button>
                  )}
                  {myClubIds.has(club.id) && (
                    <span className="flex-1 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg px-3 py-1.5 text-center flex items-center justify-center gap-1">
                      <Star size={12} fill="currentColor" /> Member
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Club" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Club Name *</label>
              <input value={newClub.name} onChange={e => setNewClub(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Robotics Club" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
              <select value={newClub.category} onChange={e => setNewClub(p => ({ ...p, category: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition bg-white">
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Email</label>
              <input type="email" value={newClub.contact_email} onChange={e => setNewClub(p => ({ ...p, contact_email: e.target.value }))} placeholder="club@university.edu" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Short Description</label>
              <input value={newClub.short_description} onChange={e => setNewClub(p => ({ ...p, short_description: e.target.value }))} placeholder="One-line description of your club" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Description</label>
              <textarea rows={3} value={newClub.description} onChange={e => setNewClub(p => ({ ...p, description: e.target.value }))} placeholder="Tell students about your club..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Meeting Schedule</label>
              <input value={newClub.meeting_schedule} onChange={e => setNewClub(p => ({ ...p, meeting_schedule: e.target.value }))} placeholder="Every Tuesday 6PM" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
              <input value={newClub.location} onChange={e => setNewClub(p => ({ ...p, location: e.target.value }))} placeholder="Building 3, Room 201" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateClub} loading={creating} disabled={!newClub.name.trim()}>Create Club</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
