
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, TrendingUp } from 'lucide-react';

const names = ["Rajesh", "Amit", "Suresh", "Priya", "Rahul", "Karan", "Simran", "Neha", "Vikram", "Deepak", "Sneha", "Anil", "Sunita", "Ravi"];
const banks = ["SBI", "HDFC", "ICICI", "Axis", "PNB", "Bank of Baroda"];

const MotionDiv = motion.div as any;

const FakeWithdrawal: React.FC = () => {
  const [notification, setNotification] = useState<{name: string, amount: number, bank: string} | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const name = names[Math.floor(Math.random() * names.length)];
      const amount = Math.floor(Math.random() * 9501) + 500;
      const bank = banks[Math.floor(Math.random() * banks.length)];
      
      setNotification({ name, amount, bank });
      
      setTimeout(() => setNotification(null), 5000);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {notification && (
        <MotionDiv 
          initial={{ opacity: 0, y: 100, x: "-50%" }}
          animate={{ opacity: 1, y: -100, x: "-50%" }}
          exit={{ opacity: 0, scale: 0.9, x: "-50%" }}
          className="fixed left-1/2 bottom-12 z-[100] w-[85%] max-w-[320px] bg-white/90 backdrop-blur-xl border border-slate-100 p-4 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-sm">
              <CheckCircle2 size={24} strokeWidth={2.5} />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payout Confirmed</span>
                <span className="text-[8px] font-bold text-slate-300 uppercase">{notification.bank}</span>
              </div>
              <p className="text-sm font-black text-slate-900 truncate">
                {notification.name} <span className="text-slate-400 font-medium">withdrew</span> ₹{notification.amount}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp size={10} className="text-emerald-500" />
                <span className="text-[9px] font-black text-emerald-600 uppercase">Success Rate 100%</span>
              </div>
            </div>
          </div>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
};

export default FakeWithdrawal;
