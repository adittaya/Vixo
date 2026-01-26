
import React from 'react';
import { View } from '../types';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const items = [
    { id: View.CHAT, label: 'Assistant', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { id: View.IMAGE, label: 'Visual Studio', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: View.VOICE, label: 'Speech Lab', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' },
  ];

  return (
    <aside className="w-64 border-r border-zinc-800 flex flex-col bg-zinc-950 z-20">
      <div className="p-8">
        <div className="flex items-center space-x-3 mb-10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold">N</span>
          </div>
          <span className="font-bold text-lg tracking-tight">Nexus</span>
        </div>

        <nav className="space-y-1">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                activeView === item.id
                  ? 'bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50'
              }`}
            >
              <svg className={`w-5 h-5 ${activeView === item.id ? 'text-blue-500' : 'text-zinc-600 group-hover:text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-bold">Engine Status</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-300">Gemini 3 Flash</span>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-emerald-500">Active</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
