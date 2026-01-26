
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AppState, Transaction, UserProduct, Product, TransactionType, TransactionStatus } from '../types';
import { PRODUCTS, ADMIN_CREDENTIALS } from '../constants';

interface AppContextType extends AppState {
  register: (name: string, username: string, mobile: string, passwordHash: string, referralCode?: string) => void;
  login: (mobile: string, passwordHash: string) => boolean;
  logout: () => void;
  adminLogin: (username: string, passwordHash: string) => boolean;
  adminLogout: () => void;
  isAdmin: boolean;
  addTransaction: (userId: string, type: TransactionType, amount: number, status: TransactionStatus, utr?: string, details?: string) => void;
  buyProduct: (productId: number) => { success: boolean; message: string };
  updateBalance: (userId: string, amount: number) => void;
  approveTransaction: (transactionId: string) => void;
  rejectTransaction: (transactionId: string) => void;
  collectDailyEarnings: () => void;
  setWithdrawalTime: (userId: string) => void;
  isSyncing: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const LOCAL_STORAGE_KEY = "sprite_v1_context_state";

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      users: [],
      currentUser: null,
      userProducts: [],
      transactions: [],
      lastWithdrawalTime: {}
    };
  });

  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('elite_invest_admin') === 'true');

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    if (state.currentUser) {
      localStorage.setItem('elite_invest_current_user', JSON.stringify(state.currentUser));
    } else {
      localStorage.removeItem('elite_invest_current_user');
    }
  }, [state]);

  useEffect(() => {
    localStorage.setItem('elite_invest_admin', isAdmin.toString());
  }, [isAdmin]);

  const collectDailyEarnings = useCallback(() => {
    if (!state.currentUser) return;
    const now = Date.now();
    const userId = state.currentUser.id;
    const activeProducts = state.userProducts.filter(up => up.userId === userId && up.status === 'ACTIVE');
    
    let totalEarning = 0;
    const updatedUserProducts = [...state.userProducts];
    const newTransactions: Transaction[] = [];

    updatedUserProducts.forEach((up) => {
      if (up.userId === userId && up.status === 'ACTIVE') {
        const product = PRODUCTS.find(p => p.id === up.productId);
        if (product) {
          const msPerDay = 24 * 60 * 60 * 1000;
          const daysPassed = Math.floor((now - up.lastCollectionDate) / msPerDay);
          
          if (daysPassed > 0) {
            const earnings = product.dailyIncome * daysPassed;
            totalEarning += earnings;
            up.lastCollectionDate += daysPassed * msPerDay;
            up.daysLeft -= daysPassed;
            
            if (up.daysLeft <= 0) {
              up.status = 'EXPIRED';
              up.daysLeft = 0;
            }

            newTransactions.push({
              id: Math.random().toString(36).substr(2, 9),
              userId,
              type: 'profit',
              amount: earnings,
              status: 'approved',
              timestamp: now,
              date: new Date(now).toISOString(),
              details: `Daily income from ${product.name}`
            });
          }
        }
      }
    });

    if (totalEarning > 0) {
      setState(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === userId ? { ...u, balance: u.balance + totalEarning } : u),
        currentUser: prev.currentUser ? { ...prev.currentUser, balance: prev.currentUser.balance + totalEarning } : null,
        userProducts: updatedUserProducts,
        transactions: [...prev.transactions, ...newTransactions]
      }));
    }
  }, [state]);

  const register = (name: string, username: string, mobile: string, passwordHash: string, referralCode?: string) => {
    if (state.users.find(u => u.mobile === mobile)) return;

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name, username, mobile, password: passwordHash,
      balance: 0, withdrawableBalance: 0, totalInvested: 0, totalWithdrawn: 0,
      referralEarnings: 0,
      referralCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
      referredBy: referralCode,
      registrationDate: new Date().toISOString(),
      vipLevel: 0, status: 'active'
    };

    setState(prev => ({ ...prev, users: [...prev.users, newUser], currentUser: newUser }));
  };

  const login = (mobile: string, passwordHash: string) => {
    const user = state.users.find(u => u.mobile === mobile && u.password === passwordHash);
    if (user) {
      setState(prev => ({ ...prev, currentUser: user }));
      localStorage.setItem('sprite_v1_active_user_id', user.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
    localStorage.removeItem('sprite_v1_active_user_id');
  };

  const adminLogin = (username: string, passwordHash: string) => {
    if (username === ADMIN_CREDENTIALS.username && passwordHash === ADMIN_CREDENTIALS.password) {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const adminLogout = () => setIsAdmin(false);

  const buyProduct = (productId: number) => {
    if (!state.currentUser) return { success: false, message: "Please login first" };
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return { success: false, message: "Product not found" };
    
    if (state.currentUser.balance < product.price) {
      return { success: false, message: "Insufficient balance. Please recharge." };
    }

    const newUserProduct: UserProduct = {
      id: Math.random().toString(36).substr(2, 9),
      userId: state.currentUser.id,
      productId: product.id,
      purchaseDate: Date.now(),
      daysLeft: product.duration,
      status: 'ACTIVE',
      lastCollectionDate: Date.now()
    };

    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: state.currentUser.id,
      type: 'purchase',
      amount: product.price,
      status: 'approved',
      timestamp: Date.now(),
      date: new Date().toISOString(),
      details: `Purchased ${product.name}`
    };

    let updatedUsers = state.users.map(u => {
      if (u.id === state.currentUser?.id) {
        return { ...u, balance: u.balance - product.price, totalInvested: u.totalInvested + product.price };
      }
      return u;
    });

    setState(prev => ({
      ...prev,
      users: updatedUsers,
      currentUser: updatedUsers.find(u => u.id === prev.currentUser?.id) || null,
      userProducts: [...prev.userProducts, newUserProduct],
      transactions: [...prev.transactions, newTransaction]
    }));

    return { success: true, message: `Successfully purchased ${product.name}!` };
  };

  const addTransaction = (userId: string, type: TransactionType, amount: number, status: TransactionStatus, utr?: string, details?: string) => {
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId, type, amount, status, timestamp: Date.now(),
      date: new Date().toISOString(), utr, details
    };
    setState(prev => ({ ...prev, transactions: [...prev.transactions, newTransaction] }));
  };

  const approveTransaction = (transactionId: string) => {
    setState(prev => {
      const trans = prev.transactions.find(t => t.id === transactionId);
      if (!trans || trans.status !== 'pending') return prev;
      const updatedUsers = prev.users.map(u => 
        u.id === trans.userId ? { ...u, balance: u.balance + (trans.type === 'recharge' ? trans.amount : 0) } : u
      );
      return {
        ...prev,
        transactions: prev.transactions.map(t => t.id === transactionId ? { ...t, status: 'approved' } : t),
        users: updatedUsers,
        currentUser: prev.currentUser?.id === trans.userId ? updatedUsers.find(u => u.id === trans.userId)! : prev.currentUser
      };
    });
  };

  const rejectTransaction = (transactionId: string) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => t.id === transactionId ? { ...t, status: 'rejected' } : t)
    }));
  };

  const setWithdrawalTime = (userId: string) => {
    setState(prev => ({
      ...prev,
      lastWithdrawalTime: { ...prev.lastWithdrawalTime, [userId]: Date.now() }
    }));
  };

  const updateBalance = (userId: string, amount: number) => {
    setState(prev => {
      const updatedUsers = prev.users.map(u => u.id === userId ? { ...u, balance: u.balance + amount } : u);
      return {
        ...prev,
        users: updatedUsers,
        currentUser: prev.currentUser?.id === userId ? updatedUsers.find(u => u.id === userId)! : prev.currentUser
      };
    });
  };

  return (
    <AppContext.Provider value={{ 
      ...state, register, login, logout, adminLogin, adminLogout, isAdmin,
      addTransaction, buyProduct, updateBalance, approveTransaction, rejectTransaction,
      collectDailyEarnings, setWithdrawalTime, isSyncing: false
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
