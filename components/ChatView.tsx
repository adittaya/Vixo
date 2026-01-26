
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage } from '../types';

const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    // Fixed: Updated object literal to match ChatMessage interface (text, timestamp)
    const userMsg: ChatMessage = {
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        // Fixed: Correctly mapping 'text' property from history
        contents: [...messages, userMsg].map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })) as any, 
        config: {
          systemInstruction: 'You are Gemini Studio Assistant, a helpful, creative AI.',
          temperature: 0.7,
        }
      });

      // Fixed: Updated object literal to match ChatMessage interface
      const modelMsg: ChatMessage = {
        role: 'model',
        text: response.text || 'Sorry, I couldn\'t generate a response.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
      // Fixed: Aligning error message object with ChatMessage interface
      setMessages(prev => [...prev, {
        role: 'model',
        text: 'I encountered an error. Please check your connection or API key.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mb-6">
              <i className="fa-solid fa-comments text-3xl text-blue-400"></i>
            </div>
            <h2 className="text-2xl font-bold mb-2">How can I help you today?</h2>
            <p className="text-slate-400">Start a conversation with Gemini 3 Flash. I can help with creative writing, code, brainstorming, and more.</p>
          </div>
        )}

        {messages.map((m, idx) => (
          <div 
            // Fixed: Using timestamp as key since id is not in the type
            key={m.timestamp.getTime() + idx} 
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`
              max-w-[85%] md:max-w-[70%] rounded-2xl p-4 
              ${m.role === 'user' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' 
                : 'glass border border-slate-700/50 text-slate-200'
              }
            `}>
              <div className="text-sm font-bold opacity-50 mb-1 uppercase tracking-wider">
                {m.role === 'user' ? 'You' : 'Gemini'}
              </div>
              {/* Fixed: Using m.text instead of m.content */}
              <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="glass border border-slate-700/50 rounded-2xl p-4 flex gap-1 items-center">
              <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 md:p-8 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
        <div className="max-w-4xl mx-auto relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message here..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-4 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none shadow-xl"
            rows={1}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-3 bottom-3 w-10 h-10 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl flex items-center justify-center transition-colors"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-500 mt-4 uppercase tracking-widest font-bold">
          Gemini may display inaccurate info, including about people, so double-check its responses.
        </p>
      </div>
    </div>
  );
};

export default ChatView;
