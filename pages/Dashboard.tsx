
import React, { useState, useEffect, useMemo } from 'react';
import { User, Transaction, Purchase } from '../types';
import { getStore } from '../store';
import { Wallet, TrendingUp, Share2, CheckCircle2, BarChart3, CreditCard } from 'lucide-react';
import { TRUST_BADGES } from '../constants';
import { motion } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const MotionDiv = motion.div as any;

interface Props { user: User; }

const Dashboard: React.FC<Props> = ({ user }) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const store = getStore();
    setPurchases(store.purchases.filter(p => p.userId === user.id));
    setTransactions(store.transactions.filter(t => t.userId === user.id).sort((a,b) => b.timestamp - a.timestamp));
  }, [user.id]);

  const referralLink = `${window.location.origin}/#/register?ref=${user.referralCode}`;

  const handleCopy = async () => {
    const text = referralLink;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (copyErr) {
        console.error('Fallback copy failed', copyErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const chartData = useMemo(() => {
    const days = 7;
    const data = [];
    for(let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const val = transactions
            .filter(t => t.date.startsWith(dateStr) && (t.type === 'profit' || t.type === 'commission'))
            .reduce((s, t) => s + t.amount, 0);
        data.push({ name: dateStr.split('-').slice(1).join('/'), yield: val });
    }
    return data;
  }, [transactions]);

  return (
    <div className="p-6 space-y-6 pb-24 bg-[#f8faf9] min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">My Board</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Member: {user.mobile}</p>
        </div>
        <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black border border-emerald-100 uppercase tracking-widest">
          VIP Level {user.vipLevel}
        </div>
      </div>

      <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 vixo-bg rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">My Balance</p>
        <h2 className="text-4xl font-black text-white mt-2 tracking-tight">₹{user.balance.toFixed(2)}</h2>
        
        <div className="grid grid-cols-2 gap-4 mt-10">
          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
            <p className="text-[8px] text-white/30 uppercase font-black mb-1">Total Put In</p>
            <p className="text-lg font-black text-white">₹{user.totalInvested}</p>
          </div>
          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
            <p className="text-[8px] text-white/30 uppercase font-black mb-1">Got Out</p>
            <p className="text-lg font-black text-white">₹{user.totalWithdrawn}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] card-shadow border border-gray-100 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="vixo-green" />
            <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400">Income Chart</h3>
          </div>
        </div>
        
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D094" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#00D094" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontSize: '10px' }} 
              />
              <Area type="monotone" dataKey="yield" stroke="#00D094" strokeWidth={3} fillOpacity={1} fill="url(#colorYield)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-gray-100 p-5 rounded-[2rem] flex items-center justify-between card-shadow">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-500">
            <Share2 size={20} />
          </div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase">Friend Code</p>
            <p className="text-sm font-black tracking-tight text-gray-900">{user.referralCode}</p>
          </div>
        </div>
        <button 
          onClick={handleCopy}
          className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${copied ? 'bg-emerald-500 text-white' : 'vixo-bg text-white shadow-lg'}`}
        >
          {copied ? 'Done' : 'Invite'}
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="font-bold text-[10px] uppercase tracking-widest text-gray-400">Working Plans</h3>
          <span className="bg-gray-100 text-gray-500 text-[8px] font-black px-3 py-1 rounded-full uppercase">{purchases.length} Packages</span>
        </div>
        
        {purchases.length > 0 ? (
          <div className="space-y-4">
            {purchases.map(p => (
              <MotionDiv 
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border border-gray-50 p-5 rounded-[2rem] flex items-center gap-5 card-shadow"
              >
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-emerald-500 border border-gray-100">
                  <CreditCard size={24} />
                </div>
                <div className="flex-grow">
                  <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{p.productName}</p>
                  <p className="text-[9px] vixo-green font-bold uppercase tracking-widest mt-0.5">Earning Started</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-gray-900 tracking-tighter">+₹{p.dailyIncome}</p>
                  <p className="text-[9px] text-gray-300 font-bold uppercase">{p.daysRemaining} days left</p>
                </div>
              </MotionDiv>
            ))}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-gray-100 p-12 rounded-[2rem] text-center opacity-40">
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">No plans working yet</p>
            <button onClick={() => window.location.hash = '/home'} className="mt-3 vixo-green text-[10px] font-black uppercase tracking-widest hover:underline">Get Plan →</button>
          </div>
        )}
      </div>

      <div className="pt-10 pb-10 flex justify-center gap-8 opacity-40">
        {TRUST_BADGES.map((b, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-xl">{b.icon}</span>
            <span className="text-[8px] font-black uppercase">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
