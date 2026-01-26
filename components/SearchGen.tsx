
import React, { useState } from 'react';
import { searchWithGrounding } from '../services/gemini';
import { Message } from '../types';

const SearchGen: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState<Message[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    const userMsg: Message = { role: 'user', text: query, timestamp: Date.now() };
    setChat(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const result = await searchWithGrounding(userMsg.text);
      const modelMsg: Message = { 
        role: 'model', 
        text: result.text, 
        timestamp: Date.now(),
        sources: result.sources 
      };
      setChat(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
      setChat(prev => [...prev, { role: 'model', text: "Error fetching data from Google Search.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto space-y-6">
      <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
        {chat.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
            <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-3xl">🌐</div>
            <div>
              <h3 className="text-xl font-bold">Search Grounded AI</h3>
              <p className="max-w-xs">Ask about real-time events, news, or complex queries with live web access.</p>
            </div>
          </div>
        )}
        {chat.map((msg, i) => (
          <div key={msg.timestamp} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] rounded-3xl p-6 ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'glass border border-white/5 text-slate-200'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((s, idx) => (
                      <a 
                        key={idx} 
                        href={s.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-colors inline-block max-w-full truncate"
                      >
                        {s.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="glass border border-white/5 rounded-3xl p-6 flex gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-[#0f172a] pb-4 pt-2">
        <div className="relative glass border border-white/10 rounded-3xl p-2 shadow-2xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="What's happening in tech today?"
            className="w-full bg-transparent border-none px-6 py-4 focus:outline-none text-lg"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 p-3 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-30"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchGen;
