import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ForgotPasswordScreenProps {
  onBack: () => void;
}

export function ForgotPasswordScreen({ onBack }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const emailError = touched && !email.trim() ? 'Email is required' : '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!email.trim()) return;

    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (err) setError(err.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Check your email</h2>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed">
            We sent a password reset link to <span className="font-medium text-slate-600">{email}</span>.
            Check your inbox and follow the instructions.
          </p>
          <button
            onClick={onBack}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white font-semibold text-base
              hover:bg-emerald-600 active:scale-[0.98] transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
            style={{ boxShadow: '0 4px 16px rgba(16, 185, 129, 0.30)' }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="mb-6">
          <img
            src="/App_icon_5.png"
            alt="ClubEntra"
            className="w-20 h-20 rounded-2xl object-cover"
            style={{ boxShadow: '0 4px 20px rgba(16, 185, 129, 0.22)' }}
          />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1 text-center">
          Forgot Password?
        </h1>
        <p className="text-sm text-slate-400 text-center mb-8">
          Enter your email and we'll send you a reset link.
        </p>

        {error && (
          <div className="w-full mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              onBlur={() => setTouched(true)}
              placeholder="jane@university.edu"
              autoComplete="email"
              className={`w-full px-4 py-3.5 rounded-2xl border text-sm bg-slate-50 text-slate-900 placeholder-slate-400
                transition-all duration-150 outline-none
                focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:border-transparent
                ${emailError ? 'border-red-300 ring-1 ring-red-300 bg-red-50/30' : 'border-slate-200 hover:border-slate-300'}`}
            />
            {emailError && <p className="text-xs text-red-500 mt-1 ml-1">{emailError}</p>}
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
                  Sending...
                </span>
              ) : 'Send Reset Link'}
            </button>
          </div>
        </form>

        <button
          onClick={onBack}
          className="mt-5 text-sm text-slate-400 hover:text-slate-600 transition-colors duration-150"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
