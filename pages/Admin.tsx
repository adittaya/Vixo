
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Transaction, Purchase, AdminSettings, Product, AuditLog, CommunityPost, SupportMessage } from '../types';
import { getStore, saveStore, manualProcessIncome, DistributionStats, performHardReversal, getReversalImpact } from '../store';
import {
  Shield, Check, X, User as UserIcon, Wallet,
  Settings, Users, CreditCard, Activity, Search,
  Zap, Power, Edit3, Trash2, Star,
  Copy, Plus, Minus, Upload, Clock, Bell, Info, ChevronLeft, ArrowRight, ShieldCheck,
  AlertTriangle, Filter, LayoutDashboard, Palette, Lock, Eye, EyeOff, ImageIcon,
  KeyRound, ShieldAlert, LogOut, RefreshCw, TrendingUp, Network, ArrowLeft, ArrowDownCircle, ArrowUpCircle,
  Coins, Megaphone, Link as LinkIcon, BarChart3, History, MessageSquare,
  QrCode, ChevronRight, Headphones, Send, Camera, Cpu, CheckCircle2, RotateCcw, Snowflake,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminCustomerCare from '../components/AdminCustomerCare';
import AdminAgent from '../components/admin/AdminAgent';

const MotionDiv = motion.div as any;

const Admin: React.FC = () => {
  const [data, setData] = useState<{
    users: User[],
    transactions: Transaction[],
    purchases: Purchase[],
    admin: AdminSettings,
    logs: AuditLog[],
    communityPosts: CommunityPost[],
    supportMessages: SupportMessage[]
  }>({ 
    users: [], 
    transactions: [], 
    purchases: [], 
    admin: { 
      lastIncomeRun: '', 
      rechargeUpiId: '',
      rechargeQrCode: '',
      popupSubject: '',
      popupText: '',
      popupAwardLine1: '',
      popupAwardLine2: '',
      popupMinRecharge: '',
      popupMinWithdrawal: '',
      popupReferralL1: '',
      popupReferralL2: '',
      popupReferralL3: '',
      popupChannelBtnText: '',
      popupEnabled: false,
      automaticIncomeEnabled: false,
      automaticIncomeTime: '00:00',
      preApprovedEnabled: false,
      branding: { 
        siteName: '', 
        primaryColor: '', 
        logo: '', 
        hero: '', 
        supportUrl: '', 
        telegramUrl: '',
        popupBtnLink: ''
      } 
    } as any, 
    logs: [],
    communityPosts: [],
    supportMessages: []
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'payments' | 'products' | 'branding' | 'community' | 'support' | 'settings' | 'broadcast'>('dashboard');
  const [paymentSubTab, setPaymentSubTab] = useState<'recharge' | 'withdraw'>('recharge');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'frozen'>('pending');
  const [communityFilter, setCommunityFilter] = useState<'all' | 'pending'>('pending');
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [distResult, setDistResult] = useState<DistributionStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAdminCustomerCareOpen, setIsAdminCustomerCareOpen] = useState(false);
  const [isAiAgentOpen, setIsAiAgentOpen] = useState(false);

  const [securityTargetUser, setSecurityTargetUser] = useState<User | null>(null);
  const [editingSecurityField, setEditingSecurityField] = useState<'password' | 'pin' | 'fund' | 'manual_deduct' | null>(null);
  const [tempSecurityVal, setTempSecurityVal] = useState('');
  
  // Reversal Console State
  const [reversalTarget, setReversalTarget] = useState<{ txn: Transaction, impact: any } | null>(null);

  // Support States
  const [activeSupportUserId, setActiveSupportUserId] = useState<string | null>(null);
  const [supportInput, setSupportInput] = useState('');
  const supportScrollRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    const store = getStore();
    setData(store as any);
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (supportScrollRef.current) {
      supportScrollRef.current.scrollTop = supportScrollRef.current.scrollHeight;
    }
  }, [data.supportMessages, activeSupportUserId]);

  const appStats = useMemo(() => {
    const approvedTxns = data.transactions.filter(t => t.status === 'approved');
    const totalRecharge = approvedTxns.filter(t => t.type === 'recharge').reduce((s, t) => s + t.amount, 0);
    const totalWithdraw = approvedTxns.filter(t => t.type === 'withdraw').reduce((s, t) => s + t.amount, 0);
    const totalPurchase = approvedTxns.filter(t => t.type === 'purchase').reduce((s, t) => s + t.amount, 0);
    
    return { 
      totalRecharge, 
      totalWithdraw, 
      totalPurchase, 
      netFlow: totalRecharge - totalWithdraw 
    };
  }, [data.transactions]);

  const initiateReversal = (txn: Transaction) => {
    const impact = getReversalImpact(txn.id);
    setReversalTarget({ txn, impact });
  };

  const handleAction = async (txnId: string, status: 'approved' | 'rejected') => {
    if (isProcessing) return;
    
    const store = getStore();
    const txn = store.transactions.find(t => t.id === txnId);
    if (!txn) return;

    // Hard Reversal Path (Recharging already approved transaction to rejection)
    if (status === 'rejected' && txn.status === 'approved' && txn.type === 'recharge') {
      initiateReversal(txn);
      return;
    }

    // Standard Approval/Rejection Path
    setIsProcessing(true);
    try {
      let nextTransactions = [...store.transactions];
      let nextUsers = [...store.users];
      
      const tIdx = nextTransactions.findIndex(t => t.id === txnId);
      if (tIdx === -1) throw new Error("Transaction not found");
      
      // Update transaction status
      nextTransactions[tIdx] = { ...nextTransactions[tIdx], status };

      const uIdx = nextUsers.findIndex(u => u.id === txn.userId);
      if (uIdx !== -1) {
        const user = nextUsers[uIdx];
        
        // Handle Recharge Approval: Credit current balance
        if (status === 'approved' && txn.type === 'recharge' && txn.status !== 'approved') {
          user.balance = (user.balance || 0) + txn.amount;
        }
        
        // Handle Withdrawal Rejection: Return funds to withdrawable balance
        if (status === 'rejected' && txn.type === 'withdraw' && txn.status === 'pending') {
          user.withdrawableBalance = (user.withdrawableBalance || 0) + txn.amount;
        }
      }

      // Create Audit Log
      const newLog: AuditLog = {
        id: `log-${Date.now()}`,
        action: status === 'approved' ? 'TXN_APPROVE' : 'TXN_REJECT',
        details: `Txn ${txnId} for ₹${txn.amount} - Operator: ${txn.userId}`,
        timestamp: new Date().toISOString(),
        adminId: 'ADMIN_MASTER'
      };

      // Atomic update of state to prevent race conditions
      await saveStore({ 
        transactions: nextTransactions, 
        users: nextUsers,
        logs: [newLog, ...store.logs].slice(0, 100)
      });
      
      refresh();
    } catch (err) {
      console.error("Action Error:", err);
      alert("System processing failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteReversal = async () => {
    if (!reversalTarget || isProcessing) return;
    
    setIsProcessing(true);
    try {
      await performHardReversal(reversalTarget.txn.id, 'ADMIN_MASTER');
      alert("Asset Nullification Protocol complete. Fraud correction applied and user frozen.");
      setReversalTarget(null);
      refresh();
    } catch (err) {
      console.error("Reversal Error:", err);
      alert("Error executing reversal protocol.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommunityAction = async (postId: string, status: 'approved' | 'rejected') => {
    const store = getStore();
    let updatedPosts: CommunityPost[];
    if (status === 'rejected') {
      updatedPosts = (store.communityPosts || []).filter(p => p.id !== postId);
    } else {
      updatedPosts = (store.communityPosts || []).map(p => p.id === postId ? { ...p, status: 'approved' } : p);
    }

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'COMMUNITY_MOD',
      details: `Post ${postId} ${status}`,
      timestamp: new Date().toISOString(),
      adminId: 'ADMIN_MASTER'
    };

    await saveStore({ 
      communityPosts: updatedPosts,
      logs: [log, ...store.logs].slice(0, 100)
    });
    refresh();
  };

  const sendSupportReply = async () => {
    if (!activeSupportUserId || !supportInput.trim()) return;
    const store = getStore();
    const newMessage: SupportMessage = {
      id: `admin-msg-${Date.now()}`,
      userId: activeSupportUserId,
      sender: 'admin',
      text: supportInput,
      timestamp: Date.now()
    };
    await saveStore({ supportMessages: [...(store.supportMessages || []), newMessage] });
    setSupportInput('');
    refresh();
  };

  const updateAdminField = async (key: keyof AdminSettings, val: any) => {
    const store = getStore();
    await saveStore({ admin: { ...store.admin, [key]: val } });
    refresh();
  };

  const updateUserSecurity = async (userId: string, updates: Partial<User>, actionLabel: string) => {
    const store = getStore();
    const updatedUsers = store.users.map(u => u.id === userId ? { ...u, ...updates } : u);
    
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'USER_SECURITY',
      details: `${actionLabel} for user ${userId}`,
      timestamp: new Date().toISOString(),
      adminId: 'ADMIN_MASTER'
    };

    await saveStore({ users: updatedUsers, logs: [log, ...store.logs].slice(0, 100) });
    if (securityTargetUser && securityTargetUser.id === userId) {
      setSecurityTargetUser({ ...securityTargetUser, ...updates });
    }
    refresh();
  };

  const manualWalletAction = async (target: 'current' | 'withdrawal' | 'deduct_current' | 'deduct_withdraw', amount: number) => {
    if (!securityTargetUser || isNaN(amount) || amount <= 0) return;
    const store = getStore();
    const updatedUsers = store.users.map(u => {
      if (u.id === securityTargetUser.id) {
        if (target === 'current') return { ...u, balance: (u.balance || 0) + amount };
        if (target === 'deduct_current') return { ...u, balance: (u.balance || 0) - amount };
        if (target === 'withdrawal') return { ...u, withdrawableBalance: (u.withdrawableBalance || 0) + amount };
        if (target === 'deduct_withdraw') return { ...u, withdrawableBalance: (u.withdrawableBalance || 0) - amount };
      }
      return u;
    });

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'MANUAL_CORRECTION',
      details: `₹${amount} correction to ${target} for ${securityTargetUser.mobile}`,
      timestamp: new Date().toISOString(),
      adminId: 'ADMIN_MASTER'
    };

    await saveStore({ users: updatedUsers, logs: [log, ...store.logs].slice(0, 100) });
    setEditingSecurityField(null);
    setSecurityTargetUser(null);
    setTempSecurityVal('');
    refresh();
  };

  const updateBranding = async (key: keyof AdminSettings['branding'], val: string) => {
    const store = getStore();
    await saveStore({ admin: { ...store.admin, branding: { ...store.admin.branding, [key]: val } } });
    refresh();
  };

  const handleBrandingImageUpload = (type: 'logo' | 'hero' | 'qr', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'qr') updateAdminField('rechargeQrCode', reader.result as string);
        else updateBranding(type as 'logo' | 'hero', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;
    const store = getStore();
    const totalReturn = editingProduct.dailyIncome * editingProduct.duration;
    const profit = totalReturn - editingProduct.price;
    const productToSave = { ...editingProduct, totalReturn, profit };
    let nextProducts = [...store.admin.customProducts];
    const idx = nextProducts.findIndex(p => p.id === productToSave.id);
    if (idx !== -1) nextProducts[idx] = productToSave;
    else nextProducts.push({ ...productToSave, id: Date.now() });
    await saveStore({ admin: { ...store.admin, customProducts: nextProducts } });
    setEditingProduct(null);
    refresh();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProduct) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingProduct({ ...editingProduct, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredUsers = useMemo(() => {
    return data.users.filter(u => u.mobile.includes(search) || u.name.toLowerCase().includes(search.toLowerCase()));
  }, [data.users, search]);

  const filteredPayments = useMemo(() => {
    let txns = data.transactions.filter(t => t.type === paymentSubTab);
    if (paymentFilter === 'pending') txns = txns.filter(t => t.status === 'pending');
    if (paymentFilter === 'approved') txns = txns.filter(t => t.status === 'approved');
    if (paymentFilter === 'frozen') {
      const frozenUserIds = data.users.filter(u => u.status === 'frozen').map(u => u.id);
      txns = txns.filter(t => frozenUserIds.includes(t.userId));
    }
    if (search) txns = txns.filter(t => {
      const user = data.users.find(u => u.id === t.userId);
      return user?.mobile.includes(search) || t.utr?.includes(search);
    });
    return txns.sort((a,b) => b.timestamp - a.timestamp);
  }, [data.transactions, data.users, paymentSubTab, paymentFilter, search]);

  const supportUsers = useMemo(() => {
    const userMessages = data.supportMessages || [];
    const userIds = Array.from(new Set(userMessages.map(m => m.userId)));
    return userIds.map(id => {
      const user = data.users.find(u => u.id === id);
      const lastMsg = [...userMessages].filter(m => m.userId === id).sort((a,b) => b.timestamp - a.timestamp)[0];
      return { user, lastMsg };
    }).filter(x => x.user) as { user: User, lastMsg: SupportMessage }[];
  }, [data.supportMessages, data.users]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 pb-32">
      {/* Header */}
      <div className="bg-[#111] p-8 border-b border-white/5 flex justify-between items-center sticky top-0 z-[100] shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#E31837] rounded-2xl flex items-center justify-center">
            <Shield size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-black text-xl italic uppercase tracking-tighter leading-none">V5 <span className="text-[#E31837]">PRIME</span></h1>
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.5em] mt-1">Authorized Access</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsAdminCustomerCareOpen(true)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/80 text-[10px] font-black uppercase hover:bg-white/10 transition-colors"
          >
            AI Assistant
          </button>
          <button
            onClick={() => setIsAiAgentOpen(true)}
            className="px-4 py-2.5 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-300 text-[10px] font-black uppercase hover:bg-blue-500/30 transition-colors flex items-center gap-1"
          >
            <Brain size={12} /> Dev Agent
          </button>
          <button onClick={() => window.location.hash = '/home'} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/40 text-[10px] font-black uppercase">Terminate</button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex bg-[#111] overflow-x-auto no-scrollbar px-6 gap-3 py-6 shadow-xl border-b border-white/5">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Control' },
          { id: 'users', icon: Users, label: 'Fleet' },
          { id: 'payments', icon: CreditCard, label: 'Ledger' },
          { id: 'support', icon: Headphones, label: 'Support' },
          { id: 'community', icon: MessageSquare, label: 'Feed' },
          { id: 'products', icon: Star, label: 'Models' },
          { id: 'branding', icon: Palette, label: 'UI' },
          { id: 'broadcast', icon: Send, label: 'Broadcast' },
          { id: 'settings', icon: Settings, label: 'Sync' }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center gap-3 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all shrink-0 rounded-2xl border ${activeTab === tab.id ? 'bg-[#E31837] text-white border-[#E31837] shadow-xl shadow-red-900/20' : 'text-gray-500 border-white/5 hover:border-white/20'}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 max-w-xl mx-auto space-y-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="bg-[#111] p-10 rounded-[48px] border border-white/5 space-y-8 shadow-2xl relative">
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-black/40 p-6 rounded-[32px] border border-white/5">
                        <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Recharges</p>
                        <p className="text-xl font-black text-emerald-500 italic">₹{appStats.totalRecharge.toLocaleString()}</p>
                    </div>
                    <div className="bg-black/40 p-6 rounded-[32px] border border-white/5">
                        <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Withdraws</p>
                        <p className="text-xl font-black text-red-500 italic">₹{appStats.totalWithdraw.toLocaleString()}</p>
                    </div>
                    <div className="bg-black/40 p-6 rounded-[32px] border border-white/5">
                        <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Asset Sales</p>
                        <p className="text-xl font-black text-blue-500 italic">₹{appStats.totalPurchase.toLocaleString()}</p>
                    </div>
                    <div className="bg-black/40 p-6 rounded-[32px] border border-white/5">
                        <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Net Flow</p>
                        <p className={`text-xl font-black italic ${appStats.netFlow >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>₹{appStats.netFlow.toLocaleString()}</p>
                    </div>
                </div>
            </div>
            <button 
              disabled={isProcessing}
              onClick={async () => {
                setIsProcessing(true);
                const res = await manualProcessIncome();
                setDistResult(res);
                setIsProcessing(false);
              }} 
              className="w-full bg-[#E31837] text-white py-6 rounded-[32px] font-black uppercase italic tracking-widest shadow-xl shadow-red-900/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isProcessing ? 'PROCESSING...' : 'FORCE DAILY PROFIT ENGINE'}
            </button>
            <div className="space-y-4">
              <h3 className="text-white font-black text-xs uppercase tracking-widest ml-4">Audit Logs</h3>
              <div className="bg-[#111] rounded-[40px] border border-white/5 divide-y divide-white/5 overflow-hidden">
                {data.logs.slice(0, 10).map(log => (
                  <div key={log.id} className="p-6 flex items-start gap-4">
                    <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-gray-500 shrink-0"><Clock size={16} /></div>
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-tight">{log.action}</p>
                      <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">{log.details}</p>
                      <p className="text-[8px] text-gray-600 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Fleet Tab (Users) */}
        {activeTab === 'users' && (
           <div className="space-y-6">
             <div className="relative">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
               <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Fleet ID..." className="w-full bg-[#111] border border-white/5 rounded-3xl py-6 pl-16 pr-8 text-sm font-bold text-white outline-none focus:border-[#E31837]" />
             </div>
             <div className="space-y-4">
               {filteredUsers.map(user => (
                 <div key={user.id} className="bg-[#111] p-6 rounded-[36px] border border-white/5 flex items-center justify-between hover:border-white/10 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 relative">
                        <UserIcon size={24}/>
                        {user.status === 'frozen' && <div className="absolute -top-1 -right-1 bg-amber-500 p-1 rounded-full text-white shadow-lg"><Snowflake size={10} strokeWidth={4} /></div>}
                        {user.status === 'banned' && <div className="absolute -top-1 -right-1 bg-red-600 p-1 rounded-full text-white shadow-lg"><Lock size={10} strokeWidth={4} /></div>}
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{user.mobile}</p>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">UID: {user.referralCode} • VIP {user.vipLevel}</p>
                      </div>
                    </div>
                    <button onClick={() => setSecurityTargetUser(user)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all shadow-lg"><Settings size={18}/></button>
                 </div>
               ))}
             </div>
           </div>
        )}

        {/* Ledger Tab (Payments) */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="flex bg-[#111] p-1.5 rounded-2xl border border-white/5">
              <button onClick={() => setPaymentSubTab('recharge')} className={`flex-1 py-4 text-[10px] font-black uppercase rounded-xl transition-all ${paymentSubTab === 'recharge' ? 'bg-[#E31837] text-white shadow-lg' : 'text-gray-500'}`}>Recharges</button>
              <button onClick={() => setPaymentSubTab('withdraw')} className={`flex-1 py-4 text-[10px] font-black uppercase rounded-xl transition-all ${paymentSubTab === 'withdraw' ? 'bg-[#E31837] text-white shadow-lg' : 'text-gray-500'}`}>Withdrawals</button>
            </div>
            <div className="flex gap-4 px-2 overflow-x-auto no-scrollbar pb-2">
              <button onClick={() => setPaymentFilter('pending')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all shrink-0 ${paymentFilter === 'pending' ? 'text-[#E31837] border-[#E31837]' : 'text-gray-600 border-transparent'}`}>Pending</button>
              <button onClick={() => setPaymentFilter('approved')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all shrink-0 ${paymentFilter === 'approved' ? 'text-emerald-500 border-emerald-500' : 'text-gray-600 border-transparent'}`}>Approved</button>
              <button onClick={() => setPaymentFilter('frozen')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all shrink-0 ${paymentFilter === 'frozen' ? 'text-amber-500 border-amber-500' : 'text-gray-600 border-transparent'}`}>Frozen Users</button>
              <button onClick={() => setPaymentFilter('all')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all shrink-0 ${paymentFilter === 'all' ? 'text-white border-white' : 'text-gray-600 border-transparent'}`}>All Records</button>
            </div>
            <div className="space-y-4">
              {filteredPayments.map(txn => {
                const user = data.users.find(u => u.id === txn.userId);
                const isFrozen = user?.status === 'frozen';
                return (
                  <div key={txn.id} className={`bg-[#111] p-8 rounded-[48px] border space-y-6 shadow-2xl relative overflow-hidden transition-all ${isFrozen ? 'border-amber-500/40 shadow-amber-900/10' : 'border-white/5'}`}>
                    {txn.status === 'approved' && txn.type === 'recharge' && !isFrozen && <div className="absolute top-0 right-0 p-4 opacity-10"><CheckCircle2 size={80} className="text-emerald-500" /></div>}
                    {isFrozen && <div className="absolute top-0 right-0 p-4 opacity-20"><Snowflake size={80} className="text-amber-500" /></div>}
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${txn.type === 'recharge' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{txn.type === 'recharge' ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}</div>
                        <div>
                          <p className="text-sm font-black text-white">₹{txn.amount}</p>
                          <p className="text-[9px] text-gray-500 font-bold uppercase">{user?.mobile || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg border ${txn.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : txn.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{txn.status}</span>
                        {isFrozen && <span className="text-[7px] font-black text-amber-500 uppercase bg-amber-500/10 px-2 py-0.5 rounded tracking-tighter">Account Frozen</span>}
                      </div>
                    </div>
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                      <p className="text-[8px] text-gray-600 font-black uppercase mb-1">System Reference</p>
                      <p className="text-xs font-mono text-gray-300">UTR: {txn.utr || 'Standard'}</p>
                      <p className="text-[8px] text-gray-700 mt-2">{new Date(txn.date).toLocaleString()}</p>
                      {txn.details && <p className="text-[8px] text-red-400 mt-1 uppercase font-bold italic">{txn.details}</p>}
                    </div>
                    {(txn.status === 'pending' || (txn.status === 'approved' && txn.type === 'recharge')) && (
                      <div className="flex gap-4">
                        {txn.status === 'pending' && (
                          <button 
                            disabled={isProcessing}
                            onClick={() => handleAction(txn.id, 'approved')} 
                            className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all disabled:opacity-50"
                          >
                            {isProcessing ? '...' : 'Approve'}
                          </button>
                        )}
                        <button 
                          disabled={isProcessing}
                          onClick={() => handleAction(txn.id, 'rejected')} 
                          className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase border active:scale-95 transition-all disabled:opacity-50 ${txn.status === 'approved' ? 'bg-[#E31837] text-white border-[#E31837]' : 'bg-white/5 text-red-500 border-red-500/10'}`}
                        >
                          {isProcessing ? '...' : (txn.status === 'approved' ? 'REVERSE & REJECT' : 'Reject')}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Support Tab */}
        {activeTab === 'support' && (
          <div className="space-y-6">
            {/* Image Requests Section */}
            <div className="bg-[#111] p-6 rounded-[32px] border border-white/5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black uppercase italic">Image Requests</h3>
                <span className="bg-amber-500/20 text-amber-400 text-xs font-black px-3 py-1 rounded-full">
                  {data.supportMessages.filter(m => m.text.includes('IMAGE REQUEST')).length} Pending
                </span>
              </div>
              {data.supportMessages.filter(m => m.text.includes('IMAGE REQUEST')).length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {data.supportMessages
                    .filter(m => m.text.includes('IMAGE REQUEST'))
                    .sort((a, b) => b.timestamp - a.timestamp) // Sort by newest first
                    .map(msg => {
                      const user = data.users.find(u => u.id === msg.userId);
                      return (
                        <div key={msg.id} className="bg-black/20 p-4 rounded-xl border border-white/5 hover:border-amber-500/30 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-black text-white">{user?.mobile || 'Unknown User'}</p>
                                <span className="bg-amber-500/10 text-amber-400 text-[8px] font-black px-2 py-1 rounded-full uppercase">
                                  UID: {msg.userId.substring(0, 8)}...
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-[10px] text-amber-400 font-bold uppercase bg-amber-500/10 px-2 py-0.5 rounded">IMAGE REQUEST</p>
                                <p className="text-[8px] text-gray-500">{new Date(msg.timestamp).toLocaleDateString()}</p>
                                <p className="text-[8px] text-gray-500">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                              <p className="text-sm text-gray-300 mt-2">{msg.text.replace('IMAGE REQUEST: ', '')}</p>
                            </div>
                          </div>
                          {msg.image && (
                            <div className="mt-3">
                              <a href={msg.image} target="_blank" rel="noreferrer" className="block">
                                <img src={msg.image} className="w-full rounded-lg border border-white/10 max-h-60 object-contain cursor-pointer hover:opacity-90 transition-opacity" alt="User attachment" />
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })
                  }
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-2xl">
                  <div className="mx-auto w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <Camera size={24} className="text-gray-600" />
                  </div>
                  <p className="text-gray-500">No image requests pending</p>
                  <p className="text-gray-700 text-sm mt-1">Users can submit images for review using the camera button</p>
                </div>
              )}
            </div>

            {!activeSupportUserId ? (
              <div className="space-y-4">
                <h2 className="text-xl font-black uppercase italic px-2">Support Tickets</h2>
                {supportUsers.length > 0 ? supportUsers.map(({ user, lastMsg }) => (
                  <button key={user.id} onClick={() => setActiveSupportUserId(user.id)} className="w-full bg-[#111] p-6 rounded-[32px] border border-white/5 flex items-center justify-between hover:border-[#E31837] transition-all group">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-[#E31837]/10 group-hover:text-[#E31837]">{lastMsg.sender === 'user' ? <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div> : <UserIcon size={24}/>}</div>
                       <div className="text-left">
                          <p className="text-sm font-black text-white">{user.mobile}</p>
                          <p className="text-[10px] text-gray-500 font-bold truncate max-w-[150px]">{lastMsg.image ? '📷 Sent an image' : lastMsg.text}</p>
                       </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-600" />
                  </button>
                )) : <div className="py-20 text-center opacity-20 flex flex-col items-center"><Headphones size={48} className="mb-4"/><p>No active support tickets.</p></div>}
              </div>
            ) : (
              <div className="bg-[#111] rounded-[48px] border border-white/5 flex flex-col h-[70vh] shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                   <div className="flex items-center gap-3">
                      <button onClick={() => setActiveSupportUserId(null)} className="p-2 bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors"><ArrowLeft size={18}/></button>
                      <div>
                        <p className="text-sm font-black text-white italic leading-none">{data.users.find(u => u.id === activeSupportUserId)?.mobile}</p>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Direct Console</p>
                      </div>
                   </div>
                </div>
                <div ref={supportScrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-black/10">
                   {(data.supportMessages || []).filter(m => m.userId === activeSupportUserId).map(msg => (
                     <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-[20px] text-sm font-medium ${msg.sender === 'admin' ? 'bg-[#E31837] text-white rounded-tr-none' : 'bg-white/5 text-gray-300 rounded-tl-none border border-white/10'}`}>
                           {msg.image && <a href={msg.image} target="_blank" rel="noreferrer"><img src={msg.image} className="w-full rounded-xl mb-2 border border-white/10 max-h-80 object-cover cursor-pointer" alt="User attachment" /></a>}
                           {msg.text && <p className="leading-relaxed font-bold">{msg.text}</p>}
                           <p className="text-[8px] opacity-40 mt-2 text-right uppercase font-black">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                        </div>
                     </div>
                   ))}
                </div>
                <div className="p-6 border-t border-white/5 flex gap-3 bg-black/20">
                   <input value={supportInput} onChange={e => setSupportInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendSupportReply()} placeholder="Write a reply..." className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-[#E31837]" />
                   <button onClick={sendSupportReply} className="p-4 bg-[#E31837] text-white rounded-2xl active:scale-95 transition-all shadow-lg"><Send size={20}/></button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Community Tab */}
        {activeTab === 'community' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase italic px-2">Feed Moderation</h2>
            <div className="flex gap-4 px-2 mb-4">
              <button onClick={() => setCommunityFilter('pending')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${communityFilter === 'pending' ? 'text-[#E31837] border-[#E31837]' : 'text-gray-600 border-transparent'}`}>Pending</button>
              <button onClick={() => setCommunityFilter('all')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${communityFilter === 'all' ? 'text-white border-white' : 'text-gray-600 border-transparent'}`}>All Posts</button>
            </div>
            {(data.communityPosts || []).filter(p => communityFilter === 'pending' ? p.status === 'pending' : true).map(post => (
              <div key={post.id} className="bg-[#111] p-8 rounded-[48px] border border-white/5 space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-black text-white">{post.userPhone}</p>
                  <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg border ${post.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>{post.status}</span>
                </div>
                <h4 className="text-base font-bold text-white italic">"{post.title}"</h4>
                <div className="aspect-square bg-black rounded-[32px] overflow-hidden border border-white/5 shadow-inner"><img src={post.image} className="w-full h-full object-cover" /></div>
                {post.status === 'pending' && (
                  <div className="flex gap-4">
                    <button onClick={() => handleCommunityAction(post.id, 'approved')} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase active:scale-95 transition-all">Approve</button>
                    <button onClick={() => handleCommunityAction(post.id, 'rejected')} className="flex-1 bg-white/5 text-red-500 py-4 rounded-2xl font-black uppercase border border-red-500/10 active:scale-95 transition-all">Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Models Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <button onClick={() => setEditingProduct({ id: Date.now(), name: '', price: 0, dailyIncome: 0, duration: 30, totalReturn: 0, profit: 0, category: 'leasing', image: '' })} className="w-full bg-[#111] border border-dashed border-white/20 p-8 rounded-[40px] flex items-center justify-center gap-4 hover:border-[#E31837] group transition-all"><Plus size={24} className="text-gray-600 group-hover:text-[#E31837]" /><span className="text-[10px] font-black uppercase tracking-widest">New Lease Model</span></button>
            <div className="space-y-6">
              {data.admin.customProducts.map(p => (
                <div key={p.id} className="bg-[#111] rounded-[44px] overflow-hidden border border-white/5 shadow-2xl relative group">
                  <div className="absolute top-6 right-6 flex gap-2 z-10">
                    <button onClick={() => setEditingProduct(p)} className="w-10 h-10 bg-black/80 backdrop-blur-md rounded-xl flex items-center justify-center text-gray-400 hover:text-white shadow-xl"><Edit3 size={18} /></button>
                    <button onClick={() => { if(confirm('Destroy product?')) { saveStore({ admin: { ...data.admin, customProducts: data.admin.customProducts.filter(x => x.id !== p.id) } }); refresh(); } }} className="w-10 h-10 bg-black/80 backdrop-blur-md rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 shadow-xl"><Trash2 size={18} /></button>
                  </div>
                  <div className="h-48 bg-black/40 flex items-center justify-center p-12"><img src={p.image} className="max-h-full object-contain grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" /></div>
                  <div className="p-8 space-y-4">
                    <h4 className="text-white font-black italic uppercase tracking-tight text-lg">{p.name}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/40 p-4 rounded-2xl border border-white/5"><p className="text-[8px] text-gray-600 uppercase font-black mb-1">Price</p><p className="text-sm font-black text-white italic">₹{p.price}</p></div>
                      <div className="bg-black/40 p-4 rounded-2xl border border-white/5"><p className="text-[8px] text-gray-600 uppercase font-black mb-1">Daily</p><p className="text-sm font-black text-emerald-500 italic">₹{p.dailyIncome}</p></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* UI Tab */}
        {activeTab === 'branding' && (
          <div className="space-y-8 pb-10">
            <div className="bg-[#111] p-10 rounded-[48px] border border-white/5 space-y-8 shadow-2xl">
               <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2"><Palette size={16}/> Site Identity</h3>
               <div className="space-y-6">
                 <div className="space-y-2">
                   <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest ml-4">Site Name</p>
                   <input value={data.admin.branding.siteName} onChange={e => updateBranding('siteName', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-[#E31837]" />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                   <div onClick={() => logoInputRef.current?.click()} className="aspect-square bg-black border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center cursor-pointer group hover:border-[#E31837] overflow-hidden">
                      {data.admin.branding.logo ? <img src={data.admin.branding.logo} className="w-20 h-20 object-contain" /> : <ImageIcon className="text-gray-700 group-hover:text-[#E31837]" size={24} />}
                      <span className="text-[8px] font-black uppercase tracking-widest mt-2">Logo</span>
                      <input ref={logoInputRef} type="file" className="hidden" onChange={e => handleBrandingImageUpload('logo', e)} />
                   </div>
                   <div onClick={() => heroInputRef.current?.click()} className="aspect-square bg-black border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center cursor-pointer group hover:border-[#E31837] overflow-hidden">
                      {data.admin.branding.hero ? <img src={data.admin.branding.hero} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-700 group-hover:text-[#E31837]" size={24} />}
                      <span className="text-[8px] font-black uppercase tracking-widest mt-2">Hero Banner</span>
                      <input ref={heroInputRef} type="file" className="hidden" onChange={e => handleBrandingImageUpload('hero', e)} />
                   </div>
                 </div>
                 <div className="space-y-4">
                   <div className="space-y-2"><p className="text-[9px] text-gray-500 font-black uppercase tracking-widest ml-4">Support URL</p><input value={data.admin.branding.supportUrl} onChange={e => updateBranding('supportUrl', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-xs text-blue-400 outline-none" /></div>
                   <div className="space-y-2"><p className="text-[9px] text-gray-500 font-black uppercase tracking-widest ml-4 font-bold text-indigo-400 italic">Telegram Join Link</p><input value={data.admin.branding.telegramUrl} onChange={e => updateBranding('telegramUrl', e.target.value)} className="w-full bg-black/40 border border-indigo-500/20 rounded-2xl py-4 px-6 text-xs text-indigo-400 outline-none focus:border-indigo-500" placeholder="https://t.me/yourchannel" /></div>
                 </div>
               </div>
            </div>
            <div className="bg-[#111] p-10 rounded-[48px] border border-white/5 space-y-8 shadow-2xl">
               <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2"><CreditCard size={16}/> Payment Gateway</h3>
               <div className="space-y-6">
                  <div className="space-y-2"><p className="text-[9px] text-gray-500 font-black uppercase tracking-widest ml-4">Admin UPI ID</p><input value={data.admin.rechargeUpiId} onChange={e => updateAdminField('rechargeUpiId', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-emerald-500 outline-none focus:border-[#E31837]" /></div>
                  <div onClick={() => qrInputRef.current?.click()} className="w-full h-48 bg-black border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center cursor-pointer group hover:border-[#E31837] overflow-hidden relative">{data.admin.rechargeQrCode ? <img src={data.admin.rechargeQrCode} className="h-40 object-contain" /> : <QrCode size={40} className="text-gray-700 group-hover:text-[#E31837]" />}<span className="text-[8px] font-black uppercase tracking-widest mt-2 text-gray-500">QR Code</span><input ref={qrInputRef} type="file" className="hidden" onChange={e => handleBrandingImageUpload('qr', e)} /></div>
               </div>
            </div>
          </div>
        )}

        {/* Broadcast Tab */}
        {activeTab === 'broadcast' && (
          <div className="space-y-8">
            <div className="bg-[#111] p-10 rounded-[48px] border border-white/5 space-y-8 shadow-2xl">
               <div className="flex items-center justify-between"><h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2"><Send size={16}/> Announcement Configuration</h3><button onClick={() => updateAdminField('popupEnabled', !data.admin.popupEnabled)} className={`w-12 h-6 rounded-full transition-all relative ${data.admin.popupEnabled ? 'bg-emerald-600' : 'bg-gray-800'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${data.admin.popupEnabled ? 'left-7' : 'left-1'}`}></div></button></div>
               <div className="space-y-6">
                 <div className="space-y-2"><p className="text-[9px] text-gray-500 font-black uppercase tracking-widest ml-4">Modal Subject</p><input value={data.admin.popupSubject} onChange={e => updateAdminField('popupSubject', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-[#E31837]" placeholder="Announcement" /></div>
                 <div className="space-y-2"><p className="text-[9px] text-gray-500 font-black uppercase tracking-widest ml-4">Award Line 1</p><input value={data.admin.popupAwardLine1} onChange={e => updateAdminField('popupAwardLine1', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-blue-400 outline-none" /></div>
                 <div className="space-y-2"><p className="text-[9px] text-gray-500 font-black uppercase tracking-widest ml-4">Award Line 2</p><input value={data.admin.popupAwardLine2} onChange={e => updateAdminField('popupAwardLine2', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-blue-400 outline-none" /></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><p className="text-[9px] text-gray-500 font-black uppercase tracking-widest ml-4">Min Recharge</p><input value={data.admin.popupMinRecharge} onChange={e => updateAdminField('popupMinRecharge', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold text-emerald-400" /></div>
                    <div className="space-y-2"><p className="text-[9px] text-gray-500 font-black uppercase tracking-widest ml-4">Min Withdrawal</p><input value={data.admin.popupMinWithdrawal} onChange={e => updateAdminField('popupMinWithdrawal', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold text-emerald-400" /></div>
                 </div>
                 <div className="grid grid-cols-3 gap-3">
                    {['L1', 'L2', 'L3'].map((l, i) => (
                      <div key={l} className="space-y-2"><p className="text-[7px] text-gray-500 font-black uppercase text-center">{l} Comm</p><input value={data.admin[`popupReferral${l}` as keyof AdminSettings] as string} onChange={e => updateAdminField(`popupReferral${l}` as any, e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 text-center text-xs font-black text-orange-400" /></div>
                    ))}
                 </div>
                 <div className="space-y-2"><p className="text-[9px] text-gray-500 font-black uppercase tracking-widest ml-4">Welcome Message</p><input value={data.admin.popupText} onChange={e => updateAdminField('popupText', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none" /></div>
                 <div className="space-y-2"><p className="text-[9px] text-gray-500 font-black uppercase tracking-widest ml-4">Button Label</p><input value={data.admin.popupChannelBtnText} onChange={e => updateAdminField('popupChannelBtnText', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none" /></div>
               </div>
            </div>
          </div>
        )}

        {/* Sync Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-8 pb-20">
            <div className="bg-[#111] p-10 rounded-[48px] border border-white/5 space-y-10 shadow-2xl">
               <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2"><Cpu size={16}/> Automation Protocol</h3>
               <div className="space-y-8">
                  <div className="flex items-center justify-between"><div><p className="text-sm font-black text-white uppercase tracking-tight">Automatic Payouts</p><p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">Daily yield cycle scheduler</p></div><button onClick={() => updateAdminField('automaticIncomeEnabled', !data.admin.automaticIncomeEnabled)} className={`w-12 h-6 rounded-full transition-all relative ${data.admin.automaticIncomeEnabled ? 'bg-emerald-600' : 'bg-gray-800'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${data.admin.automaticIncomeEnabled ? 'left-7' : 'left-1'}`}></div></button></div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between"><p className="text-xs font-black text-gray-400 uppercase tracking-widest">Distribution Time (IST)</p><input type="time" value={data.admin.automaticIncomeTime || '00:00'} onChange={e => updateAdminField('automaticIncomeTime', e.target.value)} className="bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-sm font-black text-white outline-none" /></div>
                    <div className="bg-black/40 p-5 rounded-3xl border border-white/5 flex items-center gap-4"><Clock size={16} className="text-gray-600" /><div><p className="text-[8px] text-gray-600 font-black uppercase">Last Signal Run</p><p className="text-[10px] font-black text-gray-300 uppercase tracking-tighter mt-0.5">{data.admin.lastIncomeRun || 'NO RECENT ACTIVITY DETECTED'}</p></div></div>
                  </div>
               </div>
            </div>
            <div className="bg-[#111] p-10 rounded-[48px] border border-blue-500/20 space-y-10 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-5"><Zap size={120} className="text-blue-500" /></div>
               <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2"><Zap size={16} className="text-blue-500" /> AI Automation Protocol</h3>
               <div className="space-y-8">
                  <div className="flex items-center justify-between"><div><p className="text-sm font-black text-white uppercase tracking-tight">Customer Care AI</p><p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">AI assistant has full admin access to resolve user issues automatically.</p></div><button onClick={() => updateAdminField('aiAutomationEnabled', !data.admin.aiAutomationEnabled)} className={`w-12 h-6 rounded-full transition-all relative ${data.admin.aiAutomationEnabled ? 'bg-blue-600' : 'bg-gray-800'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${data.admin.aiAutomationEnabled ? 'left-7' : 'left-1'}`}></div></button></div>
                  <div className="bg-blue-500/5 p-5 rounded-3xl border border-blue-500/10"><p className="text-[9px] text-blue-500/60 font-black uppercase leading-relaxed tracking-widest">When enabled, AI can perform admin actions to resolve user issues instantly. When disabled, users will be directed to human support.</p></div>
               </div>
            </div>
            <div className="bg-[#111] p-10 rounded-[48px] border border-amber-500/20 space-y-10 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-5"><Zap size={120} className="text-amber-500" /></div>
               <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2"><Zap size={16} className="text-amber-500" /> Pre-Approved Protocol</h3>
               <div className="space-y-8">
                  <div className="flex items-center justify-between"><div><p className="text-sm font-black text-white uppercase tracking-tight">Auto-Credit System</p><p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">Users receive wallet balance instantly upon submission.</p></div><button onClick={() => updateAdminField('preApprovedEnabled', !data.admin.preApprovedEnabled)} className={`w-12 h-6 rounded-full transition-all relative ${data.admin.preApprovedEnabled ? 'bg-amber-600' : 'bg-gray-800'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${data.admin.preApprovedEnabled ? 'left-7' : 'left-1'}`}></div></button></div>
                  <div className="bg-amber-500/5 p-5 rounded-3xl border border-amber-500/10"><p className="text-[9px] text-amber-500/60 font-black uppercase leading-relaxed tracking-widest">SUPER ADMIN POWER: Recharges can be manually reversed later from the Ledger. Reversal cancels linked nodes and undoes commissions.</p></div>
               </div>
            </div>
            <div className="bg-[#111] p-10 rounded-[48px] border border-white/5 space-y-10 shadow-2xl">
               <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2"><Shield size={16}/> Global Security Protocol</h3>
               <div className="space-y-8">
                 {[
                   { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Lock platform for all users' },
                   { key: 'incomeFrozen', label: 'Profit Engine Lock', desc: 'Pause all daily yield payouts' },
                   { key: 'withdrawalFrozen', label: 'Cashout System Lock', desc: 'Pause all bank withdrawals' },
                   { key: 'purchasesLocked', label: 'Asset Purchase Lock', desc: 'Lock new machine leases' }
                 ].map(toggle => (
                   <div key={toggle.key} className="flex items-center justify-between"><div><p className="text-sm font-black text-white uppercase tracking-tight">{toggle.label}</p><p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">{toggle.desc}</p></div><button onClick={() => updateAdminField(toggle.key as any, !data.admin[toggle.key as keyof AdminSettings])} className={`w-12 h-6 rounded-full transition-all relative ${data.admin[toggle.key as keyof AdminSettings] ? 'bg-[#E31837]' : 'bg-gray-800'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${data.admin[toggle.key as keyof AdminSettings] ? 'left-7' : 'left-1'}`}></div></button></div>
                 ))}
               </div>
            </div>
            <div className="bg-[#111] p-10 rounded-[48px] border border-white/5 space-y-10 shadow-2xl">
               <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2"><Network size={16}/> Rebate Matrix</h3>
               <div className="grid grid-cols-3 gap-6">
                 {[
                   { key: 'commissionL1', label: 'Level 1' },
                   { key: 'commissionL2', label: 'Level 2' },
                   { key: 'commissionL3', label: 'Level 3' }
                 ].map(comm => (
                   <div key={comm.key} className="space-y-2"><p className="text-[8px] text-gray-500 font-black uppercase text-center">{comm.label}</p><div className="relative"><input type="number" value={data.admin[comm.key as keyof AdminSettings] as any} onChange={e => updateAdminField(comm.key as any, parseInt(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-2 text-center text-xs font-black text-white outline-none focus:border-[#E31837]" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-gray-600">%</span></div></div>
                 ))}
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Security Console */}
      <AnimatePresence>
        {securityTargetUser && (
          <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
             <MotionDiv initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#111] rounded-[48px] w-full max-w-sm border border-white/10 overflow-hidden shadow-2xl">
              <div className="p-10 space-y-8">
                <div className="flex justify-between items-center"><h3 className="text-xl font-black italic text-white tracking-tighter uppercase leading-none">Security Console</h3><button onClick={() => { setSecurityTargetUser(null); setEditingSecurityField(null); }} className="text-gray-600 hover:text-white"><X size={24}/></button></div>
                {!editingSecurityField ? (
                  <div className="space-y-3">
                    <button onClick={() => setEditingSecurityField('password')} className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 flex items-center justify-between text-[10px] font-black uppercase text-gray-400 hover:text-white transition-all">Login Password <ChevronRight size={16} /></button>
                    <button onClick={() => setEditingSecurityField('pin')} className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 flex items-center justify-between text-[10px] font-black uppercase text-gray-400 hover:text-white transition-all">Withdraw PIN <ChevronRight size={16} /></button>
                    <button onClick={() => setEditingSecurityField('fund')} className="w-full bg-emerald-600/10 border border-emerald-500/10 rounded-2xl py-4 px-6 flex items-center justify-between text-[10px] font-black uppercase text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all">Inject Funds <Plus size={16} /></button>
                    {/* NEW ALTERNATIVE FEATURE: Manual Deduction Tool */}
                    <button onClick={() => setEditingSecurityField('manual_deduct')} className="w-full bg-rose-600/10 border border-rose-500/10 rounded-2xl py-4 px-6 flex items-center justify-between text-[10px] font-black uppercase text-rose-500 hover:bg-rose-600 hover:text-white transition-all">Manual Deduction <Minus size={16} /></button>
                    <button onClick={() => updateUserSecurity(securityTargetUser.id, { status: securityTargetUser.status === 'active' ? 'banned' : 'active' }, 'USER_STATUS')} className={`w-full py-4 px-6 rounded-2xl text-[10px] font-black uppercase transition-all ${securityTargetUser.status === 'active' ? 'bg-red-600/10 text-red-500' : 'bg-emerald-600/10 text-emerald-500'}`}>{securityTargetUser.status === 'active' ? 'Ban Operator' : 'Restore Operator'}</button>
                    <button onClick={() => updateUserSecurity(securityTargetUser.id, { status: securityTargetUser.status === 'frozen' ? 'active' : 'frozen' }, 'USER_STATUS')} className={`w-full py-4 px-6 rounded-2xl text-[10px] font-black uppercase transition-all ${securityTargetUser.status === 'frozen' ? 'bg-emerald-600/10 text-emerald-500' : 'bg-amber-600/10 text-amber-500'}`}>{securityTargetUser.status === 'frozen' ? 'Thaw Operator' : 'Emergency Freeze'}</button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest ml-2">Value / Amount</p>
                       <input type={(editingSecurityField === 'fund' || editingSecurityField === 'manual_deduct') ? 'number' : 'text'} value={tempSecurityVal} onChange={e => setTempSecurityVal(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl py-5 px-6 text-sm font-black text-white outline-none focus:border-red-500" placeholder="Enter Value" autoFocus />
                    </div>
                    {(editingSecurityField === 'fund' || editingSecurityField === 'manual_deduct') && (
                       <div className="flex gap-2">
                          <button onClick={() => manualWalletAction(editingSecurityField === 'fund' ? 'current' : 'deduct_current', parseInt(tempSecurityVal))} className="flex-1 bg-white/5 border border-white/10 py-3 rounded-xl text-[8px] font-black uppercase transition-all">To Current</button>
                          <button onClick={() => manualWalletAction(editingSecurityField === 'fund' ? 'withdrawal' : 'deduct_withdraw', parseInt(tempSecurityVal))} className="flex-1 bg-white/5 border border-white/10 py-3 rounded-xl text-[8px] font-black uppercase transition-all">To Withdraw</button>
                       </div>
                    )}
                    {editingSecurityField !== 'fund' && editingSecurityField !== 'manual_deduct' && <button onClick={() => { updateUserSecurity(securityTargetUser.id, { [editingSecurityField === 'password' ? 'password' : 'withdrawalPassword']: tempSecurityVal }, 'SEC_RESET'); setSecurityTargetUser(null); setEditingSecurityField(null); setTempSecurityVal(''); }} className="w-full bg-[#E31837] text-white py-5 rounded-2xl font-black uppercase shadow-xl">Commit Change</button>}
                    <button onClick={() => { setEditingSecurityField(null); setTempSecurityVal(''); }} className="w-full text-[9px] font-black uppercase text-gray-600 tracking-widest">Cancel</button>
                  </div>
                )}
              </div>
             </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      {/* NEW: Reversal Console Modal (Alternative to confirmation alerts) */}
      <AnimatePresence>
        {reversalTarget && (
          <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
             <MotionDiv initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#111] w-full max-w-sm rounded-[56px] border border-red-500/20 shadow-[0_0_80px_rgba(227,24,55,0.15)] overflow-hidden">
                <div className="p-10 space-y-8">
                   <div className="flex justify-center"><div className="w-16 h-16 bg-red-600/10 text-red-500 rounded-2xl flex items-center justify-center border border-red-500/10"><RotateCcw size={32} /></div></div>
                   <div className="text-center space-y-2">
                      <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">Nullification Protocol</h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-loose px-4">Transaction rollback identified. Analyzing financial impact for Fleet Operator.</p>
                   </div>
                   
                   <div className="bg-black/40 rounded-[32px] border border-white/5 divide-y divide-white/5">
                      <div className="p-5 flex justify-between items-center">
                         <span className="text-[10px] text-gray-500 font-bold uppercase">Asset Status</span>
                         <span className="text-[10px] text-red-500 font-black uppercase">To Be Liquidated</span>
                      </div>
                      <div className="p-6 space-y-4">
                         <div className="flex justify-between items-center"><span className="text-[9px] text-gray-400 font-bold uppercase">Initial Deposit</span><span className="text-sm font-black text-white italic">₹{reversalTarget.txn.amount}</span></div>
                         <div className="flex justify-between items-center"><span className="text-[9px] text-gray-400 font-bold uppercase">Linked Nodes</span><span className="text-sm font-black text-white italic">{reversalTarget.impact?.nodesCount || 0} Units</span></div>
                         <div className="flex justify-between items-center"><span className="text-[9px] text-gray-400 font-bold uppercase">Yields Reclaimed</span><span className="text-sm font-black text-red-500 italic">₹{reversalTarget.impact?.profitsTotal || 0}</span></div>
                         <div className="flex justify-between items-center"><span className="text-[9px] text-gray-400 font-bold uppercase">Comms Rolled Back</span><span className="text-sm font-black text-red-500 italic">₹{reversalTarget.impact?.commsTotal || 0}</span></div>
                      </div>
                      <div className="p-5 flex justify-between items-center bg-red-600/5">
                         <span className="text-[10px] text-red-500 font-black uppercase">Net Deduction</span>
                         <span className="text-xl font-black text-red-500 italic">₹{reversalTarget.impact?.totalDeduction || 0}</span>
                      </div>
                   </div>

                   <div className="space-y-4 pt-4">
                      <button 
                        disabled={isProcessing}
                        onClick={handleExecuteReversal}
                        className="w-full bg-[#E31837] text-white py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                      >
                         {isProcessing ? 'SYNCHRONIZING...' : 'AUTHORIZE NULLIFICATION'}
                      </button>
                      <button onClick={() => setReversalTarget(null)} className="w-full text-[10px] font-black text-gray-600 uppercase tracking-widest py-2">Abort Signal</button>
                   </div>
                </div>
             </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      {/* Product Edit Modal */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
            <MotionDiv initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#111] rounded-[48px] w-full max-sm border border-white/10 overflow-hidden shadow-2xl my-auto">
              <form onSubmit={handleSaveProduct} className="p-10 space-y-6">
                <div className="flex justify-between items-center"><h3 className="text-xl font-black italic text-white uppercase tracking-tighter">Model Config</h3><button type="button" onClick={() => setEditingProduct(null)} className="text-gray-500 hover:text-white"><X size={24}/></button></div>
                <div onClick={() => fileInputRef.current?.click()} className="aspect-video bg-black rounded-3xl border border-dashed border-white/10 flex items-center justify-center cursor-pointer overflow-hidden group">{editingProduct.image ? <img src={editingProduct.image} className="h-full object-contain" /> : <ImageIcon className="text-gray-800" size={32} />}<input ref={fileInputRef} type="file" className="hidden" onChange={handleImageUpload} /></div>
                <div className="space-y-4">
                  <input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} placeholder="Model Name" className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none" required />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseInt(e.target.value)})} placeholder="Price (₹)" className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none" required />
                    <input type="number" value={editingProduct.dailyIncome} onChange={e => setEditingProduct({...editingProduct, dailyIncome: parseInt(e.target.value)})} placeholder="Daily (₹)" className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-emerald-500 outline-none" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" value={editingProduct.duration} onChange={e => setEditingProduct({...editingProduct, duration: parseInt(e.target.value)})} placeholder="Duration" className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-white" required />
                    <input type="number" value={editingProduct.userLimit || 1} onChange={e => setEditingProduct({...editingProduct, userLimit: parseInt(e.target.value)})} placeholder="Limit" className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-white" required />
                  </div>
                  <select value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value as any})} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-white"><option value="leasing">Daily Refresh</option><option value="high_tech">Super Chilled</option></select>
                  
                  <div className="space-y-2">
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest ml-4">Deployment Protocol</p>
                    <select value={editingProduct.systemStatus || 'live'} onChange={e => setEditingProduct({...editingProduct, systemStatus: e.target.value as any})} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-[#E31837]">
                      <option value="live">System: LIVE</option>
                      <option value="soon">System: SOON</option>
                      <option value="hidden">System: HIDDEN</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full bg-[#E31837] text-white py-6 rounded-[28px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all">COMMIT ASSET</button>
              </form>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Income Success Modal */}
      <AnimatePresence>
        {distResult && (
          <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
             <MotionDiv initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#111] p-12 rounded-[60px] border border-emerald-500/20 w-full max-w-xs text-center shadow-2xl">
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-emerald-500/10"><TrendingUp size={40} /></div>
                <h3 className="text-xl font-black italic text-white uppercase tracking-tighter mb-4">ENGINE SYNCED</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-8">₹{distResult.totalDistributed} Distributed to {distResult.usersAffected} Fleet Operators.</p>
                <button onClick={() => setDistResult(null)} className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all">CLEAR SIGNAL</button>
             </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Customer Care Component */}
      <AdminCustomerCare
        isOpen={isAdminCustomerCareOpen}
        onClose={() => setIsAdminCustomerCareOpen(false)}
        isAdmin={true}
      />

      {/* AI Development Agent Component */}
      <AdminAgent
        isOpen={isAiAgentOpen}
        onClose={() => setIsAiAgentOpen(false)}
        admin={data.admin}
      />
    </div>
  );
};

export default Admin;
