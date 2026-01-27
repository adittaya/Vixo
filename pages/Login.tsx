
import React, { useState } from 'react';
// @ts-ignore
import * as ReactRouterDOM from 'react-router-dom';
import { getStore, saveStore } from '../store';
import { User } from '../types';
import { Mail, Lock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { LOGO_IMAGE } from '../constants';

const { useNavigate } = ReactRouterDOM as any;

interface Props { onLogin: (user: User) => void; }

const Login: React.FC<Props> = ({ onLogin }) => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mobile === '7047571828' && password === 'admin123') {
      navigate('/admin');
      return;
    }
    const { users } = getStore();
    const user = users.find(u => u.mobile === mobile && u.password === password);
    if (user) {
      if (user.status === 'banned') {
        setError('Account Suspended.');
        return;
      }
      saveStore({ currentUser: user });
      onLogin(user);
      navigate('/home');
    } else {
      setError('Invalid credentials.');
    }
  };

  return (
    <div className="bg-white min-h-screen flex flex-col p-8 md:p-12">
      <div className="mt-12 mb-16 flex flex-col items-center">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-4">
          <img src={LOGO_IMAGE} className="w-full h-full object-contain" alt="VIXO Logo" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tighter">VIXO</h1>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Smart. Trusted. Premium.</p>
      </div>

      <div className="flex-grow max-w-sm mx-auto w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
        <p className="text-gray-500 text-sm mb-10">Enter your details to access your nodes.</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Phone Number</label>
            <div className="relative">
              <input 
                type="tel" 
                placeholder="Phone number" 
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="vixo-input w-full pl-12"
                required
              />
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Password</label>
            <div className="relative">
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="vixo-input w-full pl-12"
                required
              />
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
            </div>
          </div>

          {error && <p className="text-red-500 text-[10px] font-bold uppercase text-center bg-red-50 py-3 rounded-xl">{error}</p>}

          <button 
            type="submit"
            className="w-full vixo-bg text-white py-4 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 group"
          >
            Sign In
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
        
        <div className="mt-10 text-center">
          <p className="text-sm text-gray-400">
            New to VIXO? <button onClick={() => navigate('/register')} className="vixo-green font-bold ml-1">Create Account</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
