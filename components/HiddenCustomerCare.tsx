import React, { useState, useRef, useEffect } from 'react';
import { customerCareAI } from '../services/customerCareAI';
import { ChatMessage } from '../types';

interface HiddenCustomerCareProps {
  isOpen: boolean;
  onClose: () => void;
}

const HiddenCustomerCare: React.FC<HiddenCustomerCareProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: 'Hello! I\'m your hidden customer care assistant. How can I help you today?',
      timestamp: new Date(),
    }
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

    const userMsg: ChatMessage = {
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await customerCareAI.getResponse(input);
      
      const modelMsg: ChatMessage = {
        role: 'model',
        text: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error('Error getting customer care response:', error);
      // Instead of a static response, try to get a dynamic one
      try {
        const dynamicErrorPrompt = `You are Simran, a Senior Customer Care Executive from Delhi, India, working for VIXO Platform.

There was an issue processing the user's request. Generate a helpful, empathetic response that acknowledges the issue and suggests trying again. Keep the response friendly and professional, in Hinglish as appropriate for Indian customers. Do NOT say "I encountered an error. Please try again later." Instead, create a unique, helpful response.`;

        const dynamicResponse = await customerCareAI.getResponse(dynamicErrorPrompt, user);
        const dynamicMsg: ChatMessage = {
          role: 'model',
          text: dynamicResponse,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, dynamicMsg]);
      } catch (dynamicError) {
        console.error("Dynamic error response also failed:", dynamicError);
        const errorMsg: ChatMessage = {
          role: 'model',
          text: 'Hi, this is Simran from VIXO. I\'m currently experiencing high traffic, but I\'m working on your request. Please try again in a few moments, and I\'ll make sure to assist you properly. Thanks for your patience!',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9998] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md h-[70vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-[#00D094] text-white p-4 rounded-t-2xl flex justify-between items-center">
          <h3 className="font-bold text-lg">Hidden Customer Care</h3>
          <button 
            onClick={onClose}
            className="text-white bg-white/20 hover:bg-white/30 rounded-full p-1 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4"
        >
          {messages.map((m, idx) => (
            <div
              key={`${m.timestamp.getTime()}-${idx}`}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                max-w-[85%] rounded-2xl p-3
                ${m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800'
                }
              `}>
                <div className="text-xs font-bold opacity-70 mb-1 uppercase tracking-wider">
                  {m.role === 'user' ? 'You' : 'Customer Care'}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed text-sm">{m.text}</div>
              </div>
            </div>
          ))}

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
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message here..."
              className="flex-1 bg-gray-100 border border-gray-300 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="bg-[#00D094] hover:bg-[#00b37f] disabled:bg-gray-300 text-white rounded-xl px-4 py-2 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HiddenCustomerCare;