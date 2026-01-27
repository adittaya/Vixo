import React, { useState, useEffect, useRef } from 'react';
import { User, SupportMessage, Transaction, AuditLog } from '../types';
import { getStore, saveStore } from '../store';
import { customerCareAI } from '../services/customerCareAI';
import { Send, Camera, ChevronLeft, RefreshCw, X, ArrowRight, User as UserIcon, Headphones, CheckCircle2, Bot, Shield, Settings, Eye, EyeOff, MessageCircle, Lock, Unlock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore
import * as ReactRouterDOM from 'react-router-dom';
import EnhancedCustomerCare from '../components/EnhancedCustomerCare';

const { useNavigate } = ReactRouterDOM as any;
const MotionDiv = motion.div as any;

interface Props { user: User; }

const Support: React.FC<Props> = ({ user }) => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [usingHiddenAI, setUsingHiddenAI] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [showAdminControls, setShowAdminControls] = useState(false);
  const [isEnhancedCustomerCareOpen, setIsEnhancedCustomerCareOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Hidden AI Agent Trigger Sequence
  let clickSequence: string[] = [];
  let sequenceTimeout: NodeJS.Timeout | null = null;

  const refreshMessages = React.useCallback(() => {
    const store = getStore();
    const userMessages = (store.supportMessages || []).filter(m => m.userId === user.id);
    // Only update if there are new messages from other sources
    setMessages(prev => {
      const prevIds = new Set(prev.map(m => m.id));
      const newMessages = userMessages.filter(m => !prevIds.has(m.id));
      if (newMessages.length > 0) {
        return [...prev, ...newMessages].sort((a, b) => a.timestamp - b.timestamp);
      }
      return prev;
    });
  }, [user.id]);

  useEffect(() => {
    refreshMessages();
    const interval = setInterval(refreshMessages, 10000); // Increased interval to reduce frequency
    return () => clearInterval(interval);
  }, [refreshMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      // Use instant scrolling instead of smooth for better performance
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

    // Check if password-related query
    const isPasswordRelated = customerCareAI.isPasswordRelated(lastUserText);

    if (isPasswordRelated) {
      // Generate password-specific response
      const passwordResponse = customerCareAI.getPasswordResponse();
      aiResponse = { text: passwordResponse };
    } else {
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
            response = await customerCareAI.getResponse(userContext, user.id);

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
      // Refresh messages to ensure UI is up to date
      refreshMessages();
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

          const store = getStore();
          const updatedStoreMessages = [...(store.supportMessages || []), modeToggleMessage];
          saveStore({ supportMessages: updatedStoreMessages });
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

  return (
    <div className="bg-[#f8faf9] flex flex-col h-screen max-h-screen overflow-hidden">
      {/* HEADER WITH ADMIN CONTROLS */}
      <header
        className={`bg-gradient-to-r from-blue-50 to-indigo-50 px-6 pt-12 pb-6 flex items-center gap-4 shrink-0 shadow-sm border-b border-blue-100 z-[100] ${
          usingHiddenAI ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200' : ''
        }`}
        onClick={handleHeaderClick}
      >
        <button onClick={(e) => { e.stopPropagation(); navigate(-1); }} className="p-2 bg-white rounded-xl text-gray-500 active:scale-95 transition-all shrink-0 shadow-sm">
          <ChevronLeft size={20} />
        </button>
        <div className="w-14 h-14 rounded-full overflow-hidden border-3 border-white shadow-lg shrink-0 relative">
           <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover" alt="Simran" />
           <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="flex items-center gap-2">
            <div>
              <h2 className="text-[16px] font-bold text-gray-800 tracking-tight">
                {usingHiddenAI ? (
                  <span className="flex items-center gap-1">
                    <Shield className="text-red-500" size={16} /> Admin Mode
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Headphones size={16} className="text-blue-500" /> Simran
                  </span>
                )}
              </h2>
              <p className="text-[10px] font-medium text-gray-600 mt-0.5">
                {usingHiddenAI
                  ? 'Full Admin Access'
                  : 'Customer Support Executive'}
              </p>
            </div>
          </div>
        </div>
        {usingHiddenAI && (
          <div className="bg-red-100 text-red-800 text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-wider">
            ADMIN
          </div>
        )}
        
        {/* Admin Controls Button - Only visible in hidden AI mode */}
        {usingHiddenAI && (
          <button
            onClick={() => setShowAdminControls(!showAdminControls)}
            className="p-2 bg-gray-100 rounded-xl text-gray-600 active:scale-95 transition-all"
          >
            {showAdminControls ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}

        {/* Enhanced Customer Care Button - Only visible in hidden AI mode */}
        {usingHiddenAI && (
          <button
            onClick={() => setIsEnhancedCustomerCareOpen(true)}
            className="p-2 bg-gray-100 rounded-xl text-gray-600 active:scale-95 transition-all"
          >
            <Settings size={16} />
          </button>
        )}
      </header>

      {/* ADMIN CONTROLS PANEL */}
      <AnimatePresence>
        {showAdminControls && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border-b border-gray-100 px-6 py-4"
          >
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => {
                  const cmd = "admin: adjust balance 100";
                  setInputText(cmd);
                }}
                className="px-3 py-1.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-lg hover:bg-blue-200 transition-colors"
              >
                Add ₹100
              </button>
              <button 
                onClick={() => {
                  const cmd = "admin: freeze account";
                  setInputText(cmd);
                }}
                className="px-3 py-1.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg hover:bg-amber-200 transition-colors"
              >
                Freeze Account
              </button>
              <button 
                onClick={() => {
                  const cmd = "admin: activate account";
                  setInputText(cmd);
                }}
                className="px-3 py-1.5 bg-green-100 text-green-800 text-xs font-bold rounded-lg hover:bg-green-200 transition-colors"
              >
                Activate Account
              </button>
              <button 
                onClick={() => {
                  const cmd = "admin: approve withdrawal";
                  setInputText(cmd);
                }}
                className="px-3 py-1.5 bg-purple-100 text-purple-800 text-xs font-bold rounded-lg hover:bg-purple-200 transition-colors"
              >
                Approve Withdrawal
              </button>
              <button 
                onClick={() => {
                  const cmd = "admin: enable maintenance";
                  setInputText(cmd);
                }}
                className="px-3 py-1.5 bg-red-100 text-red-800 text-xs font-bold rounded-lg hover:bg-red-200 transition-colors"
              >
                Enable Maintenance
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHAT AREA */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 space-y-8 pt-8 no-scrollbar bg-[#f8faf9] pb-32">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}
            >
              <div className="max-w-[85%] space-y-1">
                 {isUser ? (
                   /* USER BUBBLE: More natural look */
                   <MotionDiv initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-3 rounded-2xl rounded-tr-none shadow-md relative">
                        {msg.image && <img src={msg.image} className="w-full rounded-xl mb-2 border border-white/30 max-h-40 object-cover" alt="Attachment" />}
                        <p className="text-[14px] font-medium leading-relaxed">{msg.text}</p>
                     </MotionDiv>
                   ) : (
                     /* SUPPORT BUBBLE: More human-like appearance */
                     <MotionDiv initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white text-gray-800 px-5 py-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 relative">
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                            <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover" alt="Support" />
                          </div>
                          <div className="flex-1">
                            {msg.image && <img src={msg.image} className="w-full rounded-xl mb-3 border border-gray-200 max-h-40 object-cover" alt="Attachment" />}
                            {renderMessageText(msg.text)}
                          </div>
                        </div>
                     </MotionDiv>
                   )}
                 <p className={`text-[8px] font-black text-gray-300 uppercase tracking-widest mt-1.5 ${isUser ? 'text-right mr-2' : 'text-left ml-2'}`}>
                   {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </p>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-tl-none flex items-center gap-2 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
              </div>
              <span className="text-xs text-gray-500 ml-1">Simran is typing...</span>
            </div>
          </div>
        )}
      </div>



      {/* FLOATING INPUT BAR ABOVE NAV */}
      <footer className="fixed bottom-24 left-0 right-0 px-6 py-4 z-[90] max-w-md mx-auto">
        <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-lg flex items-center gap-2">
          <div className="flex-1 bg-gray-50 rounded-xl flex items-center">
            <input
              type="text"
              placeholder={usingHiddenAI ? "Admin command..." : "Message Simran..."}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              className="w-full bg-transparent py-3 px-4 text-[15px] font-medium text-gray-700 outline-none placeholder:text-gray-400"
            />
            <button
              onClick={handleSend}
              disabled={isSending || isTyping || !inputText.trim()}
              className="mr-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-2 rounded-full disabled:opacity-40 active:scale-95 transition-all"
            >
              {isSending ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </footer>

      {/* Enhanced Customer Care Component */}
      <EnhancedCustomerCare
        user={user}
        isOpen={isEnhancedCustomerCareOpen}
        onClose={() => setIsEnhancedCustomerCareOpen(false)}
        isAdmin={false}
      />
    </div>
  );
};

export default Support;