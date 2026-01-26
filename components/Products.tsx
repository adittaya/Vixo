import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PRODUCTS } from '../constants';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Use any cast to bypass motion.div property type checking errors
const MotionDiv = motion.div as any;

interface Props {
  inline?: boolean;
}

interface ProductCardProps {
  plan: any;
  index: number;
  owned: number;
  handleBuy: (id: number) => void;
}

// Fixed: Moved ProductCard outside of the main component to prevent unnecessary remounts and fix the "key" prop type error.
const ProductCard: React.FC<ProductCardProps> = ({ plan, index, owned, handleBuy }) => {
  const limit = plan.id === 1 ? 1 : 10; // For starter plan limit 1, others 10 as per request/screenshot logic

  return (
    // Fixed: Using MotionDiv to resolve TypeScript property errors for initial/animate/exit
    <MotionDiv
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-[2.5rem] overflow-hidden shadow-md mb-6 border border-slate-50 flex flex-col"
    >
      {/* Plan Header Image Area */}
      <div className="relative h-48 bg-slate-100 flex items-center justify-center overflow-hidden">
          <img 
              src={index % 2 === 0 
                ? "https://www.bisleri.com/images/pure-mineral-water-m.jpg" 
                : "https://www.bisleri.com/images/bisleri-pure-app-m.jpg"
              } 
              className="w-full h-full object-cover"
              alt="Product"
          />
          {index === 1 && (
              <div className="absolute top-4 left-4 bg-slate-800/80 text-white text-[9px] font-bold px-3 py-1 rounded-md uppercase">
                  COMING SOON
              </div>
          )}
      </div>

      <div className="p-6 space-y-4">
          <h3 className="text-center font-black text-[#1e293b] italic uppercase text-sm">
              BISLERI PURE PLAN {plan.id}
          </h3>

          <div className="bg-[#f8fbff] rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-tight">PRICE</span>
                  <span className="text-[#00a0e3] font-black text-sm">₹{plan.price}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-tight">DAILY</span>
                  <span className="text-[#00a884] font-black text-sm">₹{plan.dailyIncome}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-tight">LIMIT</span>
                  <span className="text-slate-700 font-bold">{owned}/{limit} Owned</span>
              </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-slate-300">
              <Clock size={12} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{plan.duration} DAYS DURATION</span>
          </div>

          <button
              disabled={owned >= limit}
              onClick={() => handleBuy(plan.id)}
              className={`w-full py-4 rounded-2xl font-black text-sm tracking-wider transition-all uppercase ${
                  owned >= limit 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-[#00a0e3] text-white shadow-lg shadow-blue-200 active:scale-95'
              }`}
          >
              {owned >= limit ? 'FULLY OWNED' : 'INVEST NOW'}
          </button>
      </div>
    </MotionDiv>
  );
};

const Products: React.FC<Props> = ({ inline }) => {
  const { buyProduct, currentUser, userProducts } = useApp();
  const [modal, setModal] = useState<{ show: boolean, success: boolean, message: string }>({
    show: false,
    success: false,
    message: ''
  });

  const handleBuy = (id: number) => {
    const result = buyProduct(id);
    setModal({
      show: true,
      success: result.success,
      message: result.message
    });
  };

  const getOwnedCount = (pid: number) => {
    return userProducts.filter(up => up.productId === pid && up.userId === currentUser?.id).length;
  };

  return (
    <div className={`space-y-2 ${inline ? '' : 'pt-6 pb-24 px-4'}`}>
      {!inline && (
        <div className="text-center mb-6">
          <h2 className="text-xl font-black text-slate-800 uppercase italic">Investment Shop</h2>
          <div className="w-12 h-1 bg-[#00a0e3] mx-auto mt-2 rounded-full"></div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        {PRODUCTS.map((plan, index) => (
          <ProductCard 
            key={plan.id} 
            plan={plan} 
            index={index} 
            owned={getOwnedCount(plan.id)}
            handleBuy={handleBuy}
          />
        ))}
      </div>

      <AnimatePresence>
        {modal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            {/* Fixed: Using MotionDiv to resolve TypeScript property errors for initial/animate/exit */}
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setModal({ ...modal, show: false })}
            />
            {/* Fixed: Using MotionDiv to resolve TypeScript property errors for initial/animate/exit */}
            <MotionDiv
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative bg-white p-8 rounded-[2.5rem] w-full max-sm text-center shadow-2xl"
            >
              <div className="flex justify-center mb-6">
                {modal.success ? (
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={48} className="text-green-500" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
                    <AlertCircle size={48} className="text-red-500" />
                  </div>
                )}
              </div>
              <h3 className={`text-xl font-black mb-2 uppercase ${modal.success ? 'text-[#00a884]' : 'text-red-500'}`}>
                {modal.success ? 'PURCHASED' : 'NOTICE'}
              </h3>
              <p className="text-slate-500 text-xs font-medium leading-relaxed mb-8">
                {modal.message}
              </p>
              <button
                onClick={() => setModal({ ...modal, show: false })}
                className="w-full py-4 bg-[#00a0e3] text-white font-bold rounded-2xl uppercase tracking-widest text-xs"
              >
                Okay
              </button>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;