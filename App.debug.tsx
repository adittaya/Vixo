import React, { useEffect, useState, createContext, useContext } from 'react';
// @ts-ignore
import * as ReactRouterDOM from 'react-router-dom';
import { User, AdminSettings } from './types';
import { getStore, saveStore, processDailyIncome, initCloudStore } from './store';
import { ShieldAlert } from 'lucide-react';
import { LOGO_IMAGE } from './constants';

const { HashRouter, Routes, Route, Navigate, useLocation } = ReactRouterDOM as any;
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
    try {
      const store = getStore();
      setCurrentUser(store.currentUser);
      setAdmin(store.admin);
    } catch (error) {
      console.error("Error updating from store:", error);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log("Starting initialization...");
        const success = await initCloudStore();
        console.log("Init cloud store result:", success);
        if (success) {
          updateFromStore();
          setIsSyncing(false);
          processDailyIncome();
        } else {
          alert("Connectivity Error: Please check your internet.");
        }
      } catch (error) {
        console.error("Initialization error:", error);
        alert("Application initialization failed: " + (error as Error).message);
      }
    };

    initialize();

    window.addEventListener('store-update', updateFromStore);
    const interval = setInterval(() => {
      try {
        processDailyIncome();
      } catch (error) {
        console.error("Error in processDailyIncome:", error);
      }
    }, 60000);

    return () => {
      window.removeEventListener('store-update', updateFromStore);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    try {
      saveStore({ currentUser: null });
      setCurrentUser(null);
      window.location.hash = '/login';
    } catch (error) {
      console.error("Error during logout:", error);
    }
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
        <div className="w-24 h-24 bg-[#00D094]/10 text-[#00D0094] rounded-[40px] flex items-center justify-center mb-8 animate-pulse">
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

  // Simplified version - just return a basic component to test if the issue is elsewhere
  return (
    <AppContext.Provider value={{ user: currentUser, admin }}>
      <Router>
        <div className="flex flex-col min-h-screen bg-[#f8faf9] max-w-md mx-auto relative shadow-2xl overflow-hidden">
          <main className="flex-grow pb-2 overflow-y-auto p-4">
            <h1 className="text-2xl font-bold">Vixo App Loaded Successfully!</h1>
            <p>User: {currentUser?.name || 'Not logged in'}</p>
            <p>Sync Status: {!isSyncing ? 'Ready' : 'Syncing'}</p>
          </main>
        </div>
      </Router>
    </AppContext.Provider>
  );
};

export default App;