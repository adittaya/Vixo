
import React from 'react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', icon: 'fa-home', label: 'Home' },
    { id: 'market', icon: 'fa-shopping-cart', label: 'Market' },
    { id: 'team', icon: 'fa-users', label: 'Team' },
    { id: 'wallet', icon: 'fa-wallet', label: 'Wallet' },
    { id: 'profile', icon: 'fa-user', label: 'Me' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center safe-bottom z-50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === tab.id ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          <i className={`fas ${tab.icon} text-lg`}></i>
          <span className="text-[10px] font-medium uppercase tracking-wider">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};
