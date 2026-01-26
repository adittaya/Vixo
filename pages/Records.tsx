
import React, { useState, useEffect } from 'react';
import { User, Transaction } from '../types';
import { getStore } from '../store';
import { ChevronLeft, Wallet, CheckCircle2, Clock, Calendar, Search } from 'lucide-react';
// @ts-ignore
import * as ReactRouterDOM from 'react-router-dom';
import { motion } from 'framer-motion';

const { useNavigate, useParams } = ReactRouterDOM as any;
const MotionDiv = motion.div as any;

interface Props {
  user: User;
}

const Records: React.FC<Props> = ({ user }) => {
  const { type } = useParams();
  const [activeTab, setActiveTab] = useState<'all' | 'recharge' | 'withdraw'>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (type === 'recharge') setActiveTab('recharge');
    if (type === 'withdraw') setActiveTab('withdraw');
  }, [type]);

  useEffect(() => {
    const store = getStore();
    let txns = store.transactions.filter(t => t.userId === user.id);
    
    if (activeTab === 'recharge') txns = txns.filter(t => t.type === 'recharge');
    if (activeTab === 'withdraw') txns = txns.filter(t => t.type === 'withdraw');
    
    setTransactions(txns.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, [user.id, activeTab]);

  return (
    <div className="bg-[#f8f9fa] min-h-screen">
      <div className="bg-[#1c1c1c] px-5 py-4 flex justify-between items-center sticky top-0 z-[100] shadow-2xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-white/50 hover:text-white transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-white text-lg font-black italic tracking-tighter uppercase">Money History</h1>
        </div>
        <Search size={20} className="text-white/50" />
      </div>

      <div className="p-6 space-y-6 pb-36">
        <div className="bg-white rounded-3xl p-1.5 flex premium-shadow border border-gray-100">
          {(['all', 'add', 'withdraw'] as const).map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab === 'add' ? 'recharge' : tab === 'withdraw' ? 'withdraw' : 'all')}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${((activeTab === 'recharge' && tab === 'add') || (activeTab === 'withdraw' && tab === 'withdraw') || (activeTab === 'all' && tab === 'all')) ? 'bg-[#1c1c1c] text-white shadow-lg' : 'text-gray-400'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {transactions.length > 0 ? (
            transactions.map((t, idx) => (
              <MotionDiv 
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-[40px] p-8 premium-shadow border border-gray-50 flex flex-col gap-6"
              >
                <div className="flex justify-between items-center border-b border-gray-50 pb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-6 rounded-full ${t.status === 'approved' ? 'bg-emerald-500' : t.status === 'pending' ? 'bg-amber-500' : 'bg-red-600'}`}></div>
                    <span className="text-xs font-black text-gray-900 uppercase tracking-widest">{t.type === 'recharge' ? 'Add Money' : 'Withdraw'}</span>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border ${t.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : t.status === 'pending' ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    {t.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Amount</p>
                    <p className="text-xl font-black text-gray-900 italic tracking-tighter">₹{t.amount.toFixed(2)}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Method</p>
                    <p className="text-xs font-bold text-gray-600 uppercase">
                      Bank Transfer
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Date</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase">
                      <Calendar size={12} className="text-gray-300" />
                      {new Date(t.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Reference</p>
                    <p className="text-[10px] font-bold text-gray-900 uppercase truncate max-w-[100px] ml-auto">
                      #{t.id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                </div>

                {t.utr && (
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">UTR No.</span>
                    </div>
                    <span className="text-xs font-black text-gray-800 tracking-tight">{t.utr}</span>
                  </div>
                )}
              </MotionDiv>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-32 opacity-20 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-[32px] flex items-center justify-center mb-6">
                <Wallet size={32} className="text-gray-400" />
              </div>
              <h1 className="text-4xl font-black italic tracking-widest text-gray-400 uppercase">EMPTY</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 px-12">No history found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Records;
