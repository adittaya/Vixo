
import React, { useState } from 'react';
import { generateImage } from '../services/gemini';
import { GeneratedImage } from '../types';

const ImageGen: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<GeneratedImage[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const url = await generateImage(prompt);
      // Fixed: Added missing 'id' and ensured 'timestamp' matches 'Date' type expected by GeneratedImage
      if (url) {
        setHistory((prev) => [{ 
          id: Math.random().toString(36).substr(2, 9), 
          url, 
          prompt, 
          timestamp: new Date() 
        }, ...prev]);
        setPrompt('');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="glass rounded-3xl p-8 border border-white/5 shadow-2xl">
        <h2 className="text-2xl font-bold mb-2">Create something magical</h2>
        <p className="text-slate-400 mb-6">Enter a prompt to generate high-quality images with Gemini 2.5 Flash Image.</p>
        
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="A cyberpunk city street at night in 4k detail..."
            className="flex-1 bg-slate-900/50 border border-slate-700 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 whitespace-nowrap"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </div>
            ) : 'Generate Image'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {history.map((img) => (
          // Fixed: Changed key from 'timestamp' (Date) to 'id' (string)
          <div key={img.id} className="group relative glass rounded-3xl overflow-hidden border border-white/5 hover:border-indigo-500/50 transition-all duration-300">
            <img src={img.url} alt={img.prompt} className="w-full aspect-square object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
              <p className="text-sm font-medium line-clamp-2">{img.prompt}</p>
            </div>
          </div>
        ))}
        {history.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center glass rounded-3xl border border-dashed border-slate-700">
            <div className="text-4xl mb-4">🖼️</div>
            <p className="text-slate-500">Your generated masterpieces will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGen;
