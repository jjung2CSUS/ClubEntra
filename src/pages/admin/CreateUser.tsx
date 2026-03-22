import { useState } from 'react';
import { ArrowLeft, UserPlus, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AdminBottomNav } from '../../components/admin/AdminBottomNav';
import type { Page } from '../../lib/types';

interface CreateUserProps {
  onNavigate: (page: Page) => void;
}

type Role = 'member' | 'officer' | 'advisor';

export function CreateUser({ onNavigate }: CreateUserProps) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    university: '',
    major: '',
    student_role: 'member' as Role,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Name, email, and password are required.');
      return;
    }
    setLoading(true);
    setError('');
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: form.full_name,
        email: form.email,
        university: form.university,
        major: form.major,
        student_role: form.student_role,
      });
      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }
    }
    setLoading(false);
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-28 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
            <CheckCircle size={36} className="text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">User Created!</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            {form.full_name} has been added as a <span className="font-semibold capitalize">{form.student_role}</span>.
          </p>
          <button
            onClick={() => { setSuccess(false); setForm({ full_name: '', email: '', password: '', university: '', major: '', student_role: 'member' }); }}
            className="mt-8 px-8 py-3 bg-emerald-500 text-white rounded-2xl font-semibold
              active:scale-95 transition-all hover:bg-emerald-600"
            style={{ boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}
          >
            Create Another
          </button>
          <button
            onClick={() => onNavigate('admin-users')}
            className="mt-3 px-8 py-3 text-slate-500 font-medium text-sm"
          >
            Back to Manage Users
          </button>
        </div>
        <AdminBottomNav currentPage="admin-users" onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100 px-5 pt-12 pb-5"
        style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}>
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => onNavigate('admin-users')}
            className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center
              hover:bg-slate-200 active:scale-95 transition-all duration-150"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Create New User</h1>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 pb-28 max-w-lg mx-auto w-full">
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-3xl p-6 space-y-5"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

            <Field label="Full Name" required>
              <input
                type="text"
                value={form.full_name}
                onChange={e => set('full_name', e.target.value)}
                placeholder="e.g. Jordan Smith"
                className={inputClass}
              />
            </Field>

            <Field label="Email Address" required>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="user@university.edu"
                className={inputClass}
              />
            </Field>

            <Field label="Password" required>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Temporary password"
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <Field label="University">
              <input
                type="text"
                value={form.university}
                onChange={e => set('university', e.target.value)}
                placeholder="e.g. State University"
                className={inputClass}
              />
            </Field>

            <Field label="Major">
              <input
                type="text"
                value={form.major}
                onChange={e => set('major', e.target.value)}
                placeholder="e.g. Computer Science"
                className={inputClass}
              />
            </Field>

            <Field label="Role">
              <div className="grid grid-cols-3 gap-2">
                {(['member', 'officer', 'advisor'] as Role[]).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => set('student_role', r)}
                    className={`py-2.5 rounded-xl text-sm font-semibold capitalize border transition-all active:scale-95
                      ${form.student_role === r
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-emerald-300'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </Field>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full flex items-center justify-center gap-2 py-4 rounded-2xl
              bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base
              active:scale-[0.98] transition-all duration-150 disabled:opacity-60"
            style={{ boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}
          >
            <UserPlus size={18} />
            {loading ? 'Creating User…' : 'Create User'}
          </button>
        </form>
      </main>

      <AdminBottomNav currentPage="admin-users" onNavigate={onNavigate} />
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-emerald-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = `w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50
  text-sm text-slate-800 placeholder-slate-400
  focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
  transition-all duration-150`;
