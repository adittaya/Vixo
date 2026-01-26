
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowDownToLine, Landmark, Smartphone, AlertCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const Withdraw: React.FC = () => {
  const { currentUser, addTransaction, lastWithdrawalTime, setWithdrawalTime } = useApp();
  const [method, setMethod] = useState<'BANK' | 'UPI'>('BANK');
  const [amount, setAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({ bankName: '', ifscCode: '', accountNumber: '', holderName: '' });
  const [upiId, setUpiId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleWithdraw = () => {
    if (!currentUser) return;
    const amt = Number(amount);
    
    if (amt < 100) {
      setError('Minimum withdrawal is ₹100');
      return;
    }
    if (amt > currentUser.balance) {
      setError('Insufficient balance');
      return;
    }

    const lastTime = lastWithdrawalTime[currentUser.id] || 0;
    const now = Date.now();
    if (now - lastTime < 24 * 60 * 60 * 1000) {
      setError('You can only withdraw once every 24 hours');
      return;
    }

    if (method === 'BANK') {
      if (!bankDetails.bankName || !bankDetails.ifscCode || !bankDetails.accountNumber || !bankDetails.holderName) {
        setError('Please fill all bank details');
        return;
      }
    } else {
      if (!upiId) {
        setError('Please enter your UPI ID');
        return;
      }
    }

    setError('');
    // Fix: Using lowercase 'withdraw' and 'pending' for TransactionType and TransactionStatus
    addTransaction(currentUser.id, 'withdraw', amt, 'pending', undefined, 
      method === 'BANK' ? `Bank: ${bankDetails.bankName}` : `UPI: ${upiId}`);
    
    // In a real app, logic would wait for admin, but here we record time
    setWithdrawalTime(currentUser.id);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="pt-10 space-y-6 text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-500">
          <ArrowDownToLine size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Withdrawal Requested</h2>
          <p className="text-xs text-slate-400">Funds will be credited to your account after verification (usually within 12-24 hours).</p>
        </div>
        <button onClick={() => window.location.hash = '#/'} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold uppercase tracking-widest text-xs">Return Home</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 pb-20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-500">
          <ArrowDownToLine size={24} />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-tight">Withdraw Funds</h2>
      </div>

      <div className="glass-panel p-2 rounded-2xl flex">
        <button 
          onClick={() => setMethod('BANK')}
          className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${method === 'BANK' ? 'bg-amber-500 text-slate-900' : 'text-slate-500'}`}
        >
          <Landmark size={14} /> Bank Transfer
        </button>
        <button 
          onClick={() => setMethod('UPI')}
          className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${method === 'UPI' ? 'bg-amber-500 text-slate-900' : 'text-slate-500'}`}
        >
          <Smartphone size={14} /> UPI Payout
        </button>
      </div>

      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Amount to Withdraw</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-500">₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-900/50 border border-slate-700 p-4 pl-8 rounded-xl text-xl font-black text-white outline-none focus:border-amber-500"
            />
          </div>
          <p className="text-[10px] text-slate-500">Available Balance: <span className="text-amber-500 font-bold">₹{currentUser?.balance}</span></p>
        </div>

        {method === 'BANK' ? (
          <div className="space-y-3 pt-2">
            <input type="text" placeholder="Account Holder Name" className="w-full bg-slate-900/50 border border-slate-700 p-4 rounded-xl text-white outline-none" 
              value={bankDetails.holderName} onChange={e => setBankDetails({...bankDetails, holderName: e.target.value})} />
            <input type="text" placeholder="Bank Name" className="w-full bg-slate-900/50 border border-slate-700 p-4 rounded-xl text-white outline-none" 
              value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} />
            <input type="text" placeholder="IFSC Code" className="w-full bg-slate-900/50 border border-slate-700 p-4 rounded-xl text-white outline-none" 
              value={bankDetails.ifscCode} onChange={e => setBankDetails({...bankDetails, ifscCode: e.target.value})} />
            <input type="text" placeholder="Account Number" className="w-full bg-slate-900/50 border border-slate-700 p-4 rounded-xl text-white outline-none" 
              value={bankDetails.accountNumber} onChange={e => setBankDetails({...bankDetails, accountNumber: e.target.value})} />
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <input type="text" placeholder="Enter UPI ID (e.g. user@bank)" className="w-full bg-slate-900/50 border border-slate-700 p-4 rounded-xl text-white outline-none" 
              value={upiId} onChange={e => setUpiId(e.target.value)} />
          </div>
        )}

        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex items-start gap-3">
          <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Policy Notice</p>
            <p className="text-[9px] text-slate-500 leading-tight">Minimum: ₹100. Withdrawals processed within 24h. Only one withdrawal allowed daily.</p>
          </div>
        </div>

        {error && <p className="text-red-500 text-[10px] font-bold uppercase text-center">{error}</p>}

        <button
          onClick={handleWithdraw}
          className="w-full py-4 gold-gradient text-slate-950 font-black rounded-2xl uppercase tracking-widest text-sm"
        >
          Confirm Withdrawal
        </button>
      </div>
    </div>
  );
};

export default Withdraw;
