import { ArrowLeft, UserPlus, UserCog, Shield, GraduationCap, Users, ChevronRight } from 'lucide-react';
import { AdminBottomNav } from '../components/admin/AdminBottomNav';
import type { Page } from '../lib/types';

interface ManageUsersProps {
  onNavigate: (page: Page) => void;
}

export function ManageUsers({ onNavigate }: ManageUsersProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100 px-5 pt-12 pb-5"
        style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}>
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => onNavigate('admin-home')}
            className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center
              hover:bg-slate-200 active:scale-95 transition-all duration-150"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Manage Users</h1>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 pb-28 max-w-lg mx-auto w-full">

        <div className="bg-white rounded-3xl overflow-hidden"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

          <ActionRow
            icon={UserPlus}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
            title="Create New User"
            subtitle="Add a new member, club officer, or advisor"
            onClick={() => onNavigate('admin-create-user')}
            divider
          />

          <ActionRow
            icon={UserCog}
            iconBg="bg-sky-100"
            iconColor="text-sky-600"
            title="Edit Current Users"
            subtitle="Update details of existing users"
            onClick={() => onNavigate('admin-edit-users')}
            divider
          />

          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-slate-400" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">View Users by Role</p>
            </div>

            <div className="space-y-2.5">
              <RoleBubble
                icon={Shield}
                label="Club Officers"
                color="emerald"
                onClick={() => onNavigate('admin-officers')}
              />
              <RoleBubble
                icon={GraduationCap}
                label="Advisors"
                color="amber"
                onClick={() => onNavigate('admin-advisors')}
              />
              <RoleBubble
                icon={Users}
                label="Members"
                color="sky"
                onClick={() => onNavigate('admin-members')}
              />
            </div>
          </div>
        </div>
      </main>

      <AdminBottomNav currentPage="admin-users" onNavigate={onNavigate} />
    </div>
  );
}

function ActionRow({
  icon: Icon, iconBg, iconColor, title, subtitle, onClick, divider,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  divider?: boolean;
}) {
  return (
    <>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-4 px-5 py-5
          hover:bg-slate-50 active:bg-slate-100 active:scale-[0.99]
          transition-all duration-150 text-left"
      >
        <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={22} className={iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-base">{title}</p>
          <p className="text-sm text-slate-400 mt-0.5 leading-snug">{subtitle}</p>
        </div>
        <ChevronRight size={18} className="text-slate-300 flex-shrink-0" />
      </button>
      {divider && <div className="mx-5 h-px bg-slate-100" />}
    </>
  );
}

function RoleBubble({
  icon: Icon, label, color, onClick,
}: {
  icon: React.ElementType;
  label: string;
  color: 'emerald' | 'amber' | 'sky';
  onClick: () => void;
}) {
  const colors = {
    emerald: { bg: 'bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200', icon: 'text-emerald-500', border: 'border-emerald-100', dot: 'bg-emerald-400' },
    amber:   { bg: 'bg-amber-50 hover:bg-amber-100 active:bg-amber-200', icon: 'text-amber-500', border: 'border-amber-100', dot: 'bg-amber-400' },
    sky:     { bg: 'bg-sky-50 hover:bg-sky-100 active:bg-sky-200', icon: 'text-sky-500', border: 'border-sky-100', dot: 'bg-sky-400' },
  };
  const c = colors[color];

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border
        ${c.bg} ${c.border}
        active:scale-[0.98] transition-all duration-150`}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
      <Icon size={16} className={`flex-shrink-0 ${c.icon}`} />
      <span className="font-semibold text-slate-700 text-sm flex-1 text-left">{label}</span>
      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
    </button>
  );
}
