
import React, { useState } from 'react';
import { User } from '../types';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Lock, Smartphone, Building2, UserCircle } from 'lucide-react';

interface FinanceViewProps {
  user: User;
  setUser: (user: User) => void;
}

const FinanceView: React.FC<FinanceViewProps> = ({ user, setUser }) => {
  const [mode, setMode] = useState<'RECHARGE' | 'WITHDRAWAL'>('RECHARGE');
  const [amount, setAmount] = useState<string>('');
  const [utr, setUtr] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleRecharge = () => {
    if (!amount || Number(amount) < 500) {
      alert("Minimum recharge is ₹500");
      return;
    }
    if (!utr) {
      alert("Please enter UTR number");
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      // Fix: currentWallet does not exist on User, using balance
      setUser({ ...user, balance: user.balance + Number(amount) });
      setLoading(false);
      setAmount('');
      setUtr('');
      alert("Recharge request submitted for verification!");
    }, 1500);
  };

  const handleWithdrawal = () => {
    if (!amount || Number(amount) < 200) {
      alert("Minimum withdrawal is ₹200");
      return;
    }
    // Fix: withdrawalWallet does not exist on User, using withdrawableBalance
    if (user.withdrawableBalance < Number(amount)) {
      alert("Insufficient funds in Withdrawal Wallet");
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      // Fix: withdrawalWallet does not exist on User, using withdrawableBalance
      setUser({ ...user, withdrawableBalance: user.withdrawableBalance - Number(amount) });
      setLoading(false);
      setAmount('');
      alert("Withdrawal request processed. Funds will reach your bank within 24h.");
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex bg-slate-800 p-1 rounded-2xl">
        <button 
          onClick={() => setMode('RECHARGE')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl transition-all ${mode === 'RECHARGE' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
        >
          <ArrowUpRight size={18} />
          <span className="text-sm font-bold">Recharge</span>
        </button>
        <button 
          onClick={() => setMode('WITHDRAWAL')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl transition-all ${mode === 'WITHDRAWAL' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}
        >
          <ArrowDownLeft size={18} />
          <span className="text-sm font-bold">Withdraw</span>
        </button>
      </div>

      {mode === 'RECHARGE' ? (
        <div className="space-y-4">
          <div className="glass p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-slate-400">Payment Methods</h3>
            <div className="flex items-center space-x-4">
              <div className="flex-1 bg-slate-700/50 p-3 rounded-2xl border-2 border-blue-500 flex flex-col items-center">
                <Smartphone size={24} className="text-blue-500 mb-2" />
                <span className="text-[10px] font-bold uppercase">UPI Gateway</span>
              </div>
              <div className="flex-1 bg-slate-700/50 p-3 rounded-2xl border-2 border-transparent opacity-50 flex flex-col items-center grayscale">
                <Building2 size={24} className="text-slate-400 mb-2" />
                <span className="text-[10px] font-bold uppercase">Net Banking</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Amount (₹)</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (min 500)"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">UTR / Ref Number</label>
              <input 
                type="text" 
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder="12-digit UTR"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button 
              onClick={handleRecharge}
              disabled={loading}
              className="w-full bg-blue-600 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              {loading ? 'Processing...' : 'Verify Recharge'}
            </button>
          </div>

          <div className="bg-amber-50/10 border border-amber-500/20 p-4 rounded-2xl">
            <p className="text-[10px] text-amber-500 font-medium">
              Note: Do not refresh the page until verification is complete. Recharges usually take 5-15 minutes to reflect in the Current Wallet.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="glass p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-400">Withdrawal Wallet</h3>
              {/* Fix: withdrawalWallet does not exist on User, using withdrawableBalance */}
              <span className="text-lg font-black text-emerald-500">₹{user.withdrawableBalance.toFixed(2)}</span>
            </div>

            {/* Fix: boundBank does not exist on User, checking for bankName and accountNumber instead */}
            {user.accountNumber ? (
              <div className="bg-slate-700/50 p-4 rounded-2xl space-y-2 border border-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Bank Account</span>
                  <Lock size={12} className="text-slate-500" />
                </div>
                {/* Fix: boundBank does not exist on User */}
                <div className="text-sm font-bold">{user.bankName}</div>
                <div className="text-xs text-slate-400">{user.accountNumber}</div>
              </div>
            ) : (
              <button className="w-full border-2 border-dashed border-slate-700 p-6 rounded-2xl text-slate-500 flex flex-col items-center hover:text-white hover:border-blue-500 transition-all">
                <Building2 size={32} className="mb-2" />
                <span className="text-sm font-bold">Bind Bank Account</span>
              </button>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Amount (₹)</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (min 200)"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button 
              onClick={handleWithdrawal}
              {/* Fix: boundBank does not exist on User */}
              disabled={loading || !user.accountNumber}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all ${
                !user.accountNumber ? 'bg-slate-700 cursor-not-allowed' : 'bg-emerald-600 shadow-emerald-500/20'
              }`}
            >
              {loading ? 'Processing...' : 'Confirm Withdrawal'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50">
              <div className="text-[8px] font-bold text-slate-500 uppercase mb-1">Fee</div>
              <div className="text-sm font-bold">5% Fixed</div>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50">
              <div className="text-[8px] font-bold text-slate-500 uppercase mb-1">Time</div>
              <div className="text-sm font-bold">Mon-Fri (10AM-6PM)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceView;
