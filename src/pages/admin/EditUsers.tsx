import { useEffect, useState } from 'react';
import { ArrowLeft, Search, UserCog, ChevronRight, X, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AdminBottomNav } from '../../components/admin/AdminBottomNav';
import type { Page, Profile } from '../../lib/types';

interface EditUsersProps {
  onNavigate: (page: Page) => void;
}

export function EditUsers({ onNavigate }: EditUsersProps) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .order('full_name')
      .then(({ data }) => { setUsers(data || []); setLoading(false); });
  }, []);

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.university?.toLowerCase().includes(search.toLowerCase())
  );

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    setSaveError('');
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editing.full_name,
        university: editing.university,
        major: editing.major,
        student_role: editing.student_role,
        bio: editing.bio,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editing.id);
    setSaving(false);
    if (error) { setSaveError(error.message); return; }
    setUsers(prev => prev.map(u => u.id === editing.id ? editing : u));
    setEditing(null);
  }

  if (editing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-100 px-5 pt-12 pb-5"
          style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}>
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setEditing(null); setSaveError(''); }}
                className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center
                  hover:bg-slate-200 active:scale-95 transition-all"
              >
                <X size={18} className="text-slate-600" />
              </button>
              <h1 className="text-xl font-bold text-slate-900">Edit User</h1>
            </div>
            <button
              onClick={saveEdit}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white
                text-sm font-semibold active:scale-95 transition-all disabled:opacity-60
                hover:bg-emerald-600"
            >
              <Check size={15} />
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </header>
        <main className="flex-1 px-5 py-6 pb-28 max-w-lg mx-auto w-full">
          <div className="bg-white rounded-3xl p-6 space-y-5"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <EField label="Full Name">
              <input value={editing.full_name || ''} onChange={e => setEditing({ ...editing, full_name: e.target.value })}
                className={iClass} placeholder="Full name" />
            </EField>
            <EField label="University">
              <input value={editing.university || ''} onChange={e => setEditing({ ...editing, university: e.target.value })}
                className={iClass} placeholder="University" />
            </EField>
            <EField label="Major">
              <input value={editing.major || ''} onChange={e => setEditing({ ...editing, major: e.target.value })}
                className={iClass} placeholder="Major" />
            </EField>
            <EField label="Role">
              <div className="grid grid-cols-3 gap-2">
                {(['member', 'officer', 'advisor'] as const).map(r => (
                  <button key={r} type="button"
                    onClick={() => setEditing({ ...editing, student_role: r })}
                    className={`py-2.5 rounded-xl text-sm font-semibold capitalize border transition-all active:scale-95
                      ${editing.student_role === r
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-emerald-300'}`}
                  >{r}</button>
                ))}
              </div>
            </EField>
            <EField label="Bio">
              <textarea value={editing.bio || ''} onChange={e => setEditing({ ...editing, bio: e.target.value })}
                className={`${iClass} resize-none`} rows={3} placeholder="Short bio…" />
            </EField>
            {saveError && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{saveError}</p>}
          </div>
        </main>
        <AdminBottomNav currentPage="admin-users" onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100 px-5 pt-12 pb-4"
        style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => onNavigate('admin-users')}
              className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center
                hover:bg-slate-200 active:scale-95 transition-all"
            >
              <ArrowLeft size={18} className="text-slate-600" />
            </button>
            <h1 className="text-xl font-bold text-slate-900">Edit Current Users</h1>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50
                text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
                placeholder-slate-400 text-slate-800"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 py-4 pb-28 max-w-lg mx-auto w-full">
        <p className="text-xs text-slate-400 mb-4">{filtered.length} user{filtered.length !== 1 ? 's' : ''} — tap to edit</p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                    <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <UserCog size={40} className="text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No users found</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(u => (
              <button
                key={u.id}
                onClick={() => setEditing({ ...u })}
                className="w-full bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3
                  hover:bg-slate-50 active:scale-[0.99] transition-all"
                style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0
                  font-semibold text-sm text-emerald-700">
                  {u.full_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-semibold text-slate-800 text-sm truncate">{u.full_name || 'Unnamed'}</p>
                  <p className="text-xs text-slate-400 truncate mt-0.5 capitalize">
                    {u.student_role || 'member'}{u.university ? ` · ${u.university}` : ''}
                  </p>
                </div>
                <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </main>

      <AdminBottomNav currentPage="admin-users" onNavigate={onNavigate} />
    </div>
  );
}

function EField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const iClass = `w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50
  text-sm text-slate-800 placeholder-slate-400
  focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all`;
