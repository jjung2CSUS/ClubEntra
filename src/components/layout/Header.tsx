import { Bell, Search, Menu } from 'lucide-react';
import type { Page } from '../../lib/types';

const pageTitles: Record<Page, string> = {
  dashboard: 'Dashboard',
  directory: 'Discover Clubs',
  'club-detail': 'Club',
  'my-clubs': 'My Clubs',
  events: 'Events Calendar',
  announcements: 'Announcements',
  documents: 'Documents',
  funding: 'Funding & Budget',
  officer: 'Officer Tools',
  analytics: 'Analytics',
  profile: 'Profile & Settings',
  collaborations: 'Collaborations',
};

interface HeaderProps {
  currentPage: Page;
  onMenuToggle: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showSearch?: boolean;
}

export function Header({ currentPage, onMenuToggle, searchQuery, onSearchChange, showSearch }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-20">
      <button onClick={onMenuToggle} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
        <Menu size={20} />
      </button>

      <h1 className="font-semibold text-slate-900 text-lg flex-1 lg:flex-none">{pageTitles[currentPage]}</h1>

      {showSearch && (
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 ml-auto">
        <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-sky-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
