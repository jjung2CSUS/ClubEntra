import { useEffect, useState } from 'react';
import { FileText, Upload, Download, Trash2, FolderOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Document, Club } from '../lib/types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

interface DocumentsProps {
  searchQuery: string;
}

const CATEGORIES = ['general', 'financial', 'meeting_notes', 'constitution', 'forms', 'media'] as const;
const CAT_LABELS: Record<string, string> = {
  general: 'General', financial: 'Financial', meeting_notes: 'Meeting Notes',
  constitution: 'Constitution', forms: 'Forms', media: 'Media',
};
const CAT_COLORS: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
  general: 'neutral', financial: 'success', meeting_notes: 'info',
  constitution: 'warning', forms: 'primary', media: 'error',
};

export function Documents({ searchQuery }: DocumentsProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<(Document & { clubs?: { name: string } })[]>([]);
  const [officerClubs, setOfficerClubs] = useState<Club[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newDoc, setNewDoc] = useState({ club_id: '', name: '', description: '', file_url: '', file_type: 'PDF', category: 'general' });

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) { setLoading(false); return; }
    const [docsRes, memberRes] = await Promise.all([
      supabase.from('documents').select('*, clubs(name)').order('created_at', { ascending: false }),
      supabase.from('club_members').select('clubs(*), role').eq('user_id', user.id).eq('status', 'active'),
    ]);
    setDocuments((docsRes.data || []) as (Document & { clubs?: { name: string } })[]);
    setOfficerClubs(
      ((memberRes.data || []) as { clubs: Club; role: string }[])
        .filter(m => ['president', 'officer', 'admin'].includes(m.role) && m.clubs)
        .map(m => m.clubs as Club)
    );
    setLoading(false);
  }

  async function handleAdd() {
    if (!user || !newDoc.club_id || !newDoc.name) return;
    setUploading(true);
    await supabase.from('documents').insert({ ...newDoc, uploaded_by: user.id });
    setUploadOpen(false);
    setNewDoc({ club_id: '', name: '', description: '', file_url: '', file_type: 'PDF', category: 'general' });
    await loadData();
    setUploading(false);
  }

  async function handleDelete(id: string) {
    await supabase.from('documents').delete().eq('id', id);
    setDocuments(prev => prev.filter(d => d.id !== id));
  }

  let filtered = documents;
  if (activeCategory !== 'all') filtered = filtered.filter(d => d.category === activeCategory);
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(d => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
  }

  if (loading) return <div className="p-6"><div className="h-64 bg-slate-200 animate-pulse rounded-2xl" /></div>;

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setActiveCategory('all')} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${activeCategory === 'all' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>All</button>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${activeCategory === cat ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {CAT_LABELS[cat]}
            </button>
          ))}
        </div>
        {officerClubs.length > 0 && (
          <Button onClick={() => setUploadOpen(true)} size="sm">
            <Upload size={14} /> Add Document
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <FolderOpen size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-600">No documents</h3>
          <p className="text-slate-400 text-sm mt-1">Documents shared by your clubs will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText size={20} className="text-slate-600" />
                </div>
                <Badge variant={CAT_COLORS[doc.category] || 'neutral'}>{CAT_LABELS[doc.category]}</Badge>
              </div>
              <h3 className="font-semibold text-slate-900 text-sm truncate">{doc.name}</h3>
              {doc.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{doc.description}</p>}
              {doc.clubs && <p className="text-xs text-sky-600 mt-2">{doc.clubs.name}</p>}
              <p className="text-xs text-slate-400 mt-1">{new Date(doc.created_at).toLocaleDateString()}</p>
              <div className="flex gap-2 mt-3">
                {doc.file_url && (
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors">
                    <Download size={12} /> Download
                  </a>
                )}
                {officerClubs.some(c => c.id === doc.club_id) && (
                  <button onClick={() => handleDelete(doc.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Add Document">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Club *</label>
            <select value={newDoc.club_id} onChange={e => setNewDoc(p => ({ ...p, club_id: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition bg-white">
              <option value="">Select a club...</option>
              {officerClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Document Name *</label>
            <input value={newDoc.name} onChange={e => setNewDoc(p => ({ ...p, name: e.target.value }))} placeholder="Spring Meeting Notes" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
              <select value={newDoc.category} onChange={e => setNewDoc(p => ({ ...p, category: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition bg-white">
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">File Type</label>
              <select value={newDoc.file_type} onChange={e => setNewDoc(p => ({ ...p, file_type: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition bg-white">
                {['PDF', 'DOCX', 'XLSX', 'PPTX', 'PNG', 'JPG', 'Other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">File URL</label>
            <input value={newDoc.file_url} onChange={e => setNewDoc(p => ({ ...p, file_url: e.target.value }))} placeholder="https://drive.google.com/..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea rows={2} value={newDoc.description} onChange={e => setNewDoc(p => ({ ...p, description: e.target.value }))} placeholder="Brief description of this document..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} loading={uploading} disabled={!newDoc.club_id || !newDoc.name}>Add Document</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
