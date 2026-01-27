import React, { useState, useEffect, useRef } from 'react';
import { User, SupportMessage, Transaction, AuditLog } from '../types';
import { getStore, saveStore } from '../store';
import { customerCareAI } from '../services/customerCareAI';
import { Send, Camera, ChevronLeft, RefreshCw, X, ArrowRight, User as UserIcon, Headphones, CheckCircle2, Bot, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore
import * as ReactRouterDOM from 'react-router-dom';

const { useNavigate } = ReactRouterDOM as any;
const MotionDiv = motion.div as any;

interface Props { user: User; }

const Support: React.FC<Props> = ({ user }) => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [inputImage, setInputImage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [usingHiddenAI, setUsingHiddenAI] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type and size before processing
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPEG, PNG, GIF, WEBP)');
        return;
      }

      if (file.size > maxSize) {
        alert('Image size exceeds 5MB limit. Please choose a smaller image.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          // Show a popup to request image upload
          if (window.confirm("Would you like to submit this image for admin review? You can describe the issue.")) {
            setInputImage(reader.result as string);
            // Focus on the text input to allow user to add description
            setTimeout(() => {
              const textInput = document.querySelector('input[type="text"]') as HTMLInputElement;
              if (textInput) textInput.focus();
            }, 100);
          }
        } catch (error) {
          console.error("Error setting image data:", error);
          alert('Error processing image. Please try another image.');
        }
      };
      reader.onerror = () => {
        console.error("Error reading image file");
        alert('Error reading image file. Please try another image.');
      };
      reader.readAsDataURL(file);
    }
  };

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

    // Use the customer care AI for all interactions
    try {
      // Get response from the customer care AI
      const response = await customerCareAI.getResponse(lastUserText);

      // Check if the response contains admin commands (only when in hidden mode)
      if (usingHiddenAI && (response.toLowerCase().includes('admin:') || response.toLowerCase().includes('execute:'))) {
        const result = await executeAdminAction(response);
        aiResponse = { text: result };
      } else {
        aiResponse = { text: response };
      }
    } catch (error) {
      console.error("Error with customer care AI:", error);
      aiResponse = { text: "I'm having trouble connecting right now. Please try again in a moment." };
      if (usingHiddenAI) setUsingHiddenAI(false);
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
  }, [user.id, usingHiddenAI]);

  const handleSend = React.useCallback(async () => {
    // Check if the user is requesting to send an image or asking about image upload
    const lowerText = inputText.toLowerCase();
    const isImageRelated =
      (lowerText.includes('send') && (lowerText.includes('picture') || lowerText.includes('image') || lowerText.includes('photo'))) ||
      (lowerText.includes('upload') && (lowerText.includes('picture') || lowerText.includes('image') || lowerText.includes('photo') || lowerText.includes('screenshot'))) ||
      (lowerText.includes('attach') && (lowerText.includes('picture') || lowerText.includes('image') || lowerText.includes('photo'))) ||
      (lowerText.includes('how to') && (lowerText.includes('send') || lowerText.includes('upload')) && (lowerText.includes('picture') || lowerText.includes('image') || lowerText.includes('photo')));

    if (isImageRelated || inputImage) {
      // Create an image request message that goes to admin panel
      const imageRequestMessage: SupportMessage = {
        id: `imgreq-${Date.now()}`,
        userId: user.id,
        sender: 'user',
        text: `IMAGE REQUEST: ${inputText || "User submitted an image for review"}`,
        image: inputImage || undefined,
        timestamp: Date.now()
      };

      // Save to store
      const store = getStore();
      const updatedStoreMessages = [...(store.supportMessages || []), imageRequestMessage];
      await saveStore({ supportMessages: updatedStoreMessages });

      // Show user feedback
      const feedbackMessage: SupportMessage = {
        id: `feedback-${Date.now()}`,
        userId: user.id,
        sender: 'admin',
        text: "Your image request has been submitted to the admin panel. An admin will review it shortly.",
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, imageRequestMessage, feedbackMessage]);

      const updatedStoreMessagesWithFeedback = [...(getStore().supportMessages || []), feedbackMessage];
      await saveStore({ supportMessages: updatedStoreMessagesWithFeedback });

      // Clear inputs
      setInputText('');
      setInputImage('');

      setIsSending(false);
      return;
    }

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
  }, [inputText, inputImage, user.id, triggerAIResponse]);

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

  const executeAgentAction = async (call: any) => {
    const store = getStore();
    let nextUsers = [...store.users];
    let nextTransactions = [...store.transactions];
    const uIdx = nextUsers.findIndex(u => u.id === user.id);
    if (uIdx === -1) return;

    try {
      if (call.name === 'reset_credentials') {
        if (call.args.type === 'password') nextUsers[uIdx].password = call.args.value;
        else if (call.args.type === 'pin') nextUsers[uIdx].withdrawalPassword = call.args.value;
      }
      else if (call.name === 'set_account_status') {
        nextUsers[uIdx].status = call.args.status;
      }
      else if (call.name === 'adjust_user_balance') {
        const amt = Number(call.args.amount);
        const isAdd = call.args.action === 'add';
        if (call.args.wallet === 'current') {
          nextUsers[uIdx].balance = isAdd ? (nextUsers[uIdx].balance + amt) : (nextUsers[uIdx].balance - amt);
        } else {
          nextUsers[uIdx].withdrawableBalance = isAdd ? (nextUsers[uIdx].withdrawableBalance + amt) : (nextUsers[uIdx].withdrawableBalance - amt);
        }
      }
      else if (call.name === 'approve_recharge_utr') {
        const txnIdx = nextTransactions.findIndex(t => t.utr === call.args.utr && t.status === 'pending');
        if (txnIdx !== -1) {
          nextTransactions[txnIdx].status = 'approved';
          nextUsers[uIdx].balance += nextTransactions[txnIdx].amount;
        }
      }
      await saveStore({ users: nextUsers, transactions: nextTransactions });
    } catch (e) {
      console.error("Action error", e);
    }
  };

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
    const cleanText = text.replace(actionRegex, '').trim();
    const actions = Array.from(text.matchAll(actionRegex)).map(m => m[1]);

    return (
      <div className="space-y-4">
        <p className="whitespace-pre-wrap leading-relaxed text-[15px] text-[#2c3e50] font-medium">{cleanText}</p>
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
      {/* HEADER MATCHING SCREENSHOT */}
      <header
        className={`bg-white px-6 pt-12 pb-6 flex items-center gap-4 shrink-0 shadow-sm border-b border-slate-50 z-[100] ${
          usingHiddenAI ? 'bg-yellow-50 border-yellow-200' : ''
        }`}
        onClick={handleHeaderClick}
      >
        <button onClick={(e) => { e.stopPropagation(); navigate(-1); }} className="p-2 bg-gray-50 rounded-xl text-gray-400 active:scale-95 transition-all shrink-0">
          <ChevronLeft size={20} />
        </button>
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#00D094]/10 shrink-0 relative">
           <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover" alt="Simran" />
           <div className="absolute bottom-0 right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[15px] font-black text-gray-900 tracking-tight truncate">
              {usingHiddenAI ? (
                <span className="flex items-center gap-1">
                  <Shield className="text-red-500" size={14} /> Admin AI
                </span>
              ) : (
                <>
                  <Bot size={14} className="text-blue-400" /> Simran
                </>
              )}
            </h2>
            <CheckCircle2 size={12} className={`shrink-0 ${usingHiddenAI ? 'text-yellow-500' : 'text-blue-500'}`} />
          </div>
          <p className="text-[9px] font-black text-[#00D094] uppercase tracking-widest mt-0.5 whitespace-nowrap">
            {usingHiddenAI
              ? 'ADMIN MODE • Full Access Enabled'
              : 'Online • VIXO Support Desk'}
          </p>
        </div>
        {usingHiddenAI && (
          <div className="bg-red-100 text-red-800 text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-wider">
            ADMIN
          </div>
        )}
      </header>

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
                   /* USER BUBBLE: GREEN AS PER SCREENSHOT */
                   <MotionDiv initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#00D094] text-white px-6 py-4 rounded-[2rem] rounded-tr-none shadow-lg relative">
                        {msg.image && <img src={msg.image} className="w-full rounded-2xl mb-2 border border-white/20 max-h-60 object-cover" alt="Attachment" />}
                        <p className="text-[14px] font-bold leading-relaxed">{msg.text}</p>
                     </MotionDiv>
                   ) : (
                     /* ADMIN BUBBLE: LIGHT GRAY AS PER SCREENSHOT */
                     <MotionDiv initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#f1f5f9] text-[#2c3e50] px-6 py-6 rounded-[2.5rem] rounded-tl-none shadow-sm border border-slate-100 relative">
                        {msg.image && <img src={msg.image} className="w-full rounded-2xl mb-4 border border-slate-200 max-h-60 object-cover" alt="Attachment" />}
                        {renderMessageText(msg.text)}
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
            <div className="bg-[#f1f5f9] p-4 rounded-[2rem] rounded-tl-none flex items-center gap-2 border border-slate-100">
               <div className="w-1.5 h-1.5 bg-[#00D094] rounded-full animate-bounce"></div>
               <div className="w-1.5 h-1.5 bg-[#00D094] rounded-full animate-bounce delay-100"></div>
               <div className="w-1.5 h-1.5 bg-[#00D094] rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
      </div>

      {/* FLOATING INPUT BAR ABOVE NAV */}
      <footer className="fixed bottom-24 left-0 right-0 px-6 py-4 z-[90] max-w-md mx-auto">
        <div className="bg-white/80 backdrop-blur-xl p-2 rounded-full border border-slate-100 shadow-2xl flex items-center gap-2">
          {/* Always show camera button for image requests */}
          <button
            onClick={() => {
              fileInputRef.current?.click();
            }}
            className="w-12 h-12 bg-slate-50 text-gray-400 rounded-full active:scale-90 transition-all flex items-center justify-center shrink-0"
          >
            <Camera size={20} />
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          </button>

          <input
            type="text"
            placeholder="Type your message..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-transparent py-3 px-2 text-[14px] font-bold text-gray-700 outline-none placeholder:text-gray-300"
          />

          <button
            onClick={handleSend}
            disabled={isSending || isTyping || !inputText.trim()}
            className="w-12 h-12 bg-[#00D094] text-white rounded-full shadow-lg disabled:opacity-30 active:scale-90 transition-all flex items-center justify-center shrink-0"
          >
            {isSending ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} className="ml-0.5" />}
          </button>
        </div>
      </footer>

      {/* IMAGE PREVIEW MODAL */}
      <AnimatePresence>
        {inputImage && (
          <MotionDiv initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed bottom-40 left-6 right-6 bg-white p-4 rounded-[2.5rem] shadow-2xl border border-slate-100 z-[101] flex items-center gap-4">
               <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-slate-100 shadow-sm"><img src={inputImage} className="w-full h-full object-cover" /></div>
               <div className="flex-1">
                  <p className="text-[10px] font-black text-gray-900 uppercase">Image attached</p>
                  <p className="text-[8px] text-gray-400 font-bold uppercase mt-0.5 tracking-tight">Tap send to submit to admin</p>
               </div>
               <button onClick={() => setInputImage('')} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={16}/></button>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Support;