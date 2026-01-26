import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UPI_ID } from '../constants';
import { Wallet, QrCode, ClipboardCheck, ArrowRight, Info, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Use any cast to bypass motion.div property type checking errors
const MotionDiv = motion.div as any;

const Recharge: React.FC = () => {
  const { addTransaction, currentUser } = useApp();
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [utr, setUtr] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) < 100) {
      setError('Minimum deposit ₹100');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = () => {
    if (utr.length < 6) {
      setError('Enter a valid 12-digit UTR/Ref No');
      return;
    }
    if (!currentUser) return;
    // Fix: Using lowercase 'recharge' and 'pending' to match TransactionType and TransactionStatus
    addTransaction(currentUser.id, 'recharge', Number(amount), 'pending', utr);
    setStep(3);
  };

  const copyUpi = () => {
    navigator.clipboard.writeText(UPI_ID);
    alert('UPI ID Copied!');
  };

  return (
    <div className="space-y-6 pt-4 pb-20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-500">
          <Wallet size={24} />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-tight">Add Funds</h2>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          // Fixed: Using MotionDiv to resolve TypeScript property errors for initial/animate/exit
          <MotionDiv
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <label className="text-xs font-bold text-slate-500 uppercase">Enter Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-500">₹</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 p-5 pl-10 rounded-2xl text-2xl font-black text-white outline-none focus:border-amber-500 transition-all"
                />
              </div>
              {error && <p className="text-red-500 text-[10px] font-bold uppercase">{error}</p>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[500, 1000, 2000, 5000, 10000, 20000].map(val => (
                <button
                  key={val}
                  onClick={() => setAmount(val.toString())}
                  className="py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:border-amber-500 transition-all"
                >
                  +₹{val}
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              className="w-full py-4 gold-gradient text-slate-900 font-black rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest text-sm shadow-xl shadow-amber-500/10"
            >
              Pay Now <ArrowRight size={18} />
            </button>
          </MotionDiv>
        )}

        {step === 2 && (
          // Fixed: Using MotionDiv to resolve TypeScript property errors for initial/animate/exit
          <MotionDiv
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="glass-panel p-6 rounded-3xl text-center space-y-6">
              <div className="space-y-1">
                <p className="text-xs text-slate-400 font-bold uppercase">Paying Amount</p>
                <p className="text-3xl font-black text-white">₹{amount}</p>
              </div>

              <div className="mx-auto bg-white p-4 rounded-3xl w-48 h-48 flex items-center justify-center shadow-2xl">
                {/* Simulated QR Code for Demo */}
                <QrCode size={140} className="text-slate-900" />
              </div>

              <div className="space-y-3">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Official UPI ID</p>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <span className="text-amber-500 font-bold font-mono">{UPI_ID}</span>
                  <button onClick={copyUpi} className="text-slate-400 hover:text-white">
                    <ClipboardCheck size={20} />
                  </button>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-amber-500">
                <Info size={16} />
                <p className="text-[10px] font-bold uppercase">Submit UTR to verify</p>
              </div>
              <input
                type="text"
                placeholder="12-digit UTR / Transaction ID"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 p-4 rounded-xl text-white font-mono outline-none focus:border-amber-500"
              />
              {error && <p className="text-red-500 text-[10px] font-bold uppercase">{error}</p>}
              <button
                onClick={handleSubmit}
                className="w-full py-4 gold-gradient text-slate-900 font-black rounded-2xl uppercase tracking-widest text-sm"
              >
                Submit Payment
              </button>
            </div>
          </MotionDiv>
        )}

        {step === 3 && (
          // Fixed: Using MotionDiv to resolve TypeScript property errors for initial/animate/exit
          <MotionDiv
            key="step3"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel p-10 rounded-3xl text-center space-y-6"
          >
            <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto">
              <Clock size={40} className="text-amber-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Pending Approval</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your deposit of ₹{amount} has been received. Our team will verify the UTR and credit your balance within 30-60 minutes.
              </p>
            </div>
            <button
              onClick={() => window.location.hash = '#/'}
              className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl uppercase tracking-widest text-xs"
            >
              Back to Dashboard
            </button>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Recharge;