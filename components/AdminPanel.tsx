
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, Users, CreditCard, Check, X, LogIn, Lock, Database } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminPanel: React.FC = () => {
  const { 
    isAdmin, adminLogin, adminLogout, transactions, users, approveTransaction, rejectTransaction 
  } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminLogin(username, password)) {
      setError('');
    } else {
      setError('Invalid admin credentials');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center items-center px-6">
        <form onSubmit={handleLogin} className="glass-panel p-8 rounded-[2rem] w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <Lock size={40} className="mx-auto text-amber-500" />
            <h2 className="text-xl font-black text-white uppercase">Admin Vault</h2>
          </div>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Admin ID" 
              className="w-full bg-slate-900 p-4 rounded-xl text-white outline-none border border-slate-800"
              value={username} onChange={e => setUsername(e.target.value)}
            />
            <input 
              type="password" 
              placeholder="Passcode" 
              className="w-full bg-slate-900 p-4 rounded-xl text-white outline-none border border-slate-800"
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500 text-[10px] font-bold text-center uppercase">{error}</p>}
          <button type="submit" className="w-full py-4 gold-gradient text-slate-900 font-black rounded-xl uppercase tracking-widest">
            Authenticate
          </button>
        </form>
      </div>
    );
  }

  // Fix: Using lowercase 'recharge', 'withdraw' and 'pending' to match TransactionType and TransactionStatus
  const pendingRecharges = transactions.filter(t => t.type === 'recharge' && t.status === 'pending');
  const pendingWithdrawals = transactions.filter(t => t.type === 'withdraw' && t.status === 'pending');

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase">
          <Settings size={20} /> Control Hub
        </h2>
        <button onClick={adminLogout} className="text-[10px] text-slate-500 font-bold border border-slate-800 px-3 py-1 rounded-full uppercase">Logout</button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel p-4 rounded-2xl">
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Total Users</p>
          <p className="text-xl font-black text-white">{users.length}</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl">
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Total Balance</p>
          <p className="text-xl font-black text-amber-500">₹{users.reduce((acc, u) => acc + u.balance, 0)}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <CreditCard size={16} /> Pending Recharges ({pendingRecharges.length})
        </h3>
        {pendingRecharges.map(t => (
          <div key={t.id} className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-white">₹{t.amount}</p>
                <p className="text-[10px] text-amber-500 font-mono">UTR: {t.utr}</p>
                <p className="text-[10px] text-slate-500">User: {users.find(u => u.id === t.userId)?.name}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => approveTransaction(t.id)} className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center"><Check size={16} /></button>
                <button onClick={() => rejectTransaction(t.id)} className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center"><X size={16} /></button>
              </div>
            </div>
          </div>
        ))}
        {pendingRecharges.length === 0 && <p className="text-center text-[10px] text-slate-600 uppercase py-4">No pending recharges</p>}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Database size={16} /> User Directory
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {users.map(u => (
            <div key={u.id} className="glass-panel p-3 rounded-xl border border-slate-900 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-white">{u.name}</p>
                <p className="text-[9px] text-slate-500">{u.mobile}</p>
              </div>
              <p className="text-[10px] font-bold text-green-500">₹{u.balance}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
