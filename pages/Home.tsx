
import React, { useState, useEffect } from 'react';
import { User, Purchase, Product, Transaction } from '../types';
import { getStore, saveStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  CheckCircle2, 
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Headphones,
  Users,
  X,
  Megaphone,
  TrendingUp,
  Cpu,
  Send,
  ArrowRightCircle,
  Share2,
  Gift,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { LOGO_IMAGE } from '../constants';
// @ts-ignore
import * as ReactRouterDOM from 'react-router-dom';

const { Link, useNavigate } = ReactRouterDOM as any;
const MotionDiv = motion.div as any;

interface Props { user: User; }

const Home: React.FC<Props> = ({ user }) => {
  const [storeData, setStoreData] = useState(getStore());
  const [activeTab, setActiveTab] = useState<'leasing' | 'high_tech'>('leasing');
  const [showNotice, setShowNotice] = useState(false);
  const [modal, setModal] = useState<{ isOpen: boolean, product: any | null, type: 'success' | 'error', message?: string }>({
    isOpen: false, product: null, type: 'success'
  });
  const navigate = useNavigate();

  const refreshState = () => setStoreData(getStore());

  useEffect(() => {
    refreshState();
    window.addEventListener('store-update', refreshState);
    const store = getStore();
    if (store.admin.popupEnabled) {
      setShowNotice(true);
    }
    return () => window.removeEventListener('store-update', refreshState);
  }, []);

  const getProductQuota = (productId: number) => {
    return storeData.purchases.filter(p => p.userId === user.id && p.productId === productId && p.status === 'active').length;
  };

  const handleLease = (product: Product) => {
    const store = getStore();
    const { admin } = store;

    if (user.status === 'frozen') {
      setModal({ isOpen: true, product: null, type: 'error', message: 'Your account is locked. Please contact support.' });
      return;
    }
    
    if (admin.purchasesLocked) {
      setModal({ isOpen: true, product, type: 'error', message: 'The shop is temporarily closed. Please check back later.' });
      return;
    }

    if (product.systemStatus === 'soon') {
      setModal({ isOpen: true, product, type: 'error', message: 'This plan is starting soon!' });
      return;
    }

    const currentOwned = getProductQuota(product.id);
    if (currentOwned >= (product.userLimit || 3)) {
      setModal({ isOpen: true, product, type: 'error', message: `You have reached the limit for this plan.` });
      return;
    }

    const updatedUsers = [...store.users];
    const userIdx = updatedUsers.findIndex(u => u.id === user.id);
    if (userIdx === -1) return;
    
    const activeUser = { ...updatedUsers[userIdx] };

    if (activeUser.balance < product.price) {
      setModal({ isOpen: true, product, type: 'error', message: 'Not enough money. Please add funds to your wallet.' });
      return;
    }

    const lastRecharge = [...store.transactions]
      .reverse()
      .find(t => t.userId === user.id && t.type === 'recharge' && t.status === 'approved');

    activeUser.balance -= product.price;
    activeUser.totalInvested += product.price;
    updatedUsers[userIdx] = activeUser;

    const purchaseId = `p-${Date.now()}`;
    const newPurchase: Purchase = {
      id: purchaseId,
      userId: user.id,
      productId: product.id,
      productName: product.name,
      purchaseDate: new Date().toISOString(),
      dailyIncome: product.dailyIncome,
      daysRemaining: product.duration,
      totalDays: product.duration,
      status: 'active',
      fundedByTxnId: lastRecharge?.id 
    };

    const newTransactions = [...store.transactions, {
      id: `t-${Date.now()}`, 
      userId: user.id, 
      type: 'purchase', 
      amount: product.price, 
      status: 'approved', 
      date: new Date().toISOString(),
      timestamp: Date.now()
    } as Transaction];

    const commissions = [
      { pct: admin.commissionL1 },
      { pct: admin.commissionL2 },
      { pct: admin.commissionL3 }
    ];

    let currentRef = user.referredBy;
    for (let i = 0; i < 3; i++) {
      if (!currentRef) break;
      const uplineIdx = updatedUsers.findIndex(u => u.referralCode === currentRef);
      if (uplineIdx !== -1) {
        const commAmount = (product.price * commissions[i].pct) / 100;
        updatedUsers[uplineIdx].withdrawableBalance += commAmount;
        newTransactions.push({
          id: `comm-${purchaseId}-${i}`,
          userId: updatedUsers[uplineIdx].id,
          type: 'commission',
          amount: commAmount,
          status: 'approved',
          date: new Date().toISOString(),
          timestamp: Date.now(),
          level: i + 1,
          sourcePurchaseId: purchaseId 
        });
        currentRef = updatedUsers[uplineIdx].referredBy;
      } else break;
    }

    saveStore({ 
      users: updatedUsers, 
      currentUser: updatedUsers[userIdx], 
      purchases: [...store.purchases, newPurchase],
      transactions: newTransactions
    });

    setModal({ 
      isOpen: true, 
      product, 
      type: 'success', 
      message: `Plan Activated! You will get ₹${product.dailyIncome} every day.` 
    });
  };

  const { admin } = storeData;
  const filteredProducts = (admin.customProducts || []).filter(p => p.category === activeTab && p.systemStatus !== 'hidden');

  const actionItems = [
    { to: "/recharge", icon: ArrowDown, label: 'Add Money', color: 'bg-emerald-50 text-emerald-500' },
    { to: "/withdraw", icon: ArrowUp, label: 'Withdraw', color: 'bg-amber-50 text-amber-500' },
    { to: "/support", icon: Headphones, label: 'Support', color: 'bg-blue-50 text-blue-500' },
    { to: admin.branding.telegramUrl || "https://t.me/", icon: Send, label: 'Telegram', color: 'bg-indigo-50 text-indigo-500', isExternal: true }
  ];

  const isUserFrozen = user.status === 'frozen';

  return (
    <div className="bg-[#f8faf9] min-h-screen pb-32">
      <AnimatePresence>
        {showNotice && (
          <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
             <MotionDiv initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-[340px] rounded-[32px] shadow-2xl relative">
                <button 
                  onClick={() => setShowNotice(false)} 
                  className="absolute -top-3 -right-3 w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg z-[1001]"
                >
                  <X size={24} strokeWidth={3} />
                </button>

                <div className="p-8 flex flex-col items-center text-center">
                   <div className="flex items-center gap-2 mb-6">
                      <span className="text-2xl">📣</span>
                      <h3 className="text-xl font-bold text-gray-800">{admin.popupSubject || 'Latest News'}</h3>
                      <span className="text-2xl">📣</span>
                   </div>

                   <div className="space-y-1 mb-8">
                      <div className="flex items-center justify-center gap-1">
                         <span className="text-xl">🎁</span>
                         <h4 className="text-lg font-extrabold text-gray-800 tracking-tight">Reward Bonus</h4>
                         <span className="text-xl">🎁</span>
                      </div>
                      <p className="text-[13px] font-bold text-[#1e40af]">{admin.popupAwardLine1}</p>
                      <p className="text-[13px] font-bold text-[#1e40af]">{admin.popupAwardLine2}</p>
                   </div>

                   <div className="space-y-2 mb-8 w-full">
                      <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#1e40af]">
                         <span>✅</span>
                         <span>Min Recharge: {admin.popupMinRecharge}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#1e40af]">
                         <span>✅</span>
                         <span>Min Withdraw: {admin.popupMinWithdrawal}</span>
                      </div>
                   </div>

                   <div className="space-y-1 mb-6">
                      <div className="flex items-center justify-center gap-1">
                         <span className="text-xl">🔥</span>
                         <h4 className="text-[15px] font-extrabold text-[#f97316]">Invite & Earn</h4>
                         <span className="text-xl">🔥</span>
                      </div>
                      <div className="text-sm font-bold text-[#1e40af] space-y-0.5">
                         <p>Level 1---{admin.commissionL1}%</p>
                         <p>Level 2---{admin.commissionL2}%</p>
                         <p>Level 3---{admin.commissionL3}%</p>
                      </div>
                   </div>

                   <p className="text-base font-black text-[#1e40af] mb-8">{admin.popupText || 'Welcome to VIXO!'}</p>

                   <a 
                    href={admin.branding.telegramUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full bg-[#0d47a1] text-white py-4 rounded-[2rem] font-bold flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
                   >
                     <Send size={22} className="fill-white" />
                     <span>{admin.popupChannelBtnText || 'Join Our Telegram'}</span>
                   </a>
                </div>
             </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      <header className="bg-white px-6 py-4 flex justify-between items-center sticky top-0 z-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center overflow-hidden">
             <img src={LOGO_IMAGE} className="w-full h-full object-contain" alt="VIXO" />
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tighter">VIXO</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/support" className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:vixo-green transition-colors"><Headphones size={20} /></Link>
          <Link to="/community" className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:vixo-green transition-colors"><Users size={20} /></Link>
        </div>
      </header>

      {/* Account Freeze Banner */}
      {isUserFrozen && (
        <MotionDiv 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="mx-6 mt-6 p-4 bg-red-600 rounded-3xl shadow-xl flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white shrink-0">
            <ShieldAlert size={20} strokeWidth={3} />
          </div>
          <div className="text-white">
            <p className="text-[10px] font-black uppercase tracking-widest">Account Locked</p>
            <p className="text-[8px] font-bold uppercase opacity-80 mt-0.5">Please contact customer support for help.</p>
          </div>
        </MotionDiv>
      )}

      <div className="p-6">
        <div className="vixo-gradient rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
           <div className="relative z-10">
              <span className="bg-white/20 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-md">VIXO Easy Earning</span>
              <h2 className="text-3xl font-black mt-4 leading-tight">Increase your<br/>daily income</h2>
              <p className="text-white/70 text-sm mt-2 max-w-[200px]">Get daily money from our verified plans.</p>
           </div>
           <Cpu size={120} className="absolute -right-8 -bottom-8 text-white/10 rotate-12" />
        </div>
      </div>

      <div className="px-6 grid grid-cols-4 gap-3">
        {actionItems.map((item, i) => {
          const itemContent = (
            <>
              <div className={`w-full aspect-square rounded-2xl ${item.color} flex items-center justify-center shadow-sm group-active:scale-90 transition-transform`}>
                <item.icon size={22} />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">{item.label}</span>
            </>
          );
          if (item.isExternal) {
            return <a key={i} href={item.to} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group cursor-pointer">{itemContent}</a>;
          }
          return <Link key={i} to={item.to} className="flex flex-col items-center gap-2 group">{itemContent}</Link>;
        })}
      </div>

      <div className="px-6 py-4">
         <button 
           onClick={() => navigate('/share')}
           className="w-full bg-[#E4FF7D] p-5 rounded-[2rem] flex items-center justify-between shadow-xl shadow-lime-200/40 group active:scale-[0.98] transition-all border border-white/50"
         >
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm">
                  <Gift size={28} strokeWidth={2.5} />
               </div>
               <div className="text-left">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Invite & Earn Money</h4>
                  <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest mt-1">Get up to {admin.commissionL1}% bonus today</p>
               </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-lg border-2 border-white/20">
               <Share2 size={20} strokeWidth={3} />
            </div>
         </button>
      </div>

      <div className="p-6 pt-2">
        <div className="bg-white p-1 rounded-2xl border border-gray-100 flex shadow-sm">
           <button onClick={() => setActiveTab('leasing')} className={`flex-1 py-3 text-xs font-bold uppercase rounded-xl transition-all ${activeTab === 'leasing' ? 'vixo-bg text-white shadow-md' : 'text-gray-400'}`}>Standard Plans</button>
           <button onClick={() => setActiveTab('high_tech')} className={`flex-1 py-3 text-xs font-bold uppercase rounded-xl transition-all ${activeTab === 'high_tech' ? 'vixo-bg text-white shadow-md' : 'text-gray-400'}`}>VVIP Plans</button>
        </div>
      </div>

      <div className="px-6 space-y-6 pb-20">
        {filteredProducts.map((p) => {
          const owned = getProductQuota(p.id);
          const limit = p.userLimit || 3;
          const isQuoFull = owned >= limit;
          const isSoon = p.systemStatus === 'soon';
          const isSoldOut = (p.slotsTaken || 0) >= (p.totalSlots || 999);

          return (
            <MotionDiv key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`bg-white rounded-[2rem] overflow-hidden border border-gray-100 card-shadow group ${isSoon || isSoldOut ? 'opacity-60' : ''}`}>
              <div className="relative h-48 bg-gray-50 flex items-center justify-center">
                 <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={p.name} />
                 <div className="absolute top-4 right-4 bg-black/60 text-white text-[9px] font-bold px-3 py-1.5 rounded-full backdrop-blur-md">Owned: {owned}/{limit}</div>
                 {(isSoon || isSoldOut) && (
                   <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-gray-900 text-white text-[10px] font-bold px-4 py-2 rounded-xl uppercase tracking-widest shadow-xl">{isSoon ? 'Starting Soon' : 'Sold Out'}</span>
                   </div>
                 )}
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-gray-900 text-lg font-bold tracking-tight">{p.name}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md font-bold uppercase">Daily Profit</span>
                    <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold uppercase">Safe & Trusted</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                   <div className="text-center p-3 bg-gray-50 rounded-xl"><p className="text-[8px] text-gray-400 font-bold uppercase mb-1">Price</p><p className="text-xs font-black text-gray-900">₹{p.price}</p></div>
                   <div className="text-center p-3 bg-gray-50 rounded-xl"><p className="text-[8px] text-gray-400 font-bold uppercase mb-1">Daily</p><p className="text-xs font-black vixo-green">₹{p.dailyIncome}</p></div>
                   <div className="text-center p-3 bg-gray-50 rounded-xl"><p className="text-[8px] text-gray-400 font-bold uppercase mb-1">Days</p><p className="text-xs font-black text-gray-900">{p.duration}d</p></div>
                </div>
                <button disabled={isQuoFull || isSoon || isSoldOut || isUserFrozen} onClick={() => handleLease(p)} className={`w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${isQuoFull || isSoon || isSoldOut || isUserFrozen ? 'bg-gray-100 text-gray-400' : 'vixo-bg text-white shadow-lg'}`}>
                  <ShoppingCart size={18} />
                  {isSoon ? 'WAITING' : isSoldOut ? 'SOLD OUT' : isQuoFull ? 'LIMIT REACHED' : isUserFrozen ? 'ACCOUNT LOCKED' : 'BUY NOW'}
                </button>
              </div>
            </MotionDiv>
          );
        })}
      </div>

      <AnimatePresence>
        {modal.isOpen && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-8">
            <MotionDiv initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[2.5rem] p-10 w-full max-sm text-center shadow-2xl">
              <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6 ${modal.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                {modal.type === 'success' ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">{modal.type === 'success' ? 'Success' : 'Error'}</h4>
              <p className="text-gray-500 text-sm mb-10 leading-relaxed">{modal.message}</p>
              <button onClick={() => setModal({ ...modal, isOpen: false })} className="w-full vixo-bg text-white py-4 rounded-2xl font-bold text-sm shadow-lg">Close</button>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
