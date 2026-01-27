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

  // State for image request form
  const [showImageForm, setShowImageForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageDescription, setImageDescription] = useState('');
  const [imageSubmitted, setImageSubmitted] = useState(false);
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
          // Set the image and immediately create an image request
          setInputImage(reader.result as string);

          // Show a popup to add description
          const description = prompt("Please describe the issue with your image (optional):");

          // Create an image request message that goes to admin panel
          const imageRequestMessage: SupportMessage = {
            id: `imgreq-${Date.now()}`,
            userId: user.id,
            sender: 'user',
            text: `IMAGE REQUEST: ${description || "User submitted an image for review"}`,
            image: reader.result as string,
            timestamp: Date.now()
          };

          // Save to store
          const store = getStore();
          const updatedStoreMessages = [...(store.supportMessages || []), imageRequestMessage];
          saveStore({ supportMessages: updatedStoreMessages }).then(() => {
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
            saveStore({ supportMessages: updatedStoreMessagesWithFeedback });
          });

          // Clear the input
          setInputImage('');

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

  // Function to handle image selection
  const handleImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image (JPEG, PNG, GIF, WEBP)');
        e.target.value = ''; // Clear the file input
        return;
      }

      if (file.size > maxSize) {
        alert('Image size exceeds 5MB limit. Please choose a smaller image.');
        e.target.value = ''; // Clear the file input
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          setSelectedImage(reader.result as string);
        } catch (error) {
          console.error("Error setting image data:", error);
          alert('Error processing image. Please try another image.');
          e.target.value = ''; // Clear the file input
        }
      };
      reader.onerror = () => {
        console.error("Error reading image file");
        alert('Error reading image file. Please try another image.');
        e.target.value = ''; // Clear the file input
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to submit image request
  const submitImageRequest = async () => {
    if (!selectedImage) {
      alert("Please select an image to submit.");
      return;
    }

    if (!imageDescription.trim()) {
      alert("Please provide a description for your image request.");
      return;
    }

    setIsSending(true); // Show loading state during submission

    try {
      // Create image request message that goes to admin panel (but not to chat history)
      const imageRequestMessage: SupportMessage = {
        id: `imgreq-${Date.now()}`,
        userId: user.id,
        sender: 'user',
        text: `IMAGE REQUEST: ${imageDescription || "User submitted an image for review"}`,
        image: selectedImage,
        timestamp: Date.now()
      };

      // Save to global store (for admin panel access) but NOT to user's chat history
      const store = getStore();
      const updatedStoreMessages = [...(store.supportMessages || []), imageRequestMessage];
      await saveStore({ supportMessages: updatedStoreMessages });

      // Show success state without adding to chat history
      setImageSubmitted(true);

      // Reset form after a delay
      setTimeout(() => {
        setShowImageForm(false);
        setImageSubmitted(false);
        setSelectedImage(null);
        setImageDescription('');
        setIsSending(false); // Hide loading state
      }, 2000);
    } catch (error) {
      console.error("Error submitting image request:", error);
      alert("Error submitting image request. Please try again.");
      setIsSending(false); // Hide loading state even on error
    }
  };

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

      {/* CIRCULAR IMAGE REQUEST BUTTON - Top Left Position */}
      <div className="fixed top-32 left-6 z-[91]">
        <button
          onClick={() => setShowImageForm(true)}
          className="w-16 h-16 bg-[#00D094] text-white rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform"
          title="Image Request"
        >
          <Camera size={24} />
        </button>
      </div>

      {/* IMAGE REQUEST FORM MODAL */}
      {showImageForm && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-[#00D094] p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-white uppercase">Image Request</h3>
                <button
                  onClick={() => setShowImageForm(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-white/80 text-sm mt-2">Submit an image for admin review</p>
            </div>

            <div className="p-6">
              {!imageSubmitted ? (
                // Image Upload Form
                <div className="space-y-6">
                  {!selectedImage ? (
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="w-16 h-16 bg-[#00D094]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Camera size={32} className="text-[#00D094]" />
                      </div>
                      <p className="font-black text-gray-700">Tap to Select Image</p>
                      <p className="text-gray-500 text-sm mt-1">JPG, PNG, or WEBP (Max 5MB)</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative rounded-2xl overflow-hidden border border-gray-200">
                        <img
                          src={selectedImage}
                          alt="Preview"
                          className="w-full h-48 object-contain bg-gray-50"
                        />
                        <button
                          onClick={() => setSelectedImage(null)}
                          className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-1.5"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <textarea
                        value={imageDescription}
                        onChange={e => setImageDescription(e.target.value)}
                        placeholder="Describe the issue with your image..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-[#00D094]"
                      />

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImage(null);
                            setImageDescription('');
                          }}
                          className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl font-black uppercase tracking-wider text-sm"
                          disabled={isSending}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={submitImageRequest}
                          disabled={isSending || !imageDescription.trim()}
                          className="flex-1 py-3 bg-[#00D094] text-white rounded-2xl font-black uppercase tracking-wider text-sm disabled:opacity-50 flex items-center justify-center"
                        >
                          {isSending ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            "Submit"
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageSelection}
                  />
                </div>
              ) : (
                // Success Page
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={48} className="text-emerald-500" />
                  </div>
                  <h4 className="text-2xl font-black text-gray-900 mb-2">Request Submitted!</h4>
                  <p className="text-gray-600 mb-8">Your image request has been sent to our admin team. They will review it shortly.</p>
                  <button
                    onClick={() => {
                      setShowImageForm(false);
                      setImageSubmitted(false);
                      setSelectedImage(null);
                      setImageDescription('');
                    }}
                    className="w-full py-4 bg-[#00D094] text-white rounded-2xl font-black uppercase tracking-wider"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING INPUT BAR ABOVE NAV */}
      <footer className="fixed bottom-24 left-0 right-0 px-6 py-4 z-[90] max-w-md mx-auto">
        <div className="bg-white/80 backdrop-blur-xl p-2 rounded-full border border-slate-100 shadow-2xl flex items-center gap-2">
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
    </div>
  );
};

export default Support;