
import React, { useState, useEffect } from 'react';
import { User, Transaction } from '../types';
import { getStore, saveStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X, CheckCircle2, Clipboard, ChevronDown, Info, QrCode, ArrowRight, Wallet, Clock, Zap } from 'lucide-react';
// @ts-ignore
import * as ReactRouterDOM from 'react-router-dom';

const { useNavigate } = ReactRouterDOM as any;
const MotionDiv = motion.div as any;

interface Props { user: User; }

const Recharge: React.FC<Props> = ({ user }) => {
  const [amount, setAmount] = useState('600');
  const [step, setStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState(600);
  const [utr, setUtr] = useState('');
  const [success, setSuccess] = useState(false);
  const [isPreApproved, setIsPreApproved] = useState(false);
  const navigate = useNavigate();

  const store = getStore();
  const { admin } = store;
  const upiId = admin.rechargeUpiId;
  const qrImage = admin.rechargeQrCode;

  const quickAmounts = [600, 1500, 3500, 8000, 18000];

  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const safeCopy = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        alert('Copied!');
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Copied!');
      } catch (copyErr) {
        console.error('Fallback copy failed', copyErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const submitUtr = () => {
    if (utr.length < 10) return alert('Please enter 12-digit UTR number');
    
    const isDuplicate = store.transactions.some(t => t.utr === utr);
    if (isDuplicate) {
      alert('Error: This UTR has already been used.');
      return;
    }

    const rechargeAmount = parseInt(amount);
    const txnId = `txn-rech-${Date.now()}`;
    const status = admin.preApprovedEnabled ? 'approved' : 'pending';

    const newTransaction: Transaction = {
      id: txnId, 
      userId: user.id, 
      type: 'recharge', 
      amount: rechargeAmount, 
      status, 
      date: new Date().toISOString(), 
      utr,
      timestamp: Date.now()
    };

    let nextUsers = [...store.users];
    if (admin.preApprovedEnabled) {
      const userIdx = nextUsers.findIndex(u => u.id === user.id);
      if (userIdx !== -1) {
        nextUsers[userIdx].balance += rechargeAmount;
      }
      setIsPreApproved(true);
    }

    saveStore({ 
      transactions: [...store.transactions, newTransaction],
      users: nextUsers
    });

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen text-center bg-white">
        <div className={`w-24 h-24 rounded-[40px] flex items-center justify-center mb-8 shadow-xl ${isPreApproved ? 'bg-amber-50 text-amber-500' : 'bg-[#00D094]/10 text-[#00D094]'}`}>
          {isPreApproved ? <Zap size={56} fill="currentColor" /> : <CheckCircle2 size={56} />}
        </div>
        <h2 className="text-3xl font-black mb-4 tracking-tighter italic uppercase">{isPreApproved ? 'INSTANT CASH' : 'CHECKING'}</h2>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-12 px-8 leading-loose">
          {isPreApproved 
            ? 'Success! Your balance is updated instantly while we verify the payment.' 
            : 'We are checking your payment. Your balance will update in a few minutes.'}
        </p>
        <button onClick={() => navigate('/home')} className="w-full vixo-bg text-white py-6 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Go Home</button>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="bg-[#f8faf9] min-h-screen flex flex-col">
        <div className="bg-white px-6 pt-16 pb-12 rounded-b-[3.5rem] shadow-sm flex flex-col items-center border-b border-gray-100 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D094] opacity-[0.03] blur-[40px] rounded-full -mr-16 -mt-16"></div>
          <button onClick={() => navigate(-1)} className="absolute left-6 top-10 p-2 bg-gray-50 rounded-xl text-gray-400 active:scale-90 transition-all"><ChevronLeft size={20}/></button>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 mb-2">Wallet</p>
          <h1 className="text-2xl font-black tracking-tight uppercase italic text-gray-900">Add Money</h1>
        </div>
        <div className="p-6 -mt-8 flex-1">
          <div className="bg-white p-8 rounded-[3rem] card-shadow border border-gray-50 space-y-10">
            <div className="grid grid-cols-3 gap-3">
              {quickAmounts.map(val => (
                <button 
                  key={val} 
                  onClick={() => setAmount(val.toString())} 
                  className={`py-4 rounded-2xl text-[11px] font-black transition-all shadow-sm border ${amount === val.toString() ? 'vixo-bg text-white border-[#00D094]' : 'bg-gray-50 text-gray-400 border-gray-100'}`}
                >
                  ₹{val}
                </button>
              ))}
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-4 mb-3">Custom Amount</p>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-900">₹</span>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  className="w-full bg-gray-50 border border-gray-100 rounded-[2rem] py-6 pl-14 pr-8 font-black text-2xl text-gray-900 outline-none focus:border-[#00D094] transition-all" 
                />
              </div>
            </div>
            <button onClick={() => setStep(2)} className="w-full vixo-bg text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] active:scale-95 transition-all shadow-xl shadow-[#00D094]/10">Continue to Pay</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8faf9] min-h-screen flex flex-col">
      <div className="vixo-bg text-white px-8 pt-16 pb-12 rounded-b-[3.5rem] shadow-xl relative">
        <div className="flex justify-between items-center mb-6">
           <button onClick={() => setStep(1)} className="p-2 bg-white/20 rounded-xl"><X size={20} /></button>
           <h2 className="text-xs font-black uppercase tracking-widest">Pay Order</h2>
           <ChevronDown size={22} className="opacity-40" />
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-2">Total to Pay</p>
          <h1 className="text-5xl font-black tracking-tighter mb-4 italic">₹{amount}</h1>
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
             <Clock size={14} />
             <p className="text-sm font-bold tracking-widest">{formatTime(timeLeft)}</p>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-8 space-y-6 pb-32 flex-grow overflow-y-auto">
         <div className="bg-white p-8 rounded-[3rem] card-shadow border border-gray-100 space-y-8">
            <div className="text-center">
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">Step 1: Scan QR Code</p>
               <div className="bg-gray-50 p-4 rounded-[2.5rem] mx-auto w-64 h-64 flex items-center justify-center border border-gray-100 shadow-inner">
                  <img src={qrImage} alt="QR Code" className="w-56 h-56 object-contain" />
               </div>
            </div>

            <div className="space-y-4">
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-4">Step 2: Or Copy UPI ID</p>
               <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 flex items-center justify-between">
                  <span className="font-mono text-sm font-black text-gray-700">{upiId}</span>
                  <button onClick={() => safeCopy(upiId)} className="p-2 vixo-green"><Clipboard size={20} /></button>
               </div>
            </div>

            <div className="bg-amber-50 p-5 rounded-3xl border border-amber-100 flex gap-4">
               <Info size={20} className="text-amber-600 shrink-0 mt-0.5" />
               <p className="text-[9px] text-amber-700 font-bold uppercase leading-relaxed tracking-widest">
                  Important: Screenshot your success message. Enter 12-digit UTR below.
               </p>
            </div>
         </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl p-6 border-t border-gray-100 max-w-md mx-auto z-[200] rounded-t-[3rem] shadow-[0_-15px_30px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-3xl border border-gray-100 shadow-inner focus-within:border-[#00D094] transition-all">
           <input 
              type="text" 
              placeholder="ENTER 12-DIGIT UTR" 
              value={utr}
              onChange={e => setUtr(e.target.value)}
              className="flex-1 bg-transparent py-4 px-6 text-sm font-black tracking-widest uppercase outline-none placeholder:text-gray-300"
           />
           <button 
             onClick={submitUtr}
             className="vixo-bg text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-[#00D094]/10"
           >
             SUBMIT
           </button>
        </div>
      </div>
    </div>
  );
};

export default Recharge;
