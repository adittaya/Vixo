
import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Wallet, Smartphone, Headphones, Send, Zap, ChevronRight, Share2 } from 'lucide-react';
// @ts-ignore
import * as ReactRouterDOM from 'react-router-dom';
import { motion } from 'framer-motion';
import Products from './Products';

const { useNavigate } = ReactRouterDOM as any;

const Dashboard: React.FC = () => {
  const { currentUser, collectDailyEarnings } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    collectDailyEarnings();
  }, [collectDailyEarnings]);

  if (!currentUser) return null;

  const actions = [
    { label: 'RECHARGE', icon: <Zap className="text-white" />, bg: 'bg-[#00a0e3]', to: '/recharge' },
    { label: 'WITHDRAW', icon: <Send className="text-white" />, bg: 'bg-[#00a0e3]', to: '/withdraw' },
    { label: 'SERVICE', icon: <Headphones className="text-white" />, bg: 'bg-[#ffc107]', to: 'https://t.me/placeholder' },
    { label: 'CHANNEL', icon: <Send className="text-white rotate-45" />, bg: 'bg-[#00a0e3]', to: 'https://t.me/placeholder' },
  ];

  return (
    <div className="pb-10 -mt-4">
      {/* Hero Section */}
      <div className="relative h-[380px] w-full flex flex-col items-center pt-12 overflow-hidden">
        {/* Sky and clouds aesthetic handled by global bisleri-bg */}
        
        {/* Logo */}
        <div className="bg-[#00a884] p-3 rounded-[2rem] shadow-xl z-10 mb-2">
            <div className="bg-white p-1 rounded-2xl">
                <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Bisleri_logo.png" 
                    alt="Bisleri" 
                    className="w-20 h-20 object-contain"
                />
            </div>
        </div>

        <h1 className="text-white font-extrabold text-sm tracking-widest uppercase z-10 mb-4 opacity-90">
            Pure Mineral Water
        </h1>
        
        {/* Wallet Pill */}
        <div className="glass-pill px-8 py-2.5 rounded-full shadow-sm z-10 border border-white/50">
            <p className="text-white font-black text-sm tracking-wide">
                WALLET: ₹{currentUser.balance.toLocaleString('en-IN')}
            </p>
        </div>

        {/* Action Grid Card */}
        <div className="absolute bottom-4 left-6 right-6 bg-white rounded-[2.5rem] p-6 shadow-xl z-20 flex justify-between items-center gap-2 border border-slate-50">
            {actions.map((action, i) => (
                <div key={i} onClick={() => action.to.startsWith('http') ? window.open(action.to) : navigate(action.to)} className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform">
                    <div className={`w-14 h-14 rounded-2xl ${action.bg} flex items-center justify-center shadow-lg shadow-blue-200/50`}>
                        {action.icon}
                    </div>
                    <span className="text-[10px] font-bold text-[#00a0e3]">{action.label}</span>
                </div>
            ))}
        </div>

        {/* Floating elements to mimic screenshot feel */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-30">
            <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full blur-sm"></div>
            <div className="absolute bottom-40 right-10 w-4 h-4 bg-white/50 rounded-full blur-md"></div>
        </div>
      </div>

      {/* Tabs Placeholder */}
      <div className="px-6 flex border-b border-slate-100 mb-6 bg-white pt-2">
          <div className="flex-1 text-center py-4 border-b-2 border-[#00a0e3] text-[#00a0e3] font-black text-xs tracking-wider">
              DAILY PLANS
          </div>
          <div className="flex-1 text-center py-4 text-slate-400 font-black text-xs tracking-wider">
              WELFARE PLANS
          </div>
      </div>

      {/* Product List */}
      <div className="px-4">
        <Products inline={true} />
      </div>
    </div>
  );
};

export default Dashboard;
