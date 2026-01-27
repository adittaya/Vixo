
import React, { useState, useEffect, useRef } from 'react';
import { User, SupportMessage, Transaction, AuditLog } from '../types';
import { getStore, saveStore } from '../store';
import { customerCareAI } from '../services/customerCareAI';
import { Send, Camera, ChevronLeft, RefreshCw, X, ArrowRight, User as UserIcon, Headphones, CheckCircle2, Bot, Shield, MessageCircle, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore
import * as ReactRouterDOM from 'react-router-dom';

const { useNavigate } = ReactRouterDOM as any;
const MotionDiv = motion.div as any;

interface Props { user: User; }

const Support: React.FC<Props> = ({ user }) => {
  // Text-only support states
  const [textMessages, setTextMessages] = useState<SupportMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [textIsSending, setTextIsSending] = useState(false);
  const [textIsTyping, setTextIsTyping] = useState(false);

  // Image-enabled support states
  const [imageMessages, setImageMessages] = useState<SupportMessage[]>([]);
  const [imageInput, setImageInput] = useState('');
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [imageIsSending, setImageIsSending] = useState(false);
  const [imageIsTyping, setImageIsTyping] = useState(false);

  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text'); // New state for tabs
  const textScrollRef = useRef<HTMLDivElement>(null);
  const imageScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Hidden AI Agent Trigger Sequence (only for text support)
  let clickSequence: string[] = [];
  let sequenceTimeout: NodeJS.Timeout | null = null;
  const [usingHiddenAI, setUsingHiddenAI] = useState(false);

  // Refresh messages for both tabs
  useEffect(() => {
    const refreshMessages = () => {
      const store = getStore();
      const userMessages = (store.supportMessages || []).filter(m => m.userId === user.id);

      // Separate messages by type
      const textOnlyMessages = userMessages.filter(m => !m.image);
      const imageMessages = userMessages.filter(m => m.image);

      setTextMessages(textOnlyMessages.sort((a, b) => a.timestamp - b.timestamp));
      setImageMessages(userMessages.sort((a, b) => a.timestamp - b.timestamp)); // Include all messages in image tab
    };

    refreshMessages();
    const interval = setInterval(refreshMessages, 10000);
    return () => clearInterval(interval);
  }, [user.id]);

  // Scroll to bottom for active tab
  useEffect(() => {
    if (activeTab === 'text' && textScrollRef.current) {
      textScrollRef.current.scrollTop = textScrollRef.current.scrollHeight;
    } else if (activeTab === 'image' && imageScrollRef.current) {
      imageScrollRef.current.scrollTop = imageScrollRef.current.scrollHeight;
    }
  }, [textMessages, imageMessages, activeTab]);

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
          setImageFile(reader.result as string);
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

  // Text-only AI response function
  const triggerTextAIResponse = React.useCallback(async (lastUserText: string) => {
    if (!lastUserText || lastUserText.trim() === '') {
      setTextIsTyping(false);
      return;
    }

    setTextIsTyping(true);

    let aiResponse;

    try {
      const response = await customerCareAI.getResponse(lastUserText);

      if (usingHiddenAI && (response.toLowerCase().includes('admin:') || response.toLowerCase().includes('execute:'))) {
        // Execute admin action if needed
        // (implementation would go here)
        aiResponse = { text: response };
      } else {
        aiResponse = { text: response };
      }
    } catch (error) {
      console.error("Error with text customer care AI:", error);
      aiResponse = { text: "I'm having trouble connecting right now. Please try again in a moment." };
      if (usingHiddenAI) setUsingHiddenAI(false);
    }

    try {
      const store = getStore();
      const adminMessage: SupportMessage = {
        id: `admin-text-${Date.now()}`,
        userId: user.id,
        sender: 'admin',
        text: aiResponse.text || "I am checking your request. Please wait. [ACTION:HOME]",
        timestamp: Date.now()
      };

      setTextMessages(prev => [...prev, adminMessage]);

      const updatedStoreMessages = [...(store.supportMessages || []), adminMessage];
      await saveStore({ supportMessages: updatedStoreMessages });
    } catch (error) {
      console.error("Error saving text admin message to store:", error);
    } finally {
      setTextIsTyping(false);
    }
  }, [user.id, usingHiddenAI]);

  // Image-enabled AI response function (uses different models)
  const triggerImageAIResponse = React.useCallback(async (lastUserText: string, imageBase64?: string) => {
    if (!lastUserText && !imageBase64) {
      setImageIsTyping(false);
      return;
    }

    setImageIsTyping(true);

    let aiResponse;

    try {
      // For image analysis, use the specialized image analysis function
      if (imageBase64) {
        // Call the image analysis function
        aiResponse = { text: await customerCareAI.getResponseWithImage(lastUserText || "Please analyze the attached image.", imageBase64) };
      } else {
        // If only text, use the regular AI
        const response = await customerCareAI.getResponse(lastUserText);
        aiResponse = { text: response };
      }
    } catch (error) {
      console.error("Error with image customer care AI:", error);
      aiResponse = { text: "I'm having trouble analyzing your message. Please try again in a moment." };
    }

    try {
      const store = getStore();
      const adminMessage: SupportMessage = {
        id: `admin-image-${Date.now()}`,
        userId: user.id,
        sender: 'admin',
        text: aiResponse.text || "I am checking your request. Please wait. [ACTION:HOME]",
        timestamp: Date.now()
      };

      setImageMessages(prev => [...prev, adminMessage]);

      const updatedStoreMessages = [...(store.supportMessages || []), adminMessage];
      await saveStore({ supportMessages: updatedStoreMessages });
    } catch (error) {
      console.error("Error saving image admin message to store:", error);
    } finally {
      setImageIsTyping(false);
    }
  }, [user.id]);

  // Handle text message sending
  const handleTextSend = React.useCallback(async () => {
    if (!textInput.trim()) return;

    setTextIsSending(true);
    try {
      const store = getStore();
      const userMsgText = textInput;

      const newUserMessage: SupportMessage = {
        id: `text-user-${Date.now()}`,
        userId: user.id,
        sender: 'user',
        text: userMsgText,
        timestamp: Date.now()
      };

      setTextMessages(prev => [...prev, newUserMessage]);

      const updatedStoreMessages = [...(store.supportMessages || []), newUserMessage];
      await saveStore({ supportMessages: updatedStoreMessages });

      setTextInput('');

      await triggerTextAIResponse(userMsgText);
    } catch (error) {
      console.error("Error sending text message:", error);
    } finally {
      setTextIsSending(false);
    }
  }, [textInput, user.id, triggerTextAIResponse]);

  // Handle image message sending
  const handleImageSend = React.useCallback(async () => {
    if (!imageInput.trim() && !imageFile) return;

    setImageIsSending(true);
    try {
      const store = getStore();
      const userMsgText = imageInput || "Please review the attached image.";

      const newUserMessage: SupportMessage = {
        id: `image-user-${Date.now()}`,
        userId: user.id,
        sender: 'user',
        text: userMsgText,
        image: imageFile || undefined,
        timestamp: Date.now()
      };

      setImageMessages(prev => [...prev, newUserMessage]);

      const updatedStoreMessages = [...(store.supportMessages || []), newUserMessage];
      await saveStore({ supportMessages: updatedStoreMessages });

      setImageInput('');
      setImageFile(null);

      await triggerImageAIResponse(userMsgText, imageFile || undefined);
    } catch (error) {
      console.error("Error sending image message:", error);
    } finally {
      setImageIsSending(false);
    }
  }, [imageInput, imageFile, user.id, triggerImageAIResponse]);

  // Function to handle hidden trigger sequence (only for text tab)
  const handleHeaderClick = React.useCallback(() => {
    if (activeTab !== 'text') return; // Only trigger in text tab

    if (sequenceTimeout) {
      clearTimeout(sequenceTimeout);
    }

    clickSequence.push('header');

    if (clickSequence.length >= 5) {
      const recentSequence = clickSequence.slice(-5);
      if (recentSequence.every((val) => val === 'header')) {
        setUsingHiddenAI(prev => {
          const newValue = !prev;

          const store = getStore();
          const modeToggleMessage: SupportMessage = {
            id: `mode-toggle-${Date.now()}`,
            userId: user.id,
            sender: 'admin',
            text: newValue
              ? 'Hidden Admin AI Agent activated. Full admin access enabled.'
              : 'Switching back to regular support mode...',
            timestamp: Date.now()
          };

          const updatedStoreMessages = [...(store.supportMessages || []), modeToggleMessage];
          saveStore({ supportMessages: updatedStoreMessages });
          setTextMessages(prev => [...prev, modeToggleMessage].sort((a, b) => a.timestamp - b.timestamp));

          return newValue;
        });

        clickSequence = [];
        return;
      }
    }

    sequenceTimeout = setTimeout(() => {
      clickSequence = [];
    }, 2000);
  }, [activeTab, user.id]);

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
      {/* HEADER WITH TABS */}
      <header
        className="bg-white px-6 pt-12 pb-6 flex flex-col shrink-0 shadow-sm border-b border-slate-50 z-[100]"
        onClick={handleHeaderClick}
      >
        <div className="flex items-center gap-4">
          <button onClick={(e) => { e.stopPropagation(); navigate(-1); }} className="p-2 bg-gray-50 rounded-xl text-gray-400 active:scale-95 transition-all shrink-0">
            <ChevronLeft size={20} />
          </button>
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#00D094]/10 shrink-0 relative">
             <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover" alt="Support Agent" />
             <div className="absolute bottom-0 right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
          </div>
          <div className="overflow-hidden flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-[15px] font-black text-gray-900 tracking-tight truncate">
                Support Center
              </h2>
            </div>
            <p className="text-[9px] font-black text-[#00D094] uppercase tracking-widest mt-0.5 whitespace-nowrap">
              Online • Choose Support Type
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex mt-4 bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-2 px-4 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
              activeTab === 'text'
                ? 'bg-[#00D094] text-white shadow-md'
                : 'text-gray-500'
            }`}
          >
            Text Support
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`flex-1 py-2 px-4 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
              activeTab === 'image'
                ? 'bg-[#00D094] text-white shadow-md'
                : 'text-gray-500'
            }`}
          >
            Image Support
          </button>
        </div>
      </header>

      {/* CHAT AREA - CONDITIONAL RENDERING BASED ON ACTIVE TAB */}
      {activeTab === 'text' ? (
        <div ref={textScrollRef} className="flex-1 overflow-y-auto px-6 space-y-8 pt-4 no-scrollbar bg-[#f8faf9] pb-32">
          {textMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}
              >
                <div className="max-w-[85%] space-y-1">
                   {isUser ? (
                     <MotionDiv initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#00D094] text-white px-6 py-4 rounded-[2rem] rounded-tr-none shadow-lg relative">
                          <p className="text-[14px] font-bold leading-relaxed">{msg.text}</p>
                       </MotionDiv>
                     ) : (
                     <MotionDiv initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#f1f5f9] text-[#2c3e50] px-6 py-6 rounded-[2.5rem] rounded-tl-none shadow-sm border border-slate-100 relative">
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

          {textIsTyping && (
            <div className="flex justify-start">
              <div className="bg-[#f1f5f9] p-4 rounded-[2rem] rounded-tl-none flex items-center gap-2 border border-slate-100">
                 <div className="w-1.5 h-1.5 bg-[#00D094] rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-[#00D094] rounded-full animate-bounce delay-100"></div>
                 <div className="w-1.5 h-1.5 bg-[#00D094] rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div ref={imageScrollRef} className="flex-1 overflow-y-auto px-6 space-y-8 pt-4 no-scrollbar bg-[#f8faf9] pb-32">
          {imageMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}
              >
                <div className="max-w-[85%] space-y-1">
                   {isUser ? (
                     <MotionDiv initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#00D094] text-white px-6 py-4 rounded-[2rem] rounded-tr-none shadow-lg relative">
                          {msg.image && <img src={msg.image} className="w-full rounded-2xl mb-2 border border-white/20 max-h-60 object-cover" alt="Attachment" />}
                          <p className="text-[14px] font-bold leading-relaxed">{msg.text}</p>
                       </MotionDiv>
                     ) : (
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

          {imageIsTyping && (
            <div className="flex justify-start">
              <div className="bg-[#f1f5f9] p-4 rounded-[2rem] rounded-tl-none flex items-center gap-2 border border-slate-100">
                 <div className="w-1.5 h-1.5 bg-[#00D094] rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-[#00D094] rounded-full animate-bounce delay-100"></div>
                 <div className="w-1.5 h-1.5 bg-[#00D094] rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* INPUT AREA - CONDITIONAL RENDERING BASED ON ACTIVE TAB */}
      <footer className="fixed bottom-24 left-0 right-0 px-6 py-4 z-[90] max-w-md mx-auto">
        {activeTab === 'text' ? (
          <div className="bg-white/80 backdrop-blur-xl p-2 rounded-full border border-slate-100 shadow-2xl flex items-center gap-2">
            <div className="w-12 h-12 bg-slate-50 text-gray-300 rounded-full active:scale-90 transition-all flex items-center justify-center shrink-0 opacity-50 cursor-not-allowed">
              <MessageCircle size={20} />
            </div>

            <input
              type="text"
              placeholder="Type your message..."
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTextSend()}
              className="flex-1 bg-transparent py-3 px-2 text-[14px] font-bold text-gray-700 outline-none placeholder:text-gray-300"
            />

            <button
              onClick={handleTextSend}
              disabled={textIsSending || textIsTyping || !textInput.trim()}
              className="w-12 h-12 bg-[#00D094] text-white rounded-full shadow-lg disabled:opacity-30 active:scale-90 transition-all flex items-center justify-center shrink-0"
            >
              {textIsSending ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} className="ml-0.5" />}
            </button>
          </div>
        ) : (
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
              placeholder="Describe your image..."
              value={imageInput}
              onChange={e => setImageInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleImageSend()}
              className="flex-1 bg-transparent py-3 px-2 text-[14px] font-bold text-gray-700 outline-none placeholder:text-gray-300"
            />

            <button
              onClick={handleImageSend}
              disabled={imageIsSending || imageIsTyping || (!imageInput.trim() && !imageFile)}
              className="w-12 h-12 bg-[#00D094] text-white rounded-full shadow-lg disabled:opacity-30 active:scale-90 transition-all flex items-center justify-center shrink-0"
            >
              {imageIsSending ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} className="ml-0.5" />}
            </button>
          </div>
        )}
      </footer>

      {/* IMAGE PREVIEW MODAL - ONLY FOR IMAGE TAB */}
      {activeTab === 'image' && imageFile && (
        <AnimatePresence>
          <MotionDiv initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed bottom-40 left-6 right-6 bg-white p-4 rounded-[2.5rem] shadow-2xl border border-slate-100 z-[101] flex items-center gap-4">
               <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-slate-100 shadow-sm"><img src={imageFile} className="w-full h-full object-cover" /></div>
               <div className="flex-1">
                  <p className="text-[10px] font-black text-gray-900 uppercase">Image attached</p>
                  <p className="text-[8px] text-gray-400 font-bold uppercase mt-0.5 tracking-tight">Tap send to share with support</p>
               </div>
               <button onClick={() => setImageFile(null)} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={16}/></button>
          </MotionDiv>
        </AnimatePresence>
      )}
    </div>
  );
};

export default Support;
