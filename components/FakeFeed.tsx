import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark } from 'lucide-react';

const names = ["Aryan", "Saniya", "Priya", "Rahul", "Kunal", "Meera", "Vikram", "Ishan", "Zoya", "Aarav", "Tanya", "Neha"];
const bankSuffixes = ["State Bank", "HDFC", "ICICI", "Axis Bank", "PNB", "Bank of Baroda"];

// Use any cast to bypass motion.div property type checking errors
const MotionDiv = motion.div as any;

const FakeFeed: React.FC = () => {
  const [current, setCurrent] = useState<{name: string, amount: number, bank: string} | null>(null);

  useEffect(() => {
    const showRandom = () => {
      const name = names[Math.floor(Math.random() * names.length)] + "***";
      const amount = Math.floor(Math.random() * 9500) + 500;
      const bank = bankSuffixes[Math.floor(Math.random() * bankSuffixes.length)];
      
      setCurrent({ name, amount, bank });
      
      setTimeout(() => {
        setCurrent(null);
      }, 4000);
    };

    const interval = setInterval(showRandom, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-xs z-[60] pointer-events-none">
      <AnimatePresence>
        {current && (
          // Fixed: Using MotionDiv to resolve TypeScript property errors for initial/animate/exit
          <MotionDiv
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="bg-slate-900/90 backdrop-blur-md border border-amber-500/30 p-3 rounded-2xl flex items-center gap-3 shadow-2xl"
          >
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
              <Landmark size={14} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-slate-300 font-medium">
                <span className="text-white font-bold">{current.name}</span> withdrew
              </p>
              <p className="text-[11px] font-black text-amber-500">
                ₹{current.amount.toLocaleString()} <span className="text-slate-500 font-normal ml-1">to {current.bank}</span>
              </p>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FakeFeed;