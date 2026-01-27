import React, { useState, useEffect, useRef } from 'react';
import { User, Transaction, Purchase, SupportMessage } from '../types';
import { getStore, saveStore } from '../store';
import { customerCareAI } from '../services/customerCareAI';
import { 
  Shield, User as UserIcon, Wallet, CreditCard, Settings, 
  Search, Check, X, Send, ChevronLeft, Eye, EyeOff, 
  ArrowRight, ShieldCheck, AlertTriangle, Filter, 
  Copy, Plus, Minus, Clock, MessageSquare, Headphones,
  ArrowDownCircle, ArrowUpCircle, Coins, RotateCcw, Snowflake
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

interface CustomerCareConsoleProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

const CustomerCareConsole: React.FC<CustomerCareConsoleProps> = ({ user, isOpen, onClose }) => {
  // Check if user is authorized to access customer care console
  const isAuthorized = user.role === 'customer_care' || user.role === 'admin' || user.isCustomerCareAgent;

  // If not authorized, don't render anything
  if (!isAuthorized) {
    return null;
  }

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'payments' | 'support'>('dashboard');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAdminControls, setShowAdminControls] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load data and messages
  useEffect(() => {
    if (isOpen) {
      const store = getStore();
      const userMessages = (store.supportMessages || []).filter(m => m.userId === user.id);
      setMessages(userMessages.sort((a, b) => a.timestamp - b.timestamp));
    }
  }, [isOpen, user.id]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Get all data from store
  const store = getStore();
  
  // Filter users based on search
  const filteredUsers = store.users.filter(u => 
    u.mobile.includes(search) || u.name.toLowerCase().includes(search.toLowerCase())
  );

  // Filter transactions based on type and status
  const filteredPayments = store.transactions.filter(t => 
    t.type === 'recharge' || t.type === 'withdraw'
  ).filter(t => {
    if (paymentFilter === 'pending') return t.status === 'pending';
    if (paymentFilter === 'approved') return t.status === 'approved';
    if (paymentFilter === 'rejected') return t.status === 'rejected';
    return true;
  }).filter(t => {
    if (search) {
      const user = store.users.find(u => u.id === t.userId);
      return user?.mobile.includes(search) || t.utr?.includes(search);
    }
    return true;
  }).sort((a,b) => b.timestamp - a.timestamp);

  // Handle admin actions
  const handleAction = async (txnId: string, status: 'approved' | 'rejected') => {
    try {
      const store = getStore();
      const txn = store.transactions.find(t => t.id === txnId);
      if (!txn) return;

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

      await saveStore({
        transactions: nextTransactions,
        users: nextUsers
      });

      // Refresh data
      const updatedStore = getStore();
      const userMessages = (updatedStore.supportMessages || []).filter(m => m.userId === user.id);
      setMessages(userMessages.sort((a, b) => a.timestamp - b.timestamp));
    } catch (err) {
      console.error("Action Error:", err);
      alert("System processing failed.");
    }
  };

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    try {
      const store = getStore();
      
      const newMessage: SupportMessage = {
        id: `care-msg-${Date.now()}`,
        userId: user.id,
        sender: 'admin', // Customer care sending as admin
        text: inputText,
        timestamp: Date.now()
      };

      const updatedMessages = [...(store.supportMessages || []), newMessage];
      await saveStore({ supportMessages: updatedMessages });
      
      setMessages([...messages, newMessage]);
      setInputText('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Handle AI response
  const triggerAIResponse = async (message: string) => {
    setIsTyping(true);
    
    try {
      const response = await customerCareAI.getResponse(message, user);
      
      const store = getStore();
      const aiMessage: SupportMessage = {
        id: `ai-msg-${Date.now()}`,
        userId: user.id,
        sender: 'admin',
        text: response,
        timestamp: Date.now()
      };

      const updatedMessages = [...(store.supportMessages || []), aiMessage];
      await saveStore({ supportMessages: updatedMessages });
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI Response Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9998] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Headphones size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Customer Care Console</h3>
              <p className="text-[10px] font-medium opacity-90">Agent: {user.name} (ID: {user.mobile})</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdminControls(!showAdminControls)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all"
            >
              {showAdminControls ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex bg-gray-100 overflow-x-auto no-scrollbar px-4 gap-2 py-3 border-b border-gray-200">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'users', label: 'Users' },
            { id: 'payments', label: 'Payments' },
            { id: 'support', label: 'Support' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all rounded-lg ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Actions */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-bold text-gray-800 mb-2">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => triggerAIResponse("How do I reset my password?")}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 py-2 px-3 rounded-lg text-xs font-bold transition-colors"
                >
                  Password Reset
                </button>
                <button 
                  onClick={() => triggerAIResponse("I need to update my bank details")}
                  className="bg-green-100 hover:bg-green-200 text-green-800 py-2 px-3 rounded-lg text-xs font-bold transition-colors"
                >
                  Bank Update
                </button>
                <button 
                  onClick={() => triggerAIResponse("My withdrawal is stuck")}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-800 py-2 px-3 rounded-lg text-xs font-bold transition-colors"
                >
                  Withdrawal Issue
                </button>
                <button 
                  onClick={() => triggerAIResponse("I want to upgrade my VIP level")}
                  className="bg-purple-100 hover:bg-purple-200 text-purple-800 py-2 px-3 rounded-lg text-xs font-bold transition-colors"
                >
                  VIP Upgrade
                </button>
              </div>
            </div>

            {/* Support Chat */}
            <div className="flex-1 flex flex-col">
              <div className="p-3 bg-gray-50 border-b border-gray-200">
                <h4 className="font-bold text-gray-700">Direct Support</h4>
              </div>
              
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-3 bg-gray-50 space-y-3"
              >
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`
                        max-w-[85%] rounded-2xl p-3 text-sm
                        ${isUser
                          ? 'bg-gray-200 text-gray-800 rounded-tl-none'
                          : 'bg-blue-600 text-white rounded-tr-none'
                        }
                      `}>
                        <div className="text-[9px] font-bold opacity-70 mb-1 uppercase tracking-wide">
                          {isUser ? 'User' : 'Support Agent'}
                        </div>
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {msg.text}
                        </div>
                        <div className="text-[8px] opacity-50 mt-1 text-right">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 rounded-2xl p-3 flex gap-1 items-center">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <span className="text-xs text-gray-500 ml-2">Agent is typing...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-3 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your response..."
                    className="flex-1 bg-gray-100 border border-gray-300 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl px-3 transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Data */}
          <div className="w-2/3 flex flex-col">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">Total Users</p>
                    <p className="text-xl font-black text-blue-800">{store.users.length}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider mb-1">Active Users</p>
                    <p className="text-xl font-black text-green-800">{store.users.filter(u => u.status === 'active').length}</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">Pending Payments</p>
                    <p className="text-xl font-black text-amber-800">{store.transactions.filter(t => t.status === 'pending').length}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider mb-1">Total Revenue</p>
                    <p className="text-xl font-black text-purple-800">₹{store.transactions.filter(t => t.status === 'approved' && t.type === 'recharge').reduce((sum, t) => sum + t.amount, 0)}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-3">Recent Activities</h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {store.logs.slice(0, 5).map(log => (
                      <div key={log.id} className="flex items-start gap-3 p-2 border-b border-gray-100 last:border-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Clock size={14} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-700 uppercase">{log.action}</p>
                          <p className="text-[9px] text-gray-500">{log.details}</p>
                          <p className="text-[8px] text-gray-400 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="flex-1 flex flex-col">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search users by phone or name..." 
                      className="w-full bg-white border border-gray-300 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 space-y-3">
                    {filteredUsers.map(user => (
                      <div 
                        key={user.id} 
                        className={`bg-white p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedUser?.id === user.id 
                            ? 'border-blue-500 ring-2 ring-blue-500/20' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <UserIcon size={20} className="text-gray-600" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">{user.name}</p>
                              <p className="text-sm text-gray-600">{user.mobile}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-800">₹{user.balance}</p>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                              user.status === 'active' ? 'bg-green-100 text-green-800' :
                              user.status === 'frozen' ? 'bg-amber-100 text-amber-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {user.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="flex-1 flex flex-col">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex gap-4">
                  <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-200">
                    <button 
                      onClick={() => setPaymentFilter('pending')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md ${
                        paymentFilter === 'pending' 
                          ? 'bg-amber-500 text-white' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Pending
                    </button>
                    <button 
                      onClick={() => setPaymentFilter('approved')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md ${
                        paymentFilter === 'approved' 
                          ? 'bg-green-500 text-white' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Approved
                    </button>
                    <button 
                      onClick={() => setPaymentFilter('rejected')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md ${
                        paymentFilter === 'rejected' 
                          ? 'bg-red-500 text-white' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Rejected
                    </button>
                    <button 
                      onClick={() => setPaymentFilter('all')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md ${
                        paymentFilter === 'all' 
                          ? 'bg-blue-500 text-white' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      All
                    </button>
                  </div>
                  
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search by user or UTR..." 
                      className="w-full bg-white border border-gray-300 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {filteredPayments.map(txn => {
                      const user = store.users.find(u => u.id === txn.userId);
                      return (
                        <div key={txn.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                txn.type === 'recharge' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                              }`}>
                                {txn.type === 'recharge' ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}
                              </div>
                              <div>
                                <p className="font-bold text-gray-800">₹{txn.amount}</p>
                                <p className="text-sm text-gray-600">{user?.mobile || 'Unknown'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                txn.status === 'approved' ? 'bg-green-100 text-green-800' :
                                txn.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {txn.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <p className="text-[10px] text-gray-600 font-bold uppercase mb-1">Reference</p>
                            <p className="text-xs font-mono text-gray-700">UTR: {txn.utr || 'Standard'}</p>
                            <p className="text-[9px] text-gray-500 mt-1">{new Date(txn.date).toLocaleString()}</p>
                          </div>
                          
                          {txn.status === 'pending' && (
                            <div className="flex gap-3 mt-4">
                              <button
                                onClick={() => handleAction(txn.id, 'approved')}
                                className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-bold text-xs uppercase"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleAction(txn.id, 'rejected')}
                                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-bold text-xs uppercase"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Support Tab */}
            {activeTab === 'support' && (
              <div className="flex-1 flex flex-col">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-bold text-gray-800">Support Tickets</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {store.supportMessages && store.supportMessages.length > 0 ? (
                      store.supportMessages
                        .filter(m => m.sender === 'user')
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .map(msg => {
                          const user = store.users.find(u => u.id === msg.userId);
                          return (
                            <div key={msg.id} className="bg-white p-4 rounded-xl border border-gray-200">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-bold text-gray-800">{user?.mobile || 'Unknown User'}</p>
                                  <p className="text-sm text-gray-600 mt-1">{msg.text}</p>
                                </div>
                                <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="mt-3 flex gap-2">
                                <button 
                                  onClick={() => {
                                    setInputText(`Hello, I understand your concern about "${msg.text}". Let me help you resolve this issue.`);
                                  }}
                                  className="text-[10px] font-bold bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors"
                                >
                                  Reply
                                </button>
                                <button 
                                  onClick={() => triggerAIResponse(msg.text)}
                                  className="text-[10px] font-bold bg-green-100 text-green-800 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors"
                                >
                                  Auto-respond
                                </button>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
                        <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-bold">No support tickets</p>
                        <p className="text-sm">All caught up! No pending support requests.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerCareConsole;