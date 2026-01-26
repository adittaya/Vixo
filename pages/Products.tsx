
import React, { useState } from 'react';
import { User, Purchase, Transaction } from '../types';
import { PRODUCTS, PRIME_PRODUCT_IMAGE } from '../constants';
import { getStore, saveStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, CheckCircle2, AlertCircle } from 'lucide-react';

const MotionDiv = motion.div as any;

interface Props {
  user: User;
}

const Products: React.FC<Props> = ({ user }) => {
  const [modal, setModal] = useState<{ isOpen: boolean, product: typeof PRODUCTS[0] | null, type: 'success' | 'error' | 'confirm', message?: string }>({
    isOpen: false,
    product: null,
    type: 'confirm'
  });

  const handlePurchase = (product: typeof PRODUCTS[0]) => {
    const store = getStore();
    const updatedUsers = [...store.users];
    const updatedPurchases = [...store.purchases];
    const activeUser = updatedUsers.find(u => u.id === user.id)!;

    if (activeUser.balance < product.price) {
      setModal({ isOpen: true, product, type: 'error', message: 'Not enough balance. Please add money.' });
      return;
    }

    const thisMonth = new Date().getMonth();
    const alreadyBought = store.purchases.some(p => 
      p.userId === user.id && 
      p.productId === product.id && 
      new Date(p.purchaseDate).getMonth() === thisMonth
    );

    if (alreadyBought) {
      setModal({ isOpen: true, product, type: 'error', message: 'You can only buy this plan once per month.' });
      return;
    }

    activeUser.balance -= product.price;
    activeUser.totalInvested += product.price;

    const newPurchase: Purchase = {
      id: `purch-${Date.now()}`,
      userId: user.id,
      productId: product.id,
      productName: product.name,
      purchaseDate: new Date().toISOString(),
      dailyIncome: product.dailyIncome,
      daysRemaining: product.duration,
      totalDays: product.duration,
      status: 'active'
    };

    updatedPurchases.push(newPurchase);

    saveStore({ 
      users: updatedUsers, 
      currentUser: activeUser, 
      purchases: updatedPurchases,
      transactions: [...store.transactions, {
        id: `txn-inv-${Date.now()}`,
        userId: user.id,
        type: 'purchase',
        amount: product.price,
        status: 'approved',
        date: new Date().toISOString(),
        timestamp: Date.now()
      } as Transaction]
    });

    setModal({ isOpen: true, product, type: 'success', message: 'Success! Your daily profit starts now.' });
  };

  return (
    <div className="p-4 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black italic tracking-tighter">VIXO <span className="text-emerald-600">PLANS</span></h1>
        <p className="text-xs text-gray-400">Easy daily earning packages</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {PRODUCTS.map((p, i) => (
          <MotionDiv 
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden group shadow-sm hover:shadow-xl transition-all"
          >
            <div className="flex">
              <div className="w-1/3 p-4 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                <img src={PRIME_PRODUCT_IMAGE} alt={p.name} className="h-32 object-contain relative z-10 group-hover:scale-110 transition-transform" />
              </div>
              <div className="w-2/3 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{p.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">PROFIT ₹{p.profit}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 mt-4">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Cost</p>
                    <p className="text-sm font-bold">₹{p.price}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Daily</p>
                    <p className="text-sm font-bold text-emerald-500">₹{p.dailyIncome}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Time</p>
                    <p className="text-sm font-bold">{p.duration} Days</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Total</p>
                    <p className="text-sm font-bold text-blue-500">₹{p.totalReturn}</p>
                  </div>
                </div>

                <button 
                  onClick={() => handlePurchase(p)}
                  className="mt-4 w-full vixo-bg text-white py-3 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={14} />
                  GET IT NOW
                </button>
              </div>
            </div>
          </MotionDiv>
        ))}
      </div>

      <AnimatePresence>
        {modal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <MotionDiv 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2rem] p-8 w-full max-sm shadow-2xl text-center"
            >
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 ${modal.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'} rounded-full flex items-center justify-center mb-4`}>
                  {modal.type === 'success' ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
                </div>
                <h3 className="text-xl font-bold mb-2">{modal.type === 'success' ? 'Success!' : 'Error'}</h3>
              </div>
              
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">{modal.message}</p>
              
              <button 
                onClick={() => setModal({ ...modal, isOpen: false })}
                className="w-full vixo-bg text-white py-4 rounded-2xl font-bold"
              >
                Close
              </button>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;
