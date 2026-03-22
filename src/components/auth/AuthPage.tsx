import { useState } from 'react';
import { Users, BookOpen, Calendar, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

type AuthMode = 'login' | 'signup';

interface AuthPageProps {
  onSuccess: () => void;
  initialMode?: AuthMode;
  onBack?: () => void;
}

export function AuthPage({ onSuccess, initialMode = 'login', onBack }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuth();

  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    university: '',
    major: '',
    graduation_year: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (mode === 'login') {
      const { error } = await signIn(form.email, form.password);
      if (error) setError(error.message);
      else onSuccess();
    } else {
      if (!form.full_name.trim()) { setError('Full name is required'); setLoading(false); return; }
      const { error } = await signUp(form.email, form.password, {
        full_name: form.full_name,
        university: form.university,
        major: form.major,
        graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null,
      });
      if (error) setError(error.message);
      else onSuccess();
    }
    setLoading(false);
  }

  const features = [
    { icon: Users, title: 'Join & Discover Clubs', desc: 'Find your community across hundreds of campus organizations' },
    { icon: Calendar, title: 'Never Miss Events', desc: 'RSVP to events and manage your campus calendar' },
    { icon: BookOpen, title: 'Organize Everything', desc: 'Documents, announcements, and funding in one place' },
    { icon: TrendingUp, title: 'Track Engagement', desc: 'Analytics and insights for club officers and admins' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 flex">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-sky-400 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-teal-400 rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-4 mb-2">
            <img src="/App_icon_5.png" alt="ClubEntra" className="w-32 h-32 rounded-3xl object-cover shadow-xl" />
            <div className="flex flex-col">
              <span className="text-5xl font-bold text-white">ClubEntra</span>
              <p className="text-sky-300 text-lg font-medium tracking-wide ml-2">Your Campus Club Hub</p>
            </div>
          </div>
        </div>
        <div className="relative space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="w-9 h-9 bg-sky-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-sky-400" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{title}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-slate-500 text-sm">
          Trusted by 500+ student organizations nationwide
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img src="/App_icon_5.png" alt="ClubEntra" className="w-9 h-9 rounded-xl object-cover shadow-md" />
            <span className="text-xl font-bold text-white">ClubEntra</span>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              {mode === 'login' ? 'Sign in to your ClubEntra account' : 'Join your campus community today'}
            </p>

            <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
              <button
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 text-sm font-medium py-2 rounded-lg transition-all ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode('signup'); setError(''); }}
                className={`flex-1 text-sm font-medium py-2 rounded-lg transition-all ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Jane Smith"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="jane@university.edu"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
              </div>
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">University</label>
                    <input
                      name="university"
                      value={form.university}
                      onChange={handleChange}
                      placeholder="State University"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Major</label>
                      <input
                        name="major"
                        value={form.major}
                        onChange={handleChange}
                        placeholder="Computer Science"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Grad Year</label>
                      <input
                        name="graduation_year"
                        type="number"
                        value={form.graduation_year}
                        onChange={handleChange}
                        placeholder="2026"
                        min="2024"
                        max="2030"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>
                </>
              )}
              <Button type="submit" loading={loading} className="w-full" size="lg">
                {mode === 'login' ? 'Sign In' : 'Create Account'}
                <ArrowRight size={16} />
              </Button>
            </form>

            <p className="text-center text-xs text-slate-500 mt-6">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }} className="text-sky-600 font-medium hover:underline">
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
