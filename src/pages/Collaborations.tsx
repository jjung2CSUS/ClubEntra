import { useEffect, useState } from 'react';
import { Handshake, Plus, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { ClubCollaboration, Club } from '../lib/types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

interface CollaborationsProps {
  searchQuery: string;
}

const STATUS_COLORS: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
  proposed: 'warning', active: 'success', completed: 'info', cancelled: 'neutral',
};

export function Collaborations({ searchQuery }: CollaborationsProps) {
  const { user } = useAuth();
  const [collabs, setCollabs] = useState<(ClubCollaboration & { club1?: { name: string }; club2?: { name: string } })[]>([]);
  const [officerClubs, setOfficerClubs] = useState<Club[]>([]);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCollab, setNewCollab] = useState({ club_id_1: '', club_id_2: '', project_name: '', description: '', start_date: '', end_date: '' });

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) { setLoading(false); return; }
    const [collabRes, memberRes, clubsRes] = await Promise.all([
      supabase.from('club_collaborations').select('*, club1:clubs!club_id_1(name), club2:clubs!club_id_2(name)').order('created_at', { ascending: false }),
      supabase.from('club_members').select('clubs(*), role').eq('user_id', user.id).eq('status', 'active'),
      supabase.from('clubs').select('id, name').eq('is_active', true).eq('is_public', true),
    ]);

    setCollabs((collabRes.data || []) as (ClubCollaboration & { club1?: { name: string }; club2?: { name: string } })[]);
    const officerList = ((memberRes.data || []) as { clubs: Club; role: string }[])
      .filter(m => ['president', 'officer', 'admin'].includes(m.role) && m.clubs)
      .map(m => m.clubs as Club);
    setOfficerClubs(officerList);
    setAllClubs((clubsRes.data as Club[]) || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!user || !newCollab.club_id_1 || !newCollab.club_id_2 || !newCollab.project_name) return;
    setCreating(true);
    await supabase.from('club_collaborations').insert({ ...newCollab, created_by: user.id, start_date: newCollab.start_date || null, end_date: newCollab.end_date || null });
    setCreateOpen(false);
    setNewCollab({ club_id_1: '', club_id_2: '', project_name: '', description: '', start_date: '', end_date: '' });
    await loadData();
    setCreating(false);
  }

  async function handleStatusChange(id: string, status: string) {
    await supabase.from('club_collaborations').update({ status }).eq('id', id);
    await loadData();
  }

  let filtered = collabs;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(c => c.project_name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
  }

  if (loading) return <div className="p-6"><div className="h-64 bg-slate-200 animate-pulse rounded-2xl" /></div>;

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="flex justify-end mb-6">
        {officerClubs.length > 0 && (
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus size={14} /> Propose Collaboration
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Handshake size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-600">No collaborations yet</h3>
          <p className="text-slate-400 text-sm mt-1">Propose a joint project with another club</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(collab => (
            <div key={collab.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-semibold text-slate-900">{collab.project_name}</h3>
                    <Badge variant={STATUS_COLORS[collab.status]}>{collab.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="font-medium text-sky-600">{collab.club1?.name}</span>
                    <ArrowRight size={14} className="text-slate-400" />
                    <span className="font-medium text-sky-600">{collab.club2?.name}</span>
                  </div>
                  {collab.description && <p className="text-sm text-slate-500 mt-2">{collab.description}</p>}
                  {(collab.start_date || collab.end_date) && (
                    <p className="text-xs text-slate-400 mt-2">
                      {collab.start_date && new Date(collab.start_date).toLocaleDateString()}
                      {collab.start_date && collab.end_date && ' – '}
                      {collab.end_date && new Date(collab.end_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {collab.status === 'proposed' && officerClubs.some(c => c.id === collab.club_id_1 || c.id === collab.club_id_2) && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleStatusChange(collab.id, 'active')} className="text-xs font-medium px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors">Accept</button>
                    <button onClick={() => handleStatusChange(collab.id, 'cancelled')} className="text-xs font-medium px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">Decline</button>
                  </div>
                )}
                {collab.status === 'active' && officerClubs.some(c => c.id === collab.club_id_1 || c.id === collab.club_id_2) && (
                  <button onClick={() => handleStatusChange(collab.id, 'completed')} className="text-xs font-medium px-3 py-1.5 bg-sky-50 text-sky-700 rounded-lg hover:bg-sky-100 transition-colors flex-shrink-0">Mark Complete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Propose Inter-Club Collaboration" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Club *</label>
              <select value={newCollab.club_id_1} onChange={e => setNewCollab(p => ({ ...p, club_id_1: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition bg-white">
                <option value="">Select your club...</option>
                {officerClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Partner Club *</label>
              <select value={newCollab.club_id_2} onChange={e => setNewCollab(p => ({ ...p, club_id_2: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition bg-white">
                <option value="">Select partner club...</option>
                {allClubs.filter(c => c.id !== newCollab.club_id_1).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Project Name *</label>
            <input value={newCollab.project_name} onChange={e => setNewCollab(p => ({ ...p, project_name: e.target.value }))} placeholder="Joint Spring Festival" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea rows={3} value={newCollab.description} onChange={e => setNewCollab(p => ({ ...p, description: e.target.value }))} placeholder="Describe the collaboration..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date</label>
              <input type="date" value={newCollab.start_date} onChange={e => setNewCollab(p => ({ ...p, start_date: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">End Date</label>
              <input type="date" value={newCollab.end_date} onChange={e => setNewCollab(p => ({ ...p, end_date: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating} disabled={!newCollab.club_id_1 || !newCollab.club_id_2 || !newCollab.project_name}>Propose</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
