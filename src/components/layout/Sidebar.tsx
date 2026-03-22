import {
  LayoutDashboard, Compass, Users, Calendar, Megaphone,
  FileText, DollarSign, BarChart3, Settings,
  Handshake, LogOut, ChevronLeft, ChevronRight, Shield, ShieldAlert
} from 'lucide-react';
import type { Page } from '../../lib/types';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  collapsed: boolean;
  onToggle: () => void;
  isOfficer?: boolean;
}

const navItems: { icon: React.ElementType; label: string; page: Page; officerOnly?: boolean }[] = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
  { icon: Compass, label: 'Discover Clubs', page: 'directory' },
  { icon: Users, label: 'My Clubs', page: 'my-clubs' },
  { icon: Calendar, label: 'Events', page: 'events' },
  { icon: Megaphone, label: 'Announcements', page: 'announcements' },
  { icon: FileText, label: 'Documents', page: 'documents' },
  { icon: DollarSign, label: 'Funding', page: 'funding' },
  { icon: Handshake, label: 'Collaborations', page: 'collaborations' },
  { icon: Shield, label: 'Officer Tools', page: 'officer', officerOnly: true },
  { icon: BarChart3, label: 'Analytics', page: 'analytics' },
  { icon: ShieldAlert, label: 'Admin Panel', page: 'admin-home' },
];

export function Sidebar({ currentPage, onNavigate, collapsed, onToggle, isOfficer }: SidebarProps) {
  const { profile, signOut } = useAuth();

  const visibleItems = navItems.filter(item => !item.officerOnly || isOfficer);

  return (
    <aside className={`fixed left-0 top-0 h-full z-30 flex flex-col bg-slate-900 text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className={`flex items-center h-16 border-b border-slate-800 px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <img src="/App_icon_5.png" alt="ClubEntra" className="w-8 h-8 rounded-lg flex-shrink-0 object-cover" />
            <span className="font-bold text-lg">ClubEntra</span>
          </div>
        )}
        {collapsed && (
          <img src="/App_icon_5.png" alt="ClubEntra" className="w-8 h-8 rounded-lg object-cover" />
        )}
        <button
          onClick={onToggle}
          className={`p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ${collapsed ? 'hidden' : ''}`}
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {collapsed && (
        <button onClick={onToggle} className="mx-auto mt-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
          <ChevronRight size={16} />
        </button>
      )}

      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map(({ icon: Icon, label, page }) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
              currentPage === page
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-3 space-y-0.5">
        <button
          onClick={() => onNavigate('profile')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            currentPage === 'profile' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
          title={collapsed ? 'Profile' : undefined}
        >
          <Settings size={18} className="flex-shrink-0" />
          {!collapsed && <span>Profile & Settings</span>}
        </button>

        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        {!collapsed && profile && (
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 bg-sky-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sky-400 text-xs font-bold">
                {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile.full_name || 'Student'}</p>
              <p className="text-xs text-slate-500 truncate">{profile.university || 'University'}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
