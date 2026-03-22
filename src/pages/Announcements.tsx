import { useEffect, useState } from 'react';
import { Megaphone, Pin, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Announcement, Club } from '../lib/types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

interface AnnouncementsProps {
  searchQuery: string;
}

export function Announcements({ searchQuery }: AnnouncementsProps) {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<(Announcement & { clubs?: { name: string } })[]>([]);
  const [officerClubs, setOfficerClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newAnn, setNewAnn] = useState({ club_id: '', title: '', content: '', is_pinned: false });

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) { setLoading(false); return; }

    const [annRes, memberRes] = await Promise.all([
      supabase.from('announcements').select('*, clubs(name)').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(30),
      supabase.from('club_members').select('clubs(*), role').eq('user_id', user.id).eq('status', 'active'),
    ]);

    setAnnouncements((annRes.data || []) as (Announcement & { clubs?: { name: string } })[]);
    setOfficerClubs(
      ((memberRes.data || []) as { clubs: Club; role: string }[])
        .filter(m => ['president', 'officer', 'admin'].includes(m.role) && m.clubs)
        .map(m => m.clubs as Club)
    );
    setLoading(false);
  }

  async function handleCreate() {
    if (!user || !newAnn.club_id || !newAnn.title || !newAnn.content) return;
    setCreating(true);
    await supabase.from('announcements').insert({ ...newAnn, author_id: user.id });
    setCreateOpen(false);
    setNewAnn({ club_id: '', title: '', content: '', is_pinned: false });
    await loadData();
    setCreating(false);
  }

  async function handleDelete(id: string) {
    await supabase.from('announcements').delete().eq('id', id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  }

  const filtered = searchQuery.trim()
    ? announcements.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : announcements;

  if (loading) return (
    <div className="p-6 space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-200 animate-pulse rounded-xl" />)}
    </div>
  );

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <div className="flex justify-end mb-6">
        {officerClubs.length > 0 && (
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus size={14} /> Post Announcement
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Megaphone size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-600">No announcements</h3>
          <p className="text-slate-400 text-sm mt-1">Join clubs to see their announcements</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ann => (
            <div key={ann.id} className={`bg-white rounded-xl border shadow-sm p-5 transition-all hover:shadow-md ${ann.is_pinned ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {ann.is_pinned && (
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Pin size={10} /> Pinned
                      </span>
                    )}
                    {ann.clubs && (
                      <span className="text-xs text-sky-600 font-medium bg-sky-50 px-2 py-0.5 rounded-full">{ann.clubs.name}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 mt-2">{ann.title}</h3>
                  <p className="text-sm text-slate-600 mt-1.5 whitespace-pre-wrap leading-relaxed">{ann.content}</p>
                  <p className="text-xs text-slate-400 mt-3">
                    {new Date(ann.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                {officerClubs.some(c => c.id === ann.club_id) && (
                  <button onClick={() => handleDelete(ann.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Post Announcement">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Club *</label>
            <select value={newAnn.club_id} onChange={e => setNewAnn(p => ({ ...p, club_id: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition bg-white">
              <option value="">Select a club...</option>
              {officerClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
            <input value={newAnn.title} onChange={e => setNewAnn(p => ({ ...p, title: e.target.value }))} placeholder="Spring Meeting Recap" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Content *</label>
            <textarea rows={5} value={newAnn.content} onChange={e => setNewAnn(p => ({ ...p, content: e.target.value }))} placeholder="Write your announcement..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition resize-none" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={newAnn.is_pinned} onChange={e => setNewAnn(p => ({ ...p, is_pinned: e.target.checked }))} className="w-4 h-4 rounded accent-sky-600" />
            <span className="text-sm font-medium text-slate-700">Pin this announcement</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating} disabled={!newAnn.club_id || !newAnn.title || !newAnn.content}>Post</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
