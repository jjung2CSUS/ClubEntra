import { useState } from 'react';
import { Eye, EyeOff, ChevronDown, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SignUpScreenProps {
  onSuccess: () => void;
  onBack: () => void;
}

type Role = 'member' | 'officer';

interface FormState {
  role: Role;
  full_name: string;
  email: string;
  student_id: string;
  university: string;
  club_name: string;
  password: string;
}

const INITIAL: FormState = {
  role: 'member',
  full_name: '',
  email: '',
  student_id: '',
  university: '',
  club_name: '',
  password: '',
};

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

type TouchedState = Record<keyof FormState, boolean>;
const UNTOUCHED: TouchedState = {
  role: false, full_name: false, email: false,
  student_id: false, university: false, club_name: false, password: false,
};

export function SignUpScreen({ onSuccess, onBack }: SignUpScreenProps) {
  const { signUp } = useAuth();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [touched, setTouched] = useState<TouchedState>(UNTOUCHED);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  function touch(field: keyof FormState) {
    setTouched(t => ({ ...t, [field]: true }));
  }

  function set(field: keyof FormState, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setServerError('');
  }

  function getErrors(): Partial<Record<keyof FormState, string>> {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.full_name.trim()) e.full_name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!isValidEmail(form.email)) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.role === 'officer' && !form.club_name.trim()) e.club_name = 'Club name is required for officers';
    return e;
  }

  const errors = getErrors();

  function fieldError(field: keyof FormState) {
    return touched[field] ? errors[field] : undefined;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({
      role: true, full_name: true, email: true,
      student_id: true, university: true, club_name: true, password: true,
    });
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    setServerError('');
    const { error } = await signUp(form.email, form.password, {
      full_name: form.full_name,
      university: form.university,
      student_id: form.student_id,
      student_role: form.role,
      club_name: form.club_name,
    });
    if (error) {
      setServerError(error.message);
      setLoading(false);
    } else {
      onSuccess();
    }
  }

  const inputBase = `w-full px-4 py-3.5 rounded-2xl border text-sm bg-slate-50 text-slate-900 placeholder-slate-400
    transition-all duration-150 outline-none
    focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:border-transparent`;
  const inputNormal = `${inputBase} border-slate-200 hover:border-slate-300`;
  const inputError = `${inputBase} border-red-300 ring-1 ring-red-300 bg-red-50/30`;

  function cls(field: keyof FormState) {
    return fieldError(field) ? inputError : inputNormal;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-start px-6 py-10">
      <div className="w-full max-w-sm flex flex-col items-center">

        <div className="w-full flex items-center mb-5">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-150"
          >
            <ArrowLeft size={22} />
          </button>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1 text-center">
          Create Account
        </h1>

        {serverError && (
          <div className="w-full mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>

          {/* Student Role */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Student Role</label>
            <div className="relative">
              <select
                value={form.role}
                onChange={e => set('role', e.target.value)}
                onBlur={() => touch('role')}
                className={`${inputNormal} appearance-none pr-10 cursor-pointer`}
              >
                <option value="member">Member</option>
                <option value="officer">Club Officer</option>
              </select>
              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Full Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              onBlur={() => touch('full_name')}
              placeholder="Jane Smith"
              autoComplete="name"
              className={cls('full_name')}
            />
            {fieldError('full_name') && <p className="text-xs text-red-500 ml-1">{fieldError('full_name')}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              onBlur={() => touch('email')}
              placeholder="jane@university.edu"
              autoComplete="email"
              className={cls('email')}
            />
            {fieldError('email') && <p className="text-xs text-red-500 ml-1">{fieldError('email')}</p>}
          </div>

          {/* Student ID */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Student ID</label>
            <input
              type="text"
              value={form.student_id}
              onChange={e => set('student_id', e.target.value)}
              onBlur={() => touch('student_id')}
              placeholder="e.g. 20231234"
              className={cls('student_id')}
            />
            {fieldError('student_id') && <p className="text-xs text-red-500 ml-1">{fieldError('student_id')}</p>}
          </div>

          {/* School */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">School / University</label>
            <input
              type="text"
              value={form.university}
              onChange={e => set('university', e.target.value)}
              onBlur={() => touch('university')}
              placeholder="State University"
              className={cls('university')}
            />
            {fieldError('university') && <p className="text-xs text-red-500 ml-1">{fieldError('university')}</p>}
          </div>

          {/* Club Name — required for officers, optional for members */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              Club Name
              {form.role === 'member' && (
                <span className="ml-1.5 text-xs font-normal text-slate-400">(optional)</span>
              )}
            </label>
            <input
              type="text"
              value={form.club_name}
              onChange={e => set('club_name', e.target.value)}
              onBlur={() => touch('club_name')}
              placeholder="e.g. Computer Science Club"
              className={cls('club_name')}
            />
            {fieldError('club_name') && <p className="text-xs text-red-500 ml-1">{fieldError('club_name')}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                onBlur={() => touch('password')}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                className={`${cls('password')} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {fieldError('password') && <p className="text-xs text-red-500 ml-1">{fieldError('password')}</p>}
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white font-semibold text-base
                hover:bg-emerald-600 active:scale-[0.98] active:bg-emerald-700
                disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
                transition-all duration-150 ease-out
                focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
              style={{ boxShadow: loading ? 'none' : '0 4px 16px rgba(16, 185, 129, 0.30)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
