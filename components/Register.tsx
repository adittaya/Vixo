
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
// @ts-ignore
import * as ReactRouterDOM from 'react-router-dom';
import { User, Smartphone, Lock, UserCircle, Tag, Eye, EyeOff } from 'lucide-react';

const { Link, useNavigate, useSearchParams } = ReactRouterDOM as any;

const Register: React.FC = () => {
  const { register } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    referralCode: searchParams.get('ref') || ''
  });
  
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile || !formData.password) {
      setError('Please fill all fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    register(formData.name, formData.username || formData.name, formData.mobile, formData.password, formData.referralCode);
    navigate('/');
  };

  return (
    <div className="py-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">CREATE ACCOUNT</h1>
        <p className="text-slate-500 text-xs font-medium">Join 10M+ users worldwide</p>
      </div>

      <form onSubmit={handleRegister} className="glass-panel p-6 rounded-[2rem] space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Full Name</label>
          <div className="relative">
            <UserCircle size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-slate-900/50 border border-slate-700 p-4 pl-12 rounded-xl text-white outline-none focus:border-amber-500 text-sm"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Mobile Number</label>
          <div className="relative">
            <Smartphone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="tel"
              placeholder="Mobile Number"
              value={formData.mobile}
              onChange={e => setFormData({...formData, mobile: e.target.value})}
              className="w-full bg-slate-900/50 border border-slate-700 p-4 pl-12 rounded-xl text-white outline-none focus:border-amber-500 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Password</label>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Password"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full bg-slate-900/50 border border-slate-700 p-4 rounded-xl text-white outline-none focus:border-amber-500 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Confirm</label>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Confirm"
              value={formData.confirmPassword}
              onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
              className="w-full bg-slate-900/50 border border-slate-700 p-4 rounded-xl text-white outline-none focus:border-amber-500 text-sm"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Referral Code (Optional)</label>
          <div className="relative">
            <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Referral Code"
              value={formData.referralCode}
              onChange={e => setFormData({...formData, referralCode: e.target.value})}
              className="w-full bg-slate-900/50 border border-slate-700 p-4 pl-12 rounded-xl text-amber-500 font-bold outline-none focus:border-amber-500 text-sm"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-[10px] font-bold uppercase text-center">{error}</p>}

        <button
          type="submit"
          className="w-full py-4 gold-gradient text-slate-950 font-black rounded-2xl shadow-lg active:scale-95 transition-all uppercase tracking-widest text-sm mt-4"
        >
          Create Account
        </button>

        <p className="text-center text-slate-500 text-xs pt-4">
          Already a member? <Link to="/login" className="text-amber-500 font-bold hover:underline">Sign In</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
