
import React from 'react';
// @ts-ignore
import * as ReactRouterDOM from 'react-router-dom';
import { Home, Wallet, Users, Share2, User } from 'lucide-react';

const { NavLink } = ReactRouterDOM as any;

const Navbar: React.FC = () => {
  const navItems = [
    { to: '/', icon: <Home size={22} />, label: 'HOME' },
    { to: '/transactions', icon: <Wallet size={22} />, label: 'INCOME' },
    { to: '/team', icon: <Users size={22} />, label: 'TEAM' },
    { to: '/share', icon: <Share2 size={22} />, label: 'SHARE' },
    { to: '/profile', icon: <User size={22} />, label: 'MY' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 md:max-w-lg md:left-1/2 md:-translate-x-1/2 flex justify-around items-center h-16 px-2 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }: { isActive: boolean }) => 
            `flex flex-col items-center justify-center space-y-1 transition-all flex-1 ${
              isActive ? 'text-[#00a0e3] scale-110' : 'text-slate-400'
            }`
          }
        >
          {item.icon}
          <span className="text-[9px] font-bold tracking-tight uppercase">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default Navbar;
