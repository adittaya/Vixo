
import React from 'react';
import { useApp } from '../context/AppContext';
import { History, TrendingUp, Download, Package, Users, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const Transactions: React.FC = () => {
  const { transactions, currentUser } = useApp();

  if (!currentUser) return null;

  const userTransactions = [...transactions]
    .filter(t => t.userId === currentUser.id)
    .sort((a, b) => b.timestamp - a.timestamp);

  const getIcon = (type: string) => {
    // Fix: Using lowercase type keys to match types.ts TransactionType
    switch(type) {
      case 'recharge': return <Download size={16} className="text-blue-500" />;
      case 'withdraw': return <AlertCircle size={16} className="text-red-500" />;
      case 'profit': return <TrendingUp size={16} className="text-green-500" />;
      case 'purchase': return <Package size={16} className="text-amber-500" />;
      case 'commission': return <Users size={16} className="text-purple-500" />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="space-y-6 pt-4 pb-20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-500">
          <History size={24} />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-tight">History</h2>
      </div>

      <div className="space-y-3">
        {userTransactions.length > 0 ? (
          userTransactions.map((t) => (
            <div key={t.id} className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center">
                  {getIcon(t.type)}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                    {t.type.replace('_', ' ')}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(t.timestamp).toLocaleDateString()} • {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {t.utr && <p className="text-[9px] text-slate-600 font-mono mt-0.5">UTR: {t.utr}</p>}
                </div>
              </div>
              <div className="text-right">
                {/* Fix: Using lowercase 'recharge', 'profit', 'commission' for comparison */}
                <p className={`text-sm font-black ${t.type === 'recharge' || t.type === 'profit' || t.type === 'commission' ? 'text-green-500' : 'text-red-500'}`}>
                  {t.type === 'recharge' || t.type === 'profit' || t.type === 'commission' ? '+' : '-'}₹{t.amount}
                </p>
                {/* Fix: Using lowercase 'approved', 'pending' for comparison */}
                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                  t.status === 'approved' ? 'bg-green-500/10 text-green-500' : 
                  t.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  {t.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20">
            <History size={48} className="mx-auto text-slate-800 mb-4" />
            <p className="text-slate-500 text-sm">No transactions yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
