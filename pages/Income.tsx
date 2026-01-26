
import React, { useState, useEffect } from 'react';
import { User, Purchase } from '../types';
import { getStore } from '../store';
import { TrendingUp, Clock, Cpu, Activity, ArrowRightCircle, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div as any;

interface Props { user: User; }

const Income: React.FC<Props> = ({ user }) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    const store = getStore();
    setPurchases(store.purchases.filter(p => p.userId === user.id));
  }, [user.id]);

  const isUserFrozen = user.status === 'frozen';

  return (
    <div className="bg-[#f8faf9] min-h-screen pb-32">
      {/* VIXO Header */}
      <div className="bg-white px-8 pt-20 pb-12 rounded-b-[3.5rem] shadow-sm border-b border-gray-100 relative overflow-hidden mb-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#00D094] opacity-[0.03] blur-[60px] rounded-full -mr-20 -mt-20"></div>
        <div className="flex justify-between items-end relative z-10 px-2">
          <div>
            <h1 className="text-3xl font-black text-gray-900 italic tracking-tighter leading-none">MY<br/><span className="vixo-green">INCOME</span></h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.4em] mt-4 ml-0.5">Active Plans: {purchases.length}</p>
          </div>
          <div className="w-16 h-16 bg-[#00D094]/10 rounded-[28px] flex items-center justify-center border border-[#00D094]/10 shadow-inner">
            <Activity className={isUserFrozen ? "text-red-500" : "text-[#00D094] animate-pulse"} size={28} />
          </div>
        </div>
      </div>

      {/* Account Freeze Banner */}
      {isUserFrozen && (
        <MotionDiv 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mb-6 p-5 bg-red-600 rounded-[2rem] shadow-xl shadow-red-900/20 flex items-center gap-4 border-2 border-white/20"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white shrink-0">
            <ShieldAlert size={20} strokeWidth={3} />
          </div>
          <div className="text-white">
            <p className="text-[10px] font-black uppercase tracking-widest">Account Locked</p>
            <p className="text-[8px] font-bold uppercase opacity-90 leading-tight mt-0.5">Your money is safe but locked. Please contact support to unlock your wallet.</p>
          </div>
        </MotionDiv>
      )}

      <div className="p-6 space-y-6 mt-0">
        {purchases.length > 0 ? (
          purchases.map((p, idx) => (
            <MotionDiv 
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`bg-white p-8 rounded-[2.5rem] card-shadow border border-gray-50 group transition-all ${p.status === 'cancelled' || isUserFrozen ? 'grayscale opacity-70' : 'hover:border-[#00D094]/30'}`}
            >
              <div className="flex justify-between items-start mb-10">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-gray-100 transition-all shadow-sm ${p.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-[#00D094]'}`}>
                    <Cpu size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">{p.productName}</h3>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">PLAN ID: VX-{p.productId}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  {p.status === 'cancelled' ? (
                    <span className="bg-red-50 text-red-500 text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm border border-red-100">Stoped</span>
                  ) : isUserFrozen ? (
                    <span className="bg-amber-50 text-amber-500 text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm border border-amber-100">Locked</span>
                  ) : (
                    <span className="bg-[#00D094]/10 text-[#00D094] text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm animate-pulse">Earning</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 shadow-inner">
                  <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest block mb-1.5">Today's Profit</span>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} className={p.status === 'cancelled' || isUserFrozen ? 'text-gray-300' : 'vixo-green'} strokeWidth={3} />
                    <span className={`text-xl font-black tracking-tighter italic ${p.status === 'cancelled' || isUserFrozen ? 'text-gray-300 line-through' : 'text-gray-900'}`}>₹{p.dailyIncome}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 shadow-inner">
                  <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest block mb-1.5">Days Left</span>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-amber-500" strokeWidth={3} />
                    <span className="text-xl font-black text-gray-900 tracking-tighter italic">{p.daysRemaining}d</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-between px-2">
                 <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${p.status === 'cancelled' || isUserFrozen ? 'bg-gray-300' : 'vixo-bg'}`}
                      style={{ width: `${(p.daysRemaining / p.totalDays) * 100}%` }}
                    ></div>
                 </div>
              </div>
            </MotionDiv>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-12 text-center">
            <div className="w-24 h-24 bg-white rounded-[40px] flex items-center justify-center mb-8 card-shadow border border-gray-100">
              <Cpu size={44} className="text-gray-100" />
            </div>
            <h2 className="text-xl font-black italic uppercase tracking-[0.2em] text-gray-900">NO PLANS</h2>
            <p className="text-gray-400 text-[10px] font-bold mt-4 uppercase leading-relaxed tracking-widest max-w-[200px] mx-auto">
              You have no active plans. Get a plan from the store to start earning today.
            </p>
            <button 
              onClick={() => window.location.hash = '/home'}
              className="mt-10 flex items-center gap-2 vixo-green font-black text-[10px] uppercase tracking-[0.2em]"
            >
              Browse Plans <ArrowRightCircle size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Income;
