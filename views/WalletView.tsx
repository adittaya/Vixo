
import React, { useState } from 'react';
import { 
  Plus, 
  ArrowDownToLine, 
  History, 
  Building, 
  CreditCard,
  Copy,
  CheckCircle2
} from 'lucide-react';
// Fixed: useApp hook will be exported from App.tsx
import { useApp } from '../App';

const WalletView: React.FC = () => {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<'recharge' | 'withdraw'>('recharge');
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);

  // Fixed: Fallback for nullable user
  if (!user) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText('888999111@upi');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Balance Summaries */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-900/20">
            <div className="flex justify-between items-start mb-12">
              <div>
                <p className="text-indigo-200/80 text-sm font-medium">Current Balance</p>
                {/* Fixed: property name correction (balance instead of currentBalance) */}
                <h3 className="text-3xl font-bold mt-1">₹{(user.balance || 0).toLocaleString()}</h3>
              </div>
              <CreditCard className="w-8 h-8 text-white/30" />
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab('recharge')}
                className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-xl text-sm font-bold backdrop-blur-md border border-white/20 transition-all"
              >
                Recharge
              </button>
              <button 
                onClick={() => setActiveTab('withdraw')}
                className="flex-1 bg-white text-indigo-700 py-2 rounded-xl text-sm font-bold shadow-lg transition-all"
              >
                Withdraw
              </button>
            </div>
          </div>

          <div className="glass-effect p-8 rounded-[2rem] border-slate-800/50">
            <p className="text-slate-400 text-sm font-medium">Withdrawal Wallet</p>
            {/* Fixed: property name correction (withdrawableBalance instead of withdrawalBalance) */}
            <h3 className="text-2xl font-bold text-white mt-1">₹{(user.withdrawableBalance || 0).toLocaleString()}</h3>
            <div className="mt-4 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-400 font-bold uppercase tracking-wider">Daily Earn Status</span>
                <span className="text-emerald-500">Active</span>
              </div>
              <p className="text-slate-400 text-sm leading-tight">Your daily yield will be credited to this wallet automatically at 00:00 IST.</p>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="lg:col-span-2 glass-effect rounded-[2.5rem] p-8">
          <div className="flex items-center gap-8 mb-8 border-b border-slate-800">
            <button 
              onClick={() => setActiveTab('recharge')}
              className={`pb-4 text-lg font-bold transition-all relative ${activeTab === 'recharge' ? 'text-white' : 'text-slate-500'}`}
            >
              Recharge via UPI
              {activeTab === 'recharge' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-full"></div>}
            </button>
            <button 
              onClick={() => setActiveTab('withdraw')}
              className={`pb-4 text-lg font-bold transition-all relative ${activeTab === 'withdraw' ? 'text-white' : 'text-slate-500'}`}
            >
              Withdraw to Bank
              {activeTab === 'withdraw' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-full"></div>}
            </button>
          </div>

          {activeTab === 'recharge' ? (
            <div className="space-y-6">
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                <p className="text-slate-400 text-sm mb-4">Step 1: Copy Official UPI ID</p>
                <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800 group">
                  <span className="font-mono text-indigo-400">888999111@upi</span>
                  <button 
                    onClick={handleCopyCode}
                    className="p-2 hover:bg-indigo-500/10 rounded-lg transition-colors"
                  >
                    {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-slate-500" />}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 block">Amount to Recharge (INR)</label>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount (Min: ₹500)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 focus:outline-none focus:border-indigo-500 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 block">12 Digit Transaction ID (UTR)</label>
                  <input 
                    type="text" 
                    placeholder="Paste UTR number here"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 focus:outline-none focus:border-indigo-500 text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 text-xs text-amber-500/80 leading-relaxed">
                Notice: Recharges are processed within 30 minutes. Ensure the UTR number is correct to avoid payment rejection. Duplicate UTR submissions will lead to account freeze.
              </div>

              <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98]">
                Submit Recharge Request
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                <div className="bg-indigo-500/10 p-3 rounded-xl">
                  <Building className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">HDFC Bank Primary Account</p>
                  <p className="text-xs text-slate-500">**** **** 4291 | IFSC: HDFC0001</p>
                </div>
                <button className="ml-auto text-xs font-bold text-indigo-500 hover:text-indigo-400">Manage</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 block">Withdrawal Amount</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-5 py-4 focus:outline-none focus:border-indigo-500 text-white font-bold"
                    />
                  </div>
                  <div className="flex justify-between mt-2 px-1">
                    {/* Fixed: withdrawalBalance -> withdrawableBalance */}
                    <span className="text-xs text-slate-500">Max: ₹{user.withdrawableBalance}</span>
                    <span className="text-xs text-slate-500">Processing Fee: 5%</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 block">Security PIN</label>
                  <input 
                    type="password" 
                    maxLength={6}
                    placeholder="Enter 6-digit withdrawal PIN"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 focus:outline-none focus:border-indigo-500 text-white tracking-[1em] text-center"
                  />
                </div>
              </div>

              <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-xs text-indigo-400 leading-relaxed">
                Rules: Bank withdrawals are processed within 24-48 hours. Minimum withdrawal is ₹200. Only one withdrawal is permitted every 24 hours. No UPI withdrawals allowed.
              </div>

              <button className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98]">
                Request Bank Transfer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletView;
