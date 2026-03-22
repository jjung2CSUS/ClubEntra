import { MessageCircle } from 'lucide-react';
import { AdminBottomNav } from '../components/admin/AdminBottomNav';
import type { Page } from '../lib/types';

interface AdminChatProps {
  onNavigate: (page: Page) => void;
}

export function AdminChat({ onNavigate }: AdminChatProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100 px-5 pt-12 pb-5"
        style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}>
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-slate-900 text-center">Chat</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center pb-28 px-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
          <MessageCircle size={28} className="text-emerald-500" />
        </div>
        <p className="text-slate-700 font-semibold text-lg">Admin Chat</p>
        <p className="text-slate-400 text-sm mt-2 max-w-xs leading-relaxed">
          Messaging between administrators will appear here.
        </p>
      </main>

      <AdminBottomNav currentPage="admin-chat" onNavigate={onNavigate} />
    </div>
  );
}
