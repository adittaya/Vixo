
import React, { useState } from 'react';
// @ts-ignore
import * as ReactRouterDOM from 'react-router-dom';
import { getStore, saveStore } from '../store';
import { User } from '../types';
import { Mail, Lock, ChevronRight, ShieldCheck, UserPlus } from 'lucide-react';
import { LOGO_IMAGE } from '../constants';

const { useNavigate, useSearchParams } = ReactRouterDOM as any;

const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlReferral = searchParams.get('ref') || '';

  const [formData, setFormData] = useState({
    mobile: '',
    password: '',
    confirmPassword: '',
    withdrawalPassword: '',
    referralCode: urlReferral
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const { users } = getStore();

    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');
    if (users.some(u => u.mobile === formData.mobile)) return setError('Phone number already in use');

    const newUser: User = {
      id: `u-${Date.now()}`,
      name: `User_${formData.mobile.slice(-4)}`,
      username: `u_${formData.mobile.slice(-4)}`,
      mobile: formData.mobile,
      password: formData.password,
      withdrawalPassword: formData.withdrawalPassword,
      balance: 0,
      withdrawableBalance: 0,
      totalInvested: 0,
      totalWithdrawn: 0,
      referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      referredBy: formData.referralCode || undefined,
      registrationDate: new Date().toISOString(),
      vipLevel: 0,
      status: 'active'
    };

    saveStore({ users: [...users, newUser], currentUser: newUser });
    navigate('/home');
  };

  return (
    <div className="bg-white min-h-screen flex flex-col p-8 md:p-12">
      <div className="mt-8 mb-12 flex flex-col items-center">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4">
          <img src={LOGO_IMAGE} className="w-full h-full object-contain" alt="VIXO Logo" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tighter">VIXO JOIN</h1>
      </div>

      <div className="flex-grow max-w-sm mx-auto w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h2>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="relative">
            <input 
              type="tel" 
              placeholder="Phone number" 
              value={formData.mobile}
              onChange={(e) => setFormData({...formData, mobile: e.target.value})}
              className="vixo-input w-full pl-12"
              required
            />
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
          </div>

          <div className="relative">
            <input 
              type="password" 
              placeholder="Set Password" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="vixo-input w-full pl-12"
              required
            />
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
          </div>

          <input 
            type="password" 
            placeholder="Confirm Password" 
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            className="vixo-input w-full"
            required
          />

          <div className="relative">
            <input 
              type="password" 
              placeholder="Withdraw PIN (6 Digits)" 
              value={formData.withdrawalPassword}
              onChange={(e) => setFormData({...formData, withdrawalPassword: e.target.value})}
              className="vixo-input w-full pl-12"
              required
            />
            <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
          </div>

          <div className="relative">
            <input 
              type="text" 
              placeholder="Invite Code (Optional)" 
              value={formData.referralCode}
              onChange={(e) => setFormData({...formData, referralCode: e.target.value})}
              className="vixo-input w-full pl-12 vixo-green font-bold"
            />
            <UserPlus size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
          </div>

          {error && <p className="text-red-500 text-[10px] font-bold uppercase text-center bg-red-50 py-3 rounded-xl">{error}</p>}

          <button 
            type="submit"
            className="w-full vixo-bg text-white py-4 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 group mt-4"
          >
            Create Portfolio
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
        
        <div className="mt-8 text-center pb-8">
          <p className="text-sm text-gray-400">
            Already registered? <button onClick={() => navigate('/login')} className="vixo-green font-bold ml-1">Sign In</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
