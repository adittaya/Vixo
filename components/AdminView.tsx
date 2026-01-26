
import React, { useState } from 'react';
import { 
  Activity, 
  ShieldAlert, 
  Settings, 
  Cpu, 
  Lock, 
  Unlock, 
  Zap, 
  Users,
  AlertTriangle
} from 'lucide-react';

const AdminView: React.FC = () => {
  const [systemOnline, setSystemOnline] = useState(true);
  const [yieldFrozen, setYieldFrozen] = useState(false);
  const [cashoutLocked, setCashoutLocked] = useState(false);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center space-x-2">
          <ShieldAlert className="text-red-500" />
          <span>Admin Control</span>
        </h2>
        <div className="flex items-center space-x-1">
          <span className={`w-2 h-2 rounded-full animate-pulse ${systemOnline ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
          <span className="text-[10px] font-bold text-slate-500 uppercase">Heartbeat</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass p-5 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity size={80} />
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Platform Users</div>
          <div className="text-2xl font-black">12,402</div>
          <div className="text-[10px] text-emerald-500 mt-1">+14% This Month</div>
        </div>
        <div className="glass p-5 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap size={80} />
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Total Yield Paid</div>
          <div className="text-2xl font-black text-emerald-500">₹8.2M</div>
          <div className="text-[10px] text-slate-500 mt-1">Net System Equity</div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">System Toggles</h3>
        
        <ToggleRow 
          icon={<Cpu size={20} />} 
          title="Daily Yield Engine" 
          desc="Automated payout scheduler"
          active={!yieldFrozen}
          onToggle={() => setYieldFrozen(!yieldFrozen)}
          dangerous
        />
        
        <ToggleRow 
          icon={<Lock size={20} />} 
          title="Withdrawal Lock" 
          desc="Freeze all cashout requests"
          active={cashoutLocked}
          onToggle={() => setCashoutLocked(!cashoutLocked)}
          dangerous
        />

        <div className="glass p-5 rounded-3xl border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center space-x-3 mb-4">
            <Settings className="text-blue-500" />
            <h4 className="text-sm font-bold">Manual Payout Override</h4>
          </div>
          <p className="text-xs text-slate-400 mb-4">Trigger a manual system-wide distribution for all active industrial plans.</p>
          <button className="w-full bg-blue-600 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
            Distribute All Yields Now
          </button>
        </div>
      </div>

      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start space-x-3">
        <AlertTriangle className="text-red-500 shrink-0" size={20} />
        <div className="text-[10px] text-red-400">
          <strong>Security Warning:</strong> Any changes made here are immediate and immutable across the platform. Access is logged with ID_PRIME_ADMIN_99.
        </div>
      </div>
    </div>
  );
};

const ToggleRow: React.FC<{ icon: React.ReactNode, title: string, desc: string, active: boolean, onToggle: () => void, dangerous?: boolean }> = ({ icon, title, desc, active, onToggle, dangerous }) => (
  <div className="glass p-4 rounded-2xl flex items-center justify-between">
    <div className="flex items-center space-x-3">
      <div className={`p-2 rounded-xl ${active ? (dangerous ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500') : 'bg-slate-700 text-slate-500'}`}>
        {icon}
      </div>
      <div>
        <div className="text-xs font-bold">{title}</div>
        <div className="text-[10px] text-slate-500">{desc}</div>
      </div>
    </div>
    <button 
      onClick={onToggle}
      className={`w-12 h-6 rounded-full p-1 transition-colors relative ${active ? (dangerous ? 'bg-blue-600' : 'bg-emerald-600') : 'bg-slate-700'}`}
    >
      <div className={`w-4 h-4 bg-white rounded-full transition-all shadow-md ${active ? 'translate-x-6' : 'translate-x-0'}`}></div>
    </button>
  </div>
);

export default AdminView;
