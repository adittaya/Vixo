
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { HERO_IMAGE, LOGO_IMAGE } from '../constants';
import { getStore } from '../store';
import { Copy, CheckCircle2, ChevronLeft, Share2, Award, Users, TrendingUp, Gift, Zap, ShieldAlert } from 'lucide-react';
// @ts-ignore
import * as ReactRouterDOM from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const { useNavigate } = ReactRouterDOM as any;
const MotionDiv = motion.div as any;

interface Props {
  user: User;
}

const Share: React.FC<Props> = ({ user }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [adminSettings, setAdminSettings] = useState(getStore().admin);
  const navigate = useNavigate();

  useEffect(() => {
    const refresh = () => setAdminSettings(getStore().admin);
    window.addEventListener('store-update', refresh);
    return () => window.removeEventListener('store-update', refresh);
  }, []);

  const refLink = `${window.location.origin}/#/register?ref=${user.referralCode}`;

  const copy = async (text: string, setFn: React.Dispatch<React.SetStateAction<boolean>>) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setFn(true);
        setTimeout(() => setFn(false), 2000);
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
        setFn(true);
        setTimeout(() => setFn(false), 2000);
      } catch (copyErr) {
        console.error('Fallback copy failed', copyErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join VIXO',
          text: `Earn money every day with VIXO. Use my code: ${user.referralCode}`,
          url: refLink,
        });
      } catch (err) {
        copy(refLink, setCopiedLink);
      }
    } else {
      copy(refLink, setCopiedLink);
    }
  };

  return (
    <div className="bg-[#f8faf9] min-h-screen pb-32">
      {/* Header */}
      <div className="bg-white px-6 py-6 flex justify-between items-center sticky top-0 z-[100] border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 bg-gray-50 rounded-xl text-gray-400 active:scale-95 transition-all">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-gray-900 text-lg font-black italic tracking-tighter uppercase leading-none">INVITE<br/><span className="text-[#00D094]">CENTER</span></h1>
        </div>
        <div className="w-10 h-10 bg-[#00D094]/10 rounded-full flex items-center justify-center text-[#00D094]">
          <Award size={20} />
        </div>
      </div>

      {/* Hero Visual */}
      <div className="p-6">
        <div className="vixo-gradient rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-xl shadow-[#00D094]/10">
          <div className="relative z-10">
            <div className="bg-white/20 w-fit p-3 rounded-2xl backdrop-blur-md border border-white/10 mb-6">
               <Gift size={28} />
            </div>
            <h2 className="text-3xl font-black italic leading-none">BUILD YOUR<br/>TEAM</h2>
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-4 max-w-[200px] leading-relaxed">
              Earn huge bonuses every time your friends start a plan.
            </p>
          </div>
          <Zap size={140} className="absolute -right-10 -bottom-10 text-white/10 rotate-12" />
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 space-y-6">
        <div className="bg-white rounded-[2.5rem] p-8 card-shadow border border-gray-50 space-y-8">
           {/* Referral Link */}
           <div className="space-y-3">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] ml-4">Your Invite Link</p>
              <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-[2rem] border border-gray-100 shadow-inner">
                <div className="flex-1 bg-transparent px-4 py-2 text-xs text-gray-500 font-bold truncate">
                  {refLink}
                </div>
                <button 
                  onClick={() => copy(refLink, setCopiedLink)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${copiedLink ? 'bg-emerald-500 text-white' : 'vixo-bg text-white shadow-lg'}`}
                >
                  {copiedLink ? <CheckCircle2 size={14} /> : 'Copy'}
                </button>
              </div>
           </div>

           {/* Referral Code */}
           <div className="space-y-3">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] ml-4">Invite Code</p>
              <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-[2rem] border border-gray-100 shadow-inner">
                <div className="flex-1 bg-transparent px-6 py-2 text-lg text-gray-900 font-black tracking-[0.4em]">
                  {user.referralCode}
                </div>
                <button 
                  onClick={() => copy(user.referralCode, setCopiedCode)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${copiedCode ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white shadow-lg'}`}
                >
                  {copiedCode ? <CheckCircle2 size={14} /> : 'Copy'}
                </button>
              </div>
           </div>

           <button 
             onClick={handleNativeShare}
             className="w-full flex items-center justify-center gap-3 bg-emerald-50 text-emerald-600 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest border border-emerald-100 active:scale-95 transition-all"
           >
              <Share2 size={18} />
              Share Now
           </button>
        </div>

        {/* Commission Tiers */}
        <div className="space-y-4">
           <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] ml-4">Team Bonus Levels</h3>
           <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 card-shadow divide-y divide-gray-50">
              {[
                { lvl: '01', icon: Award, color: 'text-emerald-500 bg-emerald-50', pct: adminSettings.commissionL1, desc: 'Direct Friends' },
                { lvl: '02', icon: Users, color: 'text-blue-500 bg-blue-50', pct: adminSettings.commissionL2, desc: 'Friend\'s Friends' },
                { lvl: '03', icon: TrendingUp, color: 'text-amber-500 bg-amber-50', pct: adminSettings.commissionL3, desc: 'Indirect Friends' },
              ].map((tier, i) => (
                <div key={i} className="p-6 flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${tier.color} rounded-2xl flex items-center justify-center shadow-sm group-active:scale-90 transition-transform`}>
                      <tier.icon size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-900 uppercase">Level {tier.lvl}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{tier.desc}</p>
                    </div>
                  </div>
                  <span className="text-xl font-black text-gray-900 italic">{tier.pct}%</span>
                </div>
              ))}
           </div>
        </div>

        {/* Security / Info */}
        <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
           <div className="relative z-10 flex items-start gap-4">
              <ShieldAlert size={20} className="text-[#00D094] shrink-0 mt-1" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-[#00D094]">Important Rules</h4>
                <p className="text-[9px] text-white/40 font-bold uppercase leading-relaxed mt-2 tracking-widest">
                  Multiple accounts are not allowed. If you create fake accounts for bonus, your account will be permanently banned.
                </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Share;
