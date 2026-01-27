
import React, { useState } from 'react';
import { User, Transaction } from '../types';
import { getStore, saveStore } from '../store';
import { Landmark, ShieldAlert, Clock, ChevronLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
// @ts-ignore
import * as ReactRouterDOM from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const { useNavigate } = ReactRouterDOM as any;
const MotionDiv = motion.div as any;

interface Props { user: User; }

const Withdraw: React.FC<Props> = ({ user }) => {
  const [amount, setAmount] = useState('');
  const [withdrawPass, setWithdrawPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const handleWithdraw = () => {
    const store = getStore();
    const numAmount = parseInt(amount);

    if (user.securityCheckRequired) {
      return setMsg({ 
        type: 'error', 
        text: 'Identity check needed. Please contact help center.' 
      });
    }

    if (!user.accountNumber || !user.ifsc) return setMsg({ type: 'error', text: 'Bank details missing. Add them in Settings.' });
    if (withdrawPass !== user.withdrawalPassword) return setMsg({ type: 'error', text: 'Wrong PIN.' });
    if (numAmount < 120) return setMsg({ type: 'error', text: 'Min: ₹120' });
    if (numAmount > (user.withdrawableBalance || 0)) return setMsg({ type: 'error', text: 'Not enough income balance.' });

    setLoading(true);
    setTimeout(() => {
      const updatedUsers = store.users.map(u => u.id === user.id ? { 
        ...u, 
        withdrawableBalance: (u.withdrawableBalance || 0) - numAmount, 
        totalWithdrawn: u.totalWithdrawn + numAmount 
      } : u);
      
      saveStore({ 
        users: updatedUsers, 
        currentUser: updatedUsers.find(u => u.id === user.id), 
        transactions: [...store.transactions, { 
          id: `txn-wd-${Date.now()}`, 
          userId: user.id, 
          type: 'withdraw', 
          amount: numAmount, 
          status: 'pending', 
          date: new Date().toISOString(), 
          method: 'bank',
          timestamp: Date.now()
        }] 
      });
      setMsg({ type: 'success', text: 'Withdrawal Request Sent!' });
      setAmount('');
      setWithdrawPass('');
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="bg-[#f8faf9] min-h-screen pb-32">
      <div className="bg-white px-8 pt-20 pb-12 rounded-b-[3.5rem] shadow-sm border-b border-gray-100 relative overflow-hidden">
        <button onClick={() => navigate(-1)} className="absolute left-6 top-10 p-2 bg-gray-50 rounded-xl text-gray-400 active:scale-90 transition-all"><ChevronLeft size={20}/></button>
        <div className="text-center relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300 mb-2">Get Your Money</p>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase text-gray-900">WITHDRAW</h1>
        </div>
      </div>

      <div className="p-6 -mt-8 space-y-6">
        <div className="bg-white p-8 rounded-[3rem] card-shadow border border-gray-50 space-y-10">
          <div>
            <div className="flex justify-between items-center mb-5 px-3">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">My Earnings</label>
              <span className="text-[10px] font-black vixo-green bg-[#00D094]/10 px-3 py-1 rounded-lg uppercase tracking-widest">₹{(user.withdrawableBalance || 0).toFixed(0)}</span>
            </div>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-900">₹</span>
              <input 
                type="number" 
                placeholder="0" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                className="w-full bg-gray-50 border border-gray-100 rounded-[2rem] py-8 pl-14 pr-8 font-black text-4xl text-gray-900 outline-none focus:border-[#00D094] transition-all shadow-inner" 
                disabled={user.securityCheckRequired}
              />
            </div>
          </div>

          <div className="relative group">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-200 group-focus-within:vixo-green transition-colors"><ShieldAlert size={22} /></span>
            <input 
              type="password" 
              placeholder="Withdraw PIN" 
              value={withdrawPass} 
              onChange={e => setWithdrawPass(e.target.value)} 
              className="w-full bg-gray-50 border border-gray-100 rounded-[2rem] py-6 pl-14 pr-8 font-black text-sm text-gray-900 outline-none focus:border-[#00D094] transition-all" 
              disabled={user.securityCheckRequired}
            />
          </div>

          <button 
            onClick={handleWithdraw} 
            disabled={loading || user.securityCheckRequired} 
            className="w-full vixo-bg text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] active:scale-95 transition-all disabled:opacity-30 shadow-xl shadow-[#00D094]/10 flex items-center justify-center gap-4"
          >
            {loading ? <Clock className="animate-spin" size={20} /> : (
              <>
                WITHDRAW NOW
                <ArrowRight size={20} strokeWidth={3} />
              </>
            )}
          </button>
        </div>

        {/* Card for Bank Info */}
        <div className="bg-white p-8 rounded-[3rem] card-shadow border border-gray-100 space-y-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shadow-inner">
              <Landmark size={24} className="text-[#00D094]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">My Bank Account</p>
              <p className="text-sm font-black text-gray-900 uppercase truncate max-w-[180px]">{user.bankName || 'NOT ADDED'}</p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-2xl p-6 space-y-4 border border-gray-100 shadow-inner">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-gray-400 uppercase">IFSC CODE</span>
              <span className="text-gray-900 uppercase italic">{user.ifsc || '---'}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-gray-400 uppercase">ACCOUNT NO.</span>
              <span className="text-gray-900 uppercase italic font-mono">{user.accountNumber || '---'}</span>
            </div>
          </div>
        </div>

        {msg.text && (
          <div className={`p-6 rounded-[2.5rem] text-[10px] font-black text-center uppercase tracking-widest shadow-xl border ${msg.type === 'error' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-green-50 text-emerald-600 border-emerald-100'}`}>
             {msg.text}
          </div>
        )}

        {/* Protocol Notes */}
        <div className="bg-[#e8ff8e]/10 p-8 rounded-[3rem] border border-[#e8ff8e]/30">
            <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">Withdraw Rules</p>
            <ul className="space-y-4">
               {[
                 'Money sent within 24 hours',
                 'Standard 5% fee applies',
                 'Sent directly to your verified bank'
               ].map((rule, idx) => (
                 <li key={idx} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full vixo-bg"></div>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{rule}</p>
                 </li>
               ))}
            </ul>
        </div>
      </div>
    </div>
  );
};

export default Withdraw;
