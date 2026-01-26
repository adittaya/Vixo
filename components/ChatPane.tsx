
import React, { useState, useRef, useEffect } from 'react';
import { generateResponse } from '../services/gemini';
import { ChatMessage } from '../types';

const ChatPane: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello! I am Nexus. How can I assist with your creative projects today?', timestamp: new Date() }
  ]);
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

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const response = await generateResponse(input, history);
      const modelMsg: ChatMessage = { 
        role: 'model', 
        text: response || 'I encountered an error processing that request.', 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full p-6 md:p-10">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar"
      >
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
            }`}>
              {msg.text}
              <div className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4">
              <div className="flex space-x-2">
                <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
        <div className="relative flex items-center bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-2 pr-4 ring-1 ring-zinc-800">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-4 text-zinc-100 placeholder-zinc-500 py-3"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-zinc-100 hover:bg-white text-black p-2 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
          >
            <svg className="w-5 h-5 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPane;
