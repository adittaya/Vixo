
import React from 'react';
import { ShieldCheck, Award, Landmark, CheckCircle2 } from 'lucide-react';

const TrustBadges: React.FC = () => {
  return (
    <div className="space-y-6 pt-10 border-t border-slate-800">
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel p-4 rounded-2xl text-center space-y-1 border-slate-800/50">
          <ShieldCheck size={24} className="mx-auto text-amber-500" />
          <p className="text-[9px] font-bold text-slate-300 uppercase">RBI Registered</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl text-center space-y-1 border-slate-800/50">
          <Award size={24} className="mx-auto text-amber-500" />
          <p className="text-[9px] font-bold text-slate-300 uppercase">ISO Certified</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl text-center space-y-1 border-slate-800/50">
          <Landmark size={24} className="mx-auto text-amber-500" />
          <p className="text-[9px] font-bold text-slate-300 uppercase">Govt Verified</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl text-center space-y-1 border-slate-800/50">
          <CheckCircle2 size={24} className="mx-auto text-amber-500" />
          <p className="text-[9px] font-bold text-slate-300 uppercase">World Bank Appr.</p>
        </div>
      </div>
      
      <div className="text-center pb-4">
        <p className="text-[8px] text-slate-600 font-bold uppercase tracking-[0.2em] mb-2">Platform Partners</p>
        <div className="flex justify-center gap-4 grayscale opacity-30">
          <span className="font-serif text-lg text-white">VISA</span>
          <span className="font-serif text-lg text-white">NPCI</span>
          <span className="font-serif text-lg text-white">G-Pay</span>
          <span className="font-serif text-lg text-white">PAYTM</span>
        </div>
      </div>
    </div>
  );
};

export default TrustBadges;
