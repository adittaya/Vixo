
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getStore, saveStore } from '../store';
import { 
  ChevronRight, 
  Wallet, 
  FileText, 
  ShieldCheck, 
  History, 
  LogOut, 
  Headphones,
  User as UserIcon,
  BadgeCheck,
  Zap,
  Share2,
  Copy,
  CheckCircle2,
  Gift,
  Sparkles,
  Trophy
} from 'lucide-react';
// @ts-ignore
import * as ReactRouterDOM from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const { Link } = ReactRouterDOM as any;
const MotionDiv = motion.div as any;

interface Props { user: User; onLogout: () => void; }

const My: React.FC<Props> = ({ user, onLogout }) => {
  const [chestState, setChestState] = useState<'closed' | 'shaking' | 'open'>('closed');
  const [rewardAmount, setRewardAmount] = useState(0);
  const [hasClaimedToday, setHasClaimedToday] = useState(false);

  useEffect(() => {
    const lastClaim = localStorage.getItem(`vixo_chest_${user.id}`);
    const today = new Date().toDateString();
    if (lastClaim === today) {
      setHasClaimedToday(true);
      setChestState('open');
    }
  }, [user.id]);

  const openChest = () => {
    if (hasClaimedToday) return;
    
    setChestState('shaking');
    
    // Simulate excitement with a delay
    setTimeout(() => {
      const amount = Math.floor(Math.random() * 45) + 5; // Random ₹5 to ₹50
      setRewardAmount(amount);
      setChestState('open');
      setHasClaimedToday(true);
      
      // Update store
      const store = getStore();
      const updatedUsers = store.users.map(u => u.id === user.id ? { 
        ...u, 
        balance: u.balance + amount 
      } : u);
      
      saveStore({ 
        users: updatedUsers, 
        currentUser: updatedUsers.find(u => u.id === user.id),
        transactions: [...store.transactions, {
          id: `chest-${Date.now()}`,
          userId: user.id,
          type: 'profit',
          amount: amount,
          status: 'approved',
          date: new Date().toISOString(),
          timestamp: Date.now(),
          details: 'Daily Lucky Gift Bonus'
        }]
      });
      
      localStorage.setItem(`vixo_chest_${user.id}`, new Date().toDateString());
    }, 1200);
  };

  const menuGroups = [
    {
      title: 'Money History',
      items: [
        { label: 'Income History', icon: History, path: '/balance-details', color: 'text-emerald-500 bg-emerald-50' },
        { label: 'Recharge Logs', icon: Wallet, path: '/records/recharge', color: 'text-blue-500 bg-blue-50' },
        { label: 'Withdrawal Logs', icon: FileText, path: '/records/withdraw', color: 'text-indigo-500 bg-indigo-50' },
      ]
    },
    {
      title: 'Settings & Support',
      items: [
        { label: 'Profile Settings', icon: ShieldCheck, path: '/personal-info', color: 'text-purple-500 bg-purple-50' },
        { label: 'Help Center', icon: Headphones, path: '/support', color: 'text-orange-500 bg-orange-50' },
      ]
    }
  ];

  return (
    <div className="bg-[#f8faf9] min-h-screen pb-32">
      <div className="bg-white px-8 pt-16 pb-12 rounded-b-[3rem] shadow-sm border-b border-gray-100 relative overflow-hidden">
        <div className="relative flex items-center gap-5 mb-10">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center border border-gray-100 relative shadow-sm">
            <UserIcon size={32} className="text-gray-300" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 vixo-bg rounded-full border-4 border-white flex items-center justify-center">
               <BadgeCheck size={12} className="text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{user.mobile}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="vixo-bg text-white text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Active Member</span>
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">ID: {user.referralCode}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-center">
            <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-1">My Balance</p>
            <p className="text-2xl font-black text-gray-900">₹{user.balance.toFixed(0)}</p>
          </div>
          <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-50 text-center">
            <p className="text-emerald-400 text-[9px] font-bold uppercase tracking-widest mb-1">My Income</p>
            <p className="text-2xl font-black vixo-green">₹{(user.withdrawableBalance || 0).toFixed(0)}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-10 mt-4">
        {/* EXCITING NEW FEATURE: SURPRISE REWARD CHEST */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] ml-4 flex items-center gap-2">
            <Sparkles size={12} className="text-amber-400" /> 
            Free Daily Gift
          </h3>
          
          <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-white/5">
             {/* Background Effects */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D094] opacity-10 blur-[50px]"></div>
             <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500 opacity-5 blur-[40px]"></div>

             <div className="relative z-10 flex flex-col items-center text-center">
                <AnimatePresence mode="wait">
                  {chestState === 'closed' && (
                    <MotionDiv 
                      key="closed"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.1, opacity: 0 }}
                      className="space-y-6"
                    >
                      <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-amber-900/40 relative">
                         <Gift size={48} className="text-white" />
                         <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-full animate-bounce">1 NEW</div>
                      </div>
                      <div>
                        <h4 className="text-white font-black text-lg uppercase italic tracking-tighter">Daily Bonus</h4>
                        <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1">Open your gift for free money every day</p>
                      </div>
                      <button 
                        onClick={openChest}
                        className="bg-[#E4FF7D] text-slate-900 px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                      >
                        OPEN NOW
                      </button>
                    </MotionDiv>
                  )}

                  {chestState === 'shaking' && (
                    <MotionDiv 
                      key="shaking"
                      animate={{ 
                        rotate: [-5, 5, -5, 5, 0],
                        x: [-2, 2, -2, 2, 0]
                      }}
                      transition={{ repeat: Infinity, duration: 0.2 }}
                      className="py-12"
                    >
                       <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-amber-500/50 shadow-2xl">
                         <Gift size={48} className="text-white" />
                      </div>
                      <p className="text-amber-400 text-[10px] font-black uppercase tracking-[0.4em] mt-8 animate-pulse">Opening Gift...</p>
                    </MotionDiv>
                  )}

                  {chestState === 'open' && (
                    <MotionDiv 
                      key="open"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="space-y-6 py-4"
                    >
                      <div className="relative">
                         <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-20 animate-pulse"></div>
                         <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-emerald-500/20 relative z-10">
                           <Trophy size={48} className="text-emerald-500" />
                         </div>
                      </div>
                      <div>
                        <p className="text-emerald-500 font-black text-3xl tracking-tighter italic">+₹{rewardAmount || (hasClaimedToday ? '??' : '0')}</p>
                        <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-2">Added to your balance</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-full inline-block">
                         <span className="text-[8px] text-white/40 font-black uppercase tracking-widest">Next Gift: Tomorrow</span>
                      </div>
                    </MotionDiv>
                  )}
                </AnimatePresence>
             </div>
          </div>
        </div>

        {menuGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-4">
            <h3 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest ml-4">{group.title}</h3>
            <div className="bg-white rounded-[2rem] overflow-hidden card-shadow border border-gray-100">
              {group.items.map((item, iIdx) => (
                <Link key={iIdx} to={item.path} className="flex items-center justify-between p-6 active:bg-gray-50 transition-colors border-b last:border-b-0 border-gray-50 group">
                  <div className="flex items-center gap-5">
                    <div className={`p-3 rounded-xl ${item.color} shadow-sm group-active:scale-90 transition-transform`}>
                      <item.icon size={20} />
                    </div>
                    <span className="text-sm font-bold text-gray-700 tracking-tight">{item.label}</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-200 group-hover:text-emerald-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        <button 
          onClick={onLogout}
          className="w-full bg-white p-6 rounded-[2rem] card-shadow border border-red-50 flex items-center justify-between active:scale-95 transition-all group"
        >
          <div className="flex items-center gap-5">
            <div className="p-3 bg-red-50 text-red-500 rounded-xl">
              <LogOut size={20} />
            </div>
            <span className="text-sm font-bold text-red-500 tracking-tight">Logout</span>
          </div>
          <ChevronRight size={18} className="text-red-100" />
        </button>
      </div>
    </div>
  );
};

export default My;
