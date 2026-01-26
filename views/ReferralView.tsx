
import React from 'react';
import { Users, UserPlus, Trophy, Share2, ArrowRight } from 'lucide-react';
// Fixed: useApp hook will be exported from App.tsx
import { useApp } from '../App';

const ReferralView: React.FC = () => {
  const { user } = useApp();

  // Fixed: Null check for user
  if (!user) return null;

  const stats = [
    { level: 'Level 1', commission: '15%', count: 42, earnings: 12500 },
    { level: 'Level 2', commission: '5%', count: 128, earnings: 8200 },
    { level: 'Level 3', commission: '2%', count: 356, earnings: 3400 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Referral Header */}
        <div className="lg:col-span-2 glass-effect rounded-[2.5rem] p-8 overflow-hidden relative">
          <div className="relative z-10">
            <h1 className="text-4xl font-black text-white mb-4">Invite Partners,<br/>Earn Commission.</h1>
            <p className="text-slate-400 max-w-md mb-8">Scale your beverage production network. Get instant rewards on every machine leased by your direct and indirect referrals.</p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Your Referral Code</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-indigo-500">{user.referralCode}</span>
                  <button className="p-2 bg-slate-800 rounded-lg hover:bg-indigo-500/20 transition-colors">
                    <Share2 className="w-5 h-5 text-slate-300" />
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Affiliate Link</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300 truncate mr-4">prime-drink.io/join?ref={user.referralCode}</span>
                  <button className="p-2 bg-slate-800 rounded-lg hover:bg-indigo-500/20 transition-colors">
                    <UserPlus className="w-5 h-5 text-slate-300" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                <p className="text-2xl font-black text-white">526</p>
                <p className="text-[10px] font-bold text-indigo-400 uppercase">Total Team</p>
              </div>
              <div className="text-center p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                <p className="text-2xl font-black text-white">₹24k</p>
                <p className="text-[10px] font-bold text-emerald-400 uppercase">Total Earned</p>
              </div>
              <div className="text-center p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                <p className="text-2xl font-black text-white">12</p>
                <p className="text-[10px] font-bold text-amber-400 uppercase">Active VIPs</p>
              </div>
            </div>
          </div>
          <Trophy className="absolute -bottom-12 -right-12 w-64 h-64 text-white/5 rotate-12" />
        </div>

        {/* Tier Ranking */}
        <div className="glass-effect rounded-[2.5rem] p-8">
          <h3 className="text-xl font-bold text-white mb-6">Commission Structure</h3>
          <div className="space-y-4">
            {stats.map((tier, i) => (
              <div key={i} className="group relative overflow-hidden bg-slate-900/50 p-6 rounded-3xl border border-slate-800 hover:border-indigo-500/30 transition-all">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-indigo-400">{tier.level}</span>
                  <span className="bg-indigo-600/20 text-indigo-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">{tier.commission}</span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-2xl font-black text-white">{tier.count}</p>
                    <p className="text-xs text-slate-500">Partners Joined</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-500">₹{tier.earnings.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Income</p>
                  </div>
                </div>
                <div className="absolute top-0 right-0 h-full w-1 bg-indigo-600/0 group-hover:bg-indigo-600/50 transition-all"></div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-4 flex items-center justify-center gap-2 text-indigo-400 font-bold text-sm hover:underline">
            View Full Team List
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralView;
