
import React, { useState, useEffect } from 'react';
import { User, Transaction } from '../types';
import { getStore } from '../store';
import { ChevronLeft, ArrowDownCircle, ArrowUpCircle, History, Filter } from 'lucide-react';
// @ts-ignore
import * as ReactRouterDOM from 'react-router-dom';
import { motion } from 'framer-motion';

const { useNavigate } = ReactRouterDOM as any;
const MotionDiv = motion.div as any;

interface Props {
  user: User;
}

const BalanceDetails: React.FC<Props> = ({ user }) => {
  const [activeMainTab, setActiveMainTab] = useState<'all' | 'recharge' | 'withdraw'>('all');
  const [activeSubTab, setActiveSubTab] = useState<'my' | 'subordinate'>('my');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const store = getStore();
    let txns = store.transactions.filter(t => t.userId === user.id);
    
    if (activeMainTab === 'recharge') txns = txns.filter(t => t.type === 'recharge');
    if (activeMainTab === 'withdraw') txns = txns.filter(t => t.type === 'withdraw' || t.type === 'purchase');
    
    if (activeSubTab === 'my') {
      txns = txns.filter(t => t.type !== 'commission');
    } else {
      txns = txns.filter(t => t.type === 'commission');
    }
    
    setTransactions(txns.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, [user.id, activeMainTab, activeSubTab]);

  const getLabel = (type: string) => {
    switch (type) {
      case 'recharge': return 'ADD MONEY';
      case 'withdraw': return 'WITHDRAW';
      case 'profit': return 'DAILY PROFIT';
      case 'commission': return 'TEAM BONUS';
      case 'purchase': return 'PLAN START'; 
      default: return type.toUpperCase();
    }
  };

  const isPositive = (type: string) => ['recharge', 'profit', 'commission'].includes(type);

  return (
    <div className="bg-[#f8f9fa] min-h-screen">
      <div className="bg-[#1c1c1c] px-5 py-4 flex justify-between items-center sticky top-0 z-[100] shadow-2xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-white/50 hover:text-white transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-white text-lg font-black italic tracking-tighter uppercase">Money History</h1>
        </div>
        <Filter size={20} className="text-white/50" />
      </div>

      <div className="p-6 space-y-6 pb-36">
        <div className="bg-white rounded-3xl p-1.5 flex premium-shadow border border-gray-100 shadow-xl">
          {(['all', 'add', 'withdraw'] as const).map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveMainTab(tab === 'add' ? 'recharge' : tab === 'withdraw' ? 'withdraw' : 'all')}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${((activeMainTab === 'recharge' && tab === 'add') || (activeMainTab === 'withdraw' && tab === 'withdraw') || (activeMainTab === 'all' && tab === 'all')) ? 'bg-[#1c1c1c] text-white shadow-lg' : 'text-gray-400'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-[24px] overflow-hidden flex shadow-sm border border-gray-100 p-1">
          <button 
            onClick={() => setActiveSubTab('my')}
            className={`flex-1 py-4 text-[11px] font-bold uppercase tracking-tighter rounded-2xl transition-all ${activeSubTab === 'my' ? 'bg-green-50 text-[#008B47]' : 'text-gray-400'}`}
          >
            My Income
          </button>
          <button 
            onClick={() => setActiveSubTab('subordinate')}
            className={`flex-1 py-4 text-[11px] font-bold uppercase tracking-tighter rounded-2xl transition-all ${activeSubTab === 'subordinate' ? 'bg-green-50 text-[#008B47]' : 'text-gray-400'}`}
          >
            Team Bonus
          </button>
        </div>

        <div className="space-y-4">
          {transactions.length > 0 ? (
            transactions.map((t, idx) => (
              <MotionDiv 
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-[32px] p-4 flex items-center justify-between shadow-[0_8px_24px_-10px_rgba(0,0,0,0.1)] border border-gray-100 active:scale-[0.98] transition-all"
                style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)' }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${isPositive(t.type) ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-600'}`}>
                    {isPositive(t.type) ? <ArrowDownCircle size={22} /> : <ArrowUpCircle size={22} />}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-black text-gray-900 uppercase tracking-tight">
                      {getLabel(t.type)}
                    </h4>
                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">
                      {new Date(t.date).toLocaleDateString()}
                    </p>
                    {t.details && <p className="text-[8px] text-gray-400 font-medium italic mt-0.5">{t.details}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-base font-black tracking-tighter italic ${isPositive(t.type) ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isPositive(t.type) ? '+' : '-'}₹{t.amount}
                  </p>
                  <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-gray-100 text-gray-400 border border-gray-50">
                    {t.status.toUpperCase()}
                  </span>
                </div>
              </MotionDiv>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center">
              <History size={64} className="text-gray-400 mb-6" />
              <h1 className="text-4xl font-black italic tracking-widest text-gray-400 uppercase">NO DATA</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-2">No records here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BalanceDetails;
