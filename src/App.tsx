import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WelcomeScreen } from './components/auth/WelcomeScreen';
import { LoginScreen } from './components/auth/LoginScreen';
import { ForgotPasswordScreen } from './components/auth/ForgotPasswordScreen';
import { SignUpScreen } from './components/auth/SignUpScreen';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { ClubDirectory } from './pages/ClubDirectory';
import { ClubDetail } from './pages/ClubDetail';
import { MyClubs } from './pages/MyClubs';
import { Events } from './pages/Events';
import { Announcements } from './pages/Announcements';
import { Documents } from './pages/Documents';
import { Funding } from './pages/Funding';
import { Collaborations } from './pages/Collaborations';
import { OfficerDashboard } from './pages/OfficerDashboard';
import { Analytics } from './pages/Analytics';
import { Profile } from './pages/Profile';
import { AdminHome } from './pages/AdminHome';
import { ManageUsers } from './pages/ManageUsers';
import { ManageClubs } from './pages/ManageClubs';
import { AdminChat } from './pages/AdminChat';
import { MobileHome } from './pages/MobileHome';
import { OfficerClubFunds } from './pages/OfficerClubFunds';
import { FundDetail } from './pages/FundDetail';
import type { FundType } from './pages/FundDetail';
import { AddTransaction } from './pages/AddTransaction';
import { CreateUser } from './pages/admin/CreateUser';
import { EditUsers } from './pages/admin/EditUsers';
import { UserRoleList } from './pages/admin/UserRoleList';
import { EditClubFunds } from './pages/admin/EditClubFunds';
import type { Page, Club } from './lib/types';
import { supabase } from './lib/supabase';

type AuthScreen = 'welcome' | 'login' | 'signup' | 'forgot-password';

function AppInner() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [authScreen, setAuthScreen] = useState<AuthScreen>('welcome');
  const [selectedClubId, setSelectedClubId] = useState<string | undefined>();
  const [selectedAdminClub, setSelectedAdminClub] = useState<Club | undefined>();
  const [selectedFundType, setSelectedFundType] = useState<FundType | undefined>();
  const [selectedFundId, setSelectedFundId] = useState<string | null>(null);
  const [selectedFundYear, setSelectedFundYear] = useState<number>(2026);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOfficer, setIsOfficer] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('club_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('role', ['president', 'officer', 'admin'])
      .limit(1)
      .then(({ data }) => setIsOfficer((data || []).length > 0));
  }, [user]);

  function handleNavigate(page: string, id?: string) {
    setCurrentPage(page as Page);
    if (id) setSelectedClubId(id);
    setSearchQuery('');
    setMobileSidebarOpen(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-3 animate-pulse">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <p className="text-slate-500 text-sm">Loading ClubEntra...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authScreen === 'welcome') {
      return (
        <WelcomeScreen
          onCreateAccount={() => setAuthScreen('signup')}
          onLogin={() => setAuthScreen('login')}
        />
      );
    }
    if (authScreen === 'login') {
      return (
        <LoginScreen
          onSuccess={() => { setAuthScreen('welcome'); setCurrentPage('home'); }}
          onForgotPassword={() => setAuthScreen('forgot-password')}
          onBack={() => setAuthScreen('welcome')}
        />
      );
    }
    if (authScreen === 'forgot-password') {
      return (
        <ForgotPasswordScreen
          onBack={() => setAuthScreen('login')}
        />
      );
    }
    return (
      <SignUpScreen
        onSuccess={() => { setAuthScreen('welcome'); setCurrentPage('home'); }}
        onBack={() => setAuthScreen('welcome')}
      />
    );
  }

  if (currentPage === 'home') {
    return <MobileHome onNavigate={handleNavigate} />;
  }

  if (currentPage === 'club-funds' && selectedClubId) {
    return (
      <OfficerClubFunds
        clubId={selectedClubId}
        onNavigate={handleNavigate}
        onBack={() => handleNavigate('home')}
        onFundSelect={(fundType) => {
          setSelectedFundType(fundType);
          setCurrentPage('fund-detail');
        }}
      />
    );
  }

  if (currentPage === 'fund-detail' && selectedClubId && selectedFundType) {
    return (
      <FundDetail
        clubId={selectedClubId}
        fundType={selectedFundType}
        onNavigate={handleNavigate}
        onBack={() => setCurrentPage('club-funds')}
        onAddTransaction={(fundId, year) => { setSelectedFundId(fundId); setSelectedFundYear(year); setCurrentPage('add-transaction'); }}
      />
    );
  }

  if (currentPage === 'add-transaction' && selectedClubId && selectedFundType) {
    return (
      <AddTransaction
        clubId={selectedClubId}
        clubFundId={selectedFundId}
        fundType={selectedFundType}
        year={selectedFundYear}
        onNavigate={handleNavigate}
        onBack={() => setCurrentPage('fund-detail')}
        onSuccess={() => setCurrentPage('fund-detail')}
      />
    );
  }

  const showSearch = ['directory', 'events', 'announcements', 'documents', 'funding', 'collaborations'].includes(currentPage);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}
      <div className={`lg:block ${mobileSidebarOpen ? 'block' : 'hidden'} fixed lg:static z-30`}>
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(p => !p)}
          isOfficer={isOfficer}
        />
      </div>

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <Header
          currentPage={currentPage}
          onMenuToggle={() => setMobileSidebarOpen(p => !p)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showSearch={showSearch}
        />
        <main className="flex-1 overflow-y-auto">
          {currentPage === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
          {currentPage === 'directory' && <ClubDirectory onNavigate={handleNavigate} searchQuery={searchQuery} />}
          {currentPage === 'club-detail' && selectedClubId && (
            <ClubDetail clubId={selectedClubId} onBack={() => setCurrentPage('directory')} onNavigate={handleNavigate} />
          )}
          {currentPage === 'my-clubs' && <MyClubs onNavigate={handleNavigate} />}
          {currentPage === 'events' && <Events searchQuery={searchQuery} />}
          {currentPage === 'announcements' && <Announcements searchQuery={searchQuery} />}
          {currentPage === 'documents' && <Documents searchQuery={searchQuery} />}
          {currentPage === 'funding' && <Funding searchQuery={searchQuery} />}
          {currentPage === 'collaborations' && <Collaborations searchQuery={searchQuery} />}
          {currentPage === 'officer' && <OfficerDashboard />}
          {currentPage === 'analytics' && <Analytics />}
          {currentPage === 'profile' && <Profile />}
          {currentPage === 'admin-home' && <AdminHome onNavigate={handleNavigate} />}
          {currentPage === 'admin-users' && <ManageUsers onNavigate={handleNavigate} />}
          {currentPage === 'admin-clubs' && (
            <ManageClubs
              onNavigate={handleNavigate}
              onEditClubFunds={club => { setSelectedAdminClub(club); handleNavigate('admin-edit-club-funds'); }}
            />
          )}
          {currentPage === 'admin-edit-club-funds' && selectedAdminClub && (
            <EditClubFunds
              club={selectedAdminClub}
              onNavigate={handleNavigate}
              onSaved={updated => setSelectedAdminClub(updated)}
            />
          )}
          {currentPage === 'admin-chat' && <AdminChat onNavigate={handleNavigate} />}
          {currentPage === 'admin-create-user' && <CreateUser onNavigate={handleNavigate} />}
          {currentPage === 'admin-edit-users' && <EditUsers onNavigate={handleNavigate} />}
          {currentPage === 'admin-officers' && <UserRoleList role="officer" onNavigate={handleNavigate} />}
          {currentPage === 'admin-advisors' && <UserRoleList role="advisor" onNavigate={handleNavigate} />}
          {currentPage === 'admin-members' && <UserRoleList role="member" onNavigate={handleNavigate} />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
