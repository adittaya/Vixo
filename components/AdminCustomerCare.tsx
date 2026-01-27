import React, { useState, useRef, useEffect } from 'react';
import { User, SupportMessage, Transaction, AuditLog } from '../types';
import { getStore, saveStore } from '../store';
import { customerCareAI } from '../services/customerCareAI';
import { Send, ChevronLeft, RefreshCw, X, ArrowRight, User as UserIcon, Headphones, CheckCircle2, Bot, Shield, Settings, Eye, EyeOff, MessageCircle, Menu, Search, Filter, Users, CreditCard, Activity, Zap, Power, Edit3, Trash2, Star, Copy, Plus, Minus, Upload, Clock, Bell, Info, ChevronRight, ArrowRight as ArrowRightIcon, ArrowDownCircle, ArrowUpCircle, Coins, Megaphone, Link as LinkIcon, BarChart3, History, QrCode, Cpu, CheckCircle2 as CheckCircle2Icon, RotateCcw, Snowflake, Lock, Eye as EyeIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore
import * as ReactRouterDOM from 'react-router-dom';

const { useNavigate } = ReactRouterDOM as any;
const MotionDiv = motion.div as any;

interface AdminCustomerCareProps {
  user?: User;
  userId?: string;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

const AdminCustomerCare: React.FC<AdminCustomerCareProps> = ({ user, userId, isOpen, onClose, isAdmin = true }) => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showAdminControls, setShowAdminControls] = useState(false);
  const [usingHiddenAI, setUsingHiddenAI] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(user || null);
  const [userSearch, setUserSearch] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load messages for the selected user
  useEffect(() => {
    if (selectedUser) {
      const store = getStore();
      const userMessages = (store.supportMessages || []).filter(m => m.userId === selectedUser.id);
      setMessages(userMessages.sort((a, b) => a.timestamp - b.timestamp));
    }
  }, [selectedUser]);

  // Refresh messages periodically
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      if (selectedUser) {
        const store = getStore();
        const userMessages = (store.supportMessages || []).filter(m => m.userId === selectedUser.id);
        setMessages(userMessages.sort((a, b) => a.timestamp - b.timestamp));
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isOpen, selectedUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Enhanced AI response with personalized context
  const triggerAIResponse = React.useCallback(async (lastUserText: string) => {
    // Ensure we have a valid message to process
    if (!lastUserText || lastUserText.trim() === '') {
      console.log("No valid message to process, skipping AI response");
      // Still need to ensure typing indicator is cleared if it was set elsewhere
      setIsTyping(false);
      return;
    }

    setIsTyping(true);

    let aiResponse;

    // Prepare personalized context for the AI
    const userContext = selectedUser ? `
      User Information:
      - Name: ${selectedUser.name}
      - Mobile: ${selectedUser.mobile}
      - Balance: ₹${selectedUser.balance}
      - Withdrawable Balance: ₹${selectedUser.withdrawableBalance}
      - Total Invested: ₹${selectedUser.totalInvested}
      - Total Withdrawn: ₹${selectedUser.totalWithdrawn}
      - VIP Level: ${selectedUser.vipLevel}
      - Registration Date: ${selectedUser.registrationDate}
      - Status: ${selectedUser.status}
      
      Current Request: ${lastUserText}
    ` : lastUserText;

    // Check if this is an image generation request
    const isImageGenerationRequest = lastUserText.toLowerCase().includes('generate image') ||
                                     lastUserText.toLowerCase().includes('create image') ||
                                     lastUserText.toLowerCase().includes('make image') ||
                                     lastUserText.toLowerCase().includes('image of');

    // Use the customer care AI for all interactions
    try {
      let response;
      if (isImageGenerationRequest) {
        // Generate an image using Pollinations
        response = await customerCareAI.generateImage(lastUserText);
        aiResponse = { text: `I generated an image for you: [IMAGE_LINK]${response}[/IMAGE_LINK]` };
      } else {
        // Get response from the customer care AI with personalized context
        response = await customerCareAI.getResponse(userContext);

        // Check if the response contains admin commands
        if (response.toLowerCase().includes('admin:') || response.toLowerCase().includes('execute:')) {
          const result = await executeAdminAction(response);
          aiResponse = { text: result };
        } else {
          aiResponse = { text: response };
        }
      }
    } catch (error) {
      console.error("Error with customer care AI:", error);
      aiResponse = { text: "I'm having trouble connecting right now. Please try again in a moment." };
    }

    try {
      const store = getStore();
      const adminMessage: SupportMessage = {
        id: `admin-msg-${Date.now()}`,
        userId: selectedUser?.id || userId || 'unknown',
        sender: 'admin',
        text: aiResponse.text || "I am checking your request. Please wait. [ACTION:HOME]",
        timestamp: Date.now()
      };

      // Update UI immediately
      setMessages(prev => [...prev, adminMessage]);

      const updatedStoreMessages = [...(store.supportMessages || []), adminMessage];
      await saveStore({ supportMessages: updatedStoreMessages });
    } catch (error) {
      console.error("Error saving admin message to store:", error);
    } finally {
      // Ensure typing indicator is always cleared in the end
      setIsTyping(false);
    }
  }, [selectedUser, userId]);

  const handleSend = React.useCallback(async () => {
    // Regular text message handling
    if (!inputText.trim()) return;

    setIsSending(true);
    try {
      const store = getStore();
      const userMsgText = inputText;

      // Create user message
      const adminMessage: SupportMessage = {
        id: `admin-msg-${Date.now()}`,
        userId: selectedUser?.id || userId || 'unknown',
        sender: 'admin',
        text: userMsgText,
        timestamp: Date.now()
      };

      // Update UI immediately for better responsiveness
      setMessages(prev => [...prev, adminMessage]);

      // Save to store in background
      const updatedStoreMessages = [...(store.supportMessages || []), adminMessage];
      await saveStore({ supportMessages: updatedStoreMessages });

      // Clear inputs only after successful save
      setInputText('');

      // Process AI response for text messages
      if (inputText.trim()) {
        await triggerAIResponse(inputText);
      }

    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      // Ensure isSending is always reset
      setIsSending(false);
    }
  }, [inputText, selectedUser, userId, triggerAIResponse]);

  // Enhanced admin functions for the AI agent
  const executeAdminAction = async (command: string) => {
    if (!selectedUser) return "No user selected for admin action";
    
    const store = getStore();
    let nextUsers = [...store.users];
    let nextTransactions = [...store.transactions];
    let nextPurchases = [...store.purchases || []];
    let nextAdmin = {...store.admin};

    try {
      // Parse command to determine action
      const lowerCmd = command.toLowerCase();

      // Balance adjustment commands
      if (lowerCmd.includes('adjust balance') || lowerCmd.includes('add balance') || lowerCmd.includes('credit balance')) {
        const match = command.match(/(\d+\.?\d*)/);
        if (match) {
          const amount = parseFloat(match[0]);
          const uIdx = nextUsers.findIndex(u => u.id === selectedUser.id);
          if (uIdx !== -1) {
            nextUsers[uIdx].balance += amount;
          }
        }
      }
      else if (lowerCmd.includes('debit balance') || lowerCmd.includes('subtract balance')) {
        const match = command.match(/(\d+\.?\d*)/);
        if (match) {
          const amount = parseFloat(match[0]);
          const uIdx = nextUsers.findIndex(u => u.id === selectedUser.id);
          if (uIdx !== -1) {
            nextUsers[uIdx].balance -= amount;
          }
        }
      }
      // Status change commands
      else if (lowerCmd.includes('activate account') || lowerCmd.includes('unfreeze account') || lowerCmd.includes('enable account')) {
        const uIdx = nextUsers.findIndex(u => u.id === selectedUser.id);
        if (uIdx !== -1) {
          nextUsers[uIdx].status = 'active';
        }
      }
      else if (lowerCmd.includes('freeze account') || lowerCmd.includes('lock account') || lowerCmd.includes('disable account')) {
        const uIdx = nextUsers.findIndex(u => u.id === selectedUser.id);
        if (uIdx !== -1) {
          nextUsers[uIdx].status = 'frozen';
        }
      }
      else if (lowerCmd.includes('ban account') || lowerCmd.includes('suspend account')) {
        const uIdx = nextUsers.findIndex(u => u.id === selectedUser.id);
        if (uIdx !== -1) {
          nextUsers[uIdx].status = 'banned';
        }
      }
      // Withdrawal operations
      else if (lowerCmd.includes('approve withdrawal') || lowerCmd.includes('process withdrawal') || lowerCmd.includes('confirm withdrawal')) {
        // Find pending withdrawal for this user
        const pendingWithdrawal = nextTransactions.find(t =>
          t.userId === selectedUser.id &&
          t.type === 'withdraw' &&
          t.status === 'pending'
        );
        if (pendingWithdrawal) {
          pendingWithdrawal.status = 'approved';
          const uIdx = nextUsers.findIndex(u => u.id === selectedUser.id);
          if (uIdx !== -1) {
            nextUsers[uIdx].withdrawableBalance -= pendingWithdrawal.amount;
            nextUsers[uIdx].totalWithdrawn += pendingWithdrawal.amount;
          }
        }
      }
      else if (lowerCmd.includes('reject withdrawal') || lowerCmd.includes('cancel withdrawal') || lowerCmd.includes('deny withdrawal')) {
        // Find pending withdrawal for this user
        const pendingWithdrawal = nextTransactions.find(t =>
          t.userId === selectedUser.id &&
          t.type === 'withdraw' &&
          t.status === 'pending'
        );
        if (pendingWithdrawal) {
          pendingWithdrawal.status = 'rejected';
        }
      }
      // Recharge operations
      else if (lowerCmd.includes('approve recharge') || lowerCmd.includes('confirm recharge')) {
        // Find pending recharge for this user
        const pendingRecharge = nextTransactions.find(t =>
          t.userId === selectedUser.id &&
          t.type === 'recharge' &&
          t.status === 'pending'
        );
        if (pendingRecharge) {
          pendingRecharge.status = 'approved';
          const uIdx = nextUsers.findIndex(u => u.id === selectedUser.id);
          if (uIdx !== -1) {
            nextUsers[uIdx].balance += pendingRecharge.amount;
          }
        }
      }
      // Investment/product operations
      else if (lowerCmd.includes('activate investment') || lowerCmd.includes('start investment') || lowerCmd.includes('enable plan')) {
        // Find user's investments that are inactive
        const userPurchases = nextPurchases.filter(p => p.userId === selectedUser.id && p.status === 'inactive');
        if (userPurchases.length > 0) {
          // Activate the first inactive purchase
          userPurchases[0].status = 'active';
        }
      }
      // Custom admin commands
      else if (lowerCmd.includes('enable maintenance')) {
        nextAdmin.maintenanceMode = true;
      }
      else if (lowerCmd.includes('disable maintenance')) {
        nextAdmin.maintenanceMode = false;
      }
      else if (lowerCmd.includes('toggle income')) {
        nextAdmin.incomeFrozen = !nextAdmin.incomeFrozen;
      }
      else if (lowerCmd.includes('run income engine') || lowerCmd.includes('process daily income')) {
        // This would trigger the income processing
        // Implementation would depend on your store.ts functions
      }
      else if (lowerCmd.includes('reset user data') || lowerCmd.includes('clear user profile')) {
        const uIdx = nextUsers.findIndex(u => u.id === selectedUser.id);
        if (uIdx !== -1) {
          // Reset user data while preserving ID and basic account info
          nextUsers[uIdx] = {
            ...nextUsers[uIdx],
            balance: 0,
            withdrawableBalance: 0,
            totalInvested: 0,
            totalWithdrawn: 0,
            referralEarnings: 0,
            vipLevel: 0
          };
        }
      }

      await saveStore({
        users: nextUsers,
        transactions: nextTransactions,
        purchases: nextPurchases,
        admin: nextAdmin
      });

      return `Admin action completed: ${command}`;
    } catch (e) {
      console.error("Admin action error", e);
      return `Error executing admin action: ${e.message}`;
    }
  };

  const renderMessageText = (text: string) => {
    const actionRegex = /\[ACTION:(RECHARGE|WITHDRAW|HOME)\]/g;
    const imageLinkRegex = /\[IMAGE_LINK\](.*?)\[\/IMAGE_LINK\]/g;
    const cleanText = text.replace(actionRegex, '').replace(imageLinkRegex, '').trim();
    const actions = Array.from(text.matchAll(actionRegex)).map(m => m[1]);
    const imageLinks = Array.from(text.matchAll(imageLinkRegex)).map(m => m[1]);

    return (
      <div className="space-y-4">
        <p className="whitespace-pre-wrap leading-relaxed text-[15px] text-[#2c3e50] font-medium">{cleanText}</p>

        {imageLinks.length > 0 && (
          <div className="space-y-2">
            {imageLinks.map((link, i) => (
              <a
                key={i}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full max-w-xs mx-auto"
              >
                <img
                  src={link}
                  alt="Generated content"
                  className="w-full rounded-lg border border-gray-200 max-h-60 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                />
              </a>
            ))}
          </div>
        )}

        {actions.length > 0 && (
          <div className="flex flex-col gap-2 pt-2">
            {actions.map((act, i) => (
              <button
                key={i}
                onClick={() => navigate(`/${act.toLowerCase()}`)}
                className="w-full bg-[#e6fcf5] hover:bg-[#d3f9ed] text-[#00D094] py-3.5 px-6 rounded-2xl flex items-center justify-between transition-all active:scale-[0.98] border border-[#d3f9ed]"
              >
                <span className="text-[12px] font-black uppercase tracking-wider">GO TO {act}</span>
                <ArrowRightIcon size={16} />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Get all users for selection
  const allUsers = getStore().users;

  // Filter users based on search
  const filteredUsers = allUsers.filter(u => 
    u.mobile.includes(userSearch) || 
    u.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div 
          className={`bg-[#E31837] text-white p-4 flex justify-between items-center`}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/30">
              <img 
                src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=200&auto=format&fit=crop" 
                className="w-full h-full object-cover" 
                alt="Admin AI" 
              />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                <span className="flex items-center gap-1">
                  <Shield size={14} className="text-white" /> Admin AI Assistant
                </span>
              </h3>
              <p className="text-[8px] font-bold uppercase tracking-wider">
                ADMIN MODE - FULL ACCESS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdminControls(!showAdminControls)}
              className="text-white/80 hover:text-white"
            >
              {showAdminControls ? <EyeOff size={16} /> : <EyeIcon size={16} />}
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Admin Controls Panel */}
        <AnimatePresence>
          {showAdminControls && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-gray-50 border-b border-gray-200 p-3"
            >
              <div className="flex flex-wrap gap-1">
                <button 
                  onClick={() => {
                    const cmd = "admin: adjust balance 100";
                    setInputText(cmd);
                  }}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded hover:bg-blue-200 transition-colors"
                >
                  Add ₹100
                </button>
                <button 
                  onClick={() => {
                    const cmd = "admin: freeze account";
                    setInputText(cmd);
                  }}
                  className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded hover:bg-amber-200 transition-colors"
                >
                  Freeze
                </button>
                <button 
                  onClick={() => {
                    const cmd = "admin: activate account";
                    setInputText(cmd);
                  }}
                  className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded hover:bg-green-200 transition-colors"
                >
                  Activate
                </button>
                <button 
                  onClick={() => {
                    const cmd = "admin: approve withdrawal";
                    setInputText(cmd);
                  }}
                  className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded hover:bg-purple-200 transition-colors"
                >
                  Approve WD
                </button>
                <button 
                  onClick={() => {
                    const cmd = "admin: enable maintenance";
                    setInputText(cmd);
                  }}
                  className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded hover:bg-red-200 transition-colors"
                >
                  Maintenance
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Selection Panel */}
        <div className="bg-gray-100 p-3 border-b border-gray-200">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search users by phone or name..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
            <select
              value={selectedUser?.id || ''}
              onChange={(e) => {
                const user = allUsers.find(u => u.id === e.target.value);
                setSelectedUser(user || null);
              }}
              className="bg-white border border-gray-300 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            >
              <option value="">Select a user</option>
              {filteredUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.mobile})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Messages and Input Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Messages */}
          <div className="w-2/3 border-r border-gray-200 flex flex-col">
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4"
            >
              {messages.length > 0 ? (
                messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`
                        max-w-[85%] rounded-2xl p-3
                        ${isUser
                          ? 'bg-gray-200 text-gray-800 rounded-tl-none'
                          : 'bg-blue-600 text-white rounded-tr-none'
                        }
                      `}>
                        <div className="text-[8px] font-bold opacity-70 mb-1 uppercase tracking-wider">
                          {isUser ? 'User' : 'Admin AI'}
                        </div>
                        <div className="whitespace-pre-wrap leading-relaxed text-sm">
                          {msg.sender === 'admin' ? renderMessageText(msg.text) : msg.text}
                        </div>
                        <div className="text-[7px] opacity-50 mt-1 text-right">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <MessageCircle size={48} className="mx-auto text-gray-300 mb-2" />
                    <p>Select a user to view their support messages</p>
                  </div>
                </div>
              )}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 rounded-2xl p-3 flex gap-1 items-center">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type admin command or message to user..."
                  className="flex-1 bg-gray-100 border border-gray-300 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || isTyping}
                  className="bg-[#E31837] hover:bg-[#c1122f] disabled:bg-gray-300 text-white rounded-xl px-4 py-2 transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* User Details Panel */}
          <div className="w-1/3 bg-white p-4 overflow-y-auto">
            <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">User Details</h3>
            
            {selectedUser ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon size={24} className="text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-bold">{selectedUser.name}</h4>
                      <p className="text-sm text-gray-600">{selectedUser.mobile}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Balance:</span>
                      <span className="font-bold">₹{selectedUser.balance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Withdrawable:</span>
                      <span className="font-bold">₹{selectedUser.withdrawableBalance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Invested:</span>
                      <span className="font-bold">₹{selectedUser.totalInvested}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">VIP Level:</span>
                      <span className="font-bold">{selectedUser.vipLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-bold ${
                        selectedUser.status === 'active' ? 'text-green-600' :
                        selectedUser.status === 'frozen' ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {selectedUser.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <button 
                    onClick={() => setInputText("admin: adjust balance 100")}
                    className="w-full bg-blue-100 text-blue-800 py-2 rounded-lg text-sm font-bold hover:bg-blue-200 transition-colors"
                  >
                    Add ₹100
                  </button>
                  <button 
                    onClick={() => setInputText(selectedUser.status === 'frozen' ? "admin: activate account" : "admin: freeze account")}
                    className={`w-full py-2 rounded-lg text-sm font-bold transition-colors ${
                      selectedUser.status === 'frozen' 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    }`}
                  >
                    {selectedUser.status === 'frozen' ? 'Unfreeze Account' : 'Freeze Account'}
                  </button>
                  <button 
                    onClick={() => setInputText("admin: approve withdrawal")}
                    className="w-full bg-purple-100 text-purple-800 py-2 rounded-lg text-sm font-bold hover:bg-purple-200 transition-colors"
                  >
                    Approve Withdrawal
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Users size={48} className="mx-auto mb-2 text-gray-300" />
                <p>Select a user to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCustomerCare;