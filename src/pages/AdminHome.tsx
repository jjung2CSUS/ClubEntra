import { Users, Building2, Shield, TrendingUp, AlertCircle } from 'lucide-react';
import { AdminBottomNav } from '../components/admin/AdminBottomNav';
import type { Page } from '../lib/types';
import { useAuth } from '../context/AuthContext';

interface AdminHomeProps {
  onNavigate: (page: Page) => void;
}

export function AdminHome({ onNavigate }: AdminHomeProps) {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100 px-6 pt-12 pb-5"
        style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-1">Administrator</p>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Home</h1>
            </div>
            <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center">
              <Shield size={20} className="text-emerald-600" />
            </div>
          </div>
          {profile?.full_name && (
            <p className="mt-2 text-sm text-slate-400">Welcome back, {profile.full_name}</p>
          )}
        </div>
      </header>

      <main className="flex-1 px-6 py-8 pb-28 max-w-lg mx-auto w-full">

        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatCard icon={TrendingUp} label="Total Users" value="—" color="emerald" />
          <StatCard icon={Building2} label="Total Clubs" value="—" color="sky" />
        </div>

        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Management</p>

        <div className="space-y-4">
          <ActionButton
            icon={Users}
            title="Manage Users"
            description="View, edit, or remove student accounts"
            primary
            onClick={() => onNavigate('admin-users')}
          />

          <ActionButton
            icon={Building2}
            title="Manage Clubs"
            description="Review, approve, or deactivate clubs"
            primary={false}
            onClick={() => onNavigate('admin-clubs')}
          />
        </div>

        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3">
          <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700">Admin Panel</p>
            <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
              You have full administrative access. All actions are logged and irreversible.
            </p>
          </div>
        </div>
      </main>

      <AdminBottomNav currentPage="admin-home" onNavigate={onNavigate} />
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, color,
}: { icon: React.ElementType; label: string; value: string; color: 'emerald' | 'sky' }) {
  const colors = {
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-500', text: 'text-emerald-600' },
    sky: { bg: 'bg-sky-50', icon: 'text-sky-500', text: 'text-sky-600' },
  };
  const c = colors[color];
  return (
    <div className={`${c.bg} rounded-2xl p-4`} style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
      <Icon size={20} className={`${c.icon} mb-3`} />
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function ActionButton({
  icon: Icon, title, description, primary, onClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  primary: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-5 rounded-2xl text-left
        transition-all duration-150 active:scale-[0.98]
        ${primary
          ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
          : 'bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-800'}
      `}
      style={{ boxShadow: primary ? '0 4px 16px rgba(16,185,129,0.25)' : '0 1px 6px rgba(0,0,0,0.06)' }}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
        ${primary ? 'bg-white/20' : 'bg-emerald-100'}`}>
        <Icon size={22} className={primary ? 'text-white' : 'text-emerald-600'} />
      </div>
      <div>
        <p className={`font-semibold text-base ${primary ? 'text-white' : 'text-slate-800'}`}>{title}</p>
        <p className={`text-sm mt-0.5 ${primary ? 'text-white/75' : 'text-slate-400'}`}>{description}</p>
      </div>
    </button>
  );
}
