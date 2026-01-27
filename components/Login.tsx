
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
// @ts-ignore
import * as ReactRouterDOM from 'react-router-dom';
import { Smartphone, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const { Link, useNavigate } = ReactRouterDOM as any;

const Login: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const success = login(mobile, password);
    if (success) {
      navigate('/');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#f0f7ff]">
      <div className="w-full max-sm space-y-12">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-white p-2 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl">
             <img src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Bisleri_logo.png" className="w-20 object-contain" alt="Bisleri" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#1e293b] tracking-tighter uppercase italic">Bisleri Pro</h1>
            <p className="text-[#00a0e3] text-xs font-bold uppercase tracking-widest">Pure Mineral Investment</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="bg-white p-8 rounded-[3rem] space-y-6 shadow-2xl border border-white">
          <div className="space-y-4">
            <div className="relative">
              <Smartphone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Mobile Number"
                className="w-full bg-slate-50 border-none p-4 pl-12 rounded-2xl text-slate-700 outline-none focus:ring-2 focus:ring-[#00a0e3]/20 transition-all font-medium"
              />
            </div>

            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-slate-50 border-none p-4 pl-12 rounded-2xl text-slate-700 outline-none focus:ring-2 focus:ring-[#00a0e3]/20 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-[10px] font-bold uppercase text-center">{error}</p>}

          <button
            type="submit"
            className="w-full py-5 bg-[#00a0e3] text-white font-black rounded-2xl shadow-xl shadow-blue-200 active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-xs"
          >
            Login Securely
          </button>

          <div className="pt-2 text-center">
            <p className="text-slate-400 text-xs font-medium">
              New here? <Link to="/register" className="text-[#00a0e3] font-black ml-1 hover:underline uppercase">Register</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
