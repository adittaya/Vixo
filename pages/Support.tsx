
import React, { useState, useEffect, useRef } from 'react';
import { User, SupportMessage, Transaction, AuditLog } from '../types';
import { getStore, saveStore } from '../store';
import { generateSupportResponse } from '../services/gemini';
import { Send, Camera, ChevronLeft, RefreshCw, X, ArrowRight, User as UserIcon, Headphones, CheckCircle2 } from 'lucide-react';
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const refreshMessages = () => {
    const store = getStore();
    const userMessages = (store.supportMessages || []).filter(m => m.userId === user.id);
    setMessages(userMessages.sort((a, b) => a.timestamp - b.timestamp));
  };

  useEffect(() => {
    refreshMessages();
    const interval = setInterval(refreshMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setInputImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() && !inputImage) return;
    setIsSending(true);
    const store = getStore();
    const userMsgText = inputText || "Sent an attachment.";
    const currentImg = inputImage;
    const newUserMessage: SupportMessage = {
      id: `msg-${Date.now()}`,
      userId: user.id,
      sender: 'user',
      text: userMsgText,
      image: currentImg || undefined,
      timestamp: Date.now()
    };
    const updatedStoreMessages = [...(store.supportMessages || []), newUserMessage];
    await saveStore({ supportMessages: updatedStoreMessages });
    setInputText('');
    setInputImage('');
    setIsSending(false);
    refreshMessages();
    triggerAIResponse(userMsgText, updatedStoreMessages, currentImg);
  };

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

  const triggerAIResponse = async (lastUserText: string, currentHistory: SupportMessage[], image?: string) => {
    await new Promise(r => setTimeout(r, 1500));
    setIsTyping(true);
    const history = currentHistory
      .filter(m => m.userId === user.id)
      .slice(-20)
      .map(m => ({ role: m.sender === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));

    const aiResponse = await generateSupportResponse(lastUserText, history, image);
    
    if (aiResponse.functionCalls) {
      for (const call of aiResponse.functionCalls) {
        await executeAgentAction(call);
      }
    }

    const store = getStore();
    const adminMessage: SupportMessage = {
      id: `admin-msg-${Date.now()}`,
      userId: user.id,
      sender: 'admin',
      text: aiResponse.text || "I am checking your request. Please wait. [ACTION:HOME]",
      timestamp: Date.now()
    };
    await saveStore({ supportMessages: [...(store.supportMessages || []), adminMessage] });
    setIsTyping(false);
    refreshMessages();
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
      <header className="bg-white px-6 pt-12 pb-6 flex items-center gap-4 shrink-0 shadow-sm border-b border-slate-50 z-[100]">
        <button onClick={() => navigate(-1)} className="p-2 bg-gray-50 rounded-xl text-gray-400 active:scale-95 transition-all shrink-0">
          <ChevronLeft size={20} />
        </button>
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#00D094]/10 shrink-0 relative">
           <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover" alt="Simran" />
           <div className="absolute bottom-0 right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
        </div>
        <div className="overflow-hidden">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[15px] font-black text-gray-900 tracking-tight truncate">Simran</h2>
            <CheckCircle2 size={12} className="text-blue-500 fill-blue-500/10 shrink-0" />
          </div>
          <p className="text-[9px] font-black text-[#00D094] uppercase tracking-widest mt-0.5 whitespace-nowrap">
            Online • VIXO Support Desk
          </p>
        </div>
      </header>

      {/* CHAT AREA */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 space-y-8 pt-8 no-scrollbar bg-[#f8faf9] pb-32">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} w-full`}
          >
            <div className="max-w-[85%] space-y-1">
               {msg.sender === 'user' ? (
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
               <p className={`text-[8px] font-black text-gray-300 uppercase tracking-widest mt-1.5 ${msg.sender === 'user' ? 'text-right mr-2' : 'text-left ml-2'}`}>
                 {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </p>
            </div>
          </div>
        ))}

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
          <button 
            onClick={() => fileInputRef.current?.click()} 
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
            disabled={isSending || isTyping || (!inputText.trim() && !inputImage)} 
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
                <p className="text-[10px] font-black text-gray-900 uppercase">Screenshot attached</p>
                <p className="text-[8px] text-gray-400 font-bold uppercase mt-0.5 tracking-tight">Tap send for Simran to review</p>
             </div>
             <button onClick={() => setInputImage('')} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={16}/></button>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Support;
