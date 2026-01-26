
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getStore } from '../store';
import { Users, TrendingUp, Network, ChevronLeft, ChevronRight, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
// @ts-ignore
import * as ReactRouterDOM from 'react-router-dom';

const { useNavigate } = ReactRouterDOM as any;
const MotionDiv = motion.div as any;

interface TeamMember {
  user: User;
  level: number;
  totalRecharge: number;
  totalWithdraw: number;
  totalPurchase: number;
  invitesCount: number;
}

interface Props { user: User; }

const Team: React.FC<Props> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState({
    l1: 0, l2: 0, l3: 0,
    totalVolume: 0
  });
  const [admin, setAdmin] = useState(getStore().admin);
  const navigate = useNavigate();

  useEffect(() => {
    const store = getStore();
    const { users, transactions } = store;
    setAdmin(store.admin);
    
    const getTeamData = (parentCode: string, level: number): TeamMember[] => {
      const directSubs = users.filter(u => u.referredBy === parentCode);
      return directSubs.map(sub => {
        const subTxns = transactions.filter(t => t.userId === sub.id && t.status === 'approved');
        return {
          user: sub,
          level,
          totalRecharge: subTxns.filter(t => t.type === 'recharge').reduce((s,t) => s + t.amount, 0),
          totalWithdraw: subTxns.filter(t => t.type === 'withdraw').reduce((s,t) => s + t.amount, 0),
          totalPurchase: subTxns.filter(t => t.type === 'purchase').reduce((s,t) => s + t.amount, 0),
          invitesCount: users.filter(u => u.referredBy === sub.referralCode).length
        };
      });
    };
    
    const l1 = getTeamData(user.referralCode, 1);
    const l2 = l1.flatMap(m => getTeamData(m.user.referralCode, 2));
    const l3 = l2.flatMap(m => getTeamData(m.user.referralCode, 3));
    
    const allMembers = [...l1, ...l2, ...l3];
    const totalVolume = allMembers.reduce((s, m) => s + m.totalPurchase, 0);

    setStats({ l1: l1.length, l2: l2.length, l3: l3.length, totalVolume });
    
    if (activeTab === 1) setTeamMembers(l1);
    else if (activeTab === 2) setTeamMembers(l2);
    else setTeamMembers(l3);

  }, [user.id, user.referralCode, activeTab]);

  const maskMobile = (mobile: string) => {
    if (user.isBlogger) return mobile;
    if (mobile.length < 5) return mobile;
    return mobile.slice(0, 3) + "XXXXX" + mobile.slice(-3);
  };

  const incomePercentages = { 
    1: `${admin.commissionL1}%`, 
    2: `${admin.commissionL2}%`, 
    3: `${admin.commissionL3}%` 
  };

  return (
    <div className="bg-[#f8faf9] min-h-screen">
      {/* VIXO Header */}
      <div className="bg-white px-8 pt-20 pb-12 rounded-b-[3.5rem] shadow-sm border-b border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 vixo-bg opacity-[0.03] blur-[60px] rounded-full -mr-20 -mt-20"></div>
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate(-1)} className="p-2 bg-gray-50 rounded-xl text-gray-400 active:scale-90 transition-all"><ChevronLeft size={20}/></button>
             <h1 className="text-2xl font-black italic tracking-tighter text-gray-900 uppercase">MY TEAM</h1>
          </div>
          <Users size={20} className="vixo-green" />
        </div>
      </div>

      <div className="p-6 space-y-6 mt-4 pb-36">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[2.5rem] card-shadow border border-gray-50">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-2">Team Investments</span>
            <p className="text-2xl font-black text-gray-900 italic tracking-tighter">₹{stats.totalVolume.toLocaleString()}</p>
          </div>
          <div className="vixo-bg p-6 rounded-[2.5rem] shadow-lg shadow-[#00D094]/10">
            <span className="text-[8px] font-black text-white/50 uppercase tracking-widest block mb-2">Members</span>
            <p className="text-2xl font-black text-white italic tracking-tighter">{stats.l1 + stats.l2 + stats.l3}</p>
          </div>
        </div>

        <div className="bg-white p-1.5 rounded-3xl card-shadow border border-gray-100 flex gap-2">
          {[1, 2, 3].map(lvl => (
            <button 
              key={lvl}
              onClick={() => setActiveTab(lvl as 1|2|3)}
              className={`flex-1 py-4 px-2 rounded-2xl transition-all flex flex-col items-center ${activeTab === lvl ? 'vixo-bg text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <span className="text-[10px] font-black uppercase tracking-widest">Level {lvl}</span>
              <span className={`text-[8px] font-bold uppercase tracking-tighter mt-1 ${activeTab === lvl ? 'text-white/60' : 'vixo-green'}`}>{incomePercentages[lvl as 1|2|3]} Reward</span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {teamMembers.length > 0 ? (
            teamMembers.map((member, idx) => (
              <MotionDiv 
                key={member.user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-[2.5rem] p-6 card-shadow border border-gray-50 group hover:border-[#00D094]/30"
              >
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 border border-gray-100">
                        <UserCheck size={18} />
                     </div>
                     <div>
                        <p className="text-sm font-black text-gray-900">{maskMobile(member.user.mobile)}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">ID: {member.user.referralCode}</p>
                     </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-200" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <p className="text-[7px] text-gray-400 font-black uppercase text-center mb-1">Added</p>
                      <p className="text-[10px] font-black text-gray-900 text-center">₹{member.totalRecharge}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <p className="text-[7px] text-gray-400 font-black uppercase text-center mb-1">Plans</p>
                      <p className="text-[10px] font-black text-gray-900 text-center">₹{member.totalPurchase}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <p className="text-[7px] text-gray-400 font-black uppercase text-center mb-1">Group</p>
                      <p className="text-[10px] font-black text-gray-900 text-center">{member.invitesCount}</p>
                    </div>
                </div>
              </MotionDiv>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Users size={48} className="text-gray-100 mb-4" />
              <h2 className="text-xl font-black italic tracking-widest text-gray-300 uppercase">NO MEMBERS</h2>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-2 max-w-[180px]">No active members found in this level yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Team;
