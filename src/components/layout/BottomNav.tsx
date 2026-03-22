import { Home, MessageCircle, User } from 'lucide-react';
import type { Page } from '../../lib/types';

interface BottomNavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS: { icon: React.ElementType; label: string; page: Page }[] = [
  { icon: Home, label: 'Home', page: 'home' },
  { icon: MessageCircle, label: 'Chat', page: 'admin-chat' },
  { icon: User, label: 'Profile', page: 'profile' },
];

export function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100"
      style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.07)' }}
    >
      <div className="flex items-stretch max-w-lg mx-auto">
        {NAV_ITEMS.map(({ icon: Icon, label, page }) => {
          const active = currentPage === page;
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`relative flex-1 flex flex-col items-center justify-center pt-3 pb-4 gap-1
                transition-all duration-150 active:scale-95
                ${active ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
              <span className={`text-xs font-medium ${active ? 'text-emerald-500' : ''}`}>{label}</span>
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
