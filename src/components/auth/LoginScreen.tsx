import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginScreenProps {
  onSuccess: () => void;
  onForgotPassword: () => void;
  onBack: () => void;
}

export function LoginScreen({ onSuccess, onForgotPassword, onBack }: LoginScreenProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });

  const emailError = touched.email && !email.trim() ? 'Email is required' : '';
  const passwordError = touched.password && !password ? 'Password is required' : '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!email.trim() || !password) return;

    setLoading(true);
    setError('');
    const { error: authError } = await signIn(email, password);
    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      onSuccess();
    }
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
          Welcome back
        </h1>
        <p className="text-sm text-slate-400 text-center mb-8">
          Sign in to your ClubEntra account
        </p>

        {error && (
          <div className="w-full mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center animate-in fade-in slide-in-from-top-1 duration-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              onBlur={() => setTouched(t => ({ ...t, email: true }))}
              placeholder="jane@university.edu"
              autoComplete="email"
              className={`w-full px-4 py-3.5 rounded-2xl border text-sm bg-slate-50 text-slate-900 placeholder-slate-400
                transition-all duration-150 outline-none
                focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:border-transparent
                ${emailError ? 'border-red-300 ring-1 ring-red-300 bg-red-50/30' : 'border-slate-200 hover:border-slate-300'}`}
            />
            {emailError && (
              <p className="text-xs text-red-500 mt-1 ml-1">{emailError}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                onBlur={() => setTouched(t => ({ ...t, password: true }))}
                placeholder="••••••••"
                autoComplete="current-password"
                className={`w-full px-4 py-3.5 pr-12 rounded-2xl border text-sm bg-slate-50 text-slate-900 placeholder-slate-400
                  transition-all duration-150 outline-none
                  focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:border-transparent
                  ${passwordError ? 'border-red-300 ring-1 ring-red-300 bg-red-50/30' : 'border-slate-200 hover:border-slate-300'}`}
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
            {passwordError && (
              <p className="text-xs text-red-500 mt-1 ml-1">{passwordError}</p>
            )}
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
                  Signing in...
                </span>
              ) : 'Login'}
            </button>
          </div>
        </form>

        <button
          onClick={onForgotPassword}
          className="mt-5 text-sm text-slate-400 hover:text-emerald-600 transition-colors duration-150 font-medium"
        >
          Forgot Password?
        </button>

      </div>
    </div>
  );
}
