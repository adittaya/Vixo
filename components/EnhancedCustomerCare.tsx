import React, { useState, useRef, useEffect } from 'react';
import { User, SupportMessage, Transaction, AuditLog } from '../types';
import { getStore, saveStore } from '../store';
import { customerCareAI } from '../services/customerCareAI';
import { Send, ChevronLeft, RefreshCw, X, ArrowRight, User as UserIcon, Headphones, CheckCircle2, Bot, Shield, Settings, Eye, EyeOff, MessageCircle, Menu, Lock, Unlock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore
import * as ReactRouterDOM from 'react-router-dom';

const { useNavigate } = ReactRouterDOM as any;
const MotionDiv = motion.div as any;

interface EnhancedCustomerCareProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

const EnhancedCustomerCare: React.FC<EnhancedCustomerCareProps> = ({ user, isOpen, onClose, isAdmin = false }) => {
  const [messages, setMessages] = useState<SupportMessage[]>([
    {
      id: `welcome-${Date.now()}`,
      userId: user.id,
      sender: 'admin',
      text: `Hello ${user.name}! I'm your personalized AI assistant. How can I help you today?`,
      timestamp: Date.now(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showAdminControls, setShowAdminControls] = useState(false);
  const [usingHiddenAI, setUsingHiddenAI] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Hidden AI Agent Trigger Sequence
  let clickSequence: string[] = [];
  let sequenceTimeout: NodeJS.Timeout | null = null;

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

    // Check if verification is required for this request
    const requiresVerification = customerCareAI.requiresVerification(lastUserText);

    if (requiresVerification) {
      // Generate verification request
      const verificationMessage = customerCareAI.generateVerificationRequest(lastUserText);
      aiResponse = { text: verificationMessage };
    } else {
      // Prepare personalized context for the AI
      const userContext = `
        User Information:
        - Name: ${user.name}
        - Mobile: ${user.mobile}
        - Balance: ₹${user.balance}
        - Withdrawable Balance: ₹${user.withdrawableBalance}
        - Total Invested: ₹${user.totalInvested}
        - Total Withdrawn: ₹${user.totalWithdrawn}
        - VIP Level: ${user.vipLevel}
        - Registration Date: ${user.registrationDate}
        - Status: ${user.status}

        Current Request: ${lastUserText}
      `;

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

          // Check if the response contains admin commands (only when in hidden mode)
          if (usingHiddenAI && (response.toLowerCase().includes('admin:') || response.toLowerCase().includes('execute:'))) {
            const result = await executeAdminAction(response);
            aiResponse = { text: result };
          } else {
            aiResponse = { text: response };
          }
        }
      } catch (error) {
        console.error("Error with customer care AI:", error);
        aiResponse = { text: "I'm having trouble connecting right now. Please try again in a moment." };
        if (usingHiddenAI) setUsingHiddenAI(false);
      }
    }

    try {
      const store = getStore();
      const adminMessage: SupportMessage = {
        id: `admin-msg-${Date.now()}`,
        userId: user.id,
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
  }, [user, usingHiddenAI]);

  const handleSend = React.useCallback(async () => {
    // Regular text message handling
    if (!inputText.trim()) return;

    setIsSending(true);
    try {
      const store = getStore();
      const userMsgText = inputText;

      // Create user message
      const newUserMessage: SupportMessage = {
        id: `msg-${Date.now()}`,
        userId: user.id,
        sender: 'user',
        text: userMsgText,
        timestamp: Date.now()
      };

      // Update UI immediately for better responsiveness
      setMessages(prev => [...prev, newUserMessage]);

      // Save to store in background
      const updatedStoreMessages = [...(store.supportMessages || []), newUserMessage];
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
  }, [inputText, user.id, triggerAIResponse]);

  // Function to handle hidden trigger sequence
  const handleHeaderClick = React.useCallback(() => {
    // Reset sequence if it's been more than 2 seconds since last click
    if (sequenceTimeout) {
      clearTimeout(sequenceTimeout);
    }

    // Add current path to sequence
    clickSequence.push('header');

    // Check if the sequence matches the hidden trigger pattern
    // For example: clicking the header 5 times in sequence
    if (clickSequence.length >= 5) {
      const recentSequence = clickSequence.slice(-5);
      if (recentSequence.every((val) => val === 'header')) {
        // Toggle hidden AI agent
        setUsingHiddenAI(prev => {
          const newValue = !prev;

          // Add a message to indicate the mode change
          const modeToggleMessage: SupportMessage = {
            id: `mode-toggle-${Date.now()}`,
            userId: user.id,
            sender: 'admin',
            text: newValue
              ? 'Hidden Admin AI Agent activated. Full admin access enabled.'
              : 'Switching back to regular support mode...',
            timestamp: Date.now()
          };

          setMessages(prevMessages => [...prevMessages, modeToggleMessage].sort((a, b) => a.timestamp - b.timestamp));

          return newValue;
        });

        clickSequence = []; // Reset sequence
        return;
      }
    }

    // Clear sequence after 2 seconds of inactivity
    sequenceTimeout = setTimeout(() => {
      clickSequence = [];
    }, 2000);
  }, [user.id]);

  // Enhanced admin functions for the hidden AI agent
  const executeAdminAction = async (command: string) => {
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
          const uIdx = nextUsers.findIndex(u => u.id === user.id);
          if (uIdx !== -1) {
            nextUsers[uIdx].balance += amount;
          }
        }
      }
      else if (lowerCmd.includes('debit balance') || lowerCmd.includes('subtract balance')) {
        const match = command.match(/(\d+\.?\d*)/);
        if (match) {
          const amount = parseFloat(match[0]);
          const uIdx = nextUsers.findIndex(u => u.id === user.id);
          if (uIdx !== -1) {
            nextUsers[uIdx].balance -= amount;
          }
        }
      }
      // Status change commands
      else if (lowerCmd.includes('activate account') || lowerCmd.includes('unfreeze account') || lowerCmd.includes('enable account')) {
        const uIdx = nextUsers.findIndex(u => u.id === user.id);
        if (uIdx !== -1) {
          nextUsers[uIdx].status = 'active';
        }
      }
      else if (lowerCmd.includes('freeze account') || lowerCmd.includes('lock account') || lowerCmd.includes('disable account')) {
        const uIdx = nextUsers.findIndex(u => u.id === user.id);
        if (uIdx !== -1) {
          nextUsers[uIdx].status = 'frozen';
        }
      }
      else if (lowerCmd.includes('ban account') || lowerCmd.includes('suspend account')) {
        const uIdx = nextUsers.findIndex(u => u.id === user.id);
        if (uIdx !== -1) {
          nextUsers[uIdx].status = 'banned';
        }
      }
      // Withdrawal operations
      else if (lowerCmd.includes('approve withdrawal') || lowerCmd.includes('process withdrawal') || lowerCmd.includes('confirm withdrawal')) {
        // Find pending withdrawal for this user
        const pendingWithdrawal = nextTransactions.find(t =>
          t.userId === user.id &&
          t.type === 'withdraw' &&
          t.status === 'pending'
        );
        if (pendingWithdrawal) {
          pendingWithdrawal.status = 'approved';
          const uIdx = nextUsers.findIndex(u => u.id === user.id);
          if (uIdx !== -1) {
            nextUsers[uIdx].withdrawableBalance -= pendingWithdrawal.amount;
            nextUsers[uIdx].totalWithdrawn += pendingWithdrawal.amount;
          }
        }
      }
      else if (lowerCmd.includes('reject withdrawal') || lowerCmd.includes('cancel withdrawal') || lowerCmd.includes('deny withdrawal')) {
        // Find pending withdrawal for this user
        const pendingWithdrawal = nextTransactions.find(t =>
          t.userId === user.id &&
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
          t.userId === user.id &&
          t.type === 'recharge' &&
          t.status === 'pending'
        );
        if (pendingRecharge) {
          pendingRecharge.status = 'approved';
          const uIdx = nextUsers.findIndex(u => u.id === user.id);
          if (uIdx !== -1) {
            nextUsers[uIdx].balance += pendingRecharge.amount;
          }
        }
      }
      // Investment/product operations
      else if (lowerCmd.includes('activate investment') || lowerCmd.includes('start investment') || lowerCmd.includes('enable plan')) {
        // Find user's investments that are inactive
        const userPurchases = nextPurchases.filter(p => p.userId === user.id && p.status === 'inactive');
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
        const uIdx = nextUsers.findIndex(u => u.id === user.id);
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
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9998] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md h-[70vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div 
          className={`bg-[#00D094] text-white p-4 rounded-t-2xl flex justify-between items-center ${
            usingHiddenAI ? 'bg-yellow-500' : 'bg-[#00D094]'
          }`}
          onClick={handleHeaderClick}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/30">
              <img 
                src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=200&auto=format&fit=crop" 
                className="w-full h-full object-cover" 
                alt="Simran" 
              />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                {usingHiddenAI ? (
                  <span className="flex items-center gap-1">
                    <Shield size={14} className="text-white" /> Admin AI
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Bot size={14} className="text-white" /> Simran
                  </span>
                )}
              </h3>
              <p className="text-[8px] font-bold uppercase tracking-wider">
                {usingHiddenAI ? 'ADMIN MODE' : 'ONLINE'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdminControls(!showAdminControls)}
              className="text-white/80 hover:text-white"
            >
              {showAdminControls ? <EyeOff size={16} /> : <Eye size={16} />}
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

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4"
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                  max-w-[85%] rounded-2xl p-3
                  ${isUser
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-gray-200 text-gray-800 rounded-tl-none'
                  }
                `}>
                  <div className="text-[8px] font-bold opacity-70 mb-1 uppercase tracking-wider">
                    {isUser ? 'You' : 'Customer Care'}
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
          })}

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
              placeholder={usingHiddenAI ? "Admin command..." : "Type your message..."}
              className="flex-1 bg-gray-100 border border-gray-300 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isTyping}
              className="bg-[#00D094] hover:bg-[#00b37f] disabled:bg-gray-300 text-white rounded-xl px-4 py-2 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCustomerCare;