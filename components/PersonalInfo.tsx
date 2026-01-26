
import React, { useState } from 'react';
import { User } from '../types';
// @ts-ignore
import * as ReactRouterDOM from 'react-router-dom';
import { ChevronLeft, Mail, CreditCard, Lock, ShieldCheck, X, Eye, EyeOff, User as UserIcon, Building2, Landmark, AlertCircle } from 'lucide-react';
import { HERO_IMAGE } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { getStore, saveStore } from '../store';

const { useNavigate } = ReactRouterDOM as any;

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

interface Props { user: User; }

const PersonalInfo: React.FC<Props> = ({ user }) => {
  const navigate = useNavigate();
  const [modal, setModal] = useState<{ open: boolean, type: 'email' | 'bank' | 'password' | 'wpassword' | '' }>({ open: false, type: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  
  const [bankData, setBankData] = useState({
    name: user.name || '',
    ifsc: user.ifsc || '',
    accountNumber: user.accountNumber || ''
  });
  const [emailData, setEmailData] = useState(user.username || '');
  const [passData, setPassData] = useState({ current: '', next: '', confirm: '' });
  const [wPassData, setWPassData] = useState({ current: '', next: '', confirm: '' });

  const updateUserInfo = (updates: Partial<User>) => {
    const store = getStore();
    const updatedUsers = store.users.map(u => u.id === user.id ? { ...u, ...updates } : u);
    const updatedUser = { ...user, ...updates };
    saveStore({ users: updatedUsers, currentUser: updatedUser });
    setModal({ open: false, type: '' });
    window.location.reload();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (modal.type === 'bank') {
      updateUserInfo({ name: bankData.name, ifsc: bankData.ifsc, accountNumber: bankData.accountNumber });
    } else if (modal.type === 'email') {
      if (!emailData.includes('@')) return setError('Invalid email address');
      updateUserInfo({ username: emailData });
    } else if (modal.type === 'password') {
      if (passData.current !== user.password) return setError('Current password incorrect');
      if (passData.next !== passData.confirm) return setError('Passwords do not match');
      updateUserInfo({ password: passData.next });
    } else if (modal.type === 'wpassword') {
      if (user.withdrawalPassword && wPassData.current !== user.withdrawalPassword) return setError('Current PIN incorrect');
      if (wPassData.next !== wPassData.confirm) return setError('PINs do not match');
      updateUserInfo({ withdrawalPassword: wPassData.next });
    }
  };

  const menuItems = [
    { id: 'email', label: 'Email Identity', icon: Mail, color: 'text-blue-600 bg-blue-50' },
    { id: 'bank', label: 'Withdrawal Method', icon: CreditCard, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'password', label: 'Access Control', icon: Lock, color: 'text-red-600 bg-red-50' },
    { id: 'wpassword', label: 'Financial Shield', icon: ShieldCheck, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-white px-8 pt-16 pb-12 rounded-b-[40px] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] border-b border-slate-100">
        <div className="flex justify-between items-center mb-10">
          <button onClick={() => navigate(-1)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active:scale-90 transition-transform"><ChevronLeft /></button>
          <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Security</h1>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
            <ShieldCheck size={24} strokeWidth={2.5} />
          </div>
        </div>
        
        <div className="text-center">
          <div className="w-24 h-24 bg-slate-900 rounded-[36px] flex items-center justify-center mx-auto mb-6 shadow-2xl rotate-3">
             <UserIcon size={40} className="text-white opacity-20" />
             <div className="absolute w-10 h-10 bg-red-600 rounded-full flex items-center justify-center -top-2 -right-2 border-4 border-white">
                <ShieldCheck size={18} className="text-white" />
             </div>
          </div>
          <h2 className="text-lg font-black text-slate-900">Protected Account</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Status: Fully Verified</p>
        </div>
      </div>

      <div className="p-6 grid grid-cols-2 gap-4 mt-4">
        {menuItems.map(item => (
          <MotionButton 
            key={item.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setModal({ open: true, type: item.id as any })}
            className="bg-white p-6 rounded-[32px] flex flex-col items-center gap-4 premium-shadow border border-slate-50 active:bg-slate-50 transition-colors"
          >
            <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center shadow-sm`}>
              <item.icon size={26} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter text-center leading-tight">{item.label}</span>
          </MotionButton>
        ))}
      </div>

      <div className="p-6 pb-24">
        <div className="bg-amber-50 border border-amber-100 p-5 rounded-[28px] flex gap-4 items-start">
          <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-700 font-bold leading-relaxed uppercase">
            Security audit recommended every 30 days. Never share your withdrawal PIN with anyone claiming to be platform support.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {modal.open && (
          <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6">
            <MotionDiv 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[48px] w-full max-w-sm overflow-hidden premium-shadow"
            >
              <div className="bg-slate-900 p-8 text-center text-white relative">
                <button onClick={() => { setModal({ open: false, type: '' }); setError(''); }} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20"><X size={18}/></button>
                <h3 className="text-xl font-black italic uppercase tracking-widest leading-none">Settings</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-50">Secure Update</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-4">
                {modal.type === 'bank' && (
                  <>
                    <input placeholder="Full Name (Bank Records)" value={bankData.name} onChange={e => setBankData({...bankData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-red-600 transition-all" required />
                    <input placeholder="IFSC Code" value={bankData.ifsc} onChange={e => setBankData({...bankData, ifsc: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-red-600 transition-all" required />
                    <input placeholder="Account Number" value={bankData.accountNumber} onChange={e => setBankData({...bankData, accountNumber: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-red-600 transition-all" required />
                  </>
                )}
                {modal.type === 'email' && (
                  <input type="email" placeholder="example@gmail.com" value={emailData} onChange={e => setEmailData(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-red-600 transition-all" required />
                )}
                {modal.type === 'password' && (
                  <>
                    <input type="password" placeholder="Current Password" onChange={e => setPassData({...passData, current: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-red-600 transition-all" required />
                    <input type="password" placeholder="New Password" onChange={e => setPassData({...passData, next: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-red-600 transition-all" required />
                  </>
                )}
                {modal.type === 'wpassword' && (
                  <input type="password" placeholder="New 4-Digit PIN" onChange={e => setWPassData({...wPassData, next: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-red-600 transition-all" required />
                )}

                {error && <p className="text-red-500 text-[10px] font-black uppercase text-center">{error}</p>}
                <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl mt-4">Confirm Changes</button>
              </form>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PersonalInfo;
