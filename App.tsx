
import React, { useEffect, useState, createContext, useContext } from 'react';
// @ts-ignore
import * as ReactRouterDOM from 'react-router-dom';
import { User, AdminSettings } from './types';
import { getStore, saveStore, processDailyIncome, initCloudStore } from './store';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Income from './pages/Income';
import Team from './pages/Team';
import Community from './pages/Community';
import Support from './pages/Support';
import My from './pages/My';
import Recharge from './pages/Recharge';
import Withdraw from './pages/Withdraw';
import Admin from './pages/Admin';
import Share from './pages/Share';
import PersonalInfo from './components/PersonalInfo';
import AboutUs from './pages/AboutUs';
import BalanceDetails from './pages/BalanceDetails';
import Records from './pages/Records';
import ChatView from './components/ChatView'; // Import the ChatView component
import { Home as HomeIcon, Zap, Users, User as UserIcon, ShieldAlert, RefreshCw, MessageCircle, Share2 } from 'lucide-react';
import { LOGO_IMAGE } from './constants';

const { HashRouter, Routes, Route, Navigate, Link, useLocation } = ReactRouterDOM as any;
const Router = HashRouter;

interface AppContextType {
  user: User | null;
  admin: AdminSettings | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppContext.Provider');
  }
  return context;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<AdminSettings | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);

  const updateFromStore = () => {
    const store = getStore();
    setCurrentUser(store.currentUser);
    setAdmin(store.admin);
  };

  useEffect(() => {
    const initialize = async () => {
      const success = await initCloudStore();
      if (success) {
        updateFromStore();
        setIsSyncing(false);
        processDailyIncome();
      } else {
        alert("Connectivity Error: Please check your internet.");
      }
    };

    initialize();

    window.addEventListener('store-update', updateFromStore);
    const interval = setInterval(processDailyIncome, 60000);
    
    return () => {
      window.removeEventListener('store-update', updateFromStore);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    saveStore({ currentUser: null });
    setCurrentUser(null);
    window.location.hash = '/login';
  };

  if (isSyncing) {
    return (
      <div className="min-h-screen bg-[#f8faf9] flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center mb-6 animate-pulse overflow-hidden">
          <img src={LOGO_IMAGE} className="w-full h-full object-contain" alt="Syncing" />
        </div>
        <h1 className="text-xl font-black tracking-tighter mb-2">VIXO SYNC</h1>
        <p className="text-gray-400 font-medium uppercase text-[9px] tracking-widest leading-loose">
          Opening your secure account...
        </p>
      </div>
    );
  }

  if (admin?.maintenanceMode) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className="w-24 h-24 bg-[#00D094]/10 text-[#00D094] rounded-[40px] flex items-center justify-center mb-8 animate-pulse">
          <ShieldAlert size={48} />
        </div>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-4 text-gray-900">MAINTENANCE</h1>
        <p className="text-gray-400 font-medium leading-relaxed uppercase text-[10px] tracking-widest">
          We are updating our system for a better experience. Please wait.
        </p>
        <button onClick={() => window.location.reload()} className="mt-12 text-[#00D094] font-black text-xs uppercase tracking-[0.3em]">Refresh App</button>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ user: currentUser, admin }}>
      <Router>
        <div className="flex flex-col min-h-screen bg-[#f8faf9] max-w-md mx-auto relative shadow-2xl overflow-hidden">
          <main className="flex-grow pb-2 overflow-y-auto">
            <Routes>
              <Route path="/login" element={<Login onLogin={(u) => setCurrentUser(u)} />} />
              <Route path="/register" element={<Register />} />
              <Route path="/home" element={currentUser ? <Home user={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/income" element={currentUser ? <Income user={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/share" element={currentUser ? <Share user={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/team" element={currentUser ? <Team user={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/community" element={currentUser ? <Community user={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/support" element={currentUser ? <Support user={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/my" element={currentUser ? <My user={currentUser} onLogout={handleLogout} /> : <Navigate to="/login" />} />
              <Route path="/recharge" element={currentUser ? <Recharge user={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/withdraw" element={currentUser ? <Withdraw user={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/personal-info" element={currentUser ? <PersonalInfo user={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/about-us" element={<AboutUs />} />
              <Route path="/balance-details" element={currentUser ? <BalanceDetails user={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/records/:type" element={currentUser ? <Records user={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/chat" element={currentUser ? <ChatView /> : <Navigate to="/login" />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/home" />} />
            </Routes>
          </main>
          {currentUser && <NavigationMenu />}
        </div>
      </Router>
    </AppContext.Provider>
  );
};

const NavigationMenu: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { label: 'Home', icon: HomeIcon, path: '/home' },
    { label: 'Earnings', icon: Zap, path: '/income' },
    { label: 'AI Assistant', icon: MessageCircle, path: '/chat' },
    { label: 'Team', icon: Users, path: '/team' },
    { label: 'Account', icon: UserIcon, path: '/my' },
  ];

  return (
    <nav className="fixed bottom-0 w-full max-w-md bg-white/80 backdrop-blur-xl border-t border-gray-100 flex justify-around items-center px-1 pt-3 pb-6 z-[99] shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`flex-1 flex flex-col items-center gap-1.5 transition-all ${isActive(item.path) ? 'text-[#00D094]' : 'text-gray-300'}`}
        >
          <div className={`p-1.5 rounded-2xl transition-all ${isActive(item.path) ? 'bg-[#00D094]/10' : 'bg-transparent'}`}>
            <item.icon size={20} strokeWidth={isActive(item.path) ? 2.5 : 2} />
          </div>
          <span className={`text-[9px] font-bold uppercase tracking-tight ${isActive(item.path) ? 'text-[#00D094]' : 'text-gray-300'}`}>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default App;
