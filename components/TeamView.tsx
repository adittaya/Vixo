
import React from 'react';
import { User } from '../types';
import { Users, UserPlus, Copy, Layers, ChevronRight, Award } from 'lucide-react';

interface TeamViewProps {
  user: User;
}

const TeamView: React.FC<TeamViewProps> = ({ user }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(user.referralCode);
    alert("Referral code copied!");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="glass p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <UserPlus size={120} />
        </div>
        <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">My Referral</h2>
        <div className="flex items-center space-x-3 mb-6">
          <div className="text-3xl font-black tracking-tighter">{user.referralCode}</div>
          <button onClick={copyToClipboard} className="bg-blue-600 p-2 rounded-xl hover:bg-blue-500 transition-colors">
            <Copy size={16} />
          </button>
        </div>
        <p className="text-xs text-slate-400 max-w-[200px]">Share your code to earn commissions up to 3 levels deep.</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* Fix: referralCount does not exist on User, using 0 as default placeholder */}
        <TeamStat level="Level 1" count={0} bonus="12%" />
        <TeamStat level="Level 2" count={0} bonus="5%" />
        <TeamStat level="Level 3" count={0} bonus="2%" />
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-bold flex items-center space-x-2">
          <Layers size={16} />
          <span>Detailed Structure</span>
        </h3>
        
        <TeamMemberRow name="Rohit S." level="L1" active={true} income={450.20} />
        <TeamMemberRow name="Priya M." level="L1" active={true} income={210.00} />
        <TeamMemberRow name="Amit K." level="L2" active={false} income={0.00} />
        <TeamMemberRow name="Sunita V." level="L1" active={true} income={89.50} />
      </div>

      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center space-x-4">
        <div className="bg-emerald-500 p-3 rounded-xl text-white">
          <Award size={24} />
        </div>
        <div>
          <div className="text-sm font-bold">VIP Affiliate Program</div>
          <div className="text-xs text-slate-400">Reach 50 active L1 members for 1.5x bonuses.</div>
        </div>
      </div>
    </div>
  );
};

const TeamStat: React.FC<{ level: string, count: number, bonus: string }> = ({ level, count, bonus }) => (
  <div className="glass p-3 rounded-2xl text-center flex flex-col items-center">
    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">{level}</div>
    <div className="text-lg font-black">{count}</div>
    <div className="mt-1 px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded-full">
      {bonus} Commission
    </div>
  </div>
);

const TeamMemberRow: React.FC<{ name: string, level: string, active: boolean, income: number }> = ({ name, level, active, income }) => (
  <div className="glass p-3 rounded-2xl flex items-center justify-between">
    <div className="flex items-center space-x-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${active ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-500'}`}>
        {name.charAt(0)}
      </div>
      <div>
        <div className="text-xs font-bold">{name}</div>
        <div className="text-[10px] text-slate-500 flex items-center space-x-1">
          <span>{level}</span>
          <span>•</span>
          <span className={active ? 'text-emerald-500' : 'text-slate-500'}>{active ? 'Active' : 'Inactive'}</span>
        </div>
      </div>
    </div>
    <div className="flex flex-col items-end">
      <div className="text-xs font-bold text-emerald-500">₹{income.toFixed(2)}</div>
      <ChevronRight size={14} className="text-slate-600" />
    </div>
  </div>
);

export default TeamView;
