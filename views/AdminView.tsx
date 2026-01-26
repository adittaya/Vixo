
import React, { useState } from 'react';
import { 
  Activity, 
  Settings2, 
  Database, 
  ShieldAlert, 
  RefreshCw, 
  AlertTriangle,
  Users,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

const AdminView: React.FC = () => {
  const [isYieldRunning, setIsYieldRunning] = useState(false);

  const pendingRecharges = [
    { id: 'REC001', user: 'Sunil Kumar', amount: 5000, utr: '128911002233', date: '2024-03-20 14:30' },
    { id: 'REC002', user: 'Priya Verma', amount: 1500, utr: '334455667788', date: '2024-03-20 15:10' },
    { id: 'REC003', user: 'Vikram Singh', amount: 12000, utr: '990011223344', date: '2024-03-20 16:45' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-2xl">
            <ShieldAlert className="w-8 h-8 text-rose-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white uppercase tracking-tighter">System Control Center</h1>
            <p className="text-slate-400">Authorized personnel only. Management of financial flows.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Load</span>
            <span className="text-emerald-500 font-bold">Optimal</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Peers</span>
            <span className="text-white font-bold">1,248</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Yield Control Panel */}
        <div className="glass-effect rounded-[2rem] p-8 border-rose-500/20 bg-rose-500/5">
          <div className="flex items-center gap-3 mb-6">
            <RefreshCw className={`w-6 h-6 ${isYieldRunning ? 'text-emerald-500 animate-spin' : 'text-slate-500'}`} />
            <h3 className="text-xl font-bold text-white">Global Yield Schedular</h3>
          </div>
          <p className="text-sm text-slate-400 mb-8">Manually trigger the daily profit distribution to all active machine lessees across the platform.</p>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Run</span>
              <span className="text-sm font-bold text-white">2024-03-20 00:01</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Est. Payout</span>
              <span className="text-sm font-bold text-emerald-500">₹8,45,200.00</span>
            </div>
            <button 
              onClick={() => setIsYieldRunning(true)}
              disabled={isYieldRunning}
              className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {isYieldRunning ? 'DISTRIBUTING...' : 'TRIGGER YIELD NOW'}
            </button>
          </div>
        </div>

        {/* Global Settings */}
        <div className="lg:col-span-2 glass-effect rounded-[2rem] p-8">
          <div className="flex items-center gap-3 mb-8">
            <Settings2 className="w-6 h-6 text-indigo-500" />
            <h3 className="text-xl font-bold text-white">Platform Settings</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl border border-slate-800 cursor-pointer group">
                <div>
                  <p className="text-sm font-bold text-white">Lock Withdrawals</p>
                  <p className="text-xs text-slate-500">Global pause on cashouts</p>
                </div>
                <input type="checkbox" className="w-10 h-5 bg-slate-800 rounded-full appearance-none checked:bg-indigo-500 transition-all relative after:content-[''] after:absolute after:top-1 after:left-1 after:w-3 after:h-3 after:bg-white after:rounded-full checked:after:translate-x-5 after:transition-all" />
              </label>
              <label className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl border border-slate-800 cursor-pointer group">
                <div>
                  <p className="text-sm font-bold text-white">Maintenance Mode</p>
                  <p className="text-xs text-slate-500">Show splash screen</p>
                </div>
                <input type="checkbox" className="w-10 h-5 bg-slate-800 rounded-full appearance-none checked:bg-amber-500 transition-all relative after:content-[''] after:absolute after:top-1 after:left-1 after:w-3 after:h-3 after:bg-white after:rounded-full checked:after:translate-x-5 after:transition-all" />
              </label>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Withdrawal Fee (%)</label>
                <input type="number" defaultValue={5} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white font-bold focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Min Recharge (₹)</label>
                <input type="number" defaultValue={500} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white font-bold focus:border-indigo-500 outline-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recharge Approval Queue */}
      <div className="glass-effect rounded-[2.5rem] p-8 overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-indigo-500" />
            <h3 className="text-xl font-bold text-white">Pending Recharge Approval</h3>
          </div>
          <button className="text-xs font-bold text-indigo-500 hover:underline">View All Records</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-800">
                <th className="pb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">User / ID</th>
                <th className="pb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                <th className="pb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">UTR Reference</th>
                <th className="pb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Time</th>
                <th className="pb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRecharges.map((req) => (
                <tr key={req.id} className="group hover:bg-white/5 transition-all">
                  <td className="py-6">
                    <p className="font-bold text-white">{req.user}</p>
                    <p className="text-xs text-slate-500">{req.id}</p>
                  </td>
                  <td className="py-6">
                    <span className="font-black text-emerald-500">₹{req.amount.toLocaleString()}</span>
                  </td>
                  <td className="py-6">
                    <span className="font-mono text-sm text-slate-300">{req.utr}</span>
                  </td>
                  <td className="py-6">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {req.date}
                    </div>
                  </td>
                  <td className="py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-all active:scale-90">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-all active:scale-90">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
