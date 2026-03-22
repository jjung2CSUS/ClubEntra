import { useEffect, useState } from 'react';
import { DollarSign, Plus, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { FundingRequest, Club } from '../lib/types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

interface FundingProps {
  searchQuery: string;
}

const STATUS_COLORS: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
  pending: 'warning', approved: 'success', rejected: 'error', paid: 'info',
};
const PRIORITY_COLORS: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
  low: 'neutral', normal: 'primary', high: 'warning', urgent: 'error',
};
const CATEGORIES = ['general', 'event', 'supplies', 'travel', 'marketing', 'equipment'] as const;

export function Funding({ searchQuery }: FundingProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<(FundingRequest & { clubs?: { name: string } })[]>([]);
  const [officerClubs, setOfficerClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [newReq, setNewReq] = useState({ club_id: '', title: '', description: '', amount: '', category: 'general', priority: 'normal' });

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) { setLoading(false); return; }
    const [reqRes, memberRes] = await Promise.all([
      supabase.from('funding_requests').select('*, clubs(name)').order('created_at', { ascending: false }),
      supabase.from('club_members').select('clubs(*), role').eq('user_id', user.id).eq('status', 'active'),
    ]);
    setRequests((reqRes.data || []) as (FundingRequest & { clubs?: { name: string } })[]);
    setOfficerClubs(
      ((memberRes.data || []) as { clubs: Club; role: string }[])
        .filter(m => ['president', 'officer', 'admin'].includes(m.role) && m.clubs)
        .map(m => m.clubs as Club)
    );
    setLoading(false);
  }

  async function handleCreate() {
    if (!user || !newReq.club_id || !newReq.title || !newReq.amount) return;
    setCreating(true);
    await supabase.from('funding_requests').insert({ ...newReq, amount: parseFloat(newReq.amount), submitted_by: user.id });
    setCreateOpen(false);
    setNewReq({ club_id: '', title: '', description: '', amount: '', category: 'general', priority: 'normal' });
    await loadData();
    setCreating(false);
  }

  async function handleStatusChange(id: string, status: string) {
    await supabase.from('funding_requests').update({ status, reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq('id', id);
    await loadData();
  }

  const totalByStatus = {
    pending: requests.filter(r => r.status === 'pending').reduce((s, r) => s + Number(r.amount), 0),
    approved: requests.filter(r => r.status === 'approved' || r.status === 'paid').reduce((s, r) => s + Number(r.amount), 0),
  };

  let filtered = requests;
  if (activeFilter !== 'all') filtered = filtered.filter(r => r.status === activeFilter);
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(r => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
  }

  if (loading) return <div className="p-6"><div className="h-64 bg-slate-200 animate-pulse rounded-2xl" /></div>;

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Pending Requests', value: totalByStatus.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', count: requests.filter(r => r.status === 'pending').length },
          { label: 'Approved / Paid', value: totalByStatus.approved, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', count: requests.filter(r => r.status === 'approved' || r.status === 'paid').length },
          { label: 'Total Requests', value: requests.reduce((s, r) => s + Number(r.amount), 0), icon: DollarSign, color: 'text-sky-600', bg: 'bg-sky-50', count: requests.length },
        ].map(({ label, value, icon: Icon, color, bg, count }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-xl font-bold text-slate-900">${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-sm text-slate-500">{label} <span className="text-slate-400">({count})</span></p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {(['all', 'pending', 'approved', 'rejected', 'paid'] as const).map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${activeFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {officerClubs.length > 0 && (
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus size={14} /> Submit Request
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <TrendingUp size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-600">No funding requests</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <div key={req.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900">{req.title}</h3>
                    <Badge variant={PRIORITY_COLORS[req.priority]}>{req.priority}</Badge>
                    <Badge variant={STATUS_COLORS[req.status]}>{req.status}</Badge>
                  </div>
                  {req.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{req.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    {req.clubs && <span className="text-sky-600">{req.clubs.name}</span>}
                    <span className="capitalize">{req.category}</span>
                    <span>{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xl font-bold text-slate-900">${Number(req.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  {req.status === 'pending' && officerClubs.some(c => c.id === req.club_id) && (
                    <div className="flex gap-1 mt-2">
                      <button onClick={() => handleStatusChange(req.id, 'approved')} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                        <CheckCircle size={14} />
                      </button>
                      <button onClick={() => handleStatusChange(req.id, 'rejected')} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                        <XCircle size={14} />
                      </button>
                    </div>
                  )}
                  {req.status === 'approved' && officerClubs.some(c => c.id === req.club_id) && (
                    <button onClick={() => handleStatusChange(req.id, 'paid')} className="mt-2 text-xs text-sky-600 font-medium hover:underline">Mark Paid</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Submit Funding Request" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Club *</label>
            <select value={newReq.club_id} onChange={e => setNewReq(p => ({ ...p, club_id: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition bg-white">
              <option value="">Select a club...</option>
              {officerClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Request Title *</label>
            <input value={newReq.title} onChange={e => setNewReq(p => ({ ...p, title: e.target.value }))} placeholder="Annual Banquet Catering" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount ($) *</label>
              <input type="number" min="0" step="0.01" value={newReq.amount} onChange={e => setNewReq(p => ({ ...p, amount: e.target.value }))} placeholder="250.00" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
              <select value={newReq.category} onChange={e => setNewReq(p => ({ ...p, category: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition bg-white">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
              <select value={newReq.priority} onChange={e => setNewReq(p => ({ ...p, priority: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition bg-white">
                {['low', 'normal', 'high', 'urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea rows={3} value={newReq.description} onChange={e => setNewReq(p => ({ ...p, description: e.target.value }))} placeholder="Explain what the funds will be used for..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating} disabled={!newReq.club_id || !newReq.title || !newReq.amount}>Submit</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
